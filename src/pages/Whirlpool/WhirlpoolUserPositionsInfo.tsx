import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import {
  NormalizedPositionData,
  explorerAtom,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  selectWhirlpoolUserPositionList,
  whirlpoolAtomFamily,
} from "../../state";
import { SimpleCard } from "../../components/common/SimpleCard";
import { TextButton } from "../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { Button } from "../../components/Button";
import { Link } from "react-router-dom";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { WhirlpoolNewPositionDialog } from "./WhirlpoolNewPositionDialog";
import { WhirlpoolClosePositionDialog } from "./WhirlpoolClosePositionDialog";
import { WhirlpoolChangeLiquidityDialog } from "./WhirlpoolChangeLiquidityDialog";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { InfoTooltip } from "../../components/common";
import { Explorers, NetworkOption } from "../../utils/types";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { useIsProhibitedJurisdiction } from "../../hooks/useIsProhibitedJurisdiction";

export const WhirlpoolUserPositionsInfo = () => {
  const isProhibitedJurisdiction = useIsProhibitedJurisdiction();
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const [newPositionVisible, setNewPositionVisible] = useState(false);
  const [liquidityPosition, setLiquidityPosition] = useState({
    positionKey: "",
    increment: true,
  });
  const positions = useRecoilValue(selectWhirlpoolUserPositionList(key));
  const [positionToClose, setPositionToClose] = useState("");
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const explorer = useRecoilValue(explorerAtom);
  return (
    <>
      <SimpleCard className="flex-1 flex">
        <div className="flex flex-row justify-between items-center">
          <p className="text-xl font-khand text-text-placeholder">
            Open Positions
          </p>
          {!!key && (
            <Link
              target="_blank"
              className="text-primary"
              to={Explorers[explorer].accountLink(key, isDevnet)}
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

          {/* Hide adding a position if user is in prohibited jurisdiction */}
          {!isProhibitedJurisdiction && (
            <TextButton
              className="text-primary"
              onClick={() => setNewPositionVisible(true)}
            >
              + New Position
            </TextButton>
          )}
        </div>
      </SimpleCard>
      <WhirlpoolNewPositionDialog
        open={newPositionVisible}
        onClose={() => setNewPositionVisible(false)}
      />
      <WhirlpoolChangeLiquidityDialog
        open={!!liquidityPosition.positionKey}
        onClose={() =>
          setLiquidityPosition((prev) => ({
            ...prev,
            positionKey: "",
          }))
        }
        positionKey={liquidityPosition.positionKey}
        increment={liquidityPosition.increment}
      />
      <WhirlpoolClosePositionDialog
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
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const amountFormatterTokenA = useMintAmountFormatter(
    whirlpool?.tokenMintA.toString() ?? ""
  );
  const amountFormatterTokenB = useMintAmountFormatter(
    whirlpool?.tokenMintB.toString() ?? ""
  );
  const tokenASymbol = useRecoilValue(selectWhirlpoolTokenASymbol(key));
  const tokenBSymbol = useRecoilValue(selectWhirlpoolTokenBSymbol(key));

  return (
    <InfoTooltip
      className="flex flex-col flex-1"
      tooltipContent={
        <div className="flex justify-between items-center">
          <p>
            <span className="opacity-75">{tokenASymbol} Fees:</span>{" "}
            <span className="font-semibold">
              {amountFormatterTokenA(pos.feesA.toNumber())}
            </span>
          </p>
          <div className="w-2" />
          <p>
            <span className="opacity-75">{tokenBSymbol} Fees:</span>{" "}
            <span className="font-semibold">
              {amountFormatterTokenB(pos.feesB.toNumber())}
            </span>
          </p>
        </div>
      }
    >
      <div className={`h-1 w-full rounded-xl bg-chart-${index} mb-2`} />
      <div className="flex justify-between items-center">
        <p>
          <span className="opacity-75">{tokenASymbol} Balance:</span>{" "}
          <span className="font-semibold">
            {amountFormatterTokenA(pos.tokenABalance)}
          </span>
        </p>
        <div className="w-2" />
        <p>
          <span className="opacity-75">{tokenBSymbol} Balance:</span>{" "}
          <span className="font-semibold">
            {amountFormatterTokenB(pos.tokenBBalance)}
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
    </InfoTooltip>
  );
};
