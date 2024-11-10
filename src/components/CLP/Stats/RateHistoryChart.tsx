import {
  ResponsiveContainer,
  XAxis,
  CartesianGrid,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ComposedChart,
} from "recharts";
import React, { RefObject, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import {
  customTimeframeAtom,
  historyRangeTypeAtom,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { SimpleCard } from "../../common/SimpleCard";
import { Checkbox } from "../../common/Checkbox";
import { RangeType, formatDate } from ".";
import { sampleData } from "../../../utils/math";
import {
  FormattedFeeDatapoint,
  selectVaultRateHistory,
} from "../../../state/misc/selectors";
import { formatAmount } from "../../../utils/formatters";
import { Spinner } from "../../Spinner";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { getRange, getSampleInterval } from "../../../utils/stats";
import { useChartWidth } from "../../../hooks/Clp/Stats/useChartWidth";

export const RateHistoryChart = ({
  areaChartProps = {},
  containerRef,
}: {
  areaChartProps?: { onMouseEnter?: () => void; onMouseLeave?: () => void };
  containerRef: RefObject<HTMLDivElement>;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [merged, setMerged] = useState(true);
  const [loading, setLoading] = useState(true);
  const rangeType = useRecoilValue(historyRangeTypeAtom);
  const [data, setData] = useState<FormattedFeeDatapoint[]>([]);
  const history = useRecoilValue(selectVaultRateHistory(clpKey));
  const customRange = useRecoilValue(customTimeframeAtom);
  const chartWidth = useChartWidth(containerRef);

  useEffect(() => {
    const [from, to] =
      rangeType === RangeType.Custom
        ? customRange.map((t) => t * 1000)
        : getRange(rangeType);
    setData(
      sampleData(
        history.filter((d) => d.createdAt >= from && d.createdAt <= to),
        getSampleInterval(rangeType)
      )
    );
    if (history.length) setLoading(false);
  }, [customRange, history, rangeType]);

  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  return (
    <SimpleCard>
      <p className=" font-khand text-text-placeholder text-2xl font-semibold">
        Rate & Fees History
      </p>
      {loading ? (
        <Spinner className="w-36 h-36 mx-auto my-20" />
      ) : (
        <ResponsiveContainer
          width={chartWidth - 100}
          height={"100%"}
          maxHeight={500}
        >
          <div className="flex flex-col justify-center">
            <ComposedChart
              onMouseEnter={areaChartProps?.onMouseEnter}
              onMouseLeave={areaChartProps?.onMouseLeave}
              width={chartWidth - 50}
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
              {!merged && (
                <YAxis
                  yAxisId="left2"
                  tick={{ stroke: "var(--chart-3)", fontSize: 12 }}
                  tickFormatter={(v) =>
                    v !== 0 ? `${formatAmount(v)} ${tokenBSymbol}` : ""
                  }
                />
              )}
              <Bar
                dataKey="rate"
                yAxisId={"right"}
                stackId={merged ? "a" : "b"}
                fill="var(--chart-1)"
                opacity={0.5}
              />
              <YAxis
                yAxisId="left"
                dataKey={merged ? "totalInB" : "feesA"}
                tick={{ stroke: "var(--chart-0)", fontSize: 12 }}
                tickFormatter={(v) =>
                  v !== 0
                    ? `${formatAmount(v)} ${
                        merged ? tokenBSymbol : tokenASymbol
                      }`
                    : ""
                }
              />
              <YAxis
                yAxisId="right"
                dataKey={"rate"}
                orientation="right"
                tick={{ stroke: "var(--chart-1)", fontSize: 12 }}
                tickFormatter={(v) => (v !== 0 ? `${v} %` : "")}
              />
              <Tooltip content={<HistoryToolip merged={merged} />} />
              <Line
                dataKey={merged ? "totalInB" : "feesA"}
                yAxisId="left"
                stroke="var(--chart-0)"
                strokeWidth={5}
                dot={false}
              />
              {!merged && (
                <Line
                  dataKey={"feesB"}
                  yAxisId="left2"
                  stroke="var(--chart-3)"
                  strokeWidth={5}
                  dot={false}
                />
              )}
            </ComposedChart>
            <div className="flex justify-center mt-2">
              <Checkbox
                value={merged}
                onChange={() => setMerged((m) => !m)}
                label={`Fees in terms of ${tokenBSymbol}`}
              />
            </div>
          </div>
        </ResponsiveContainer>
      )}
    </SimpleCard>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistoryToolip = ({ active, payload, merged }: any) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background-panel rounded-md px-2 py-3">
        <div key={data?.name} className="mt-2">
          <p className="font-semibold">
            Date: {formatDate(data.payload.createdAt, true)}
          </p>
          {merged ? (
            <span className="font-semibold text-sm text-text">
              <span className="text-chart-0 ">
                {tokenASymbol} + {tokenBSymbol} fees:{" "}
              </span>
              <br />
              <span>
                {data?.payload?.totalInB.toFixed(6)} {tokenBSymbol}
              </span>
            </span>
          ) : (
            <>
              <span className="font-semibold text-sm text-chart-0">
                {tokenASymbol} fees: {data?.payload?.feesA}
              </span>
              <br />
              <span className="font-semibold text-sm text-chart-3">
                {tokenBSymbol} fees: {data?.payload?.feesB}
              </span>
            </>
          )}
          <br />
          <p className="font-semibold text-sm text-chart-1">
            Rate: {data?.payload?.rate.toFixed(4)} %
          </p>
        </div>
      </div>
    );
  }
  return null;
};
