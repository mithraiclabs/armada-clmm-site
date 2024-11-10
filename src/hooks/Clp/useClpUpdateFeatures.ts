import { useCallback } from "react";
import { useClpVaultProgram } from "./useClpVaultProgram";
import { useRecoilValue } from "recoil";
import { clpVaultAtomFamily, selectPriorityFeeIx } from "../../state";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import {
  FEATURES_ENABLED_NONE,
  FEATURES_ENABLED_SWAPS,
} from "@mithraic-labs/clp-vault";
import useSharedTxLogic from "../useSendTxCommon";
import { useLoadClpVaultFunc } from "./useLoadClpVault";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../utils/getComputeLimit";

export const useClpUpdateFeatures = (vaultId: string) => {
  const clpVault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const program = useClpVaultProgram();
  const wallet = useAnchorWallet();
  const loadVault = useLoadClpVaultFunc(vaultId);
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { sendTx } = useSharedTxLogic();
  return useCallback(
    async (enable: boolean) => {
      if (!clpVault || !wallet) return;
      if (!wallet.publicKey.equals(clpVault.adminKey)) {
        toast.error("Connected wallet is not the vault admin");
        return;
      }
      const tx = await program.methods
        .updateConfig(
          clpVault.marketMakingKey,
          clpVault.feeOwner,
          clpVault.performanceFee,
          clpVault.withdrawalFee,
          clpVault.marketMakingFee,
          clpVault.strategy,
          clpVault.stakePool,
          enable ? FEATURES_ENABLED_SWAPS : FEATURES_ENABLED_NONE
        )
        .accounts({
          adminKey: wallet.publicKey,
          clpVault: vaultId,
        })
        .transaction();

      const computeUnits = await getComputeUnitsForTransaction(
        program.provider.connection,
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

      const txId = await sendTx(tx, [], program.idl, "Updating config");
      loadVault();
      return txId;
    },
    [clpVault, loadVault, priorityFeeIx, program, sendTx, vaultId, wallet]
  );
};
