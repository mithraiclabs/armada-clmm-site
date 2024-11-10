import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { Decimal } from "../utils/decimal";
import { useWhirlpoolClient, useWhirlpoolFetcher } from "./useWhirlpoolFetcher";
import BN from "bn.js";
import { IGNORE_CACHE, swapQuoteByInputToken } from "@orca-so/whirlpools-sdk";
import { Percentage } from "@orca-so/common-sdk";
import { useLoadSplAccounts } from "./useLoadSplAccounts";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { selectPriorityFeeIx, whirlpoolAtomFamily } from "../state";
import useSharedTxLogic from "./useSendTxCommon";
import { buildFromTxBuilder } from "../utils/tx-utils";

export const useOrcaSwap = (whirlpoolId: string) => {
  const wallet = useAnchorWallet();
  const client = useWhirlpoolClient();
  const fetcher = useWhirlpoolFetcher();
  const loadSplAccs = useLoadSplAccounts();
  const setWhirlpool = useSetRecoilState(whirlpoolAtomFamily(whirlpoolId));
  const { sendTx } = useSharedTxLogic();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { connection } = useConnection();

  return useCallback(
    async (amount: Decimal, usingA: boolean) => {
      if (!wallet || !wallet.publicKey) throw new Error("no wallet connected");
      const whirlpool = await client.getPool(whirlpoolId, IGNORE_CACHE);
      const tokenA = whirlpool.getTokenAInfo();
      const tokenB = whirlpool.getTokenBInfo();
      const tokenMint = usingA ? tokenA.mint : tokenB.mint;
      const decimals = usingA ? tokenA.decimals : tokenB.decimals;
      const program = client.getContext().program;
      const tokenQuote = await swapQuoteByInputToken(
        whirlpool,
        tokenMint,
        new BN(amount.mul(10 ** decimals).toString()),
        Percentage.fromFraction(10, 100),
        program.programId,
        fetcher
      );
      const swapBuilder = await whirlpool.swap(tokenQuote);
      const latestBlockhash = await connection.getLatestBlockhash();
      const { tx, signers } = await buildFromTxBuilder(
        swapBuilder,
        connection,
        wallet.publicKey,
        latestBlockhash,
        priorityFeeIx,
        false
      );

      if (tx) {
        const id = await sendTx(
          tx,
          signers,
          program.idl,
          "Swapping tokens using whirlpool"
        );

        // use timeout so following return is not blocked.
        setTimeout(async () => {
          loadSplAccs([tokenA.mint, tokenB.mint]);
          const updatedWhirlpool = await client.getPool(
            whirlpoolId,
            IGNORE_CACHE
          );
          setWhirlpool(updatedWhirlpool.getData());
        }, 0);

        return id;
      }
    },
    [
      client,
      connection,
      fetcher,
      loadSplAccs,
      priorityFeeIx,
      sendTx,
      setWhirlpool,
      wallet,
      whirlpoolId,
    ]
  );
};

export const useOrcaPrediction = (whirlpoolId: string) => {
  const wallet = useAnchorWallet();
  const client = useWhirlpoolClient();
  const fetcher = useWhirlpoolFetcher();

  return useCallback(
    async (amount: Decimal, usingA: boolean) => {
      if (!wallet || !wallet.publicKey) return 0;
      const whirlpool = await client.getPool(whirlpoolId);
      const tokenA = whirlpool.getTokenAInfo();
      const tokenB = whirlpool.getTokenBInfo();
      try {
        const tokenQuote = await swapQuoteByInputToken(
          whirlpool,
          usingA ? tokenA.mint : tokenB.mint,
          new BN(
            amount.mul(10 ** (usingA ? tokenA : tokenB).decimals).toString()
          ),
          Percentage.fromFraction(10, 100),
          client.getContext().program.programId,
          fetcher
        );
        return new Decimal(tokenQuote.estimatedAmountOut.toString())
          .div(10 ** (!usingA ? tokenA : tokenB).decimals)
          .toNumber();
      } catch (error) {
        return 0;
      }
    },
    [client, fetcher, wallet, whirlpoolId]
  );
};
