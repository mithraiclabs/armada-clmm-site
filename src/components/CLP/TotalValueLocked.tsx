import { SimpleCard } from "../common/SimpleCard";
import { useRecoilValue } from "recoil";
import {
  selectClpTotalTokenUiAmounts,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectVaultMaxTvl,
  selectVaultTvl,
  selectVaultTvlTokenA,
  selectVaultTvlTokenB,
} from "../../state";
import { usdFormatter } from "../../utils/constants";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { useMemo } from "react";
import { formatPercent } from "../../utils/formatters";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";

export const TotalValueLocked = () => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tvl = useRecoilValue(selectVaultTvl(clpKey));
  const maxTvl = useRecoilValue(selectVaultMaxTvl(clpKey));
  const tokenAmounts = useRecoilValue(selectClpTotalTokenUiAmounts(clpKey));
  const tvlTokenA = useRecoilValue(selectVaultTvlTokenA(clpKey));
  const tvlTokenB = useRecoilValue(selectVaultTvlTokenB(clpKey));
  const symbolTokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const symbolTokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const data = useMemo(() => {
    const usdA = tvlTokenA?.toNumber() ?? 0;
    const usdB = tvlTokenB?.toNumber() ?? 0;
    const total = tvl?.toNumber() ?? 0;
    return [
      {
        name: symbolTokenA,
        value: usdA,
        ratio: usdA / total,
        amount: tokenAmounts?.tokenA.toNumber() ?? 0,
      },
      {
        name: symbolTokenB,
        value: usdB,
        ratio: usdB / total,
        amount: tokenAmounts?.tokenB.toNumber() ?? 0,
      },
    ];
  }, [
    symbolTokenA,
    symbolTokenB,
    tokenAmounts?.tokenA,
    tokenAmounts?.tokenB,
    tvl,
    tvlTokenA,
    tvlTokenB,
  ]);

  if (!tvl) {
    return null;
  }

  return (
    <SimpleCard className="mx-0">
      <div className="flex lg:flex-row flex-col">
        <div>
          <p className="text-2xl font-khand text-text-placeholder font-semibold">
            {t("Total Value Locked")}
          </p>
          <div className="bg-background-panelSurface p-4 rounded-md flex justify-end items-center">
            <p className="text-lg md:text-2xl lg:text-lg xl:text-xl 2xl:text-3xl font-semibold font-khand text-end">
              {usdFormatter.format(tvl.toNumber())} <br />
              <span className="text-text-placeholder text-sm">
                / {usdFormatter.format(maxTvl.toNumber())}
              </span>
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center 2xl:flex-row">
          <PieChart width={100} height={100}>
            <defs>
              <pattern
                id="diagonalHatch"
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <path
                  d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                  stroke="var(--primary)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <Pie
              data={data}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={540}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? "url(#diagonalHatch)" : "var(--primary)"}
                />
              ))}
            </Pie>
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              content={PieToolTip}
              position={{ x: 100, y: -30 }}
            />
          </PieChart>
          <div>
            <div className="flex flex-row items-center">
              <div className="h-2 w-2 rounded-full">
                <svg height="100%" width="100%" viewBox="0 0 8 8">
                  <defs>
                    <pattern
                      id="diagonalHatch"
                      patternUnits="userSpaceOnUse"
                      width="2"
                      height="2"
                    >
                      <path
                        d="M-0.5,0.5 l1,-1 M0,2 l2,-2 M1.5,2.5 l1,-1"
                        stroke="var(--primary)"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <circle fill="url(#diagonalHatch)" r={4} cx={4} cy={4} />
                </svg>
              </div>
              <p className="ml-2 text-sm font-semibold">{symbolTokenA}</p>
            </div>
            <div className="flex flex-row items-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="ml-2 text-sm font-semibold">{symbolTokenB}</p>
            </div>
          </div>
        </div>
      </div>
    </SimpleCard>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieToolTip = ({ active, payload }: any) => {
  const { t } = useTranslation();
  if (!active || !payload || !payload.length) {
    return null;
  }
  const { name, payload: data } = payload[0];

  return (
    <div className="bg-background-container rounded-md px-2 py-3 text-text min-w-[150px]">
      <p className="text-sm text-text-placeholder font-semibold">
        {t("Amount ({{name}})", { name })}
      </p>
      <p className="text-xl font-khand">{data?.amount}</p>
      <p className="text-sm text-text-placeholder font-semibold">
        {t("Vault Ratio")}
      </p>
      <p className="text-xl font-khand">
        {formatPercent((data?.ratio ?? 0) * 100)}%
      </p>
    </div>
  );
};
