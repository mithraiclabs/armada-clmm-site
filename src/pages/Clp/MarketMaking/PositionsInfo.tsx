import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import {
  NormalizedPositionData,
  clpVaultAtomFamily,
  explorerAtom,
  selectClpVaultPositionDataList,
  selectPositionTokenPercentages,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUiInvertTokenPair,
} from "../../../state";
import { SimpleCard } from "../../../components/common/SimpleCard";
import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { NewPositionDialog } from "./NewPositionDialog";
import { PublicKey } from "@solana/web3.js";
import { Button } from "../../../components/Button";
import { useClpInitializeBundle } from "../../../hooks/Clp/useClpInitializeBundle";
import toast from "react-hot-toast";
import { ChangeLiquidityDialog } from "./ChangeLiquidityDialog";
import { ClosePositionDialog } from "./ClosePositionDialog";
import { Link } from "react-router-dom";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { Explorers, NetworkOption } from "../../../utils/types";

// Add inc/dec liquidity that takes tokenA or token B as input. Show error if not enough of either is in the vault. Should dec from other positions if that's the case

export const PositionsInfo = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [newPositionVisible, setNewPositionVisible] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [liquidityPosition, setLiquidityPosition] = useState({
    positionKey: "",
    increment: true,
  });
  const [positionToClose, setPositionToClose] = useState("");
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const positions = useRecoilValue(selectClpVaultPositionDataList(clpKey));
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const explorer = useRecoilValue(explorerAtom);
  const initializeBundle = useClpInitializeBundle(clpKey);
  const onInitializeBundle = useCallback(async () => {
    try {
      setInitializing(true);
      await initializeBundle();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setInitializing(false);
    }
  }, [initializeBundle]);
  const onCloseLiquidityDialog = useCallback(
    () =>
      setLiquidityPosition((prev) => ({
        ...prev,
        positionKey: "",
      })),
    []
  );

  return (
    <>
      <SimpleCard className="flex-1 flex mx-0">
        <div className="flex flex-row justify-between items-center">
          <p className="text-xl font-khand text-text-placeholder">
            Open Positions
          </p>
          {!!clpVault?.clp && (
            <Link
              target="_blank"
              className="text-primary"
              to={Explorers[explorer].accountLink(
                clpVault?.clp.toString() ?? "",
                isDevnet
              )}
            >
              Pool Trades
            </Link>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            {positions.map((pos, index) => (
              <div
                key={pos.pubkey}
                className={`flex flex-col my-2 pb-2 border-b-2 border-background-input`}
              >
                <OpenPosition pos={pos} index={index} />
                <div className="flex flex-row justify-between items-center mt-1">
                  <Button
                    disabled={pos.liquidityA === 0 && pos.liquidityB === 0}
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      setLiquidityPosition({
                        positionKey: pos.pubkey,
                        increment: false,
                      })
                    }
                  >
                    {" "}
                    - Liquidity
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      setLiquidityPosition({
                        positionKey: pos.pubkey,
                        increment: true,
                      })
                    }
                  >
                    {" "}
                    + Liquidity
                  </Button>
                  <TextButton
                    className="ml-2 text-text-danger"
                    onClick={() => setPositionToClose(pos.pubkey)}
                  >
                    <CloseIcon height={40} width={40} />
                  </TextButton>
                </div>
              </div>
            ))}
          </div>
          {clpVault?.positionBundle.equals(PublicKey.default) ? (
            <div>
              <p className="text-sm text-text-placeholder mb-2">
                No Position Bundle exists for this vault. Please initialize in
                order to open positions.
              </p>
              <Button loading={initializing} onClick={onInitializeBundle}>
                Initialize Position Bundle
              </Button>
            </div>
          ) : (
            <TextButton
              className="text-primary"
              onClick={() => setNewPositionVisible(true)}
            >
              + New Position
            </TextButton>
          )}
        </div>
      </SimpleCard>
      <NewPositionDialog
        open={newPositionVisible}
        onClose={() => setNewPositionVisible(false)}
      />
      <ChangeLiquidityDialog
        open={!!liquidityPosition.positionKey}
        onClose={onCloseLiquidityDialog}
        positionKey={liquidityPosition.positionKey}
        increment={liquidityPosition.increment}
      />
      <ClosePositionDialog
        open={!!positionToClose}
        positionKey={positionToClose}
        onClose={() => setPositionToClose("")}
      />
    </>
  );
};

export const OpenPosition = ({
  index,
  pos,
}: {
  index: number;
  pos: NormalizedPositionData;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const amountFormatterTokenA = useMintAmountFormatter(
    clpVault?.tokenMintA.toString() ?? ""
  );
  const amountFormatterTokenB = useMintAmountFormatter(
    clpVault?.tokenMintB.toString() ?? ""
  );
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const inverted = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const { tokenA: percentageTokenA, tokenB: percentageTokenB } = useRecoilValue(
    selectPositionTokenPercentages(pos.pubkey)
  );

  const underlyingTokenBalanceContent = inverted ? (
    <p>
      <span className="opacity-75">{tokenBSymbol} Balance:</span>{" "}
      <span className="font-semibold">
        {amountFormatterTokenB(pos.tokenBBalance)}
      </span>
    </p>
  ) : (
    <p>
      <span className="opacity-75">{tokenASymbol} Balance:</span>{" "}
      <span className="font-semibold">
        {amountFormatterTokenA(pos.tokenABalance)}
      </span>
    </p>
  );
  const quoteTokenBalanceContent = inverted ? (
    <p>
      <span className="opacity-75">{tokenASymbol} Balance:</span>{" "}
      <span className="font-semibold">
        {amountFormatterTokenA(pos.tokenABalance)}
      </span>
    </p>
  ) : (
    <p>
      <span className="opacity-75">{tokenBSymbol} Balance:</span>{" "}
      <span className="font-semibold">
        {amountFormatterTokenB(pos.tokenBBalance)}
      </span>
    </p>
  );

  return (
    <div className="flex flex-col flex-1">
      <div className={`h-1 w-full rounded-xl bg-chart-${index} mb-2`} />
      <div className="flex justify-between items-center">
        {quoteTokenBalanceContent}
        <div className="w-2" />
        {underlyingTokenBalanceContent}
      </div>
      <div className="flex justify-between items-center  text-base">
        <p>
          <span className="opacity-75">Position %:</span>{" "}
          <span className="font-semibold">
            {inverted
              ? percentageTokenA.toFixed(2)
              : percentageTokenB.toFixed(2)}
            %
          </span>
        </p>
        <div className="w-2" />
        <p>
          <span className="opacity-75">Position %:</span>{" "}
          <span className="font-semibold">
            {inverted
              ? percentageTokenB.toFixed(2)
              : percentageTokenA.toFixed(2)}
            %
          </span>
        </p>
      </div>
      <div className="flex justify-between ">
        <p>
          <span className="opacity-75">Lower Price:</span>{" "}
          <span className="font-semibold">
            {amountFormatterTokenB(pos.lowerPrice)}
          </span>
        </p>
        <div className="w-2" />
        <p>
          <span className="opacity-75">Upper Price:</span>{" "}
          <span className="font-semibold">
            {amountFormatterTokenB(pos.upperPrice)}
          </span>
        </p>
      </div>
    </div>
  );
};
