import { useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import useSharedTxLogic from "../useSendTxCommon";
import { useClpVaultProgram } from "../Clp/useClpVaultProgram";

export const useWSolAccounts = () => {
  const program = useClpVaultProgram();
  const wallet = useAnchorWallet();
  const { sendTx } = useSharedTxLogic();
  const closeAccount = useCallback(
    async (address: string) => {
      if (!program || !program.provider || !wallet) return [];
      const tx = new Transaction().add(
        createCloseAccountInstruction(
          new PublicKey(address),
          wallet.publicKey,
          wallet.publicKey,
          undefined,
          TOKEN_PROGRAM_ID
        )
      );

      const txId = await sendTx(
        tx,
        [],
        undefined,
        "Closing Account and reclaiming wSOL"
      );
      return txId;
    },
    [program, sendTx, wallet]
  );

  return { closeAccount };
};
