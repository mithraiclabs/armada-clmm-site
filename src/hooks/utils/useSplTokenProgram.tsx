import { AnchorProvider } from "@coral-xyz/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { splTokenProgram } from "@coral-xyz/spl-token";

const noop = () => {
  //
};

/**
 *
 * @returns SPL TOKEN PROGRAM
 */
export const useSplTokenProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  return useMemo(() => {
    const _anchorWallet = wallet
      ? wallet
      : ({
          publicKey: PublicKey.default,
          signTransaction: noop as () => Promise<any>,
          signAllTransactions: noop as () => Promise<any>,
        } as AnchorWallet);
    const provider = new AnchorProvider(connection, _anchorWallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });

    return splTokenProgram({ provider });
  }, [connection, wallet]);
};
