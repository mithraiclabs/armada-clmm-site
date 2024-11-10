import {
  ResponsiveContainer,
  XAxis,
  CartesianGrid,
  YAxis,
  Line,
  ComposedChart,
  Tooltip,
} from "recharts";
import React, { RefObject, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import {
  PerformanceDatapoint,
  historyRangeTypeAtom,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { SimpleCard } from "../../common/SimpleCard";
import { Checkbox } from "../../common/Checkbox";
import { formatDate } from ".";
import { sampleData } from "../../../utils/math";
import { Spinner } from "../../Spinner";
import { format } from "date-fns";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { selectVaultPnlHistory } from "../../../state/misc/selectors";
import { getSampleInterval } from "../../../utils/stats";
import { useChartWidth } from "../../../hooks/Clp/Stats/useChartWidth";

export const ReturnsChart = ({
  areaChartProps = {},
  containerRef,
}: {
  areaChartProps?: { onMouseEnter?: () => void; onMouseLeave?: () => void };
  containerRef: RefObject<HTMLDivElement>;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [showTokenAHodl, setShowTokenAHodl] = useState(false);
  const [showTokenBHodl, setShowTokenBHodl] = useState(false);
  const [showSplitHodl, setShowSplitHodl] = useState(true);
  const [showVaultPerformance, setShowVaultPerformance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceDatapoint[]>([]);
  const rangeType = useRecoilValue(historyRangeTypeAtom);
  const chartWidth = useChartWidth(containerRef);
  const history = useRecoilValue(selectVaultPnlHistory(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const last = data[data.length - 1];

  useEffect(() => {
    setLoading(true);
    setData(sampleData(history, getSampleInterval(rangeType)));
    if (history.length) setLoading(false);
  }, [history, rangeType]);

  return (
    <div className="flex flex-col md:flex-row max-w-full">
      <div className="flex flex-row md:flex-col col-span-2 justify-evenly md:justify-between font-bold text-sm md:text-2xl">
        <SimpleCard>
          <div className="w-full md:w-auto">
            <p className="text-chart-0">Strategy</p>
            <p>{last?.vaultDiff.toFixed(2)}%</p>
          </div>
        </SimpleCard>
        <SimpleCard>
          <div className="w-full md:w-auto">
            <p className="text-chart-2">{tokenASymbol}</p>
            <p>{last?.aPriceDiff.toFixed(2)}%</p>
          </div>
        </SimpleCard>
        <SimpleCard>
          <div className="w-full md:w-auto">
            <p className="text-chart-3">{tokenBSymbol}</p>
            <p>{last?.bPriceDiff.toFixed(2)}%</p>
          </div>
        </SimpleCard>
      </div>
      <div className=" col-span-5">
        <SimpleCard>
          <p className=" font-khand text-text-placeholder text-2xl font-semibold">
            Performance
          </p>
          {loading ? (
            <Spinner className="w-36 h-36 mx-auto my-20" />
          ) : (
            <ResponsiveContainer
              width={chartWidth < 750 ? chartWidth - 75 : chartWidth - 240}
              height={"100%"}
              maxHeight={500}
            >
              <>
                <ComposedChart
                  onMouseEnter={areaChartProps?.onMouseEnter}
                  onMouseLeave={areaChartProps?.onMouseLeave}
                  width={chartWidth < 750 ? chartWidth - 75 : chartWidth - 240}
                  height={300}
                  data={data}
                  margin={{ top: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    tick={{ stroke: "var(--text)", fontSize: 12 }}
                    type="number"
                    tickCount={6}
                    domain={["dataMin", "dataMax"]}
                    dataKey="createdAt"
                    tickFormatter={(v) => formatDate(v)}
                  />

                  <YAxis
                    yAxisId="left"
                    tick={{ stroke: "var(--text)", fontSize: 12 }}
                    tickFormatter={(v) => `${v} %`}
                  />
                  <Tooltip
                    content={
                      <ReturnsToolip
                        vault={showVaultPerformance}
                        tokenA={showTokenAHodl}
                        tokenB={showTokenBHodl}
                        split={showSplitHodl}
                      />
                    }
                  />
                  {showVaultPerformance && (
                    <Line
                      dataKey={"vaultDiff"}
                      yAxisId="left"
                      stroke="var(--chart-0)"
                      strokeWidth={3}
                      dot={<></>}
                    />
                  )}
                  {showTokenAHodl && (
                    <Line
                      dataKey={"aPriceDiff"}
                      yAxisId="left"
                      stroke="var(--chart-2)"
                      strokeWidth={3}
                      dot={<></>}
                    />
                  )}
                  {showTokenBHodl && (
                    <Line
                      dataKey={"bPriceDiff"}
                      yAxisId="left"
                      stroke="var(--chart-3)"
                      strokeWidth={3}
                      dot={<></>}
                    />
                  )}
                  {showSplitHodl && (
                    <Line
                      dataKey={"splitPriceDiff"}
                      yAxisId="left"
                      stroke="var(--chart-1)"
                      strokeWidth={3}
                      dot={<></>}
                    />
                  )}
                </ComposedChart>
                <div className="flex flex-row justify-evenly">
                  <Checkbox
                    value={showVaultPerformance}
                    label={`Vault`}
                    labelColor="chart-0"
                    onChange={() => setShowVaultPerformance((m) => !m)}
                  />
                  <Checkbox
                    value={showSplitHodl}
                    label={`Split`}
                    labelColor="chart-1"
                    onChange={() => setShowSplitHodl((m) => !m)}
                  />

                  <Checkbox
                    value={showTokenAHodl}
                    label={`${tokenASymbol}`}
                    labelColor="chart-2"
                    onChange={() => setShowTokenAHodl((m) => !m)}
                  />
                  <Checkbox
                    value={showTokenBHodl}
                    label={`${tokenBSymbol}`}
                    labelColor="chart-3"
                    onChange={() => setShowTokenBHodl((m) => !m)}
                  />
                </div>
              </>
            </ResponsiveContainer>
          )}
        </SimpleCard>
      </div>
    </div>
  );
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReturnsToolip: any = ({
  active,
  payload,
  vault,
  tokenA,
  tokenB,
  split,
}: {
  active: boolean;
  payload: [{ payload: PerformanceDatapoint }];
  tokenA: boolean;
  tokenB: boolean;
  split: boolean;
  vault: boolean;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background-panel rounded-md px-2 py-3">
        <div key={data.payload.createdAt} className="mt-2">
          <p className="font-normal">
            Date: {formatDate(data.payload.createdAt, true)}
          </p>
          <p className="font-normal">
            Time: {format(data.payload.createdAt, `HH:mm OOO`)}
          </p>
          {vault && (
            <p className="font-semibold text-sm text-chart-0">
              Vault: {data?.payload?.vaultDiff.toFixed(3)}%
            </p>
          )}
          {tokenA && (
            <p className="font-semibold text-sm text-chart-2">
              {tokenASymbol}: {data?.payload?.aPriceDiff.toFixed(3)}%
            </p>
          )}
          {tokenB && (
            <p className="font-semibold text-sm text-chart-3">
              {tokenBSymbol}: {data?.payload?.bPriceDiff.toFixed(3)}%
            </p>
          )}
          {split && (
            <p className="font-semibold text-sm text-chart-1">
              {tokenASymbol}+{tokenBSymbol}:{" "}
              {data?.payload?.splitPriceDiff.toFixed(3)}%
            </p>
          )}
        </div>
      </div>
    );
  }
  return <></>;
};
