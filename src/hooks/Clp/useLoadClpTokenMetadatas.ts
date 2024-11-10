import { useCallback, useEffect, useMemo } from "react";
import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  getMultipleTokenMetadata,
  tokenMetadataFamily,
  useUpdateTokenMetadata,
} from "../../state";
import { useTokens } from "../useTokens";
import { useConnection } from "@solana/wallet-adapter-react";

export const useLoadClpTokenMetadatas = (clpKey: string) => {
  const loadClpTokenMetadatas = useLoadClpTokenMetadatasFunc(clpKey);

  useEffect(() => {
    loadClpTokenMetadatas();
  }, [loadClpTokenMetadatas]);
};

export const useLoadClpTokenMetadatasFunc = (clpKey: string) => {
  const { connection } = useConnection();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const tokens = useTokens();
  const updateMetadata = useUpdateTokenMetadata();
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const mintLP = clpVault?.lpMint.toString() ?? "";
  const mints = useMemo(
    () => (mintA && mintB && mintLP ? [mintA, mintB, mintLP] : []),
    [mintA, mintB, mintLP]
  );
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  return useCallback(async () => {
    if (mints.length && !tokenA && !tokenB) {
      const metadata = (
        await getMultipleTokenMetadata(connection, tokens, mints)
      ).filter((x) => !!x);
      updateMetadata(metadata);
    }
  }, [connection, mints, tokenA, tokenB, tokens, updateMetadata]);
};
