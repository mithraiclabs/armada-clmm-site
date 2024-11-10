import { useClpVaultProgram } from "./useClpVaultProgram";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectPriorityFeeIx,
  whirlpoolAtomFamily,
} from "../../state";
import { ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  ACCOUNT_SIZE,
} from "@solana/spl-token";
import {
  getVaultPositionAccounts,
  VaultPosition,
} from "@mithraic-labs/clp-vault";
import { getSolanaFeeAmount } from "../../utils/tx-utils";
import { useFetchAndUpdateVaultBalances } from "./useLoadClpVaultBalances";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import useSharedTxLogic from "../useSendTxCommon";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../utils/getComputeLimit";
import { useClpCollectRewards } from "./useClpCollectRewards";

export const useClpCollectFees = (
  clpKey: string,
  instructionsOnly?: boolean
) => {
  const clpVaultProgram = useClpVaultProgram();
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const collectRewards = useClpCollectRewards(clpKey, true);
  const { sendTx } = useSharedTxLogic();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);

  return useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (
          !clpVaultProgram.provider.publicKey ||
          clpVaultProgram.provider.publicKey.equals(PublicKey.default)
        ) {
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

        let bytes = 0;
        let accountsCount = 0;
        const preInstructions: TransactionInstruction[] = [];
        const rewardsIxs = await collectRewards();
        if (rewardsIxs.length)
          preInstructions.push(...(rewardsIxs as TransactionInstruction[]));
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
        const mmFeeAccountTokenA = getAssociatedTokenAddressSync(
          clpVault.tokenMintA,
          clpVault.marketMakingKey,
          true
        );
        const mmFeeAccountTokenB = getAssociatedTokenAddressSync(
          clpVault.tokenMintB,
          clpVault.marketMakingKey,
          true
        );

        const [
          feeAccountTokenAInfo,
          feeAccountTokenBInfo,
          mmFeeAccountTokenAInfo,
          mmFeeAccountTokenBInfo,
        ] = await clpVaultProgram.provider.connection.getMultipleAccountsInfo([
          feeAccountTokenA,
          feeAccountTokenB,
          mmFeeAccountTokenA,
          mmFeeAccountTokenB,
        ]);

        if (!feeAccountTokenAInfo) {
          bytes += ACCOUNT_SIZE;
          accountsCount += 1;
          const ix = createAssociatedTokenAccountInstruction(
            clpVaultProgram.provider.publicKey,
            feeAccountTokenA,
            clpVault.feeOwner,
            clpVault.tokenMintA,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          preInstructions.push(ix);
        }

        if (!feeAccountTokenBInfo) {
          bytes += ACCOUNT_SIZE;
          accountsCount += 1;
          const ix = createAssociatedTokenAccountInstruction(
            clpVaultProgram.provider.publicKey,
            feeAccountTokenB,
            clpVault.feeOwner,
            clpVault.tokenMintB,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          preInstructions.push(ix);
        }

        if (!mmFeeAccountTokenAInfo) {
          bytes += ACCOUNT_SIZE;
          accountsCount += 1;
          const ix = createAssociatedTokenAccountInstruction(
            clpVaultProgram.provider.publicKey,
            mmFeeAccountTokenA,
            clpVault.marketMakingKey,
            clpVault.tokenMintA,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          preInstructions.push(ix);
        }

        if (!mmFeeAccountTokenBInfo) {
          bytes += ACCOUNT_SIZE;
          accountsCount += 1;
          const ix = createAssociatedTokenAccountInstruction(
            clpVaultProgram.provider.publicKey,
            mmFeeAccountTokenB,
            clpVault.marketMakingKey,
            clpVault.tokenMintB,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          preInstructions.push(ix);
        }

        const remainingAccounts = getVaultPositionAccounts(
          clpVault.positions as VaultPosition[],
          clpVault.clp,
          whirlpool.tickSpacing
        );

        const solBalance = snapshot
          .getLoadable(nativeSolBalanceAtom)
          .getValue();
        const fees = await getSolanaFeeAmount(
          clpVaultProgram.provider.connection,
          bytes,
          accountsCount
        );
        if (fees > solBalance) {
          throw new Error("Insufficient SOL for transaction");
        }

        const builder = await clpVaultProgram.methods
          .collectFees()
          .accounts({
            payer: clpVaultProgram.provider.publicKey,
            clpVault: clpKey,
            clp: clpVault.clp,
            clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
            positionBundleTokenAccount: clpVault.positionBundleTokenAccount,
            tokenVaultA: clpVault.tokenVaultA,
            clpTokenVaultA: whirlpool.tokenVaultA,
            tokenVaultB: clpVault.tokenVaultB,
            clpTokenVaultB: whirlpool.tokenVaultB,
            feeAccountTokenA,
            feeAccountTokenB,
            mmFeeAccountTokenA,
            mmFeeAccountTokenB,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts(remainingAccounts);
        const tx = await builder.preInstructions(preInstructions).transaction();
        if (instructionsOnly) {
          return tx.instructions;
        }
        const computeUnits = await getComputeUnitsForTransaction(
          clpVaultProgram.provider.connection,
          tx,
          clpVaultProgram.provider.publicKey
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

        const txId = await sendTx(tx, [], undefined, "Collecting fees");
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
