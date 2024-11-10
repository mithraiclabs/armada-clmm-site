import { useCallback } from "react";
import { useClpVaultProgram } from "./useClpVaultProgram";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { useRecoilValue } from "recoil";
import { clpVaultAtomFamily, splMintAtomFamily } from "../../state";
import { Decimal } from "../../utils/decimal";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useJupiterSwap } from "./useJupiterSwap";
import useSharedTxLogic from "../useSendTxCommon";
import { useLoadClpVaultFunc } from "./useLoadClpVault";

/**
 *
 * @param clpKey {PublicKey} - The CLP Vault's public key
 * @param usingA {Boolean} - If true, tokenA is being swapped for tokenB
 * @returns
 */
export const useExternalSwap = (clpKey: string, usingA: boolean) => {
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const program = useClpVaultProgram();
  const loadVault = useLoadClpVaultFunc(clpKey);
  const tokenMintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenMintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const { sendTx } = useSharedTxLogic();
  const wallet = useAnchorWallet();
  const swap = useJupiterSwap({
    inputMint: (usingA ? tokenMintA : tokenMintB)?.address ?? PublicKey.default,
    outputMint:
      (!usingA ? tokenMintA : tokenMintB)?.address ?? PublicKey.default,
  });
  return useCallback(
    async (amount: string, slippage = "0.5") => {
      if (!clpVault || !tokenMintA || !tokenMintB || !wallet) {
        throw new Error("useExternalSwap missing necessary state");
      }
      const amt = new Decimal(amount).mul(
        10 ** (usingA ? tokenMintA : tokenMintB).decimals
      );

      // Set source and destination based on token input
      const source = usingA ? clpVault.tokenVaultA : clpVault.tokenVaultB;
      const destination = usingA ? clpVault.tokenVaultB : clpVault.tokenVaultA;

      const swapSetupIx = await program.methods
        .externalSwapSetup(new BN(amt.toString()))
        .accounts({
          marketMakingKey: clpVault.marketMakingKey,
          clpVault: clpKey,
          source,
          dest: destination,
          tokenProgram: TOKEN_PROGRAM_ID,
          instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .instruction();

      const swapCleanupIx = await program.methods
        .externalSwapCleanup()
        .accounts({
          marketMakingKey: clpVault.marketMakingKey,
          clpVault: clpKey,
          source: source,
          dest: destination,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      const { swapTx } = await swap(
        new Decimal(amount),
        new Decimal(slippage),
        undefined,
        source,
        destination,
        [swapSetupIx],
        [swapCleanupIx],
        true
      );

      const signatures = await sendTx(
        swapTx,
        [],
        program.idl,
        "Swapping tokens"
      );
      loadVault();

      return Object.values(signatures);
    },
    [
      clpVault,
      tokenMintA,
      tokenMintB,
      wallet,
      usingA,
      program,
      clpKey,
      swap,
      loadVault,
      sendTx,
    ]
  );
};
