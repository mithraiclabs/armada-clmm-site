import { useRecoilValue, useSetRecoilState } from "recoil";
import { useCallback, useEffect } from "react";
import {
  clpVaultAtomFamily,
  useUpdateWhirlpoolPositions,
  useUpdateWhirlpoolTickData,
  whirlpoolAtomFamily,
  whirlpoolConfigAtomFamily,
} from "../../state";
import { useWhirlpoolFetcher } from "../useWhirlpoolFetcher";
import { VaultPosition } from "../../utils/types";
import { PublicKey } from "@solana/web3.js";
import {
  IGNORE_CACHE,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PositionData,
  TickArrayUtil,
  TickData,
} from "@orca-so/whirlpools-sdk";

export const useLoadClpVaultPositions = (clpKey: string) => {
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);

  useEffect(() => {
    fetchAndUpdateVaultPositions();
  }, [fetchAndUpdateVaultPositions]);
};

export const useFetchAndUpdateVaultPositions = (clpKey: string) => {
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const whirlpoolFetcher = useWhirlpoolFetcher();
  const updatePositions = useUpdateWhirlpoolPositions();
  const updateTickData = useUpdateWhirlpoolTickData();
  const setWhirlpoolConfig = useSetRecoilState(
    whirlpoolConfigAtomFamily(clpKey)
  );

  // fetch positions and tickdata
  return useCallback(async () => {
    if (!clpVault || !whirlpool) {
      return;
    }
    const positionKeys = (clpVault.positions as VaultPosition[])
      .filter((vp) => !vp.positionKey.equals(PublicKey.default))
      .map((vp) => vp.positionKey);

    const positionsMap = await whirlpoolFetcher.getPositions(
      positionKeys,
      IGNORE_CACHE
    );
    const config = await whirlpoolFetcher.getConfig(whirlpool.whirlpoolsConfig);
    setWhirlpoolConfig(config);
    const positionsList = positionKeys
      .map((key) => [key.toString(), positionsMap.get(key.toString())])
      .filter((p) => !!p) as [string, PositionData][];
    const tickKeys = positionsList.map(([, positionData]) => ({
      lowerTickArrayPda: PDAUtil.getTickArrayFromTickIndex(
        positionData.tickLowerIndex,
        whirlpool.tickSpacing,
        positionData.whirlpool,
        ORCA_WHIRLPOOL_PROGRAM_ID
      ).publicKey,
      upperTickArrayPda: PDAUtil.getTickArrayFromTickIndex(
        positionData.tickUpperIndex,
        whirlpool.tickSpacing,
        positionData.whirlpool,
        ORCA_WHIRLPOOL_PROGRAM_ID
      ).publicKey,
    }));
    const flattenedTickKeys = tickKeys.reduce((acc, positionTicks) => {
      acc.push(positionTicks.lowerTickArrayPda);
      acc.push(positionTicks.upperTickArrayPda);
      return acc;
    }, [] as PublicKey[]);
    const tickArraysList = await whirlpoolFetcher.getTickArrays(
      flattenedTickKeys,
      IGNORE_CACHE
    );
    const tickDataList = positionsList
      .map(([key, positionData], index) => {
        const lowerTickArrayData = tickArraysList[index * 2];
        const upperTickArrayData = tickArraysList[index * 2 + 1];
        if (!lowerTickArrayData || !upperTickArrayData || !positionData) {
          return null;
        }
        return [
          key,
          {
            lowerTickData:
              lowerTickArrayData &&
              TickArrayUtil.getTickFromArray(
                lowerTickArrayData,
                positionData.tickLowerIndex,
                whirlpool.tickSpacing
              ),
            upperTickData:
              upperTickArrayData &&
              TickArrayUtil.getTickFromArray(
                upperTickArrayData,
                positionData.tickUpperIndex,
                whirlpool.tickSpacing
              ),
          },
        ];
      })
      .filter((t) => !!t) as [
      string,
      {
        lowerTickData: TickData;
        upperTickData: TickData;
      }
    ][];
    updatePositions(positionsList);
    updateTickData(tickDataList);
  }, [
    clpVault,
    setWhirlpoolConfig,
    updatePositions,
    updateTickData,
    whirlpool,
    whirlpoolFetcher,
  ]);
};
