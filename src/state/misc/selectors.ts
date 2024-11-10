import { selector, selectorFamily } from "recoil";
import { clpVaultAtomFamily } from "../clp";
import {
  PerformanceDatapoint,
  customPriorityFee,
  customTimeframeAtom,
  historyRangeTypeAtom,
  mintPriceHistoryAtomFamily,
  slippageAtomFamily,
  vaultEventHistoryAtomFamily,
  vaultRateHistoryAtomFamily,
  vaultTvlHistoryAtomFamily,
} from "./atoms";
import { splMintAtomFamily } from "../tokens";
import { getRange } from "../../utils/stats";
import { EventDocument, FirebaseTimestamp } from "../../../../types/events";
import { ComputeBudgetProgram } from "@solana/web3.js";
import { RangeType } from "../../components/CLP/Stats";
import { Decimal } from "../../utils/decimal";

export type FormattedTVLDatapoint = {
  price: number;
  createdAt: number;
  totalA: number;
  totalAinB: number;
  totalB: number;
};

export type FormattedFeeDatapoint = {
  feesA: number;
  feesB: number;
  totalInB: number;
  rate: number;
  createdAt: number;
};

/** `slippageAtomFamily` wrapper that uses number */
export const slippageAsNumber = selectorFamily({
  key: "slippageAsNumer",
  get:
    (vaultId: string) =>
    ({ get }) =>
      parseFloat(get(slippageAtomFamily(vaultId))),
  set:
    (vaultId: string) =>
    ({ set }, newVal) =>
      set(slippageAtomFamily(vaultId), newVal.toString()),
});

/**
 * Formats data for vault tvl history according to decimal points
 */
export const selectVaultTVLHistory = selectorFamily<
  FormattedTVLDatapoint[],
  string
>({
  key: "selectVaultTVLHistory",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const rawHistory = get(vaultTvlHistoryAtomFamily(clpKey));
      const mintA = clpVault?.tokenMintA.toString() ?? "";
      const mintB = clpVault?.tokenMintB.toString() ?? "";
      const tokenMintA = get(splMintAtomFamily(mintA));
      const tokenMintB = get(splMintAtomFamily(mintB));
      if (!clpVault || !rawHistory.length || !tokenMintA || !tokenMintB) {
        return [];
      }
      return rawHistory.map((p) => ({
        price: p.price,
        createdAt: p.createdAt,
        totalA: p.totalA.div(10 ** tokenMintA.decimals).toNumber(),
        totalAinB: p.totalA
          .div(10 ** tokenMintA.decimals)
          .mul(p.price || 0)
          .toNumber(),
        totalB: p.totalB.div(10 ** (tokenMintB?.decimals ?? 0)).toNumber(),
      }));
    },
});

/**
 * Formats data for vault rate history according to decimal points
 */
export const selectVaultRateHistory = selectorFamily<
  FormattedFeeDatapoint[],
  string
>({
  key: "selectVaultRateHistory",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const rawHistory = get(vaultRateHistoryAtomFamily(clpKey));
      const mintA = clpVault?.tokenMintA.toString() ?? "";
      const mintB = clpVault?.tokenMintB.toString() ?? "";
      const tokenMintA = get(splMintAtomFamily(mintA));
      const tokenMintB = get(splMintAtomFamily(mintB));
      if (!clpVault || !rawHistory.length || !tokenMintA || !tokenMintB) {
        return [];
      }
      let lastPrice = 0;
      const history = [];
      for (const p of rawHistory) {
        const feesA = p.feesA.div(10 ** (tokenMintA?.decimals ?? 0)).toNumber();
        const feesB = p.feesB.div(10 ** (tokenMintB?.decimals ?? 0)).toNumber();
        let price = p.price;
        if (!price) {
          price = lastPrice;
        } else lastPrice = price;
        history.push({
          feesA,
          feesB,
          totalInB: p.feesA
            .div(10 ** (tokenMintA?.decimals ?? 0))
            .mul(price)
            .add(feesB)
            .toNumber(),
          rate: p.apy * 100,
          createdAt: p.createdAt,
        });
      }
      return history;
    },
});

export const selectVaultPnlHistory = selectorFamily<
  PerformanceDatapoint[],
  string
>({
  key: "selectVaultPnlHistory",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const mintA = clpVault?.tokenMintA.toString() ?? "";
      const mintB = clpVault?.tokenMintB.toString() ?? "";
      const tokenMintA = get(splMintAtomFamily(mintA));
      const tokenMintB = get(splMintAtomFamily(mintB));
      const lpMintInfo = get(
        splMintAtomFamily(clpVault?.lpMint.toString() ?? "")
      );
      const tvlData = get(vaultTvlHistoryAtomFamily(clpKey));
      const pricesA = get(mintPriceHistoryAtomFamily(mintA));
      const pricesB = get(mintPriceHistoryAtomFamily(mintB));
      const rangeType = get(historyRangeTypeAtom);
      const customTimeframe = get(customTimeframeAtom);
      const [from] =
        rangeType === RangeType.Custom
          ? customTimeframe.map((t) => t * 1000)
          : getRange(rangeType);
      if (!clpVault || !tokenMintA || !tokenMintB || !lpMintInfo || !tvlData) {
        return [];
      }

      const filtered = tvlData.filter(
        (t) => !!t.lpSupply && t.lpSupply.gt(0) && t.createdAt >= from
      );
      const formattedData = filtered.map((t) => {
        const lpCount = t.lpSupply.div(10 ** lpMintInfo.decimals);
        const createdAt = t.createdAt;
        const totalAWithoutFees = new Decimal(t.totalA)
          .sub(t.uncollectedManagerFeesA)
          .sub(t.uncollectedProtocolFeesA)
          .div(10 ** (tokenMintA.decimals ?? 0));
        const totalBWithoutFees = new Decimal(t.totalB)
          .sub(t.uncollectedManagerFeesB)
          .sub(t.uncollectedProtocolFeesB)
          .div(10 ** (tokenMintB.decimals ?? 0));

        const aPerLp = totalAWithoutFees.div(lpCount);
        const bPerLp = totalBWithoutFees.div(lpCount);

        const aPrice = pricesA.length
          ? pricesA.find((p) => p.createdAt >= createdAt)?.price ??
            pricesA[pricesA.length - 1].price
          : 1;
        const bPrice = pricesB.length
          ? pricesB.find((p) => p.createdAt >= createdAt)?.price ??
            pricesB[pricesB.length - 1].price
          : 1;

        const lpTokenValue = aPerLp.mul(aPrice).add(bPerLp.mul(bPrice));

        const first = filtered[0];
        // value of fist deposit A in current datapoint price + first B depoist in current price
        const abValue =
          new Decimal(first.totalA)
            .div(10 ** (tokenMintA.decimals ?? 0))
            .mul(aPrice)
            .toNumber() +
          new Decimal(first.totalB)
            .div(10 ** (tokenMintB.decimals ?? 0))
            .mul(bPrice)
            .toNumber();

        return {
          // Use the current price of A & B to calculate the value of the assets behind the LP
          //  tokens at present. This is extremely important because P&L should be based off
          //  of if the user just held their original tokenA & tokenB amounts.
          pnlVault: lpTokenValue,
          createdAt,
          aPrice,
          bPrice,
          abValue,
        };
      });
      if (!formattedData.length) return [];
      const first = formattedData[0];
      return formattedData.map((datapoint) => {
        const vaultDiff = datapoint.pnlVault
          .div(first.pnlVault)
          .sub(1)
          .mul(100)
          .toNumber();
        const aPriceDiff =
          (100 * (datapoint.aPrice - first.aPrice)) / first.aPrice;
        const bPriceDiff =
          (100 * (datapoint.bPrice - first.bPrice)) / first.bPrice;
        const splitPriceDiff = aPriceDiff / 2 + bPriceDiff / 2;
        return {
          vaultDiff,
          aPriceDiff,
          bPriceDiff,
          splitPriceDiff,
          createdAt: datapoint.createdAt,
        };
      });
    },
});

/**
 * Event history for stats page
 */
export const selectVaultEventHistory = selectorFamily<
  EventDocument<FirebaseTimestamp>[],
  string
>({
  key: "selectVaultEventHistory",
  get:
    (clpKey: string) =>
    ({ get }) => {
      const rawHistory = get(vaultEventHistoryAtomFamily(clpKey));
      const clpVault = get(clpVaultAtomFamily(clpKey));
      const mintA = clpVault?.tokenMintA.toString() ?? "";
      const mintB = clpVault?.tokenMintB.toString() ?? "";
      const tokenMintA = get(splMintAtomFamily(mintA));
      const tokenMintB = get(splMintAtomFamily(mintB));
      if (!tokenMintA || !tokenMintB) return [];
      return rawHistory.map((h) => ({
        ...h,
        a: new Decimal(h.a).div(10 ** tokenMintA.decimals).toString(),
        b: new Decimal(h.b).div(10 ** tokenMintB.decimals).toString(),
      }));
    },
});

export const selectPriorityFeeIx = selector({
  key: "selectPriorityFeeIx",
  get: ({ get }) => {
    const fee = get(customPriorityFee);
    if (!fee) return null;
    return ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.floor(Number(fee)),
    });
  },
});
