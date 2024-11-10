import { selectorFamily } from "recoil";
import {
  whirlpoolAtomFamily,
  whirlpoolOwnedPositionKeys,
  whirlpoolPositionAtomFamily,
  whirlpoolTickDataAtomFamily,
} from "./atoms";
import { splMintAtomFamily, tokenMetadataFamily } from "../tokens";
import { PoolUtil, PriceMath, collectFeesQuote } from "@orca-so/whirlpools-sdk";
import { Decimal } from "../../utils/decimal";

export type NormalizedPositionData = {
  lowerPrice: number;
  upperPrice: number;
  pubkey: string;
  liquidity: number;
  liquidityA: number;
  liquidityB: number;
  tokenABalance: number;
  tokenBBalance: number;
  feesA: Decimal;
  feesB: Decimal;
};

export const selectWhirlpoolTokenASymbol = selectorFamily({
  key: "selectWhirlpoolTokenASymbol",
  get:
    (key: string) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(key));
      const tokenAMetadata = get(
        tokenMetadataFamily(whirlpool?.tokenMintA.toString() ?? "")
      );
      return (
        tokenAMetadata?.symbol ??
        whirlpool?.tokenMintA.toString().slice(0, 5) ??
        "Token A"
      );
    },
});

export const selectWhirlpoolTokenBSymbol = selectorFamily({
  key: "selectWhirlpoolTokenBSymbol",
  get:
    (key: string) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(key));
      const tokenBMetadata = get(
        tokenMetadataFamily(whirlpool?.tokenMintB.toString() ?? "")
      );
      return (
        tokenBMetadata?.symbol ??
        whirlpool?.tokenMintB.toString().slice(0, 5) ??
        "Token B"
      );
    },
});

export const selectUiInvertWhirlpool = selectorFamily({
  key: "selectUiInvertWhirlpool",
  get:
    (whirlpoolKey: string) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      if (!whirlpool) {
        return false;
      }
      const [sortedA] = PoolUtil.toBaseQuoteOrder(
        whirlpool.tokenMintA,
        whirlpool.tokenMintB
      );
      return !sortedA.equals(whirlpool.tokenMintA);
    },
});

export const selectWhirlpoolCurrentPrice = selectorFamily({
  key: "selectWhirlpoolCurrentPrice",
  get:
    (whirlpoolKey: string) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      const tokenAMint = whirlpool?.tokenMintA.toString() ?? "";
      const tokenBMint = whirlpool?.tokenMintB.toString() ?? "";
      const invertedTokens = get(selectUiInvertWhirlpool(whirlpoolKey));
      const mintA = get(splMintAtomFamily(tokenAMint));
      const mintB = get(splMintAtomFamily(tokenBMint));
      if (!whirlpool || !mintA || !mintB) {
        return null;
      }
      const price = PriceMath.sqrtPriceX64ToPrice(
        whirlpool.sqrtPrice,
        mintA.decimals,
        mintB.decimals
      );
      const currentPrice = invertedTokens
        ? PriceMath.invertPrice(price, mintA.decimals, mintB.decimals)
        : price;

      return currentPrice;
    },
});

export const selectPositionUncollectedFeeEstimateUiAmount = selectorFamily({
  key: "selectPositionUncollectedFeeEstimateUiAmount",
  get:
    (key: string) =>
    ({ get }) => {
      const position = get(whirlpoolPositionAtomFamily(key));
      const positionTickData = get(whirlpoolTickDataAtomFamily(key));
      const whirlpool = get(
        whirlpoolAtomFamily(position?.whirlpool.toString() ?? "")
      );
      if (!position || !positionTickData || !whirlpool) {
        return {
          feeOwedA: new Decimal(0),
          feeOwedB: new Decimal(0),
        };
      }
      const { feeOwedA, feeOwedB } = collectFeesQuote({
        whirlpool,
        position,
        tickLower: positionTickData.lowerTickData,
        tickUpper: positionTickData.upperTickData,
      });
      return {
        feeOwedA: new Decimal(feeOwedA.toString()),
        feeOwedB: new Decimal(feeOwedB.toString()),
      };
    },
});

export const selectTickIndexToPrice = selectorFamily({
  key: "selectTickIndexToPrice",
  get:
    (whirlpoolKey: string) =>
    ({ get, getCallback }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      const tokenAMint = whirlpool?.tokenMintA.toString() ?? "";
      const tokenBMint = whirlpool?.tokenMintB.toString() ?? "";
      const mintA = get(splMintAtomFamily(tokenAMint));
      const mintB = get(splMintAtomFamily(tokenBMint));
      const invertedTokens = get(selectUiInvertWhirlpool(whirlpoolKey));

      return getCallback(() => (tick: number, requireInvert: boolean) => {
        if (!whirlpool || !mintA || !mintB) {
          return new Decimal(0);
        }
        const price = PriceMath.tickIndexToPrice(
          tick,
          mintA.decimals,
          mintB.decimals
        );
        return invertedTokens && requireInvert
          ? PriceMath.invertPrice(price, mintA.decimals, mintB.decimals)
          : price;
      });
    },
});

export const selectWhirlpoolUserPositionList = selectorFamily<
  NormalizedPositionData[],
  string
>({
  key: "selectWhirlpoolUserPositionList",
  get:
    (whirlpoolKey) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      const tokenAMint = whirlpool?.tokenMintA.toString() ?? "";
      const tokenBMint = whirlpool?.tokenMintB.toString() ?? "";
      const invertedTokens = get(selectUiInvertWhirlpool(whirlpoolKey));
      const mintA = get(splMintAtomFamily(tokenAMint));
      const mintB = get(splMintAtomFamily(tokenBMint));
      const positionKeys = get(whirlpoolOwnedPositionKeys(whirlpoolKey));
      const getTickPrice = get(selectTickIndexToPrice(whirlpoolKey));
      if (!whirlpool || !tokenAMint || !tokenBMint || !mintA || !mintB) {
        return [];
      }

      const price = PriceMath.sqrtPriceX64ToPrice(
        whirlpool.sqrtPrice,
        mintA.decimals,
        mintB.decimals
      );
      const currentPrice = invertedTokens
        ? PriceMath.invertPrice(price, mintA.decimals, mintB.decimals)
        : price;

      return (
        (positionKeys
          .map((position) => {
            const positionData = get(whirlpoolPositionAtomFamily(position));
            if (!positionData) {
              return null;
            }
            const tokenAmounts = PoolUtil.getTokenAmountsFromLiquidity(
              positionData.liquidity,
              whirlpool.sqrtPrice,
              PriceMath.tickIndexToSqrtPriceX64(positionData.tickLowerIndex),
              PriceMath.tickIndexToSqrtPriceX64(positionData.tickUpperIndex),
              true
            );
            const tokenABalance = new Decimal(
              tokenAmounts.tokenA.toString()
            ).div(10 ** mintA.decimals);
            const tokenBBalance = new Decimal(
              tokenAmounts.tokenB.toString()
            ).div(10 ** mintB.decimals);
            const lowerPrice = getTickPrice(
              invertedTokens
                ? positionData.tickUpperIndex
                : positionData.tickLowerIndex,
              true
            ).toNumber();
            const upperPrice = getTickPrice(
              invertedTokens
                ? positionData.tickLowerIndex
                : positionData.tickUpperIndex,
              true
            ).toNumber();

            // liquidity per price point in terms of token B
            const scaledLiquidityB = currentPrice
              .mul(tokenABalance)
              .add(tokenBBalance)
              .div(upperPrice - lowerPrice)
              .toNumber();
            // liquidity per price point in terms of token A
            const scaledLiquidityA = tokenBBalance
              .div(currentPrice)
              .add(tokenABalance)
              .div(upperPrice - lowerPrice)
              .toNumber();
            const { feeOwedA, feeOwedB } = get(
              selectPositionUncollectedFeeEstimateUiAmount(position)
            );
            return {
              pubkey: position,
              liquidityA: scaledLiquidityA,
              liquidityB: scaledLiquidityB,
              liquidity: positionData.liquidity
                .divn(upperPrice - lowerPrice)
                .toNumber(),
              lowerPrice,
              tokenABalance: tokenABalance.toNumber(),
              tokenBBalance: tokenBBalance.toNumber(),
              upperPrice,
              feesA: feeOwedA.div(10 ** mintA.decimals),
              feesB: feeOwedB.div(10 ** mintB.decimals),
            };
          })
          .filter((p) => !!p) as NormalizedPositionData[]) ?? []
      ).sort((a, b) => a.lowerPrice - b.lowerPrice);
    },
});

export const selectWhirlpoolUserPositionSum = selectorFamily({
  key: "selectWhirlpoolUserPositionSum",
  get:
    (whirlpoolKey: string) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      const mintA = get(
        splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
      );
      const mintB = get(
        splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
      );
      const userPositions = get(selectWhirlpoolUserPositionList(whirlpoolKey));
      let totalA = new Decimal(0);
      let totalB = new Decimal(0);

      if (!mintA || !mintB || !userPositions.length) return { totalA, totalB };

      for (const position of userPositions) {
        totalA = totalA.add(position.tokenABalance);
        totalB = totalB.add(position.tokenBBalance);
      }
      return {
        totalA,
        totalB,
      };
    },
});

export const selectWhirlpoolUserPositionsUncollectedFeesUiAmounts =
  selectorFamily({
    key: "selectWhirlpoolUserPositionsUncollectedFeesUiAmounts",
    get:
      (key: string) =>
      ({ get }) => {
        const whirlpool = get(whirlpoolAtomFamily(key));
        const positions = get(selectWhirlpoolUserPositionList(key));
        const tokenAMint = whirlpool?.tokenMintA.toString() ?? "";
        const tokenBMint = whirlpool?.tokenMintB.toString() ?? "";
        const mintA = get(splMintAtomFamily(tokenAMint));
        const mintB = get(splMintAtomFamily(tokenBMint));
        if (!mintB || !mintA || !whirlpool) {
          return null;
        }
        let owedA = new Decimal(0);
        let owedB = new Decimal(0);
        for (const { pubkey } of positions) {
          const { feeOwedA, feeOwedB } = get(
            selectPositionUncollectedFeeEstimateUiAmount(pubkey)
          );
          owedA = owedA.add(feeOwedA);
          owedB = owedB.add(feeOwedB);
        }
        const feeOwedA = owedA.div(10 ** mintA.decimals);
        const feeOwedB = owedB.div(10 ** mintB.decimals);

        return {
          feeOwedA,
          feeOwedB,
        };
      },
  });

export const selectPositionTokenPercentages = selectorFamily({
  key: "selectPositionTokenPercentages",
  get:
    (positionKey: string) =>
    ({ get }) => {
      const position = get(whirlpoolPositionAtomFamily(positionKey));
      const whirlpoolKey = position?.whirlpool.toString() ?? "";
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));

      if (!position || !whirlpool) {
        return {
          tokenA: 0,
          tokenB: 0,
        };
      }

      const currentTick = whirlpool.tickCurrentIndex;
      if (currentTick > position.tickUpperIndex) {
        return {
          tokenA: 0,
          tokenB: 100,
        };
      } else if (currentTick < position.tickLowerIndex) {
        return {
          tokenA: 100,
          tokenB: 0,
        };
      }

      const posRange = position.tickUpperIndex - position.tickLowerIndex;
      const tokenA = ((position.tickUpperIndex - currentTick) / posRange) * 100;
      const tokenB = ((currentTick - position.tickLowerIndex) / posRange) * 100;
      return {
        tokenA: tokenA,
        tokenB: tokenB,
      };
    },
});
