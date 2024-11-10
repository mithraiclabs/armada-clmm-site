import { useClpVaultProgram } from "./useClpVaultProgram";
import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  getMultipleTokenAccounts,
  selectPriorityFeeIx,
  whirlpoolAtomFamily,
} from "../../state";
import { ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  getRewardAccounts,
  getVaultPositionAccounts,
  VaultPosition,
} from "@mithraic-labs/clp-vault";
import { useFetchAndUpdateVaultBalances } from "./useLoadClpVaultBalances";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import useSharedTxLogic from "../useSendTxCommon";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../utils/getComputeLimit";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

export const useClpCollectRewards = (
  clpKey: string,
  instructionsOnly?: boolean
) => {
  const clpVaultProgram = useClpVaultProgram();
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const { sendTx } = useSharedTxLogic();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const wallet = useAnchorWallet();

  return useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (!wallet) {
          throw new Error("Please connect wallet and try again.");
        }

        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(clpVault?.clp.toString() ?? ""))
          .getValue();

        if (!clpVault || !whirlpool) {
          throw new Error("State not loaded, please try again");
        }

        const feeAccountTokenA = getAssociatedTokenAddressSync(
          clpVault.tokenMintA,
          clpVault.feeOwner,
          true
        );
        const feeAccountTokenB = getAssociatedTokenAddressSync(
          clpVault.tokenMintB,
          clpVault.feeOwner,
          true
        );

        const [userAAccount, userBAccount] = await getMultipleTokenAccounts(
          clpVaultProgram.provider.connection,
          [feeAccountTokenA, feeAccountTokenB]
        );
        const preInstructions: TransactionInstruction[] = [];
        if (!userAAccount) {
          preInstructions.push(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              feeAccountTokenA,
              clpVault.feeOwner,
              clpVault.tokenMintA
            )
          );
        }
        if (!userBAccount) {
          preInstructions.push(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              feeAccountTokenB,
              clpVault.feeOwner,
              clpVault.tokenMintB
            )
          );
        }

        const rewardRemainingAccounts = getRewardAccounts(whirlpool, clpVault);

        const vaultPositionRemainingAccounts = getVaultPositionAccounts(
          clpVault.positions as VaultPosition[],
          clpVault.clp,
          whirlpool.tickSpacing
        );

        const builder = await clpVaultProgram.methods
          .collectRewards()
          .accounts({
            payer: wallet.publicKey,
            clp: clpVault.clp,
            clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
            clpVault: clpKey,
            positionBundleTokenAccount: clpVault.positionBundleTokenAccount,
            tokenAFeeAccount: feeAccountTokenA,
            tokenBFeeAccount: feeAccountTokenB,
            tokenProgram: TOKEN_PROGRAM_ID,
          })

          .remainingAccounts([
            ...rewardRemainingAccounts,
            ...vaultPositionRemainingAccounts,
          ]);

        const tx = await builder.preInstructions(preInstructions).transaction();
        if (instructionsOnly) {
          return tx.instructions;
        }
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

        const txId = await sendTx(tx, [], undefined, "Collecting rewards");
        fetchAndUpdateVaultBalances();
        fetchAndUpdateVaultPositions();
        return txId;
      },
    [
      clpKey,
      clpVaultProgram.methods,
      clpVaultProgram.provider.publicKey,
      instructionsOnly,
      fetchAndUpdateVaultBalances,
      fetchAndUpdateVaultPositions,
      priorityFeeIx,
      sendTx,
    ]
  );
};
