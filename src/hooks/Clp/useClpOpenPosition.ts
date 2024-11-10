import { useClpVaultProgram } from "./useClpVaultProgram";
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectPriorityFeeIx,
  selectUiInvertTokenPair,
  splMintAtomFamily,
  whirlpoolAtomFamily,
} from "../../state";
import { VaultPosition } from "@mithraic-labs/clp-vault";
import {
  ComputeBudgetProgram,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PriceMath,
  TickUtil,
} from "@orca-so/whirlpools-sdk";
import { Decimal } from "../../utils/decimal";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { BASE_NETWORK_FEES } from "../../utils/tx-utils";
import useSharedTxLogic from "../useSendTxCommon";
import { TxType } from "../../utils/types";
import { useSaveTxToHistory } from "../utils/useSaveTxToHistory";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForTransaction,
} from "../../utils/getComputeLimit";

export const useClpOpenPosition = (clpKey: string) => {
  const clpVaultProgram = useClpVaultProgram();
  const setClpVault = useSetRecoilState(clpVaultAtomFamily(clpKey));
  const invertedTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const wallet = useAnchorWallet();
  const { sendTx } = useSharedTxLogic();
  const { saveTx } = useSaveTxToHistory();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);

  return useRecoilCallback(
    ({ snapshot }) =>
      async (
        lowerPrice: Decimal | string | number,
        upperPrice: Decimal | string | number
      ) => {
        if (!wallet) {
          throw new Error("Please connect wallet and try again.");
        }
        const clpVault = snapshot
          .getLoadable(clpVaultAtomFamily(clpKey))
          .getValue();
        const mintA = snapshot
          .getLoadable(splMintAtomFamily(clpVault?.tokenMintA.toString() ?? ""))
          .getValue();
        const mintB = snapshot
          .getLoadable(splMintAtomFamily(clpVault?.tokenMintB.toString() ?? ""))
          .getValue();
        const whirlpool = snapshot
          .getLoadable(whirlpoolAtomFamily(clpVault?.clp.toString() ?? ""))
          .getValue();
        if (!clpVault || !mintA || !mintB || !whirlpool) {
          throw new Error("State not loaded, please try again");
        }
        const positionIndex = (clpVault.positions as VaultPosition[]).findIndex(
          (p) => p.positionKey.equals(PublicKey.default)
        );
        const inputLowerTick = PriceMath.priceToTickIndex(
          new Decimal(lowerPrice),
          invertedTokens ? mintB.decimals : mintA.decimals,
          invertedTokens ? mintA.decimals : mintB.decimals
        );
        const inputUpperTick = PriceMath.priceToTickIndex(
          new Decimal(upperPrice),
          invertedTokens ? mintB.decimals : mintA.decimals,
          invertedTokens ? mintA.decimals : mintB.decimals
        );
        let lowerTick = invertedTokens
          ? TickUtil.invertTick(inputUpperTick)
          : inputLowerTick;
        let upperTick = invertedTokens
          ? TickUtil.invertTick(inputLowerTick)
          : inputUpperTick;
        lowerTick = TickUtil.getInitializableTickIndex(
          lowerTick,
          whirlpool.tickSpacing
        );
        upperTick = TickUtil.getInitializableTickIndex(
          upperTick,
          whirlpool.tickSpacing
        );
        if (positionIndex < 0) {
          throw new Error("Too many positions");
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

        const txBuilder = await clpVaultProgram.methods
          .openPosition(positionIndex, lowerTick, upperTick)
          .accounts({
            payer: wallet.publicKey,
            marketMakingKey: wallet.publicKey,
            clpVault: clpKey,
            clp: clpVault.clp,
            clpProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
            bundledPosition,
            positionBundle: clpVault.positionBundle,
            positionBundleTokenAccount: clpVault.positionBundleTokenAccount,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
          });
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
          "Opening new position"
        );
        saveTx({
          message: "Succcessfully opened a new position",
          action: `Position open on vault ${clpKey.slice(0, 8)}...`,
          signatures: [
            {
              signature,
              type: TxType.clmmPositionOpen,
            },
          ],
        });
        const _clpVault = await clpVaultProgram.account.clpVault.fetch(clpKey);
        setClpVault(_clpVault);
      },
    [
      wallet,
      clpKey,
      invertedTokens,
      priorityFeeIx,
      clpVaultProgram,
      sendTx,
      setClpVault,
      saveTx,
    ]
  );
};
