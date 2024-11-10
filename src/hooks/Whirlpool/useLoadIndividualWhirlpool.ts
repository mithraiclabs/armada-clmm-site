import { useLoadMintInfoAndMeta } from "../useLoadMintInfoAndMeta";
import {
  useUpdateWhirlpoolPositions,
  useUpdateWhirlpoolTickData,
  whirlpoolAtomFamily,
  whirlpoolOwnedPositionKeys,
} from "../../state";
import { useWhirlpoolClient } from "../useWhirlpoolFetcher";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  IGNORE_CACHE,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  Position,
  TickData,
} from "@orca-so/whirlpools-sdk";
import { useRecoilCallback } from "recoil";
import { PublicKey } from "@solana/web3.js";
import { useLoadSplAccounts } from "../useLoadSplAccounts";

export const useLoadIndividualClp = (whirlpoolKey: string) => {
  const whirlpoolClient = useWhirlpoolClient();
  const loadMintAndMeta = useLoadMintInfoAndMeta();
  const loadAccounts = useLoadSplAccounts();
  return useRecoilCallback(
    ({ set }) =>
      async () => {
        if (!whirlpoolKey) {
          return;
        }
        const whirlpool = await whirlpoolClient.getPool(
          whirlpoolKey,
          IGNORE_CACHE
        );
        set(whirlpoolAtomFamily(whirlpoolKey), whirlpool.getData());
        const [mintA, mintB] = [
          whirlpool.getTokenAInfo(),
          whirlpool.getTokenBInfo(),
        ];
        loadAccounts([mintA.address.toString(), mintB.address.toString()]);
        loadMintAndMeta([mintA.address.toString(), mintB.address.toString()]);
      },
    [whirlpoolClient, whirlpoolKey]
  );
};

export const useLoadUserClpPositions = (whirlpoolKey: string) => {
  const whirlpoolClient = useWhirlpoolClient();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const updatePositions = useUpdateWhirlpoolPositions();
  const updateTickData = useUpdateWhirlpoolTickData();

  return useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(whirlpoolKey))
          .getValue();
        if (whirlpool && wallet) {
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
          ).filter(
            (position) =>
              position !== null &&
              position.getData().whirlpool.toString() === whirlpoolKey
          ) as Position[];

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
          set(
            whirlpoolOwnedPositionKeys(whirlpoolKey),
            positions.map((p) => p.getAddress().toString())
          );
        }
      },
    [
      whirlpoolKey,
      wallet,
      connection,
      whirlpoolClient,
      updateTickData,
      updatePositions,
    ]
  );
};
