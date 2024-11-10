import { useClpVaultProgram } from "./useClpVaultProgram";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  TickUtil,
  decreaseLiquidityQuoteByLiquidityWithParams,
} from "@orca-so/whirlpools-sdk";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectPriorityFeeIx,
  whirlpoolAtomFamily,
  whirlpoolPositionAtomFamily,
} from "../../state";
import { VaultPosition } from "@mithraic-labs/clp-vault";
import { Percentage } from "@orca-so/common-sdk";
import { BN } from "bn.js";
import { Decimal } from "../../utils/decimal";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import { useFetchAndUpdateVaultBalances } from "./useLoadClpVaultBalances";
import { BASE_NETWORK_FEES } from "../../utils/tx-utils";
import useSharedTxLogic from "../useSendTxCommon";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../utils/getComputeLimit";

export const useClpDecreaseLiquidity = (
  clpKey: string,
  positionKey: string
) => {
  const clpVaultProgram = useClpVaultProgram();
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const getDecreaseLiquidityQuoteVals = useGetDecreaseLiquidityQuoteVals(
    clpKey,
    positionKey
  );
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { sendTx } = useSharedTxLogic();

  return useRecoilCallback(
    ({ snapshot }) =>
      async (slippage: number, decreasePercent: number) => {
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
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionKey))
          .getValue();

        if (!clpVault || !whirlpool || !position) {
          throw new Error("State not loaded, please try again");
        }

        const positionIndex = (clpVault.positions as VaultPosition[]).findIndex(
          (p) => p.positionKey.toString() === positionKey
        );

        if (positionIndex < 0) {
          throw new Error("Invalid position key for clp vault");
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

        const decreaseLiquidityParams = getDecreaseLiquidityQuoteVals(
          slippage,
          decreasePercent
        );

        const solBalance = snapshot
          .getLoadable(nativeSolBalanceAtom)
          .getValue();
        if (BASE_NETWORK_FEES > solBalance) {
          throw new Error("Insufficient SOL for transaction");
        }
        console.debug(
          "DEBUG: useClpDecreaseLiquidity ",
          decreaseLiquidityParams.liquidityAmount.toString(),
          decreaseLiquidityParams.tokenMinA.toString(),
          decreaseLiquidityParams.tokenMinB.toString(),
          positionIndex
        );

        const txBuilder = await clpVaultProgram.methods
          .decreaseLiquidity(
            decreaseLiquidityParams.liquidityAmount,
            decreaseLiquidityParams.tokenMinA,
            decreaseLiquidityParams.tokenMinB,
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
          });
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

        const txid = await sendTx(
          tx,
          [],
          clpVaultProgram.idl,
          "Decreasing liquidity"
        );
        fetchAndUpdateVaultPositions();
        fetchAndUpdateVaultBalances();
        return txid;
      },
    [
      clpKey,
      clpVaultProgram,
      fetchAndUpdateVaultBalances,
      fetchAndUpdateVaultPositions,
      getDecreaseLiquidityQuoteVals,
      positionKey,
      priorityFeeIx,
      sendTx,
    ]
  );
};

export const useGetDecreaseLiquidityQuoteVals = (
  clpKey: string,
  positionKey: string
) => {
  return useRecoilCallback(
    ({ snapshot }) =>
      (slippage: number, decreasePercent: number) => {
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(clpVault?.clp.toString() ?? ""))
          .getValue();
        const position = snapshot
          .getLoadable(whirlpoolPositionAtomFamily(positionKey))
          .getValue();

        if (!whirlpool || !position) {
          throw new Error("State not loaded, please try again");
        }

        // allow percentage precision of 1/100
        const decreaseLiquidity = position.liquidity
          .mul(new BN(decreasePercent * 100))
          .div(new BN(10000));

        console.log(
          "DEBUG: useGetDecreaseLiquidityQuoteVals ",
          decreaseLiquidity.toString(),
          whirlpool.tickCurrentIndex,
          whirlpool.sqrtPrice.toString(),
          position.tickLowerIndex,
          position.tickUpperIndex,
          Percentage.fromDecimal(new Decimal(slippage)).toString()
        );
        return decreaseLiquidityQuoteByLiquidityWithParams({
          liquidity: decreaseLiquidity,
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
