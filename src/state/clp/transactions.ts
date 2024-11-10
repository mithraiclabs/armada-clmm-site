import { useRecoilTransaction_UNSTABLE } from "recoil";
import {
  DEAD_VAULT_LIST,
  clpVaultAtomFamily,
  clpVaultKeysAtom,
  clpVaultRateAtomFamily,
} from ".";
import _uniqBy from "lodash/uniqBy";
import { ClpVaultStruct } from "@mithraic-labs/clp-vault";
import { VaultHistoryResp } from "./types";

export const useUpdateClpVaults = () =>
  useRecoilTransaction_UNSTABLE<[[string, ClpVaultStruct][]]>(
    ({ set }) =>
      (vaultTuples) => {
        set(
          clpVaultKeysAtom,
          vaultTuples
            .filter(([address]) => !DEAD_VAULT_LIST.includes(address)) // ignore dead vaults
            .map(([address, vault]) => {
              set(clpVaultAtomFamily(address), vault);
              return address;
            })
        );
      },
    []
  );

export const useUpdateVaultHistories = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (historyMap: VaultHistoryResp) => {
        Object.keys(historyMap).forEach((clpKey) => {
          if (historyMap[clpKey].rateDoc) {
            set(clpVaultRateAtomFamily(clpKey), historyMap[clpKey].rateDoc);
          }
        });
      },
    []
  );

export const useAppendClpVaultKey = () =>
  useRecoilTransaction_UNSTABLE(
    ({ get, set }) =>
      (key: string) => {
        const oldKeys = get(clpVaultKeysAtom);
        const uniqueClpVaultKeys = _uniqBy([...oldKeys, key], (k) => k);
        set(clpVaultKeysAtom, uniqueClpVaultKeys);
      },
    []
  );
