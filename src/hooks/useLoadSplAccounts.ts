import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  getMultipleTokenAccounts,
  nativeSolBalanceAtom,
  selectAllClpVaultMints,
  useResetAssociatedTokenAccounts,
  useUpdateAssociatedTokenAccounts,
  useUpdateSplTokenAccounts,
} from "../state";
import { useCallback } from "react";
import { Account, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useRecoilValue, useSetRecoilState } from "recoil";

export const useLoadSplAccounts = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const updateTokenAccounts = useUpdateAssociatedTokenAccounts();
  const resetTokenAccounts = useResetAssociatedTokenAccounts();
  const setSolBalance = useSetRecoilState(nativeSolBalanceAtom);

  return useCallback(
    async (mints: (string | PublicKey)[]) => {
      if (!wallet || !mints.length) {
        return;
      }
      const tokenAccountAddresses = mints.map((mint) =>
        getAssociatedTokenAddressSync(new PublicKey(mint), wallet.publicKey)
      );
      resetTokenAccounts(mints.map((m) => m.toString()));
      const [_tokenAccounts, solBalance] = await Promise.all([
        getMultipleTokenAccounts(connection, tokenAccountAddresses),
        connection.getBalance(wallet.publicKey, "confirmed"),
      ]);
      const tokenAccounts = _tokenAccounts.filter((x) => !!x) as Account[];
      updateTokenAccounts(tokenAccounts);
      setSolBalance(solBalance);
    },
    [connection, resetTokenAccounts, setSolBalance, updateTokenAccounts, wallet]
  );
};

export const useLoadSplAccountsForClpVaults = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const updateTokenAccounts = useUpdateAssociatedTokenAccounts();
  const resetTokenAccounts = useResetAssociatedTokenAccounts();
  const mints = useRecoilValue(selectAllClpVaultMints);

  return useCallback(() => {
    if (!wallet) {
      return;
    }

    const tokenAccountAddresses = mints.map((mint) =>
      getAssociatedTokenAddressSync(new PublicKey(mint), wallet.publicKey)
    );
    (async () => {
      resetTokenAccounts(mints);
      const tokenAccounts = (
        await getMultipleTokenAccounts(connection, tokenAccountAddresses)
      ).filter((x) => !!x) as Account[];
      updateTokenAccounts(tokenAccounts);
    })();
  }, [connection, mints, resetTokenAccounts, updateTokenAccounts, wallet]);
};

export const useLoadSplAccountsByAddress = () => {
  const { connection } = useConnection();
  const updateSplTokenAccounts = useUpdateSplTokenAccounts();
  const updateTokenAccounts = useUpdateAssociatedTokenAccounts();
  const wallet = useAnchorWallet();

  return useCallback(
    async (tokenAccountAddresses: (string | PublicKey)[]) => {
      const _tokenAccounts = await getMultipleTokenAccounts(
        connection,
        tokenAccountAddresses.map((t) => new PublicKey(t))
      );
      const tokenAccounts = _tokenAccounts.filter((x) => !!x) as Account[];
      updateSplTokenAccounts(tokenAccounts);
      if (wallet)
        updateTokenAccounts(
          tokenAccounts.filter((a) => a.owner.equals(wallet.publicKey))
        );
    },
    [connection, updateSplTokenAccounts, updateTokenAccounts, wallet]
  );
};
