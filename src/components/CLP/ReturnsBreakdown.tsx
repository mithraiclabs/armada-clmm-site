import { useRecoilValue } from "recoil";
import { SimpleCard } from "../common/SimpleCard";
import {
  annualizeRatesAtom,
  selectClpDailyFeesYield,
  selectClpDailyRates,
} from "../../state";
import { InfoTooltip } from "../common/InfoTooltip";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { Trans, useTranslation } from "react-i18next";


export const RateBreakdown = () => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const ratesAnnualized = useRecoilValue(annualizeRatesAtom);
  const dailyRate = useRecoilValue(selectClpDailyFeesYield(clpKey));
  const pool = useRecoilValue(selectClpDailyRates(clpKey));

  return (
    <SimpleCard className="max-w-full mx-0">
      <p className="font-khand text-2xl text-text-placeholder font-semibold mb-2">
        {ratesAnnualized ? (
          <Trans>
            24HR Rate
            <span className="text-lg"> (annualized)</span>
          </Trans>
        ) : (
          t("24HR Rate")
        )}
      </p>
      <div className="flex flex-row justify-between space-x-6">
        <InfoTooltip
          title={t("Total Rate")}
          tooltipContent={
            <div>
              <p>{t("Pool Daily Rate + Vault Rewards Daily Rate")}</p>
            </div>
          }
        >
          <BreakdownElement
            title={t("Total Rate")}
            value={`${dailyRate?.mul(100)?.toFixed(2) ?? "0.00"}%`}
          />
        </InfoTooltip>
        <InfoTooltip
          title={t("Pool Rate")}
          tooltipContent={
            <div>
              <p>
                {t(
                  "Realized Daily Rate from earning trading fees and any associated underlying pool rewards"
                )}
              </p>
            </div>
          }
        >
          <BreakdownElement
            title={t("Pool Rate")}
            value={`${pool?.mul(100)?.toFixed(2) ?? "0.00"}%`}
          />
        </InfoTooltip>
        <InfoTooltip
          title={t("Rewards Rate")}
          tooltipContent={"n/a"}
        >
          <BreakdownElement
            title={t("Rewards")}
            value={"0.00%"}
          />
        </InfoTooltip>
      </div>
    </SimpleCard>
  );
};

export const BreakdownElement = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <div>
      <p className="text-sm md:text-xs text-text-placeholder border-b-[1px] border-dashed border-text-placeholder mb-2 w-fit">
        {title}
      </p>
      <p className="text-lg md:text-xl font-khand text-text font-semibold w-fit">
        {value}
      </p>
    </div>
  );
};
