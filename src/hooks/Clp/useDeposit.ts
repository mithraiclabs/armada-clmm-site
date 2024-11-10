import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectTokenASymbol,
  selectTokenBSymbol,
  whirlpoolAtomFamily,
} from "../../state";
import { useRecoilValue } from "recoil";
import { useCallback } from "react";
import {
  ACCOUNT_SIZE,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptAccount,
  createInitializeAccountInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import { ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import { TxType, VaultPosition } from "../../utils/types";
import BN from "bn.js";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { getVaultPositionAccounts } from "@mithraic-labs/clp-vault";
import { useLoadSplAccounts } from "../useLoadSplAccounts";
import { useClpVaultProgram } from "./useClpVaultProgram";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import useSharedTxLogic from "../useSendTxCommon";
import { getSolanaFeeAmount } from "../../utils/tx-utils";
import { useJupiterSwap } from "./useJupiterSwap";
import { Decimal } from "../../utils/decimal";
import { useLoadSplMintsFromClpVaultFunc } from "../useLoadSplMintsFromClpVault";
import { selectPriorityFeeIx } from "../../state/misc/selectors";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForInstructions,
  getComputeUnitsForTransaction,
} from "../../utils/getComputeLimit";

export const positionCountComputeUnits = (positionCount: number) => {
  switch (Math.ceil(positionCount)) {
    case 1:
      return 170_000;
    case 2:
      return 250_000;
    case 3:
      return 320_000;
    case 4:
      return 400_000;
    case 5:
      return 480_000;
    default:
      return 150_000;
  }
};
/**
 * Slippage is in terms of % and can step by 1/100th of a percent
 */
export const useClpDeposit = (
  clpKey: string,
  swapInfo?: {
    swapTokenA: boolean;
  }
) => {
  const wallet = useAnchorWallet();
  const program = useClpVaultProgram();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(clpKey));
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const loadSplAccounts = useLoadSplAccounts();
  const loadSplMints = useLoadSplMintsFromClpVaultFunc(clpKey);
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { sendMultipleTransactions } = useSharedTxLogic();
  const solBalance = useRecoilValue(nativeSolBalanceAtom);
  const swap = useJupiterSwap(
    clpVault && swapInfo
      ? {
          inputMint: swapInfo.swapTokenA
            ? clpVault.tokenMintA
            : clpVault.tokenMintB,
          outputMint: !swapInfo.swapTokenA
            ? clpVault.tokenMintA
            : clpVault.tokenMintB,
        }
      : {
          inputMint: PublicKey.default,
          outputMint: PublicKey.default,
        }
  );

  return useCallback(
    async (
      amountA: BN,
      amountB: BN,
      amountLP: BN,
      withStaking: boolean,
      slippage = 0.11,
      amountToSwap?: Decimal
    ) => {
      if (slippage > 100 || slippage < 0) {
        throw new Error("Invalid slippage value");
      }
      if (!wallet) {
        throw new Error("Please connect wallet and try again.");
      }
      if (!clpVault || !program || !whirlpool) {
        throw new Error("State not loaded, please try again");
      }
      const stakeLpTokens =
        withStaking && !clpVault.stakePool.equals(PublicKey.default);
      const txTypes = [] as TxType[];
      const txDescriptions = [] as string[];
      const preInstructions: TransactionInstruction[] = [];
      let swapVersionedTx: VersionedTransaction | null;
      const preInstructionSigners: Signer[] = [];
      if (swapInfo) {
        if (!amountToSwap) throw new Error("missing swap data");
        const { swapTx } = await swap(amountToSwap, new Decimal(slippage));
        txTypes.push(TxType.swap);
        swapVersionedTx = swapTx;
      } else {
        swapVersionedTx = null;
      }
      const postInstructions: TransactionInstruction[] = [];
      const postInstructionSigners: Signer[] = [];
      let bytes = 0;
      let accounts = 0;
      // allow slippage precision of 1/100
      const slippageA = amountA.mul(new BN(slippage * 100)).div(new BN(10000));
      const slippageB = amountB.mul(new BN(slippage * 100)).div(new BN(10000));
      const maxAmountA = amountA.add(slippageA);
      const maxAmountB = amountB.add(slippageB);
      const wsolAccounts = [] as PublicKey[];
      let userTokenAccountA = getAssociatedTokenAddressSync(
        clpVault.tokenMintA,
        wallet.publicKey,
        false
      );

      if (NATIVE_MINT.equals(clpVault.tokenMintA)) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const rentBalance = await getMinimumBalanceForRentExemptAccount(
          program.provider.connection
        );
        const kp = new Keypair();
        userTokenAccountA = kp.publicKey;
        preInstructionSigners.push(kp);

        wsolAccounts.push(kp.publicKey);
        preInstructions.push(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: kp.publicKey,
            lamports: rentBalance + maxAmountA.toNumber(),
            space: ACCOUNT_SIZE,
            programId: TOKEN_PROGRAM_ID,
          })
        );
        preInstructions.push(
          createInitializeAccountInstruction(
            kp.publicKey,
            NATIVE_MINT,
            wallet.publicKey,
            TOKEN_PROGRAM_ID
          )
        );
        postInstructions.push(
          createCloseAccountInstruction(
            kp.publicKey,
            wallet.publicKey,
            wallet.publicKey,
            undefined,
            TOKEN_PROGRAM_ID
          )
        );
      }
      let userTokenAccountB = getAssociatedTokenAddressSync(
        clpVault.tokenMintB,
        wallet.publicKey,
        false
      );
      if (NATIVE_MINT.equals(clpVault.tokenMintB)) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const rentBalance = await getMinimumBalanceForRentExemptAccount(
          program.provider.connection
        );
        const kp = new Keypair();
        userTokenAccountB = kp.publicKey;
        preInstructionSigners.push(kp);
        wsolAccounts.push(kp.publicKey);
        preInstructions.push(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: kp.publicKey,
            lamports: rentBalance + maxAmountB.toNumber(),
            space: ACCOUNT_SIZE,
            programId: TOKEN_PROGRAM_ID,
          })
        );
        preInstructions.push(
          createInitializeAccountInstruction(
            kp.publicKey,
            NATIVE_MINT,
            wallet.publicKey,
            TOKEN_PROGRAM_ID
          )
        );
        postInstructions.push(
          createCloseAccountInstruction(
            kp.publicKey,
            wallet.publicKey,
            wallet.publicKey,
            undefined,
            TOKEN_PROGRAM_ID
          )
        );
      }
      const lpMintAta = getAssociatedTokenAddressSync(
        clpVault.lpMint,
        wallet.publicKey,
        false
      );
      const whirlpoolKey = clpVault.clp;
      const remainingAccounts = getVaultPositionAccounts(
        clpVault.positions as VaultPosition[],
        whirlpoolKey,
        whirlpool.tickSpacing
      );
      const lpMintAccountInfo =
        await program.provider.connection.getAccountInfo(lpMintAta);

      if (!lpMintAccountInfo) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const createDestIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          lpMintAta,
          wallet.publicKey,
          clpVault.lpMint
        );
        preInstructions.push(createDestIx);
      }

      const fees = await getSolanaFeeAmount(
        program.provider.connection,
        bytes,
        accounts
      );
      if (fees > solBalance) {
        throw new Error("Insufficient SOL for transaction");
      }

      const depositTxBuilder = await program.methods
        .deposit(amountLP, maxAmountA, maxAmountB)
        .accounts({
          payer: wallet.publicKey,
          userTokenA: userTokenAccountA,
          userTokenB: userTokenAccountB,
          userLpTokenAcct: lpMintAta,

          clpVault: clpKey,
          lpMint: clpVault.lpMint,
          tokenVaultA: clpVault.tokenVaultA,
          tokenVaultB: clpVault.tokenVaultB,
          positionBundleTokenAccount: clpVault.positionBundleTokenAccount,

          clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
          clp: whirlpoolKey,
          clpTokenVaultA: whirlpool.tokenVaultA,
          clpTokenVaultB: whirlpool.tokenVaultB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        // Add the VaultPosition accounts to the remaining accounts
        .remainingAccounts(remainingAccounts);

      const _depositTx = await depositTxBuilder.transaction();
      const [
        latestBlockhash,
        computeUnits,
        preInstructionsCompute,
        postInstructionsCompute,
      ] = await Promise.all([
        program.provider.connection.getLatestBlockhash("confirmed"),
        getComputeUnitsForTransaction(
          program.provider.connection,
          _depositTx,
          wallet.publicKey
        ),
        preInstructions.length
          ? getComputeUnitsForInstructions(
              program.provider.connection,
              preInstructions,
              wallet.publicKey
            )
          : null,
        postInstructions.length
          ? getComputeUnitsForInstructions(
              program.provider.connection,
              postInstructions,
              wallet.publicKey
            )
          : null,
      ]);
      const computeBudget = computeUnits
        ? computeUnits * COMPUTE_UNIT_BUFFER
        : positionCountComputeUnits(remainingAccounts.length / 3);

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: computeBudget,
      });
      const depositTx = await depositTxBuilder
        .preInstructions([computeBudgetIx])
        .transaction();
      if (preInstructions.length) {
        txTypes.push(TxType.accountsOpen);
      }
      txTypes.push(TxType.clmmDeposit);
      if (postInstructions.length) {
        txTypes.push(stakeLpTokens ? TxType.stake : TxType.accountsClose);
      }

      if (preInstructionsCompute) {
        preInstructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: preInstructionsCompute * COMPUTE_UNIT_BUFFER,
          })
        );
      }
      if (postInstructionsCompute) {
        postInstructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: postInstructionsCompute * COMPUTE_UNIT_BUFFER,
          })
        );
      }

      const ixGroups = [
        preInstructions,
        depositTx.instructions,
        postInstructions,
      ];
      const txns = [] as (Transaction | VersionedTransaction)[];
      if (swapVersionedTx) {
        txns.push(swapVersionedTx);
        txDescriptions.push("Swapping tokens");
      }
      if (preInstructions.length) txDescriptions.push("Accounts creation");
      if (depositTx.instructions.length)
        txDescriptions.push(`Depositing into ${tokenSymbolA}-${tokenSymbolB}`);
      if (postInstructions.length)
        txDescriptions.push(
          stakeLpTokens ? "LP token staking" : "Accounts closing"
        );

      const signers = [preInstructionSigners, [], postInstructionSigners];

      txns.push(
        ...ixGroups
          .filter((ixs) => !!ixs.length)
          .map((instructions, index) => {
            const tx = new Transaction({
              feePayer: wallet.publicKey,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
            if (priorityFeeIx) {
              tx.add(priorityFeeIx);
            }
            tx.add(...instructions);
            if (signers[index]?.length) {
              tx.partialSign(...signers[index]);
            }
            return tx;
          })
      );

      const signatures = await sendMultipleTransactions(
        txns,
        txDescriptions,
        program.idl,
        wsolAccounts
      );

      fetchAndUpdateVaultPositions();
      await loadSplMints();
      loadSplAccounts([
        clpVault.tokenMintA.toString(),
        clpVault.tokenMintB.toString(),
        clpVault.lpMint.toString(),
      ]);
      return { signatures, txTypes };
    },
    [wallet, clpVault, program, whirlpool, swapInfo, solBalance, clpKey, tokenSymbolA, tokenSymbolB, sendMultipleTransactions, fetchAndUpdateVaultPositions, loadSplMints, loadSplAccounts, swap, priorityFeeIx]
  );
};
