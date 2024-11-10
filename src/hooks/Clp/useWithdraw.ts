import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  associatedTokenAccountAtomFamily,
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  whirlpoolAtomFamily,
} from "../../state";
import { useRecoilValue } from "recoil";
import { useCallback } from "react";
import { useClpVaultProgram } from "./useClpVaultProgram";
import {
  ACCOUNT_SIZE,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  TickUtil,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { TxType, VaultPosition } from "../../utils/types";
import BN from "bn.js";
import {
  AccountMeta,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { CLP_IDL } from "@mithraic-labs/clp-vault";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import { useLoadSplAccounts } from "../useLoadSplAccounts";
import useSharedTxLogic from "../useSendTxCommon";
import { getSolanaFeeAmount } from "../../utils/tx-utils";
import { positionCountComputeUnits } from "./useDeposit";
import { useLoadSplMintsFromClpVaultFunc } from "../useLoadSplMintsFromClpVault";
import { selectPriorityFeeIx } from "../../state/misc/selectors";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForInstructions,
  getComputeUnitsForTransaction,
} from "../../utils/getComputeLimit";

/**
 * Slippage is in terms of % and can step by 1/100th of a percent
 */
export const useClpWithdraw = (clpKey: string) => {
  const wallet = useAnchorWallet();
  const program = useClpVaultProgram();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const loadSplAccounts = useLoadSplAccounts();
  const loadMints = useLoadSplMintsFromClpVaultFunc(clpKey);
  const tokenLPAta = useRecoilValue(
    associatedTokenAccountAtomFamily(clpVault?.lpMint.toString() ?? "")
  );
  const { sendMultipleTransactions } = useSharedTxLogic();
  const solBalance = useRecoilValue(nativeSolBalanceAtom);
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);

  return useCallback(
    async (
      withdrawAmount: BN,
      estAmountA: BN,
      estAmountB: BN,
      slippage = 0.01
    ) => {
      if (slippage > 100 || slippage < 0) {
        throw new Error("Invalid slippage value");
      }
      if (!wallet) {
        throw new Error("Please connect wallet and try again.");
      }
      if (!clpVault || !program || !whirlpool || !tokenLPAta) {
        throw new Error("State not loaded, please try again");
      }

      const preInstructions: TransactionInstruction[] = [];
      const preInstructionSigners: Signer[] = [];
      const postInstructions: TransactionInstruction[] = [];
      const postInstructionSigners: Signer[] = [];
      const txTypes = [] as TxType[];
      let bytes = 0;
      let accounts = 0;
      const lpBalance = new BN(tokenLPAta.amount.toString());
      const withUnstake = false;
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
        preInstructions.push(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: kp.publicKey,
            lamports: rentBalance,
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
        preInstructions.push(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: kp.publicKey,
            lamports: rentBalance,
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

      const tokenAFeeAccount = getAssociatedTokenAddressSync(
        clpVault.tokenMintA,
        clpVault.feeOwner,
        true
      );
      const tokenBFeeAccount = getAssociatedTokenAddressSync(
        clpVault.tokenMintB,
        clpVault.feeOwner,
        true
      );
      // when withdrawing more than LP balance, we need to unstake LP tokens
      if (withdrawAmount.gt(lpBalance)) {
        throw new Error("Insufficient balance");
      }

      const { remainingAccounts, preInstructions: remainingPreIx } =
        await remainingAccountChecker(
          clpVault.positions as VaultPosition[],
          whirlpoolKey,
          whirlpool.tickSpacing,
          program
        );

      const [
        tokenAFeeAccountInfo,
        tokenBFeeAccountInfo,
        userATokenATAAccInfo,
        userBTokenATAAccInfo,
      ] = await program.provider.connection.getMultipleAccountsInfo([
        tokenAFeeAccount,
        tokenBFeeAccount,
        userTokenAccountA,
        userTokenAccountB,
      ]);

      if (!tokenAFeeAccountInfo) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const ix = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          tokenAFeeAccount,
          clpVault.feeOwner,
          clpVault.tokenMintA
        );
        preInstructions.push(ix);
      }

      if (!tokenBFeeAccountInfo) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const ix = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          tokenBFeeAccount,
          clpVault.feeOwner,
          clpVault.tokenMintB
        );
        preInstructions.push(ix);
      }
      if (!userATokenATAAccInfo && !NATIVE_MINT.equals(clpVault.tokenMintA)) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const createDestIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userTokenAccountA,
          wallet.publicKey,
          clpVault.tokenMintA
        );
        preInstructions.push(createDestIx);
      }
      if (!userBTokenATAAccInfo && !NATIVE_MINT.equals(clpVault.tokenMintB)) {
        bytes += ACCOUNT_SIZE;
        accounts += 1;
        const createDestIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userTokenAccountB,
          wallet.publicKey,
          clpVault.tokenMintB
        );
        preInstructions.push(createDestIx);
      }

      if (remainingPreIx.length) {
        preInstructions.push(...remainingPreIx);
      }

      // allow slippage precision of 1/100
      const slippageA = estAmountA
        .mul(new BN(slippage * 100))
        .div(new BN(10000));
      const slippageB = estAmountB
        .mul(new BN(slippage * 100))
        .div(new BN(10000));
      const minAmountA = estAmountA.sub(slippageA);
      const minAmountB = estAmountB.sub(slippageB);

      const fees = await getSolanaFeeAmount(
        program.provider.connection,
        bytes,
        accounts
      );
      if (fees > solBalance) {
        throw new Error("Insufficient SOL for transaction");
      }

      // Actually call the Withdraw instruction
      const withdrawTxBuilder = program.methods
        .withdraw(withdrawAmount, minAmountA, minAmountB)
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
          tokenAFeeAccount,
          tokenBFeeAccount,
        })
        // Add the VaultPosition accounts to the remaining accounts
        .remainingAccounts(remainingAccounts);
      const _withdrawTx = await withdrawTxBuilder.transaction();
      const [
        latestBlockhash,
        computeUnits,
        preInstructionsCompute,
        postInstructionsCompute,
      ] = await Promise.all([
        program.provider.connection.getLatestBlockhash("confirmed"),
        getComputeUnitsForTransaction(
          program.provider.connection,
          _withdrawTx,
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
      const withdrawTx = await withdrawTxBuilder
        .preInstructions([computeBudgetIx])
        .transaction();

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
        withdrawTx.instructions,
        postInstructions,
      ];
      const txDescriptions = [] as string[];

      if (preInstructions.length) {
        txDescriptions.push(
          withUnstake ? "LP token unstaking" : "Accounts creation"
        );
        txTypes.push(withUnstake ? TxType.unstake : TxType.accountsOpen);
      }
      if (withdrawTx.instructions.length)
        txDescriptions.push(`Withdraw from vault`);
      if (postInstructions.length) txDescriptions.push("Accounts closing");

      txTypes.push(TxType.clmmWithdraw);
      if (postInstructions.length) txTypes.push(TxType.accountsClose);

      const txns = [] as (Transaction | VersionedTransaction)[];

      txns.push(
        ...ixGroups
          .map((instructions, index) => {
            const tx = new Transaction({
              feePayer: wallet.publicKey,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
            if (instructions.length) {
              if (priorityFeeIx) {
                tx.add(priorityFeeIx, ...instructions);
              } else {
                tx.add(...instructions);
              }
            }
            if (index === 0 && preInstructionSigners.length) {
              // preInstructions
              tx.partialSign(...preInstructionSigners);
            } else if (index === 2 && postInstructionSigners.length) {
              // postInstructions
              tx.partialSign(...postInstructionSigners);
            }
            return tx;
          })
          .filter((t) => t.instructions.length)
      );

      const signatures = await sendMultipleTransactions(
        txns,
        txDescriptions,
        program.idl
      );
      await Promise.all([
        fetchAndUpdateVaultPositions(),
        loadSplAccounts([
          clpVault.tokenMintA.toString(),
          clpVault.tokenMintB.toString(),
          clpVault.lpMint.toString(),
        ]),
        loadMints(),
      ]);
      return { signatures, txTypes };
    },
    [wallet, clpVault, program, whirlpool, tokenLPAta, solBalance, clpKey, sendMultipleTransactions, fetchAndUpdateVaultPositions, loadSplAccounts, loadMints, priorityFeeIx]
  );
};

export const remainingAccountChecker = async (
  positions: VaultPosition[],
  whirlpoolKey: PublicKey,
  tickSpacing: number,
  program: Program<typeof CLP_IDL>
) => {
  try {
    const remainingAccounts: AccountMeta[] = [];
    const preInstructions: TransactionInstruction[] = [];
    const TicksToCreate = [] as string[];
    const whirlpoolCtx = WhirlpoolContext.withProvider(
      // @ts-expect-error update anchor
      program.provider,
      ORCA_WHIRLPOOL_PROGRAM_ID
    );
    for (const vaultPosition of positions) {
      // Return if the vault position is an empty or non-active position
      if (
        vaultPosition.positionKey.toString() === PublicKey.default.toString()
      ) {
        continue;
      }
      remainingAccounts.push({
        pubkey: vaultPosition.positionKey,
        isWritable: true,
        isSigner: false,
      });

      const lowerTickArrayStart = TickUtil.getStartTickIndex(
        vaultPosition.lowerTick,
        tickSpacing
      );
      const lowerTickArrayPda = PDAUtil.getTickArray(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpoolKey,
        lowerTickArrayStart
      ).publicKey;
      const upperTickArrayStart = TickUtil.getStartTickIndex(
        vaultPosition.upperTick,
        tickSpacing
      );
      const upperTickArrayPda = PDAUtil.getTickArray(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpoolKey,
        upperTickArrayStart
      ).publicKey;

      const [lowerTickInfo, upperTickInfo] =
        await program.provider.connection.getMultipleAccountsInfo([
          lowerTickArrayPda,
          upperTickArrayPda,
        ]);

      if (
        !lowerTickInfo &&
        !TicksToCreate.includes(lowerTickArrayPda.toString())
      ) {
        const ix = await whirlpoolCtx.program.methods
          .initializeTickArray(lowerTickArrayStart)
          .accounts({
            whirlpool: whirlpoolKey,
            funder: program.provider.publicKey,
            tickArray: lowerTickArrayPda,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        preInstructions.push(ix);
        TicksToCreate.push(lowerTickArrayPda.toString());
      }

      if (
        !upperTickInfo &&
        !lowerTickArrayPda.equals(upperTickArrayPda) &&
        !TicksToCreate.includes(upperTickArrayPda.toString())
      ) {
        const ix = await whirlpoolCtx.program.methods
          .initializeTickArray(upperTickArrayStart)
          .accounts({
            whirlpool: whirlpoolKey,
            funder: program.provider.publicKey,
            tickArray: upperTickArrayPda,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        TicksToCreate.push(upperTickArrayPda.toString());
        preInstructions.push(ix);
      }
      remainingAccounts.push({
        pubkey: lowerTickArrayPda,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: upperTickArrayPda,
        isWritable: true,
        isSigner: false,
      });
    }
    return {
      preInstructions,
      remainingAccounts,
    };
  } catch (error) {
    console.log({ error });
    return {
      preInstructions: [],
      remainingAccounts: [],
    };
  }
};
