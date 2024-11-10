import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import { Decimal } from "../../../utils/decimal";
import { SimpleCard } from "../../../components/common/SimpleCard";
import {
  clpVaultAtomFamily,
  selectPriorityFeeIx,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUncollectedFeeEstimateUiAmounts,
  splMintAtomFamily,
  splTokenAccountAtomFamily,
  whirlpoolAtomFamily,
  whirlpoolConfigAtomFamily,
} from "../../../state";
import {
  useFetchAndUpdateVaultBalances,
  useLoadClpVaultBalances,
} from "../../../hooks/Clp/useLoadClpVaultBalances";
import { Button } from "../../../components/Button";
import { useClpCollectFees } from "../../../hooks/Clp/useClpCollectFees";
import { useFetchAndUpdateVaultPositions } from "../../../hooks/Clp/useLoadClpVaultPositions";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { Link } from "react-router-dom";
import { FEATURES_ENABLED_SWAPS } from "@mithraic-labs/clp-vault";
import { TextButton } from "../../../components/Button/TextButton";
import { useClpUpdateFeatures } from "../../../hooks/Clp/useClpUpdateFeatures";
import { Spinner } from "../../../components/Spinner";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { SwapDialog } from "./SwapDialog";
import { NumberInput } from "../../../components/common";
import { useWhirlpoolClient } from "../../../hooks/useWhirlpoolFetcher";
import useSharedTxLogic from "../../../hooks/useSendTxCommon";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../../utils/getComputeLimit";

export const VaultInfo = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const wallet = useAnchorWallet();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const collectFees = useClpCollectFees(clpKey);
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const config = useRecoilValue(whirlpoolConfigAtomFamily(clpKey));
  const [loading, setLoading] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [loadingFeature, setLoadingFeature] = useState(false);
  const { sendTx } = useSharedTxLogic();
  const tokenMintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenAccountA = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultA.toString() ?? "")
  );
  const tokenMintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const tokenAccountB = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultB.toString() ?? "")
  );
  const balanceA = new Decimal(tokenAccountA?.amount.toString() ?? 0).div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAccountB?.amount.toString() ?? 0).div(
    10 ** (tokenMintB?.decimals ?? 0)
  );
  const estUncollectedFees = useRecoilValue(
    selectUncollectedFeeEstimateUiAmounts(clpKey)
  );
  const connectedWalletIsAdmin =
    wallet && clpVault?.adminKey.equals(wallet.publicKey);
  const connectedWalletIsMM =
    wallet && clpVault?.marketMakingKey.equals(wallet.publicKey);
  const connectedWalletIsFeeAuthority = !!(
    wallet &&
    config &&
    config.feeAuthority.equals(wallet.publicKey)
  );
  const client = useWhirlpoolClient();
  const updateVaultFeatures = useClpUpdateFeatures(clpKey);
  const poolFeeRate = new Decimal(whirlpool?.feeRate ?? 0)
    .div(1_000_000)
    .mul(100)
    .toNumber()
    .toFixed(4);
  const [feeRate, setFeeRate] = useState(poolFeeRate);
  const fetchPositions = useFetchAndUpdateVaultPositions(clpKey);
  const fetchAndUpdateVaultBalances = useFetchAndUpdateVaultBalances(clpKey);
  const onCollectFees = useCallback(async () => {
    setLoading(true);
    try {
      await collectFees();
      setTimeout(async () => {
        await fetchPositions();
        fetchAndUpdateVaultBalances();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [collectFees, fetchAndUpdateVaultBalances, fetchPositions]);

  const onUpdateFeeRate = useCallback(async () => {
    if (!connectedWalletIsFeeAuthority || !clpVault || !whirlpool) return;
    const context = client.getContext();
    const builder = await context.program.methods
      .setFeeRate(Math.round(Number(feeRate) * 1000))
      .accounts({
        whirlpoolsConfig: whirlpool.whirlpoolsConfig,
        whirlpool: clpVault.clp,
        feeAuthority: wallet.publicKey,
      });

    const tx = await builder.transaction();
    const computeUnits = await getComputeUnitsForTransaction(
      context.program.provider.connection,
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

    await sendTx(tx, [], context.program.idl, "Updating fee rate");
  }, [
    client,
    clpVault,
    connectedWalletIsFeeAuthority,
    feeRate,
    priorityFeeIx,
    sendTx,
    wallet?.publicKey,
    whirlpool,
  ]);

  useLoadClpVaultBalances(clpKey);

  return (
    <SimpleCard className="mx-0">
      <div className="flex justify-between">
        <p className="text-xl font-khand text-text-placeholder mb-2">
          Unallocated Vault Balances
        </p>
        <Link
          target="_blank"
          className="text-primary"
          to={`/clmm/${clpKey}/stats`}
        >
          Stats
        </Link>
      </div>
      <div className="flex flex-row justify-between">
        <p className="font-semibold"> Pool Fee Rate</p>
        <p className="text-primary">{poolFeeRate}%</p>
      </div>
      <div className="flex flex-row justify-between">
        <p className="font-semibold">{tokenASymbol}</p>
        <p>{balanceA.toString()}</p>
      </div>
      <div className="flex flex-row justify-between mx-4">
        <p>Est. Uncollected Fees</p>
        <p>{estUncollectedFees?.feeOwedA.toString() ?? "-"}</p>
      </div>
      <div className="h-2" />
      <div className="flex flex-row justify-between">
        <p className="font-semibold">{tokenBSymbol}</p>
        <p>{balanceB.toString()}</p>
      </div>
      <div className="flex flex-row justify-between mx-4">
        <p>Est. Uncollected Fees</p>
        <p>{estUncollectedFees?.feeOwedB.toString() ?? "-"}</p>
      </div>

      <div className="flex flex-row justify-between items-center mt-2">
        {connectedWalletIsMM &&
        clpVault?.featuresEnabled === FEATURES_ENABLED_SWAPS ? (
          <Button
            className="px-4"
            onClick={() => {
              setSwapOpen(true);
            }}
          >
            Swap
          </Button>
        ) : (
          <div />
        )}
        {connectedWalletIsAdmin && (
          <TextButton
            className={`${
              !clpVault?.featuresEnabled ? "text-primary" : "text-text-danger"
            }`}
            onClick={async () => {
              setLoadingFeature(true);
              updateVaultFeatures(!clpVault?.featuresEnabled);
              setLoadingFeature(false);
            }}
          >
            {loadingFeature && <Spinner className="mr-2 w-4 h-4" />}
            {clpVault?.featuresEnabled ? "Disable Swaps" : "Enable Swaps"}
          </TextButton>
        )}
      </div>

      {connectedWalletIsFeeAuthority && (
        <div className="mt-4">
          <p className="font-semibold mb-2">Update Fee Rate (%)</p>
          <NumberInput value={feeRate} onChange={setFeeRate} />
          <Button className="mt-2" onClick={onUpdateFeeRate}>
            Update
          </Button>
        </div>
      )}
      {!!(
        estUncollectedFees?.feeOwedA.greaterThan(0) ||
        estUncollectedFees?.feeOwedB.greaterThan(0)
      ) && (
        <div className="flex mt-4">
          <Button
            fullWidth
            loading={loading}
            onClick={onCollectFees}
            variant="outline"
          >
            Collect Fees
          </Button>
        </div>
      )}
      <SwapDialog
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        preventOutsideClick
      />
    </SimpleCard>
  );
};
