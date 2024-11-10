import React from "react";
import { useRecoilValue } from "recoil";
import { PositionChart } from "../../../components/CLP/PositionChart";
import {
  clpVaultAtomFamily,
  selectClpCurrentPrice,
  selectClpVaultPositionDataList,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { Tooltip } from "recharts";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";

export const MarketMakingChart = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const positions = useRecoilValue(selectClpVaultPositionDataList(clpKey));
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const amountFormatterTokenB = useMintAmountFormatter(
    clpVault?.tokenMintB.toString() ?? ""
  );
  const currentPrice = useRecoilValue(
    selectClpCurrentPrice(clpKey)
  )?.toNumber();

  return (
    <div className="min-h-[400px] flex flex-col flex-1">
      <div className="flex justify-center">
        <p className="font-medium">
          Current Price:{" "}
          <span className="font-semibold">
            {amountFormatterTokenB(currentPrice)}
          </span>
        </p>
      </div>
      {positions.length ? (
        <PositionChart
          positions={positions}
          currentPrice={currentPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          tokenSelect
        >
          <Tooltip content={<MarketMakingToolip />} />
        </PositionChart>
      ) : (
        <div className="mt-3 flex flex-1">
          <p className="flex-1 text-center">No Active Positions</p>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MarketMakingToolip: any = ({ active, payload }: any) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  if (active && payload && payload.length) {
    return (
      <div className="bg-background-panel rounded-md px-2 py-3">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((data: any) => (
          <div key={data?.name} className="mt-2">
            <p className="font-normal">
              Position: {(data?.name ?? ("" as string)).slice(0, 20)}...
            </p>
            <p className="font-semibold text-sm">
              {tokenASymbol}:{" "}
              {data?.payload?.metadata[data?.name]?.tokenABalance}
            </p>
            <p className="font-semibold text-sm">
              {tokenBSymbol}:{" "}
              {data?.payload?.metadata[data?.name]?.tokenBBalance}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
