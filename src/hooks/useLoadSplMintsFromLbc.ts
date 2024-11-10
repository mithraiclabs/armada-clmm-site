import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil";
import {
  getMultipleMints,
  getMultipleTokenAccounts,
  splMintAtomFamily,
  tokenBondingAtomFamily,
  useUpdateSplMints,
  useUpdateAssociatedTokenAccounts,
  tokenSwapperAtomFamily,
  nativeSolBalanceAtom,
} from "../state";
import { useEffect, useMemo, useState } from "react";
import {
  Account,
  Mint,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export const useLoadSplMintsFromLbc = (lbcKey: string) => {
  const { connection } = useConnection();
  const updateSplMints = useUpdateSplMints();
  const tokenBonding = useRecoilValue(tokenBondingAtomFamily(lbcKey ?? ""));
  const baseTokenSwapper = useRecoilValue(
    tokenSwapperAtomFamily(tokenBonding?.swapperBase.toString() ?? "")
  );
  const targetTokenSwapper = useRecoilValue(
    tokenSwapperAtomFamily(tokenBonding?.swapperTarget.toString() ?? "")
  );
  const mints = useMemo(
    () =>
      [
        tokenBonding?.baseMint,
        tokenBonding?.targetMint,
        baseTokenSwapper?.baseMint,
        baseTokenSwapper?.targetMint,
        targetTokenSwapper?.baseMint,
        targetTokenSwapper?.targetMint,
      ].filter((m) => !!m) as PublicKey[],
    [
      baseTokenSwapper?.baseMint,
      baseTokenSwapper?.targetMint,
      targetTokenSwapper?.baseMint,
      targetTokenSwapper?.targetMint,
      tokenBonding?.baseMint,
      tokenBonding?.targetMint,
    ]
  );
  // TODO update to handle undefined swappers
  // Time to fix
  const mintsLoaded = useRecoilCallback(
    ({ snapshot }) =>
      () =>
        !!tokenBonding &&
        mints.reduce(
          (acc, mint) =>
            snapshot.getLoadable(splMintAtomFamily(mint.toString() ?? ""))
              .contents && acc,
          true
        ),
    [tokenBonding, mints]
  );
  const [loading, setLoading] = useState(!mintsLoaded());

  useEffect(() => {
    // load mints respective to the tokenBonding and related token swappers
    if (tokenBonding && !mintsLoaded()) {
      (async () => {
        const _mints = (await getMultipleMints(connection, mints)).filter(
          (m) => !!m
        ) as Mint[];
        updateSplMints(_mints);
        setLoading(false);
      })();
    }
  }, [connection, mints, mintsLoaded, tokenBonding, updateSplMints]);

  return loading;
};

export const useLoadSplAccountsFromLbc = (lbcKey: string) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const updateTokenAccounts = useUpdateAssociatedTokenAccounts();
  const tokenBonding = useRecoilValue(tokenBondingAtomFamily(lbcKey ?? ""));
  const baseTokenSwapper = useRecoilValue(
    tokenSwapperAtomFamily(tokenBonding?.swapperBase.toString() ?? "")
  );
  const targetTokenSwapper = useRecoilValue(
    tokenSwapperAtomFamily(tokenBonding?.swapperTarget.toString() ?? "")
  );
  const setSolBalance = useSetRecoilState(nativeSolBalanceAtom);
  const mints = useMemo(
    () =>
      [
        tokenBonding?.baseMint,
        tokenBonding?.targetMint,
        baseTokenSwapper?.baseMint,
        baseTokenSwapper?.targetMint,
        targetTokenSwapper?.baseMint,
        targetTokenSwapper?.targetMint,
      ].filter((m) => m && !m.equals(PublicKey.default)) as PublicKey[],
    [
      baseTokenSwapper?.baseMint,
      baseTokenSwapper?.targetMint,
      targetTokenSwapper?.baseMint,
      targetTokenSwapper?.targetMint,
      tokenBonding?.baseMint,
      tokenBonding?.targetMint,
    ]
  );

  useEffect(() => {
    if (!tokenBonding || !wallet) {
      return;
    }
    const tokenAccountAddresses = mints.map((mint) =>
      getAssociatedTokenAddressSync(mint, wallet.publicKey)
    );
    (async () => {
      const [_tokenAccounts, solBalance] = await Promise.all([
        getMultipleTokenAccounts(connection, tokenAccountAddresses),
        connection.getBalance(wallet.publicKey, "confirmed"),
      ]);
      const tokenAccounts = _tokenAccounts.filter((x) => !!x) as Account[];
      updateTokenAccounts(tokenAccounts);
      setSolBalance(solBalance);
    })();
  }, [
    baseTokenSwapper,
    connection,
    mints,
    setSolBalance,
    targetTokenSwapper,
    tokenBonding,
    updateTokenAccounts,
    wallet,
  ]);
};
