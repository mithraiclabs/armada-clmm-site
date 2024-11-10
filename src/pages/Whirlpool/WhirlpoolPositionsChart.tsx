import React from "react";
import { useRecoilValue } from "recoil";
import {
  selectWhirlpoolCurrentPrice,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  selectWhirlpoolUserPositionList,
} from "../../state";
import { PositionChart } from "../../components/CLP/PositionChart";
import { Tooltip } from "recharts";
import { MarketMakingToolip } from "../Clp/MarketMaking/MarketMakingChart";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";

export const WhirlpoolPositionsChart = () => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const positions = useRecoilValue(
    selectWhirlpoolUserPositionList(key)
  );
  const tokenASymbol = useRecoilValue(selectWhirlpoolTokenASymbol(key));
  const tokenBSymbol = useRecoilValue(selectWhirlpoolTokenBSymbol(key));
  const currentPrice = useRecoilValue(
    selectWhirlpoolCurrentPrice(key)
  )?.toNumber();

  return (
    <div className="min-h-[400px] flex flex-col flex-1">
      <div className="flex justify-center">
        <p className="font-medium">
          Current Price:{" "}
          <span className="font-semibold">{currentPrice?.toString()}</span>
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
