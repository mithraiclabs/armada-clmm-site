import { useClpVaultProgram } from "./useClpVaultProgram";
import { useRecoilCallback, useSetRecoilState } from "recoil";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { clpVaultAtomFamily, selectPriorityFeeIx } from "../../state";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import useSharedTxLogic from "../useSendTxCommon";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../utils/getComputeLimit";

export const useClpInitializeBundle = (clpKey: string) => {
  const clpVaultProgram = useClpVaultProgram();
  const setClpVault = useSetRecoilState(clpVaultAtomFamily(clpKey));
  const wallet = useAnchorWallet();
  const { sendTx } = useSharedTxLogic();

  return useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (!wallet) {
          throw new Error("Please connect wallet and try again.");
        }
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const priorityFeeIx = snapshot
          .getLoadable(selectPriorityFeeIx)
          .getValue();
        if (!clpVault) {
          throw new Error("State not loaded, please try again");
        }
        const bundleMintKeypair = Keypair.generate();
        const positionBundle = PDAUtil.getPositionBundle(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          bundleMintKeypair.publicKey
        ).publicKey;
        const positionBundleTokenAccount = getAssociatedTokenAddressSync(
          bundleMintKeypair.publicKey,
          new PublicKey(clpKey),
          true
        );

        const txBuilder = await clpVaultProgram.methods
          .initializePositionBundle()
          .accounts({
            payer: wallet.publicKey,
            clpVault: clpKey,
            clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
            positionBundle,
            positionBundleMint: bundleMintKeypair.publicKey,
            positionBundleTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .signers([bundleMintKeypair]);
        const tx = await txBuilder.transaction();

        const computeUnits = await getComputeUnitsForTransaction(
          clpVaultProgram.provider.connection,
          tx,
          wallet.publicKey
        );

        if (priorityFeeIx) {
          tx.instructions.unshift(priorityFeeIx);
        }
        if (computeUnits) {
          tx.instructions.unshift(
            ComputeBudgetProgram.setComputeUnitLimit({
              units: computeUnits * COMPUTE_UNIT_BUFFER,
            })
          );
        }

        await sendTx(
          tx,
          [bundleMintKeypair],
          clpVaultProgram.idl,
          "Initializing position bundle"
        );
        const _clpVault = await clpVaultProgram.account.clpVault.fetch(clpKey);
        setClpVault(_clpVault);
      },
    [wallet, clpKey, clpVaultProgram, sendTx, setClpVault]
  );
};
