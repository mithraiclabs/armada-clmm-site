import { useWhirlpoolClient } from "../useWhirlpoolFetcher";
import { useCallback } from "react";
import { Percentage, TransactionBuilder } from "@orca-so/common-sdk";
import {
  IGNORE_CACHE,
  PriceMath,
  TickUtil,
  decreaseLiquidityQuoteByLiquidityWithParams,
  increaseLiquidityQuoteByInputToken,
  increaseLiquidityQuoteByInputTokenWithParams,
} from "@orca-so/whirlpools-sdk";
import { Decimal } from "../../utils/decimal";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  selectPriorityFeeIx,
  selectUiInvertWhirlpool,
  selectWhirlpoolUserPositionList,
  splMintAtomFamily,
  whirlpoolAtomFamily,
  whirlpoolPositionAtomFamily,
} from "../../state";
import BN from "bn.js";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import useSharedTxLogic from "../useSendTxCommon";
import { useLoadUserClpPositions } from "./useLoadIndividualWhirlpool";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { buildFromTxBuilder } from "../../utils/tx-utils";

export const useWhirlpoolActions = (whirlpoolKey: string) => {
  const whirlpoolClient = useWhirlpoolClient();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(whirlpoolKey));
  const { sendMultipleTransactions, sendTx } = useSharedTxLogic();
  const mintA = whirlpool?.tokenMintA ?? "";
  const mintB = whirlpool?.tokenMintB ?? "";
  const tokenADecimal =
    useRecoilValue(splMintAtomFamily(mintA.toString()))?.decimals ?? 0;
  const tokenBDecimal =
    useRecoilValue(splMintAtomFamily(mintB.toString()))?.decimals ?? 0;
  const loadPositions = useLoadUserClpPositions(whirlpoolKey);
  const { connection } = useConnection();
  const positions = useRecoilValue(
    selectWhirlpoolUserPositionList(whirlpoolKey)
  );
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const isPoolInverted = useRecoilValue(selectUiInvertWhirlpool(whirlpoolKey));
  const wallet = useAnchorWallet();

  const openPosition = useCallback(
    async (
      lowerPrice: string,
      upperPrice: string,
      usingA: boolean,
      liquidity: string
    ) => {
      const pool = await whirlpoolClient.getPool(whirlpoolKey);
      if (!whirlpool || !wallet) throw new Error("No whirlpool");
      const txBuilders = [];
      const txs = [] as (Transaction | VersionedTransaction)[];
      // TODO: DRY this up with getQuote
      const lowerPriceDecimal = new Decimal(
        !Number(lowerPrice) || lowerPrice == "0" ? 0.0000001 : lowerPrice
      );
      const upperPriceDecimal = new Decimal(upperPrice || 0.0000001);
      const tickLower = TickUtil.getInitializableTickIndex(
        PriceMath.priceToTickIndex(
          isPoolInverted
            ? PriceMath.invertPrice(
                upperPriceDecimal,
                tokenADecimal,
                tokenBDecimal
              )
            : lowerPriceDecimal,
          tokenADecimal,
          tokenBDecimal
        ),
        whirlpool.tickSpacing
      );
      const tickUpper = TickUtil.getInitializableTickIndex(
        PriceMath.priceToTickIndex(
          isPoolInverted
            ? PriceMath.invertPrice(
                lowerPriceDecimal,
                tokenADecimal,
                tokenBDecimal
              )
            : upperPriceDecimal,
          tokenADecimal,
          tokenBDecimal
        ),
        whirlpool.tickSpacing
      );
      const quote = increaseLiquidityQuoteByInputToken(
        usingA ? mintA : mintB,
        new Decimal(liquidity),
        tickLower,
        tickUpper,
        Percentage.fromFraction(1, 100),
        pool
      );

      const initTickTx = await pool.initTickArrayForTicks(
        [tickLower, tickUpper],
        undefined,
        IGNORE_CACHE
      );
      const latestBlockhash = await connection.getLatestBlockhash();
      const descriptions = [] as string[];
      if (initTickTx) {
        txBuilders.push(initTickTx);
        descriptions.push("Initializing tick array...");
      }

      const { tx } = await pool.openPosition(tickLower, tickUpper, quote);
      txBuilders.push(tx);
      descriptions.push("Opening position...");
      for (const txBuilder of txBuilders) {
        const { tx } = await buildFromTxBuilder(
          txBuilder,
          connection,
          wallet.publicKey,
          latestBlockhash,
          priorityFeeIx,
          true
        );
        txs.push(tx);
      }
      const txIds = await sendMultipleTransactions(txs, descriptions);
      await loadPositions();
      return Object.values(txIds) as string[];
    },
    [
      connection,
      isPoolInverted,
      loadPositions,
      mintA,
      mintB,
      priorityFeeIx,
      sendMultipleTransactions,
      tokenADecimal,
      tokenBDecimal,
      wallet,
      whirlpool,
      whirlpoolClient,
      whirlpoolKey,
    ]
  );

  const closePosition = useCallback(
    async (positionKey: string) => {
      if (!wallet) return [];
      const pool = await whirlpoolClient.getPool(whirlpoolKey);
      const closeTransactions = await pool.closePosition(
        positionKey,
        Percentage.fromFraction(5, 1000)
      );
      const txs = [] as (Transaction | VersionedTransaction)[];
      const latestBlockhash = await connection.getLatestBlockhash();

      for (const txBuilder of closeTransactions) {
        const { tx } = await buildFromTxBuilder(
          txBuilder,
          connection,
          wallet.publicKey,
          latestBlockhash,
          priorityFeeIx,
          true
        );
        txs.push(tx);
      }
      const txIds = await sendMultipleTransactions(
        txs,
        txs.map(() => "Closing position")
      );
      await loadPositions();
      return Object.values(txIds) as string[];
    },
    [
      connection,
      loadPositions,
      priorityFeeIx,
      sendMultipleTransactions,
      wallet,
      whirlpoolClient,
      whirlpoolKey,
    ]
  );

  const getQuote = useCallback(
    (
      lowerPrice: string,
      upperPrice: string,
      usingA: boolean,
      liquidity: string
    ) => {
      if (!whirlpool)
        return {
          estA: new Decimal(0),
          estB: new Decimal(0),
          maxA: new Decimal(0),
          maxB: new Decimal(0),
        };
      const lowerPriceDecimal = new Decimal(
        !Number(lowerPrice) || lowerPrice == "0" ? 0.0000001 : lowerPrice
      );
      const upperPriceDecimal = new Decimal(upperPrice || 0.0000001);
      const tickLower = TickUtil.getInitializableTickIndex(
        PriceMath.priceToTickIndex(
          isPoolInverted
            ? PriceMath.invertPrice(
                upperPriceDecimal,
                tokenADecimal,
                tokenBDecimal
              )
            : lowerPriceDecimal,
          tokenADecimal,
          tokenBDecimal
        ),
        whirlpool.tickSpacing
      );
      const tickUpper = TickUtil.getInitializableTickIndex(
        PriceMath.priceToTickIndex(
          isPoolInverted
            ? PriceMath.invertPrice(
                lowerPriceDecimal,
                tokenADecimal,
                tokenBDecimal
              )
            : upperPriceDecimal,
          tokenADecimal,
          tokenBDecimal
        ),
        whirlpool.tickSpacing
      );
      if (tickLower >= tickUpper)
        return {
          estA: new Decimal(0),
          estB: new Decimal(0),
          maxA: new Decimal(0),
          maxB: new Decimal(0),
        };

      const quote = increaseLiquidityQuoteByInputTokenWithParams({
        tokenMintA: whirlpool.tokenMintA,
        tokenMintB: whirlpool.tokenMintB,
        tickCurrentIndex: whirlpool.tickCurrentIndex,
        sqrtPrice: whirlpool.sqrtPrice,
        inputTokenMint: usingA ? whirlpool.tokenMintA : whirlpool.tokenMintB,
        inputTokenAmount: new BN(
          new Decimal(liquidity)
            .mul(10 ** (usingA ? tokenADecimal : tokenBDecimal))
            .floor()
            .toString()
        ),
        tickLowerIndex: tickLower,
        tickUpperIndex: tickUpper,
        slippageTolerance: Percentage.fromFraction(1, 1000),
      });
      return {
        estA: new Decimal(quote.tokenEstA.toString()).div(10 ** tokenADecimal),
        estB: new Decimal(quote.tokenEstB.toString()).div(10 ** tokenBDecimal),
        maxA: new Decimal(quote.tokenMaxA.toString()).div(10 ** tokenADecimal),
        maxB: new Decimal(quote.tokenMaxB.toString()).div(10 ** tokenBDecimal),
      };
    },
    [isPoolInverted, tokenADecimal, tokenBDecimal, whirlpool]
  );

  const getIncreasePositionQuote = useRecoilCallback(
    ({ snapshot }) =>
      (positionAddress: string, usingA: boolean, liquidity: string) => {
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionAddress))
          .getValue();
        if (!whirlpool || !position || !liquidity || !Number(liquidity))
          return {
            estA: new Decimal(0),
            estB: new Decimal(0),
            maxA: new Decimal(0),
            maxB: new Decimal(0),
          };
        const quote = increaseLiquidityQuoteByInputTokenWithParams({
          tokenMintA: whirlpool.tokenMintA,
          tokenMintB: whirlpool.tokenMintB,
          tickCurrentIndex: whirlpool.tickCurrentIndex,
          sqrtPrice: whirlpool.sqrtPrice,
          inputTokenMint: usingA ? whirlpool.tokenMintA : whirlpool.tokenMintB,
          inputTokenAmount: new BN(
            new Decimal(liquidity)
              .mul(10 ** (usingA ? tokenADecimal : tokenBDecimal))
              .toString()
          ),
          tickLowerIndex: position.tickLowerIndex,
          tickUpperIndex: position.tickUpperIndex,
          slippageTolerance: Percentage.fromFraction(1, 1000),
        });
        return {
          estA: new Decimal(quote.tokenEstA.toString()).div(
            10 ** tokenADecimal
          ),
          estB: new Decimal(quote.tokenEstB.toString()).div(
            10 ** tokenBDecimal
          ),
          maxA: new Decimal(quote.tokenMaxA.toString()).div(
            10 ** tokenADecimal
          ),
          maxB: new Decimal(quote.tokenMaxB.toString()).div(
            10 ** tokenBDecimal
          ),
        };
      },
    [tokenADecimal, tokenBDecimal, whirlpool]
  );

  const getDecreasePositionQuote = useRecoilCallback(
    ({ snapshot }) =>
      (positionAddress: string, percentage: number, slippage: number) => {
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionAddress))
          .getValue();

        if (!whirlpool || !position || !percentage)
          return {
            estA: new Decimal(0),
            estB: new Decimal(0),
            minA: new Decimal(0),
            minB: new Decimal(0),
          };
        const totalLiquidityInPosition = position.liquidity;
        const withdrawLiquidityAmount = totalLiquidityInPosition.muln(
          percentage / 100
        );

        const quote = decreaseLiquidityQuoteByLiquidityWithParams({
          liquidity: withdrawLiquidityAmount,
          sqrtPrice: whirlpool.sqrtPrice,
          tickCurrentIndex: whirlpool.tickCurrentIndex,
          tickLowerIndex: position.tickLowerIndex,
          tickUpperIndex: position.tickUpperIndex,
          slippageTolerance: Percentage.fromDecimal(new Decimal(slippage)),
        });

        return {
          estA: new Decimal(quote.tokenEstA.toString()).div(
            10 ** tokenADecimal
          ),
          estB: new Decimal(quote.tokenEstB.toString()).div(
            10 ** tokenBDecimal
          ),
          minA: new Decimal(quote.tokenMinA.toString()).div(
            10 ** tokenADecimal
          ),
          minB: new Decimal(quote.tokenMinB.toString()).div(
            10 ** tokenBDecimal
          ),
        };
      },
    [tokenADecimal, tokenBDecimal, whirlpool]
  );

  const increaseLiquidity = useCallback(
    async (
      positionAddress: string,
      usingA: boolean,
      liquidity: string,
      slippage: number
    ) => {
      if (!whirlpool) throw new Error("No whirlpool");
      if (!wallet) throw new Error("no wallet connected");
      const position = await whirlpoolClient.getPosition(positionAddress);
      const latestBlockhash = await connection.getLatestBlockhash();
      const inputMint = usingA ? mintA : mintB;
      const tokenAmount = new Decimal(liquidity || 0).mul(
        10 ** (usingA ? tokenADecimal : tokenBDecimal)
      );
      const positionData = position.getData();
      const tokenAmountBN = new BN(tokenAmount.toString());
      const increase_quote = increaseLiquidityQuoteByInputTokenWithParams({
        inputTokenAmount: tokenAmountBN,
        inputTokenMint: new PublicKey(inputMint),
        tokenMintA: new PublicKey(mintA),
        tokenMintB: new PublicKey(mintB),
        tickCurrentIndex: whirlpool.tickCurrentIndex,
        sqrtPrice: whirlpool.sqrtPrice,
        tickLowerIndex: positionData.tickLowerIndex,
        tickUpperIndex: positionData.tickUpperIndex,
        slippageTolerance: Percentage.fromDecimal(new Decimal(slippage)),
      });
      const builder = await position.increaseLiquidity(increase_quote);
      const { tx, signers } = await buildFromTxBuilder(
        builder as unknown as TransactionBuilder,
        connection,
        wallet.publicKey,
        latestBlockhash,
        priorityFeeIx,
        false
      );
      const signature = await sendTx(
        tx,
        signers,
        undefined,
        "Increasing liquidity"
      );
      return signature;
    },
    [
      connection,
      mintA,
      mintB,
      priorityFeeIx,
      sendTx,
      tokenADecimal,
      tokenBDecimal,
      wallet,
      whirlpool,
      whirlpoolClient,
    ]
  );

  const decreaseLiquidity = useCallback(
    async (positionAddress: string, percentage: number, slippage: number) => {
      if (!whirlpool) throw new Error("No whirlpool");
      if (!wallet) throw new Error("no wallet connected");
      const position = await whirlpoolClient.getPosition(positionAddress);
      const latestBlockhash = await connection.getLatestBlockhash();
      const positionData = position.getData();
      const totalLiquidityInPosition = positionData.liquidity;
      const withdrawLiquidityAmount = totalLiquidityInPosition.muln(
        percentage / 100
      );
      const depositQuote = decreaseLiquidityQuoteByLiquidityWithParams({
        liquidity: withdrawLiquidityAmount,
        sqrtPrice: whirlpool.sqrtPrice,
        tickCurrentIndex: whirlpool.tickCurrentIndex,
        tickLowerIndex: positionData.tickLowerIndex,
        tickUpperIndex: positionData.tickUpperIndex,
        slippageTolerance: Percentage.fromDecimal(new Decimal(slippage)),
      });
      const builder = await position.decreaseLiquidity(depositQuote);
      const { tx, signers } = await buildFromTxBuilder(
        builder as unknown as TransactionBuilder,
        connection,
        wallet.publicKey,
        latestBlockhash,
        priorityFeeIx,
        false
      );
      const txId = await sendTx(
        tx,
        signers,
        undefined,
        "Decreasing liquidity..."
      );
      await loadPositions();
      return txId;
    },
    [
      connection,
      loadPositions,
      priorityFeeIx,
      sendTx,
      wallet,
      whirlpool,
      whirlpoolClient,
    ]
  );

  const collectFees = useCallback(async () => {
    if (!wallet) return;
    const txs = [] as (Transaction | VersionedTransaction)[];
    const latestBlockhash = await connection.getLatestBlockhash();
    const txBuilders = await whirlpoolClient.collectFeesAndRewardsForPositions(
      positions.map((p) => p.pubkey)
    );
    for (const txBuilder of txBuilders) {
      const { tx } = await buildFromTxBuilder(
        txBuilder,
        connection,
        wallet.publicKey,
        latestBlockhash,
        priorityFeeIx,
        true
      );
      txs.push(tx);
    }
    try {
      const txIds = await sendMultipleTransactions(
        txs,
        txs.map(() => "Collecting fees")
      );
      loadPositions();
      return Object.values(txIds) as string[];
    } catch (error) {
      console.error(error);
    }
  }, [
    connection,
    loadPositions,
    positions,
    priorityFeeIx,
    sendMultipleTransactions,
    wallet,
    whirlpoolClient,
  ]);

  return {
    openPosition,
    closePosition,
    getQuote,
    getIncreasePositionQuote,
    getDecreasePositionQuote,
    increaseLiquidity,
    decreaseLiquidity,
    collectFees,
  };
};
