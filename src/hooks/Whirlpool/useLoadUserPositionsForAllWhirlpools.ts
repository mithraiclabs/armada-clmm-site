import {
  selectVaultWhirlpoolKeys,
  useUpdateWhirlpoolPositions,
  useUpdateWhirlpoolTickData,
  whirlpoolAtomFamily,
  whirlpoolOwnedPositionKeys,
} from "../../state";
import { useWhirlpoolClient } from "../useWhirlpoolFetcher";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  Position,
  TickData,
} from "@orca-so/whirlpools-sdk";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { PublicKey } from "@solana/web3.js";

export const useLoadUserPositionsForWhirlpools = () => {
  const whirlpoolClient = useWhirlpoolClient();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const updatePositions = useUpdateWhirlpoolPositions();
  const updateTickData = useUpdateWhirlpoolTickData();
  const whirlpoolKeys = useRecoilValue(selectVaultWhirlpoolKeys);

  return useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        if (!wallet) return;
        const parsedTokenAccounts =
          await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
            programId: TOKEN_PROGRAM_ID,
          });
        const positionPdas = parsedTokenAccounts.value.map(({ account }) => {
          return PDAUtil.getPosition(
            ORCA_WHIRLPOOL_PROGRAM_ID,
            new PublicKey(account.data.parsed.info.mint)
          ).publicKey;
        });
        const positions = Object.values(
          await whirlpoolClient.getPositions(positionPdas)
        ).filter((position) => position !== null) as Position[];
        for (const key of whirlpoolKeys) {
          const whirlpool = snapshot
            .getLoadable(whirlpoolAtomFamily(key))
            .getValue();
          if (whirlpool && wallet) {
            const tickDataList = positions
              .map((position) => {
                return [
                  position.getAddress().toString(),
                  {
                    lowerTickData: position.getLowerTickData(),
                    upperTickData: position.getUpperTickData(),
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

            updateTickData(tickDataList);
            updatePositions(
              positions.map((p) => [p.getAddress().toString(), p.getData()])
            );
          }
        }
        const poolPositionsMap = {} as { [whirlpool: string]: string[] };
        for (const position of positions) {
          const pool = position.getData().whirlpool.toString();
          const positionKey = position.getAddress().toString();
          if (!poolPositionsMap[pool]) {
            poolPositionsMap[pool] = [positionKey];
          } else {
            poolPositionsMap[pool].push(positionKey);
          }
        }
        Object.entries(poolPositionsMap).forEach(([pool, positions]) => {
          set(whirlpoolOwnedPositionKeys(pool), positions);
        });
      },
    [
      wallet,
      connection,
      whirlpoolClient,
      whirlpoolKeys,
      updateTickData,
      updatePositions,
    ]
  );
};
