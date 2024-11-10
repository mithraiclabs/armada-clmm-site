import { selector, selectorFamily } from "recoil";
import { PublicKey } from "@solana/web3.js";
import {
  PoolUtil,
  PositionData,
  PriceMath,
  TickData,
  collectFeesQuote,
} from "@orca-so/whirlpools-sdk";
import {
  clmmVaultManagerFilterAtom,
  clmmVaultSearchFilterAtom,
  clmmVaultSortAtom,
  clpVaultAtomFamily,
  clpVaultKeysAtom,
  clpVaultRateAtomFamily,
} from "./atoms";
import {
  associatedTokenAccountAtomFamily,
  splMintAtomFamily,
  splTokenAccountAtomFamily,
  spotPriceMap,
  tokenMetadataFamily,
} from "../tokens/atoms";

import BN from "bn.js";
import { calculateTotalLiquidityOnPositions } from "@mithraic-labs/clp-vault";
import { VaultPosition } from "../../utils/types";
import { CLP_VAULT_TOKEN_DECIMALS } from "../../utils/constants";
import { DEPRECATED_VAULT_LIST } from ".";
import { Mint } from "@solana/spl-token";
import { DEFAULT_CLMM_CAP } from "./tvlCaps";
import { annualizeRatesAtom } from "../misc/atoms";
import _uniqBy from "lodash/uniqBy";
import {
  NormalizedPositionData,
  selectPositionUncollectedFeeEstimateUiAmount,
  selectTickIndexToPrice,
  selectUiInvertWhirlpool,
  selectWhirlpoolCurrentPrice,
  whirlpoolAtomFamily,
  whirlpoolOwnedPositionKeys,
  whirlpoolPositionAtomFamily,
  whirlpoolTickDataAtomFamily,
} from "../whirlpools";
import { Decimal } from "../../utils/decimal";

export const selectTokenASymbol = selectorFamily({
  key: "selectTokenASymbol",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const tokenAMetadata = get(
        tokenMetadataFamily(clpVault?.tokenMintA.toString() ?? "")
      );
      return (
        tokenAMetadata?.symbol ??
        clpVault?.tokenMintA.toString().slice(0, 5) ??
        "Token A"
      );
    },
});

export const selectTokenBSymbol = selectorFamily({
  key: "selectTokenBSymbol",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const tokenBMetadata = get(
        tokenMetadataFamily(clpVault?.tokenMintB.toString() ?? "")
      );
      return (
        tokenBMetadata?.symbol ??
        clpVault?.tokenMintB.toString().slice(0, 5) ??
        "Token B"
      );
    },
});

export const selectClpCurrentPrice = selectorFamily({
  key: "selectClpCurrentPrice",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const price = get(
        selectWhirlpoolCurrentPrice(clpVault?.clp.toString() ?? "")
      );
      return price;
    },
});

export const selectPriceTokenA = selectorFamily({
  key: "selectPriceTokenA",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(clpKey));
      const priceTokenA = get(spotPriceMap(vault?.tokenMintA.toString() ?? ""));
      const priceTokenB = get(spotPriceMap(vault?.tokenMintB.toString() ?? ""));
      const currentPrice = get(selectClpCurrentPrice(clpKey));

      if (!priceTokenA && priceTokenB && currentPrice) {
        return currentPrice.div(priceTokenB).toNumber();
      }
      return priceTokenA;
    },
});

export const selectPriceTokenB = selectorFamily({
  key: "selectPriceTokenB",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(clpKey));
      const priceTokenA = get(spotPriceMap(vault?.tokenMintA.toString() ?? ""));
      const priceTokenB = get(spotPriceMap(vault?.tokenMintB.toString() ?? ""));
      const currentPrice = get(selectClpCurrentPrice(clpKey));

      if (!priceTokenB && priceTokenA && currentPrice) {
        return currentPrice.mul(priceTokenA).toNumber();
      }
      return priceTokenB;
    },
});

export const selectClpVaultPositionDataList = selectorFamily<
  NormalizedPositionData[],
  string
>({
  key: "selectClpVaultPositionDataList",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      return get(
        selectVaultWhirlpoolPositionList({
          whirlpoolKey: clpVault?.clp.toString() ?? "",
          clpPositionKeys: clpVault?.positions.map((p) =>
            p.positionKey.toString()
          ),
        })
      );
    },
});

export const selectVaultWhirlpoolPositionList = selectorFamily<
  NormalizedPositionData[],
  {
    whirlpoolKey: string;
    clpPositionKeys?: string[];
  }
>({
  key: "selectVaultWhirlpoolPositionList",
  get:
    ({ whirlpoolKey, clpPositionKeys }) =>
    ({ get }) => {
      const whirlpool = get(whirlpoolAtomFamily(whirlpoolKey));
      const tokenAMint = whirlpool?.tokenMintA.toString() ?? "";
      const tokenBMint = whirlpool?.tokenMintB.toString() ?? "";
      const invertedTokens = get(selectUiInvertWhirlpool(whirlpoolKey));
      const mintA = get(splMintAtomFamily(tokenAMint));
      const mintB = get(splMintAtomFamily(tokenBMint));
      const positionKeys = get(whirlpoolOwnedPositionKeys(whirlpoolKey));
      const getTickPrice = get(selectTickIndexToPrice(whirlpoolKey));
      // if we pass position keys its for a clp vauls
      const forClpVault = !!clpPositionKeys;
      const positions = clpPositionKeys ?? positionKeys;
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
        (positions
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
              invertedTokens && forClpVault
                ? positionData.tickUpperIndex
                : positionData.tickLowerIndex,
              forClpVault
            ).toNumber();
            const upperPrice = getTickPrice(
              invertedTokens && forClpVault
                ? positionData.tickLowerIndex
                : positionData.tickUpperIndex,
              forClpVault
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

export const selectAllClpVaultMints = selector({
  key: "selectAllClpVaultMints",
  get: ({ get }) => {
    const keys = get(clpVaultKeysAtom);
    const mints = [] as string[];
    for (const vaultId of keys) {
      const vault = get(clpVaultAtomFamily(vaultId));
      if (vault) {
        const lpMint = vault.lpMint.toString();
        const aMint = vault.tokenMintA.toString();
        const bMint = vault.tokenMintB.toString();
        [lpMint, aMint, bMint].forEach((m) => {
          if (!mints.includes(m)) mints.push(m);
        });
      }
    }
    return mints;
  },
});

/**
 * Note: this will only show uncollected fees that have calculated on-chain
 * using the UpdateFees IX.
 *
 * Devs will most likely want to use `selectUncollectedFeeEstimateUiAmounts`.
 */
export const selectClpVaultUncollectedFees = selectorFamily({
  key: "selectClpVaultUncollectedFees",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const mintA = get(
        splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
      );
      const mintB = get(
        splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
      );

      if (!clpVault || !mintA || !mintB) {
        return null;
      }

      const sumFees = (clpVault.positions as VaultPosition[]).reduce(
        (acc, vp) => {
          const position = get(
            whirlpoolPositionAtomFamily(vp.positionKey.toString() ?? "")
          );
          if (!position) {
            return acc;
          }
          acc.tokenAFees = acc.tokenAFees.add(position.feeOwedA);
          acc.tokenBFees = acc.tokenBFees.add(position.feeOwedB);
          return acc;
        },
        { tokenAFees: new BN(0), tokenBFees: new BN(0) }
      );

      return {
        tokenAFees: new Decimal(sumFees.tokenAFees.toString()).div(
          10 ** mintA.decimals
        ),
        tokenBFees: new Decimal(sumFees.tokenBFees.toString()).div(
          10 ** mintB.decimals
        ),
      };
    },
});

export const selectWhirlpoolPositionsForClpVault = selectorFamily({
  key: "selectWhirlpoolPositionsForClpVault",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(clpKey));
      const positions = {} as Record<string, PositionData | null>;
      for (const position of vault?.positions as VaultPosition[]) {
        const positionRecord = get(
          whirlpoolPositionAtomFamily(position.positionKey.toString())
        );
        positions[position.positionKey.toString()] = positionRecord;
      }
      return positions;
    },
});

export const selectTickDataForClpVault = selectorFamily({
  key: "selectTickDataForClpVault",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(clpKey));
      const tickData = {} as Record<
        string,
        {
          lowerTickData: TickData;
          upperTickData: TickData;
        } | null
      >;
      for (const position of vault?.positions as VaultPosition[]) {
        const tickDataRecord = get(
          whirlpoolTickDataAtomFamily(position.positionKey.toString())
        );
        tickData[position.positionKey.toString()] = tickDataRecord;
      }
      return tickData;
    },
});

export const selectClpTotalTokenAmounts = selectorFamily({
  key: "selectClpTotalTokenAmounts",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      if (!clpVault) return null;
      const whirlpool = get(whirlpoolAtomFamily(clpVault.clp.toString()));
      const whirlpoolPositions = get(
        selectWhirlpoolPositionsForClpVault(clpKey)
      );
      const whirlpoolTickData = get(selectTickDataForClpVault(clpKey));

      if (!whirlpool || !whirlpoolPositions || !whirlpoolTickData) {
        return null;
      }

      const tokenAccountA = get(
        splTokenAccountAtomFamily(clpVault.tokenVaultA.toString() ?? "")
      );
      const tokenAccountB = get(
        splTokenAccountAtomFamily(clpVault.tokenVaultB.toString() ?? "")
      );
      const totalFromPositions = calculateTotalLiquidityOnPositions({
        clpVault,
        whirlpool,
        whirlpoolPositions,
        whirlpoolTickData,
      });

      return {
        tokenA: totalFromPositions.totalA.add(
          new BN(tokenAccountA?.amount.toString() ?? 0)
        ),
        tokenB: totalFromPositions.totalB.add(
          new BN(tokenAccountB?.amount.toString() ?? 0)
        ),
      };
    },
  dangerouslyAllowMutability: true,
});

export const selectClpTotalTokenAmountsWithoutFees = selectorFamily({
  key: "selectClpTotalTokenAmountsWithoutFees",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      if (!clpVault) return null;
      const whirlpool = get(whirlpoolAtomFamily(clpVault.clp.toString()));
      const whirlpoolPositions = get(
        selectWhirlpoolPositionsForClpVault(clpKey)
      );
      const whirlpoolTickData = get(selectTickDataForClpVault(clpKey));

      if (!whirlpool || !whirlpoolPositions || !whirlpoolTickData) {
        return null;
      }

      const tokenAccountA = get(
        splTokenAccountAtomFamily(clpVault.tokenVaultA.toString() ?? "")
      );
      const tokenAccountB = get(
        splTokenAccountAtomFamily(clpVault.tokenVaultB.toString() ?? "")
      );
      const totalFromPositions = calculateTotalLiquidityOnPositions({
        clpVault,
        whirlpool,
        whirlpoolPositions,
        whirlpoolTickData,
        skipFees: true,
      });

      return {
        tokenA: totalFromPositions.totalA.add(
          new BN(tokenAccountA?.amount.toString() ?? 0)
        ),
        tokenB: totalFromPositions.totalB.add(
          new BN(tokenAccountB?.amount.toString() ?? 0)
        ),
      };
    },
  dangerouslyAllowMutability: true,
});

/**
 * Total token amounts, but normalized using the mint's decimals
 */
export const selectClpTotalTokenUiAmounts = selectorFamily({
  key: "selectClpTotalTokenUiAmounts",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const tokenAmounts = get(selectClpTotalTokenAmounts(clpKey));
      const mintA = get(
        splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
      );
      const mintB = get(
        splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
      );

      if (!tokenAmounts || !mintA || !mintB) {
        return null;
      }

      const totalA = new Decimal(tokenAmounts.tokenA.toString()).div(
        10 ** mintA.decimals
      );
      const totalB = new Decimal(tokenAmounts.tokenB.toString()).div(
        10 ** mintB.decimals
      );
      return {
        tokenA: totalA,
        tokenB: totalB,
      };
    },
});

export const selectUseClpInitialRatio = selectorFamily({
  key: "selectUseClpInitialRatio",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const totalTokenAmounts = get(selectClpTotalTokenAmounts(clpKey));
      return (
        !totalTokenAmounts ||
        (totalTokenAmounts.tokenA.eqn(0) && totalTokenAmounts.tokenB.eqn(0))
      );
    },
});

export const selectVaultTvlTokenA = selectorFamily({
  key: "selectVaultTvlTokenA",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const priceTokenA = get(selectPriceTokenA(clpKey));
      const tokenAmounts = get(selectClpTotalTokenUiAmounts(clpKey));
      if (!tokenAmounts || !priceTokenA) {
        return null;
      }
      return tokenAmounts.tokenA.mul(priceTokenA);
    },
});

export const selectVaultTvlTokenB = selectorFamily({
  key: "selectVaultTvlTokenB",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const priceTokenB = get(selectPriceTokenB(clpKey));
      const tokenAmounts = get(selectClpTotalTokenUiAmounts(clpKey));
      if (!tokenAmounts || !priceTokenB) {
        return null;
      }
      return tokenAmounts.tokenB.mul(priceTokenB);
    },
});

export const selectVaultTvl = selectorFamily({
  key: "selectVaultTvl",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const tvlTokenA = get(selectVaultTvlTokenA(clpKey));
      const tvlTokenB = get(selectVaultTvlTokenB(clpKey));
      if (!tvlTokenA || !tvlTokenB) {
        return null;
      }

      return tvlTokenA.add(tvlTokenB);
    },
});

// todo use api for vault caps to avoid hardcoding
export const selectVaultMaxTvl = selectorFamily({
  key: "selectVaultMaxTvl",
  get: (_: string) => () => {
    // const customMaxTvl = customTvlCaps[clpKey];

    // if (customMaxTvl) {
    //   return new Decimal(customMaxTvl);
    // }

    return DEFAULT_CLMM_CAP;
  },
});

export const selectClp24HrFees = selectorFamily({
  key: "selectClp24HrFees",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const poolRateDoc = get(clpVaultRateAtomFamily(clpKey));
      const priceTokenA = get(selectPriceTokenA(clpKey));
      const priceTokenB = get(selectPriceTokenB(clpKey));

      if (!poolRateDoc || !priceTokenA || !priceTokenB) {
        return null;
      }

      const totalFeesA = new Decimal(poolRateDoc.feesA ?? 0);
      const totalFeesB = new Decimal(poolRateDoc.feesB ?? 0);
      // Normalize the fees to 24 hours
      const periodStartTime = poolRateDoc.startTime._seconds;
      const periodEndtime = poolRateDoc.endTime._seconds;
      const period = periodEndtime - periodStartTime;
      const oneDayFactor = new Decimal(period / (24 * 60 * 60));
      const oneDayFeesA = totalFeesA.div(oneDayFactor);
      const oneDayFeesB = totalFeesB.div(oneDayFactor);

      return oneDayFeesA.mul(priceTokenA).add(oneDayFeesB.mul(priceTokenB));
    },
});

export const selectClpDailyFeesYield = selectorFamily({
  key: "selectClpDailyFeesYield",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const annualizeRate = get(annualizeRatesAtom);
      const poolRateDoc = get(clpVaultRateAtomFamily(clpKey));

      if (!poolRateDoc) {
        return null;
      }
      const ratePeriodInSeconds =
        poolRateDoc.endTime._seconds - poolRateDoc.startTime._seconds;
      const dailyRate = new Decimal(24 * 60 * 60)
        .div(new Decimal(ratePeriodInSeconds))
        .mul(new Decimal(poolRateDoc.rate));
      if (annualizeRate) {
        return dailyRate.mul(365);
      }
      return dailyRate;
    },
});

export const selectClpDailyRates = selectorFamily({
  key: "selectClpDailyRates",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const annualizeRate = get(annualizeRatesAtom);
      const poolRateDoc = get(clpVaultRateAtomFamily(clpKey));

      if (!poolRateDoc) {
        return null;
      }
      const ratePeriodInSeconds =
        poolRateDoc.endTime._seconds - poolRateDoc.startTime._seconds;
      const dailyRate = new Decimal(24 * 60 * 60)
        .div(new Decimal(ratePeriodInSeconds))
        .mul(new Decimal(poolRateDoc.rate));
      if (annualizeRate) {
        return dailyRate.mul(365);
      }
      return dailyRate;
    },
});

export const selectClp24HrVolume = selectorFamily({
  key: "selectClp24HrVolume",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const fees24hr = get(selectClp24HrFees(clpKey));
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const whirlpool = get(
        whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
      );
      if (!fees24hr || !whirlpool) {
        return null;
      }

      // feeRate is stored as hundredths of a basis point
      // [see source](https://github.com/orca-so/whirlpools/blob/main/programs/whirlpool/src/state/whirlpool.rs#L21-L23)
      const poolFeeRate = whirlpool.feeRate / 1_000_000;
      // protocolFeeRate is stored as basis points
      // [see source](https://github.com/orca-so/whirlpools/blob/main/programs/whirlpool/src/state/whirlpool.rs#L25-L26)
      const poolProtocolFeeRate = whirlpool.protocolFeeRate / 10_000;
      const feePortionOfVolme = new Decimal(
        poolFeeRate * (1 - poolProtocolFeeRate)
      );

      return fees24hr.div(feePortionOfVolme);
    },
});

/**
 * How many LP Tokens are owned by the connected wallet, including staking.
 */
export const selectUserTotalLpBalance = selectorFamily({
  key: "selectUserTotalLpBalance",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const mintLp = clpVault?.lpMint.toString() ?? "";
      const lpAccountUser = get(associatedTokenAccountAtomFamily(mintLp));
      const lpTokensInWallet = new Decimal(
        lpAccountUser?.amount.toString() ?? 0
      ).div(10 ** CLP_VAULT_TOKEN_DECIMALS);
      return lpTokensInWallet;
    },
});

export const selectClpVaultUserBalance = selectorFamily({
  key: "selectClpVaultUserBalance",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(clpKey));
      if (!vault) {
        return [];
      }
      const mintA = vault.tokenMintA.toString();
      const mintB = vault.tokenMintB.toString();
      const mintLp = vault.lpMint.toString();
      const tokenMintA = get(splMintAtomFamily(mintA));
      const tokenMintB = get(splMintAtomFamily(mintB));
      const tokenMintLP = get(splMintAtomFamily(mintLp));
      const totals = get(selectClpTotalTokenAmounts(clpKey));
      const totalUserLpTokens = get(selectUserTotalLpBalance(clpKey));
      if (!totals || !tokenMintLP || !tokenMintA || !tokenMintB) {
        return [];
      }
      const totalSupply = new Decimal(tokenMintLP.supply.toString()).div(
        10 ** CLP_VAULT_TOKEN_DECIMALS
      );
      const shareOfSupply = totalUserLpTokens.div(
        totalSupply.isZero() ? 1 : totalSupply
      );
      const totalA = new Decimal(totals.tokenA.toString()).div(
        10 ** tokenMintA.decimals
      );
      const totalB = new Decimal(totals.tokenB.toString()).div(
        10 ** tokenMintB.decimals
      );

      return [
        totalA.mul(shareOfSupply).toFixed(tokenMintA.decimals),
        totalB.mul(shareOfSupply).toFixed(tokenMintB.decimals),
      ];
    },
});

/**
 * Convert current vault balances to a single USD value using prices from `spotPriceMap`.
 */
export const selectClpVaultUserUsdBalance = selectorFamily({
  key: "selectClpVaultUserUsdBalance",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const [vaultUserBalanceA, vaultUserBalanceB] = get(
        selectClpVaultUserBalance(clpKey)
      );
      const priceTokenA = get(selectPriceTokenA(clpKey));
      const priceTokenB = get(selectPriceTokenB(clpKey));

      if (
        !vaultUserBalanceA ||
        !vaultUserBalanceB ||
        !priceTokenA ||
        !priceTokenB
      ) {
        return null;
      }
      return new Decimal(vaultUserBalanceA)
        .mul(priceTokenA)
        .add(new Decimal(vaultUserBalanceB).mul(priceTokenB));
    },
});

export const selectAllClpVaultLpMints = selector({
  key: "selectAllClpVaultLpMints",
  get: ({ get }) => {
    const keys = get(clpVaultKeysAtom);
    const lpMints = [] as [string, string][];
    for (const vaultId of keys) {
      const vault = get(clpVaultAtomFamily(vaultId));
      if (vault) {
        const lpMint = vault.lpMint.toString();
        lpMints.push([vaultId, lpMint]);
      }
    }
    return lpMints;
  },
});

/**
 * List of all CLP Vault stakePool pubkeys
 */
export const selectAllClpVaultStakePoolKeys = selector({
  key: "selectAllClpVaultStakePoolKeys",
  get: ({ get }) => {
    const keys = get(clpVaultKeysAtom);
    return keys
      .map((key) => get(clpVaultAtomFamily(key))?.stakePool)
      .filter(
        (stakePoolKey) =>
          !!stakePoolKey && !stakePoolKey.equals(PublicKey.default)
      ) as PublicKey[];
  },
});

/**
 * Comma delimited string of stakePool addresses from CLP Vaults.
 *
 * Representing these as a single string improves performance as hooks
 * will properly detect changes in the string (unlike an object/array).
 */
export const selectCommaDelimitedStringOfClpVaultStakePoolKeys = selector({
  key: "selectCommaDelimitedStringOfClpVaultStakePoolKeys",
  get: ({ get }) => {
    const keys = get(selectAllClpVaultStakePoolKeys);
    return keys.map((key) => key.toString()).join(",");
  },
});

export const selectUncollectedFeeEstimate = selectorFamily({
  key: "selectUncollectedFeeEstimate",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const whirlpool = get(
        whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
      );

      if (!clpVault || !whirlpool) {
        return null;
      }

      return (clpVault.positions as VaultPosition[]).reduce(
        (acc, position) => {
          const positionTickData = get(
            whirlpoolTickDataAtomFamily(position.positionKey.toString())
          );
          const positionData = get(
            whirlpoolPositionAtomFamily(position.positionKey.toString())
          );
          if (
            PublicKey.default.equals(position.positionKey) ||
            !positionData ||
            !positionTickData
          ) {
            return acc;
          }
          const feesQuote = collectFeesQuote({
            whirlpool,
            position: positionData,
            tickLower: positionTickData.lowerTickData,
            tickUpper: positionTickData.upperTickData,
          });
          acc.feeOwedA = acc.feeOwedA.add(feesQuote.feeOwedA);
          acc.feeOwedB = acc.feeOwedB.add(feesQuote.feeOwedB);
          return acc;
        },
        {
          feeOwedA: new BN(0),
          feeOwedB: new BN(0),
        }
      );
    },
});

export const selectUncollectedFeeEstimateUiAmounts = selectorFamily({
  key: "selectUncollectedFeeEstimateUiAmounts",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const feeQuotes = get(selectUncollectedFeeEstimate(clpKey));
      const mintA = get(
        splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
      );
      const mintB = get(
        splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
      );

      if (!feeQuotes || !mintB || !mintA) {
        return null;
      }

      const feeOwedA = new Decimal(feeQuotes.feeOwedA.toString()).div(
        10 ** mintA.decimals
      );
      const feeOwedB = new Decimal(feeQuotes.feeOwedB.toString()).div(
        10 ** mintB.decimals
      );

      return {
        feeOwedA,
        feeOwedB,
      };
    },
});

export const estimateLpTokenValue = (
  tokenMintA: Mint | null,
  tokenMintB: Mint | null,
  lpMint: Mint | null,
  totals: {
    tokenA: BN;
    tokenB: BN;
  } | null,
  priceTokenA: number,
  priceTokenB: number
) => {
  if (tokenMintA && tokenMintB && lpMint && totals) {
    const totalSupply = new Decimal(lpMint.supply.toString()).div(
      10 ** CLP_VAULT_TOKEN_DECIMALS
    );
    const shareOfSupply = new Decimal(1).div(totalSupply);
    const totalA = new Decimal(totals.tokenA.toString()).div(
      10 ** tokenMintA.decimals
    );
    const totalB = new Decimal(totals.tokenB.toString()).div(
      10 ** tokenMintB.decimals
    );
    return shareOfSupply
      .mul(totalA)
      .mul(priceTokenA)
      .add(shareOfSupply.mul(totalB).mul(priceTokenB))
      .toNumber();
  }
  // avoid division by 0
  return 0;
};

// Sorts vault keys by TVL and filters out non whitelisted vaults.
export const selectSortedVaultKeys = selector({
  key: "selectSortedVaultKeys",
  get: ({ get }) => {
    const allKeys = get(clpVaultKeysAtom);
    const sortCriteria = get(clmmVaultSortAtom);
    const searchFilter = get(clmmVaultSearchFilterAtom);
    const managerFilter = get(clmmVaultManagerFilterAtom);
    const ascending = sortCriteria.ascending;
    const filtered = [...allKeys].filter((key) => {
      const vault = get(clpVaultAtomFamily(key));
      if (!vault) return false;
      const managerName = get(selectVaultManagerName(key));
      const symbolA = get(selectTokenASymbol(key));
      const symbolB = get(selectTokenBSymbol(key));

      if (
        !symbolA.toLowerCase().includes(searchFilter.toLowerCase()) &&
        !symbolB.toLowerCase().includes(searchFilter.toLowerCase())
      ) {
        return false;
      }
      if (managerFilter === "All") {
        return true;
      }

      return managerFilter === managerName;
    });

    let sorted = filtered;
    switch (sortCriteria.type) {
      case "rate":
        sorted = filtered.sort((a, b) => {
          const _24hrRateA = get(selectClpDailyFeesYield(a));
          const _24hrRateB = get(selectClpDailyFeesYield(b));
          const pos = ascending
            ? _24hrRateA?.sub(_24hrRateB ?? 0)
            : _24hrRateB?.sub(_24hrRateA ?? 0);
          return pos?.toNumber() ?? -1;
        });
        break;
      case "fees":
        sorted = filtered.sort((a, b) => {
          const _24hrFeesA = get(selectClp24HrFees(a));
          const _24hrFeesB = get(selectClp24HrFees(b));
          const pos = ascending
            ? _24hrFeesA?.sub(_24hrFeesB ?? 0)
            : _24hrFeesB?.sub(_24hrFeesA ?? 0);
          return pos?.toNumber() ?? -1;
        });
        break;
      case "volume":
        sorted = filtered.sort((a, b) => {
          const _24hrVolumeA = get(selectClp24HrVolume(a));
          const _24hrVolumeB = get(selectClp24HrVolume(b));
          const pos = ascending
            ? _24hrVolumeA?.sub(_24hrVolumeB ?? 0)
            : _24hrVolumeB?.sub(_24hrVolumeA ?? 0);
          return pos?.toNumber() ?? -1;
        });
        break;
      case "tvl":
      default:
        sorted = filtered.sort((a, b) => {
          const tvlA = get(selectVaultTvl(a));
          const tvlB = get(selectVaultTvl(b));
          const pos = ascending ? tvlA?.sub(tvlB ?? 0) : tvlB?.sub(tvlA ?? 0);
          return pos?.toNumber() ?? -1;
        });
        break;
    }
    // Always sort deprecated vaults at the bottom
    return sorted.sort((a, b) => {
      if (get(selectIsVaultDeprecated(b))) {
        return -1;
      }
      return 0;
    });
  },
});

/**
 * Some CLPs have token orderings that do not make sense for an end user (i.e. USDC/BTC).
 * This selector will return whether or not we must invert the information for the UI.
 */
export const selectUiInvertTokenPair = selectorFamily({
  key: "selectUiInvertTokenPair",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      if (!clpVault) {
        return false;
      }
      return get(selectUiInvertWhirlpool(clpVault.clp.toString()));
    },
});

export const selectGetUiTickIndexToPrice = selectorFamily({
  key: "selectGetUiTickIndexToPrice",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      return selectTickIndexToPrice(clpVault?.clp.toString() ?? "");
    },
});

export const selectClpVaultMetadata = selectorFamily({
  key: "selectClpVaultMetadata",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clp = get(clpVaultAtomFamily(clpKey));
      const lpMint = clp?.lpMint.toString() ?? "";
      const lpMintMeta = get(tokenMetadataFamily(lpMint));
      return lpMintMeta?.armadaMeta ?? null;
    },
});

export const selectClpVaultMetadataType = selectorFamily({
  key: "selectClpVaultMetadataType",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const metadata = get(selectClpVaultMetadata(clpKey));
      return metadata?.type ?? "rebalancing";
    },
});

/**
 * Find the first active position straddling current price, and determine it's fill %.
 */
export const selectClpCurrentTrancheFillPercentage = selectorFamily({
  key: "selectClpCurrentTrancheFillPercentage",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const whirlpool = get(
        whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
      );
      const tokenA = get(
        splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
      );
      const tokenB = get(
        splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
      );

      if (!clpVault || !whirlpool || !tokenA || !tokenB) {
        return null;
      }

      const position = (clpVault.positions as VaultPosition[])
        .filter((vp) => !vp.positionKey.equals(PublicKey.default))
        .find((vp) => {
          const pos = get(
            whirlpoolPositionAtomFamily(vp.positionKey.toString())
          );
          return (
            pos &&
            whirlpool.tickCurrentIndex > pos.tickLowerIndex &&
            whirlpool.tickCurrentIndex < pos.tickUpperIndex
          );
        });
      if (!position) {
        return null;
      }
      const tickToPrice = (tick: number) =>
        PriceMath.tickIndexToPrice(tick, tokenA.decimals, tokenB.decimals);
      const upperPrice = tickToPrice(position.upperTick);
      const lowerPrice = tickToPrice(position.lowerTick);
      const tickSpan = upperPrice.sub(lowerPrice);
      const tickDiff = tickToPrice(whirlpool.tickCurrentIndex).sub(lowerPrice);
      return tickDiff.div(tickSpan);
    },
});

export const selectVaultWhirlpoolKeys = selector({
  key: "selectVaultWhirlpoolKeys",
  get: ({ get }) => {
    const allKeys = get(clpVaultKeysAtom);

    return _uniqBy(
      allKeys
        .map((key) => {
          const vault = get(clpVaultAtomFamily(key));
          return vault?.clp.toString();
        })
        .filter((id) => !!id) as string[],
      (k) => k
    );
  },
});

export const selectIsVaultDeprecated = selectorFamily({
  key: "selectIsVaultDeprecated",
  get: (vaultKey: string) => () => {
    return DEPRECATED_VAULT_LIST.includes(vaultKey);
  },
});

export const selectSortText = selector({
  key: "selectSortText",
  get: ({ get }) => {
    const sortCriteria = get(clmmVaultSortAtom);
    let sortText = "TVL ";

    switch (sortCriteria.type) {
      case "tvl":
        sortText = "TVL ";
        break;
      case "fees":
        sortText = "Fees ";
        break;
      case "rate":
        sortText = "Rate ";
        break;
      case "volume":
        sortText = "Volume ";
        break;
    }

    return sortText;
  },
});

export const selectVaultManagerName = selectorFamily({
  key: "selectVaultManagerName",
  get:
    (vaultKey: string) =>
    ({ get }) => {
      const vault = get(clpVaultAtomFamily(vaultKey));
      switch (vault?.marketMakingKey.toString() ?? "") {
        case "2xFbZtJjR3szsVXrjVwU35uA9uk35xujNufdUzPFsqFL":
          return "STS";
        default:
          return "Armada";
      }
    },
});
