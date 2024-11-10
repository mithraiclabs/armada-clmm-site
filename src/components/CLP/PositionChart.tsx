import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  AreaProps,
} from "recharts";
import React, { ReactElement, useMemo } from "react";
import { NormalizedPositionData } from "../../state";

/*
 * Chart data takes the form:
 * {
 *   price: number
 *   '0x123': number
 *   '0xabc': number
 *   metadata: {
 *     '0x123': NormalizedPositionData
 *     '0xabc': NormalizedPositionData
 *   }
 * }
 */

const xTickFormatter = (price: number) => {
  return price.toLocaleString(undefined, {
    maximumFractionDigits: price < 0.0001 ? 8 : price < 1 ? 4 : 2,
  });
};

export const PositionChart = ({
  children,
  currentPrice,
  positions,
  monoColor,
  areaProps = {},
  areaChartProps = {},
}: {
  areaChartProps?: { onMouseEnter?: () => void; onMouseLeave?: () => void };
  areaProps?: Omit<AreaProps, "ref" | "dataKey">;
  children?: React.ReactNode;
  currentPrice?: number;
  positions: NormalizedPositionData[];
  monoColor?: boolean;
  tokenASymbol?: string;
  tokenBSymbol?: string;
  tokenSelect?: boolean;
}) => {
  const data = useMemo(() => {
    let prices = positions.reduce((acc, p) => {
      if (!acc.includes(p.lowerPrice)) acc.push(p.lowerPrice);
      if (!acc.includes(p.upperPrice)) acc.push(p.upperPrice);
      return acc;
    }, [] as number[]);
    prices = (currentPrice ? prices.concat([currentPrice]) : prices).sort(
      (a, b) => a - b
    );
    return prices.map((price) => {
      const pos = { metadata: {} } as Record<string, unknown>;
      for (const position of positions) {
        if (price >= position.lowerPrice && price <= position.upperPrice) {
          pos[position.pubkey] = position.liquidity;
          pos.metadata = {
            ...((pos.metadata as Record<string, unknown>) || {}),
            [position.pubkey]: position,
          };
        }
      }
      return {
        price,
        ...pos,
      };
    });
  }, [currentPrice, positions]);

  const pricePoints = useMemo(() => data.map((item) => item.price), [data]);
  const minPrice = useMemo(() => Math.min(...pricePoints), [pricePoints]);
  const maxPrice = useMemo(() => Math.max(...pricePoints), [pricePoints]);
  const gap = useMemo(() => (maxPrice - minPrice) * 0.08, [maxPrice, minPrice]);
  return (
    <>
      <ResponsiveContainer maxHeight={600}>
        <AreaChart
          data={data}
          {...areaChartProps}
          margin={{ top: 20, left: 14 }}
        >
          <XAxis
            dataKey="price"
            interval="preserveStartEnd"
            tickFormatter={xTickFormatter}
            type="number"
            domain={[Math.max(minPrice - gap, 0), maxPrice + gap]}
          />
          {positions.map((p, index) => (
            <Area
              key={p.pubkey}
              dataKey={p.pubkey}
              type="stepBefore"
              stackId={1}
              strokeWidth={0}
              strokeOpacity={0}
              stroke={monoColor ? "var(--chart-0)" : `var(--chart-${index})`}
              fill={monoColor ? "var(--chart-0)" : `var(--chart-${index})`}
              {...areaProps}
            />
          ))}
          {children}
          {!!currentPrice && (
            <ReferenceLine
              label={CurrentPriceLabel}
              x={currentPrice}
              stroke="var(--text)"
              strokeWidth={2}
              opacity={0.3}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      {/* {tokenSelect && <Toggle onChange={
        (i) => setTokenToUse(i as 0 | 1)
      } selectedIndex={tokenToUse}>
        <div className="font-medium">{tokenASymbol}</div>
        <div className="font-medium">{tokenBSymbol}</div>
      </Toggle>} */}
    </>
  );
};

const MARKER_WIDTH = 5;
const CurrentPriceLabel = ({
  viewBox,
}: {
  viewBox: { x: number; y: number; width: number; height: number };
}): ReactElement<SVGElement> => {
  return (
    <circle
      fill="var(--text)"
      cx={viewBox.x}
      cy={viewBox.y + MARKER_WIDTH / 2}
      r={MARKER_WIDTH}
    />
  );
};
