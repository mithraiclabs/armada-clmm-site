import {
  ResponsiveContainer,
  XAxis,
  BarChart,
  CartesianGrid,
  YAxis,
  Tooltip,
  Bar,
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
  FormattedTVLDatapoint,
  selectVaultTVLHistory,
} from "../../../state/misc/selectors";
import { formatAmount } from "../../../utils/formatters";
import { Spinner } from "../../Spinner";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { getRange, getSampleInterval } from "../../../utils/stats";
import { useChartWidth } from "../../../hooks/Clp/Stats/useChartWidth";

export const TvlHistoryChart = ({
  areaChartProps = {},
  containerRef,
}: {
  areaChartProps?: { onMouseEnter?: () => void; onMouseLeave?: () => void };
  containerRef: RefObject<HTMLDivElement>;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FormattedTVLDatapoint[]>([]);
  const tvlHistory = useRecoilValue(selectVaultTVLHistory(clpKey));
  const rangeType = useRecoilValue(historyRangeTypeAtom);
  const customRange = useRecoilValue(customTimeframeAtom);
  const chartWidth = useChartWidth(containerRef);
  const [merged, setMerged] = useState(true);
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));

  useEffect(() => {
    const [from, to] =
      rangeType === RangeType.Custom
        ? customRange.map((t) => t * 1000)
        : getRange(rangeType);
    setData(
      sampleData(
        tvlHistory.filter((d) => d.createdAt >= from && d.createdAt <= to),
        getSampleInterval(rangeType)
      )
    );
    if (tvlHistory.length) setLoading(false);
  }, [tvlHistory, rangeType, customRange]);

  return (
    <SimpleCard>
      <p className=" font-khand text-text-placeholder text-2xl font-semibold">
        TVL History
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
            <BarChart
              onMouseEnter={areaChartProps?.onMouseEnter}
              onMouseLeave={areaChartProps?.onMouseLeave}
              width={chartWidth - 100}
              height={300}
              data={data}
              margin={{ top: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                tick={{ stroke: "var(--text)", fontSize: 12 }}
                type="number"
                domain={["dataMin", "dataMax"]}
                tickCount={6}
                dataKey="createdAt"
                tickFormatter={(v) => formatDate(v)}
              />
              <YAxis
                yAxisId="left"
                tick={{
                  stroke: merged ? "var(--text)" : "var(--chart-0)",
                  fontSize: 12,
                }}
                tickFormatter={(v) =>
                  v !== 0
                    ? `${formatAmount(v)} ${
                        merged ? tokenBSymbol : tokenASymbol
                      }`
                    : ""
                }
              />
              {!merged && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ stroke: "var(--chart-1)", fontSize: 12 }}
                  tickFormatter={(v) =>
                    v !== 0 ? `${formatAmount(v)} ${tokenBSymbol}` : ""
                  }
                />
              )}
              <Tooltip content={<HistoryToolip />} />
              <Bar
                dataKey={merged ? "totalAinB" : "totalA"}
                yAxisId="left"
                stackId={"a"}
                fill="var(--chart-0)"
              />
              <Bar
                dataKey="totalB"
                yAxisId={merged ? "left" : "right"}
                stackId={merged ? "a" : "b"}
                fill="var(--chart-1)"
              />
            </BarChart>
            <div className="flex justify-center mt-2">
              <Checkbox
                value={merged}
                onChange={() => setMerged((m) => !m)}
                label={`TVL in terms of ${tokenBSymbol}`}
              />
            </div>
          </div>
        </ResponsiveContainer>
      )}
    </SimpleCard>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HistoryToolip = ({ active, payload }: any) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background-panel rounded-md px-2 py-3">
        <div key={data?.name} className="mt-2">
          <p className="font-normal">
            Date: {formatDate(data.payload.createdAt, true)}
          </p>
          <p className="font-semibold text-sm text-chart-0">
            {tokenASymbol}: {data?.payload?.totalA}
          </p>
          <p className="font-semibold text-sm text-chart-1">
            {tokenBSymbol}: {data?.payload?.totalB}
          </p>
        </div>
      </div>
    );
  }
  return null;
};
