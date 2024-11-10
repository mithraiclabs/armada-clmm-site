import { atom, atomFamily } from "recoil";
import { recoilPersist } from "recoil-persist";
import { Explorer, NetworkOption, TxGroupLog } from "../../utils/types";
import { RangeType } from "../../components/CLP/Stats";
import { EventDocument, FirebaseTimestamp } from "../../../../types/events";
import { Decimal } from "../../utils/decimal";

const {
  /* A function that takes an atom and returns a new atom that is persisted to local storage. */
  persistAtom,
} = recoilPersist();

export const txHistoryStack = atom<TxGroupLog[]>({
  key: "txHistoryStack",
  default: [],
  effects: [persistAtom],
});

export const devnetTxHistoryStack = atom<TxGroupLog[]>({
  key: "devnetTxHistoryStack",
  default: [],
  effects: [persistAtom],
});

export const networkAtom = atom<NetworkOption>({
  key: "networkAtom",
  default: 0,
  effects: [persistAtom],
});

export const customRpcAtom = atom<string>({
  key: "customRpcAtom",
  default: "",
  effects: [persistAtom],
});

export const annualizeRatesAtom = atom({
  key: "annualizeRatesAtom",
  default: true,
  effects: [persistAtom],
});

export const acceptDisclaimerAtom = atom({
  key: "acceptDisclaimerAtom",
  default: false,
  effects: [persistAtom],
});

export const acceptToUAtom = atom({
  key: "acceptToUAtom",
  default: false,
  effects: [persistAtom],
});

export const confettiAtom = atom<boolean>({
  key: "confettiAtom",
  default: false,
});

export const selectedSwapWhirlpoolKey = atom<string>({
  key: "selectedSwapWhirlpoolKey",
  default: "",
});

export const vaultTvlHistoryAtomFamily = atomFamily<
  TVLHistoryDatapoint[],
  string
>({
  key: "vaultTvlHistoryAtomFamily",
  default: [],
});

export const vaultEventHistoryAtomFamily = atomFamily<
  EventDocument<FirebaseTimestamp>[],
  string
>({
  key: "vaultEventHistoryAtomFamily",
  default: [],
});

export const vaultRateHistoryAtomFamily = atomFamily<
  RateHistoryDatapoint[],
  string
>({
  key: "vaultRateHistoryAtomFamily",
  default: [],
});

export const mintPriceHistoryAtomFamily = atomFamily<PriceDataPoint[], string>({
  key: "mintPriceHistoryAtomFamily",
  default: [],
});

export const historyRangeTypeAtom = atom<RangeType>({
  key: "historyRangeTypeAtom",
  default: 1,
});

const nowInSeconds = new Date().getTime() / 1000;
/**
 * in seconds
 */
export const customTimeframeAtom = atom<[number, number]>({
  key: "customTimeframeAtom",
  default: [nowInSeconds, nowInSeconds],
});

// this is custom slippage that user sets
export const slippageAtomFamily = atomFamily<string, string>({
  key: "slippageAtomFamily",
  default: "0.5",
  effects: [persistAtom],
});

export const customPriorityFee = atom<string>({
  key: "customPriorityFee",
  default: "16000",
  effects: [persistAtom],
});

export const customSlippageAtomFamily = atomFamily<boolean, string>({
  key: "customSlippageAtomFamily",
  default: false,
  effects: [persistAtom],
});

export const adjustAsPercentageAtom = atom<boolean>({
  key: "adjustAsPercentageAtom",
  default: true,
  effects: [persistAtom],
});

export const explorerAtom = atom<Explorer>({
  key: "explorerAtom",
  default: Explorer.Solscan,
  effects: [persistAtom],
});

export type TVLHistoryDatapoint = {
  createdAt: number;
  price: number;
  totalA: Decimal;
  totalB: Decimal;
  uncollectedManagerFeesA: Decimal;
  uncollectedManagerFeesB: Decimal;
  uncollectedProtocolFeesA: Decimal;
  uncollectedProtocolFeesB: Decimal;
  lpSupply: Decimal;
};

export type RateHistoryDatapoint = {
  createdAt: number;
  apy: number;
  price: number;
  feesA: Decimal;
  feesB: Decimal;
};

export type PerformanceDatapoint = {
  vaultDiff: number;
  aPriceDiff: number;
  bPriceDiff: number;
  splitPriceDiff: number;
  createdAt: number;
};

type PriceDataPoint = {
  price: number;
  createdAt: number;
};
