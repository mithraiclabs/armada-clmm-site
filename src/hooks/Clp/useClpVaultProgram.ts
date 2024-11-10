import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useDevnetState } from "../../contexts/NetworkProvider";
import {
  CLP_DEVNET_PROGRAM_KEY,
  CLP_MAINNET_PROGRAM_KEY,
} from "../../utils/constants";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CLP_IDL } from "@mithraic-labs/clp-vault";
import { NetworkOption } from "../../utils/types";

const noop = () => {
  //
};

/**
 *
 * @returns CLP Vault Anchor Program
 */
export const useClpVaultProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [network] = useDevnetState();

  return useMemo(() => {
    const _anchorWallet = wallet
      ? wallet
      : ({
          publicKey: PublicKey.default,
          signTransaction: noop as () => Promise<any>,
          signAllTransactions: noop as () => Promise<any>,
        } as AnchorWallet);
    const programKey: string =
      network === NetworkOption.Devnet
        ? CLP_DEVNET_PROGRAM_KEY
        : CLP_MAINNET_PROGRAM_KEY;
    const provider = new AnchorProvider(connection, _anchorWallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });
    return new Program(CLP_IDL, programKey, provider);
  }, [connection, network, wallet]);
};
