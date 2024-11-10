import { useRecoilTransaction_UNSTABLE } from "recoil";
import {
  devnetTxHistoryStack,
  networkAtom,
  txHistoryStack,
  vaultEventHistoryAtomFamily,
  vaultRateHistoryAtomFamily,
  vaultTvlHistoryAtomFamily,
} from "./atoms";
import { NetworkOption, TxType } from "../../utils/types";
import { EventDocument, FirebaseTimestamp } from "../../../../types/events";
import { Decimal } from "../../utils/decimal";

export const usePushToSignatureStack = () =>
  useRecoilTransaction_UNSTABLE(
    ({ get, set }) =>
      (action: string, signatures: { signature: string; type: TxType }[]) => {
        const network = get(networkAtom);
        const isDevnet = network === NetworkOption.Devnet;
        const timestamp = new Date().valueOf();
        const previous = get(isDevnet ? devnetTxHistoryStack : txHistoryStack);
        set(isDevnet ? devnetTxHistoryStack : txHistoryStack, [
          {
            action,
            signatures,
            timestamp,
          },
          ...previous,
        ]);
      },
    []
  );

export const useUpdateTVLHistory = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (tvlHistory: RawTvlData) => {
        for (const [vaultId, history] of Object.entries(tvlHistory)) {
          set(
            vaultTvlHistoryAtomFamily(vaultId),
            history.map((p) => ({
              price: Number(p.price),
              createdAt: p.createdAt._seconds * 1000,
              totalA: new Decimal(p.totalA),
              totalB: new Decimal(p.totalB),
              uncollectedManagerFeesA: new Decimal(p.uncollectedManagerFeesA),
              uncollectedManagerFeesB: new Decimal(p.uncollectedManagerFeesB),
              uncollectedProtocolFeesA: new Decimal(p.uncollectedProtocolFeesA),
              uncollectedProtocolFeesB: new Decimal(p.uncollectedProtocolFeesB),
              lpSupply: new Decimal(p.lpSupply || 0),
            }))
          );
        }
      },
    []
  );

export const useUpdateEventHistory = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (tvlHistory: {
        [vaultId: string]: EventDocument<FirebaseTimestamp>[];
      }) => {
        for (const [vaultId, history] of Object.entries(tvlHistory)) {
          set(
            vaultEventHistoryAtomFamily(vaultId),
            history.map((p) => ({
              ...p,
              createdAt: new Date(
                p.chainTime._seconds * 1000
              ).valueOf() as number,
            }))
          );
        }
      },
    []
  );

export const useUpdateRateHistory = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (rateHistory: RawRateData) => {
        for (const [vaultId, history] of Object.entries(rateHistory)) {
          set(
            vaultRateHistoryAtomFamily(vaultId),
            history.map((p) => {
              return {
                feesA: new Decimal(p.feesA),
                feesB: new Decimal(p.feesB),
                price: p.price,
                apy: new Decimal(p.rate || 0).toNumber(),
                createdAt: p.createdAt,
              };
            })
          );
        }
      },
    []
  );

export type RawTvlData = {
  [vaultId: string]: {
    totalA: string;
    totalB: string;
    uncollectedDepositorFeesA: string;
    uncollectedDepositorFeesB: string;
    uncollectedFeesA: string;
    uncollectedFeesB: string;
    uncollectedManagerFeesA: string;
    uncollectedManagerFeesB: string;
    uncollectedProtocolFeesA: string;
    uncollectedProtocolFeesB: string;
    price: string;
    vault: string;
    lpSupply: string;
    createdAt: {
      _seconds: number;
    };
  }[];
};

export type RawRateData = {
  [vaultId: string]: {
    feesA: string;
    feesB: string;
    rate: number;
    createdAt: number;
    price: number;
  }[];
};
