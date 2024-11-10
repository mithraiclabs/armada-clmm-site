import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useClpVaultProgram } from "./useClpVaultProgram";
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectPriorityFeeIx,
} from "../../state";
import { VaultPosition } from "@mithraic-labs/clp-vault";
import { ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { BASE_NETWORK_FEES } from "../../utils/tx-utils";
import { useClpCollectFees } from "./useClpCollectFees";
import { useFetchAndUpdateVaultPositions } from "./useLoadClpVaultPositions";
import { useFetchAndUpdateVaultBalances } from "./useLoadClpVaultBalances";
import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";
import useSharedTxLogic from "../useSendTxCommon";
import { TxType } from "../../utils/types";
import { useSaveTxToHistory } from "../utils/useSaveTxToHistory";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForTransaction,
} from "../../utils/getComputeLimit";

export const useClpClosePosition = (clpKey: string, positionKey: string) => {
  const wallet = useAnchorWallet();
  const clpVaultProgram = useClpVaultProgram();
  const setClpVault = useSetRecoilState(clpVaultAtomFamily(clpKey));
  const sweepFees = useClpCollectFees(clpKey, true);
  const fetchAndUpdateVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const { sendTx } = useSharedTxLogic();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { saveTx } = useSaveTxToHistory();

  return useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (!wallet) {
          throw new Error("Please connect wallet and try again.");
        }
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        if (!clpVault) {
          throw new Error("State not loaded, please try again");
        }
        if (!clpVault.marketMakingKey.equals(wallet.publicKey)) {
          throw new Error(
            "Wallet not authorized to close positions on this vault"
          );
        }
        const positionIndex = (clpVault.positions as VaultPosition[]).findIndex(
          (p) => p.positionKey.toString() === positionKey
        );
        if (positionIndex < 0) {
          throw new Error("Invalid position key for clp vault");
        }
        const bundledPosition = PDAUtil.getBundledPosition(
          ORCA_WHIRLPOOL_PROGRAM_ID,
          clpVault.positionBundleMint,
          positionIndex
        ).publicKey;

        const solBalance = snapshot
          .getLoadable(nativeSolBalanceAtom)
          .getValue();
        if (BASE_NETWORK_FEES > solBalance) {
          throw new Error("Insufficient SOL for transaction");
        }
        let preInstructions: TransactionInstruction[] = [];
        const sweepFeeIx = (await sweepFees()) as TransactionInstruction[];
        if (sweepFeeIx) {
          preInstructions = [...sweepFeeIx];
        }
        try {
          const txBuilder = await clpVaultProgram.methods
            .closePosition(positionIndex)
            .accounts({
              receiver: wallet.publicKey,
              marketMakingKey: wallet.publicKey,
              clpVault: clpKey,
              clp: clpVault.clp,
              clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
              bundledPosition,
              positionBundle: clpVault.positionBundle,
              positionBundleTokenAccount: clpVault.positionBundleTokenAccount,
            })
            .preInstructions(preInstructions);
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

          const signature = await sendTx(
            tx,
            [],
            clpVaultProgram.idl,
            "Closing position",
            {
              skipPreflight: true,
            }
          );
          saveTx({
            message: "Succcessfully closed a new position",
            action: `Position closed on vault ${clpKey.slice(0, 8)}...`,
            signatures: [
              {
                signature,
                type: TxType.clmmPositionOpen,
              },
            ],
          });

          setTimeout(() => {
            fetchAndUpdateVaultPositions();
            fetchAndUpdateVaultBalances();
          }, 5000);
          const _clpVault = await clpVaultProgram.account.clpVault.fetch(
            clpKey
          );
          setClpVault(_clpVault);
        } catch (error) {
          console.error(error);
        }
      },
    [
      clpKey,
      clpVaultProgram,
      fetchAndUpdateVaultBalances,
      fetchAndUpdateVaultPositions,
      positionKey,
      priorityFeeIx,
      sendTx,
      saveTx,
      setClpVault,
      sweepFees,
      wallet,
    ]
  );
};
