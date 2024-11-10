import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { nativeSolBalanceAtom } from "../state";

export const useLoadNativeSolBalance = () => {
  const loadSolBalance = useLoadNativeSolBalanceFunc();
  useEffect(() => {
    loadSolBalance();
  }, [loadSolBalance]);
};

export const useLoadNativeSolBalanceFunc = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const setSolBalance = useSetRecoilState(nativeSolBalanceAtom);

  return useCallback(async () => {
    if (!wallet) {
      return;
    }
    const balance = await connection.getBalance(wallet.publicKey, "confirmed");
    setSolBalance(balance);
  }, [connection, setSolBalance, wallet]);
};
