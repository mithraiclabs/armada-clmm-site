import { useConnection } from "@solana/wallet-adapter-react";
import {
  clpVaultAtomFamily,
  getMultipleTokenAccounts,
  useUpdateSplTokenAccounts,
} from "../../state";
import { useRecoilValue } from "recoil";
import { useCallback, useEffect } from "react";
import { Account } from "@solana/spl-token";

export const useLoadClpVaultBalances = (clpKey: string) => {
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);

  useEffect(() => {
    fetchAndUpdateVaultBalances();
  }, [fetchAndUpdateVaultBalances]);
};

export const useFetchAndUpdateVaultBalances = (clpKey: string) => {
  const { connection } = useConnection();
  const updateTokenAccounts = useUpdateSplTokenAccounts();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));

  return useCallback(async () => {
    if (!clpVault) {
      return;
    }
    const addresses = [clpVault.tokenVaultA, clpVault.tokenVaultB];
    const tokenAccounts = (
      await getMultipleTokenAccounts(connection, addresses)
    ).filter((x) => !!x) as Account[];
    updateTokenAccounts(tokenAccounts);
  }, [clpVault, connection, updateTokenAccounts]);
};
