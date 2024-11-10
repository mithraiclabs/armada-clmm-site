import { useConnection } from "@solana/wallet-adapter-react";
import {
  clpVaultAtomFamily,
  getMultipleMints,
  splMintAtomFamily,
  useUpdateSplMints,
} from "../state";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { useCallback, useEffect } from "react";
import { Mint } from "@solana/spl-token";

export const useLoadSplMintsFromClpVault = (clpVaultKey: string) => {
  const loadSplMints = useLoadSplMintsFromClpVaultFunc(clpVaultKey);
  useEffect(() => {
    loadSplMints();
  }, [loadSplMints]);
};

export const useLoadSplMintsFromClpVaultFunc = (clpVaultKey: string) => {
  const { connection } = useConnection();
  const updateSplMints = useUpdateSplMints();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpVaultKey));
  const mintsLoaded = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        !!clpVault &&
        [clpVault.tokenMintA, clpVault.tokenMintB, clpVault.lpMint].reduce(
          (acc, mint) =>
            snapshot.getLoadable(splMintAtomFamily(mint.toString() ?? ""))
              .contents && acc,
          true
        ),
    []
  );

  return useCallback(async () => {
    // load mints respective to the tokenBonding
    if (clpVault) {
      if (!mintsLoaded()) {
        const mints = (
          await getMultipleMints(connection, [
            clpVault.tokenMintA,
            clpVault.tokenMintB,
            clpVault.lpMint,
          ])
        ).filter((m) => !!m) as Mint[];
        updateSplMints(mints);
      } else {
        // lp mint supply changes on every deposit/withdraw so we should get it regardless
        const mints = (
          await getMultipleMints(connection, [clpVault.lpMint])
        ).filter((m) => !!m) as Mint[];
        updateSplMints(mints);
      }
    }
  }, [connection, mintsLoaded, clpVault, updateSplMints]);
};
