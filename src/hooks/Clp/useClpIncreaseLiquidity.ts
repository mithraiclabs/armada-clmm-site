import { useClpVaultProgram } from "./useClpVaultProgram";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  AccountName,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  TickUtil,
  WhirlpoolContext,
  getAccountSize,
  increaseLiquidityQuoteByInputTokenWithParams,
} from "@orca-so/whirlpools-sdk";
import { Percentage } from "@orca-so/common-sdk";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { Decimal } from "../../utils/decimal";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectPriorityFeeIx,
  splMintAtomFamily,
  whirlpoolAtomFamily,
  whirlpoolPositionAtomFamily,
} from "../../state";
import { BN } from "bn.js";
import { VaultPosition } from "@mithraic-labs/clp-vault";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import { useFetchAndUpdateVaultBalances } from "./useLoadClpVaultBalances";
import { getSolanaFeeAmount } from "../../utils/tx-utils";
import useSharedTxLogic from "../useSendTxCommon";
import toast from "react-hot-toast";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForTransaction,
} from "../../utils/getComputeLimit";

export const useClpIncreaseLiquidity = (
  clpKey: string,
  positionKey: string
) => {
  const clpVaultProgram = useClpVaultProgram();
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const getIncreaseLiquidityQuoteVals = useGetIncreaseLiquidityQuoteVals(
    clpKey,
    positionKey
  );
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { sendTx } = useSharedTxLogic();

  return useRecoilCallback(
    ({ snapshot }) =>
      async (
        slippage: number,
        inputTokenAmount: Decimal | string | number,
        inputTokenMint: string
      ) => {
        if (
          !clpVaultProgram.provider.publicKey ||
          clpVaultProgram.provider.publicKey.equals(PublicKey.default)
        ) {
          toast.error("Please connect wallet and try again.");
          return;
        }
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(clpVault?.clp.toString() ?? ""))
          .getValue();
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionKey))
          .getValue();
        if (!clpVault || !whirlpool || !position) {
          toast.error("State not loaded, please try again");
          return;
        }

        let bytes = 0;
        let accounts = 0;

        const positionIndex = (clpVault.positions as VaultPosition[]).findIndex(
          (p) => p.positionKey.toString() === positionKey
        );

        if (positionIndex < 0) {
          toast.error("Invalid position key for clp vault");
          return;
        }

        const lowerTickArrayStart = TickUtil.getStartTickIndex(
          position.tickLowerIndex,
          whirlpool.tickSpacing
        );
        const upperTickArrayStart = TickUtil.getStartTickIndex(
          position.tickUpperIndex,
          whirlpool.tickSpacing
        );
        const lowerTickArrayPda = PDAUtil.getTickArray(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          clpVault.clp,
          lowerTickArrayStart
        ).publicKey;
        const upperTickArrayPda = PDAUtil.getTickArray(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          clpVault.clp,
          upperTickArrayStart
        ).publicKey;
        const whirlpoolCtx = WhirlpoolContext.withProvider(
          // @ts-expect-error update anchor
          clpVaultProgram.provider,
          ORCA_WHIRLPOOL_PROGRAM_ID
        );

        const preInstructions: TransactionInstruction[] = [];
        const postInstructions: TransactionInstruction[] = [];
        const [lowerTickArrayInfo, upperTickArrayInfo] =
          await clpVaultProgram.provider.connection.getMultipleAccountsInfo([
            lowerTickArrayPda,
            upperTickArrayPda,
          ]);

        if (!lowerTickArrayInfo) {
          bytes += getAccountSize(AccountName.TickArray);
          accounts += 1;
          const ix = await whirlpoolCtx.program.methods
            .initializeTickArray(lowerTickArrayStart)
            .accounts({
              whirlpool: clpVault.clp,
              funder: clpVaultProgram.provider.publicKey,
              tickArray: lowerTickArrayPda,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          preInstructions.push(ix);
        }

        if (
          !upperTickArrayInfo &&
          !lowerTickArrayPda.equals(upperTickArrayPda)
        ) {
          bytes += getAccountSize(AccountName.TickArray);
          accounts += 1;
          const ix = await whirlpoolCtx.program.methods
            .initializeTickArray(upperTickArrayStart)
            .accounts({
              whirlpool: clpVault.clp,
              funder: clpVaultProgram.provider.publicKey,
              tickArray: upperTickArrayPda,
              systemProgram: SystemProgram.programId,
            })
            .instruction();
          preInstructions.push(ix);
        }

        let offset = 1;
        let tickArrayStart = TickUtil.getStartTickIndex(
          position.tickLowerIndex,
          whirlpool.tickSpacing,
          offset
        );
        const tickArrayStarts: number[] = [];
        while (tickArrayStart < upperTickArrayStart) {
          // add additional tick arrays that need to be initialized
          tickArrayStarts.push(tickArrayStart);
          offset += 1;
          tickArrayStart = TickUtil.getStartTickIndex(
            position.tickLowerIndex,
            whirlpool.tickSpacing,
            offset
          );
        }

        const tickArrayPdas = tickArrayStarts.map(
          (i) =>
            PDAUtil.getTickArray(ORCA_WHIRLPOOL_PROGRAM_ID, clpVault.clp, i)
              .publicKey
        );

        const tickArrayAccountInfos =
          await clpVaultProgram.provider.connection.getMultipleAccountsInfo(
            tickArrayPdas
          );
        for (let i = 0; i < tickArrayAccountInfos.length; i++) {
          const pda = tickArrayPdas[i];
          const tickArrayStart = tickArrayStarts[i];
          const acctInfo = tickArrayAccountInfos[i];
          if (
            !acctInfo &&
            !pda.equals(lowerTickArrayPda) &&
            !pda.equals(upperTickArrayPda)
          ) {
            const ix = await whirlpoolCtx.program.methods
              .initializeTickArray(tickArrayStart)
              .accounts({
                whirlpool: clpVault.clp,
                funder: clpVaultProgram.provider.publicKey,
                tickArray: pda,
                systemProgram: SystemProgram.programId,
              })
              .instruction();
            postInstructions.push(ix);
          }
        }

        const increaseLiquidityParams = getIncreaseLiquidityQuoteVals(
          slippage,
          inputTokenAmount,
          inputTokenMint
        );

        const solBalance = snapshot
          .getLoadable(nativeSolBalanceAtom)
          .getValue();
        const fees = await getSolanaFeeAmount(
          clpVaultProgram.provider.connection,
          bytes,
          accounts
        );
        if (fees > solBalance) {
          toast.error("Insufficient SOL for transaction");
          return;
        }

        const txBuilder = await clpVaultProgram.methods
          .increaseLiquidity(
            increaseLiquidityParams.liquidityAmount,
            increaseLiquidityParams.tokenMaxA,
            increaseLiquidityParams.tokenMaxB,
            positionIndex
          )
          .accounts({
            marketMakingKey: clpVaultProgram.provider.publicKey,
            clpVault: clpKey,
            clp: clpVault.clp,
            clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
            tokenVaultA: clpVault.tokenVaultA,
            tokenVaultB: clpVault.tokenVaultB,
            clpTokenVaultA: whirlpool.tokenVaultA,
            clpTokenVaultB: whirlpool.tokenVaultB,
            positionBundleTokenAccount: clpVault.positionBundleTokenAccount,
            position: positionKey,
            tickArrayLower: lowerTickArrayPda,
            tickArrayUpper: upperTickArrayPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .preInstructions(preInstructions)
          .postInstructions(postInstructions);
        const tx = await txBuilder.transaction();

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

        const signature = await sendTx(
          tx,
          [],
          clpVaultProgram.idl,
          "Increasing liquidity"
        );
        fetchAndUpdateVaultBalances();
        fetchAndUpdateVaultPositions();
        return signature;
      },
    [
      clpVaultProgram,
      clpKey,
      positionKey,
      priorityFeeIx,
      getIncreaseLiquidityQuoteVals,
      sendTx,
      fetchAndUpdateVaultBalances,
      fetchAndUpdateVaultPositions,
    ]
  );
};

export const useGetIncreaseLiquidityQuoteVals = (
  clpKey: string,
  positionKey: string
) => {
  return useRecoilCallback(
    ({ snapshot }) =>
      (
        slippage: number,
        inputTokenAmount: Decimal | string | number,
        inputTokenMint: string
      ) => {
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(clpVault?.clp.toString() ?? ""))
          .getValue();
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionKey))
          .getValue();
        const mintA = snapshot
          .getLoadable(
            splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
          )
          .getValue();
        const mintB = snapshot
          .getLoadable(
            splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
          )
          .getValue();
        if (!clpVault || !whirlpool || !mintA || !mintB || !position) {
          throw new Error("State not loaded, please try again");
        }
        const inputMint =
          mintA.address.toString() === inputTokenMint ? mintA : mintB;
        const tokenAmount = new Decimal(
          parseFloat(inputTokenAmount.toString()) ? inputTokenAmount : 0
        ).mul(10 ** inputMint.decimals);
        const tokenAmountBN = new BN(tokenAmount.toString());
        return increaseLiquidityQuoteByInputTokenWithParams({
          inputTokenAmount: tokenAmountBN,
          inputTokenMint: inputMint.address,
          tokenMintA: mintA.address,
          tokenMintB: mintB.address,
          tickCurrentIndex: whirlpool.tickCurrentIndex,
          sqrtPrice: whirlpool.sqrtPrice,
          tickLowerIndex: position.tickLowerIndex,
          tickUpperIndex: position.tickUpperIndex,
          slippageTolerance: Percentage.fromDecimal(new Decimal(slippage)),
        });
      },
    [clpKey, positionKey]
  );
};
