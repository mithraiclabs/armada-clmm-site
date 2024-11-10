import { SimpleCard } from "../common/SimpleCard";
import { useRecoilValue } from "recoil";
import { U32_MAX, clpVaultAtomFamily } from "../../state";
import { ReactComponent as PlusIcon } from "../../assets/icons/plus.svg";
import { ReactComponent as CrossIcon } from "../../assets/icons/cross.svg";
import { useState } from "react";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";
import { Decimal } from "../../utils/decimal";
import { InfoTooltip } from "../common";

export const FeeBreakdown = () => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));

  const [expanded, setExpanded] = useState(false);
  if (!vault) return null;

  return (
    <SimpleCard className="mx-0 ">
      <div
        onClick={() => setExpanded((e) => !e)}
        className={`flex flex-row justify-between items-center`}
        style={{ cursor: "pointer" }}
      >
        <p className="font-semibold text-xl">Fees</p>
        {expanded ? <CrossIcon /> : <PlusIcon />}
      </div>
      {expanded && (
        <div className="flex flex-col mt-2 space-y-2">
          <div className="flex flex-row justify-between items-center">
            <InfoTooltip
              title={t("Deposit Fee")}
              tooltipContent={
                <div>
                  <p>{t("Fee taken when depoisting your position")}</p>
                </div>
              }
            >
              <p className=" text-text-placeholder border-b-[1px] border-dashed border-text-placeholder font-semibold  ">
                {t("Deposit Fee")}
              </p>
            </InfoTooltip>
            <p className="font-medium">0.00%</p>
          </div>
          <div className="flex flex-row justify-between items-center">
            <InfoTooltip
              title={t("Withdrawal Fee")}
              tooltipContent={
                <div>
                  <p>{t("Fee taken when withdrawing your position")}</p>
                </div>
              }
            >
              <p className=" text-text-placeholder border-b-[1px] border-dashed border-text-placeholder font-semibold  ">
                {t("Withdrawal Fee")}
              </p>
            </InfoTooltip>
            <p className="font-medium">
              {u32PercentToDecimalPercent(vault.withdrawalFee)}%
            </p>
          </div>
          <div className="flex flex-row justify-between items-center">
            <InfoTooltip
              title={t("Performance Fee")}
              tooltipContent={
                <div>
                  <p>{t("Fee taken based on the vault profits")}</p>
                </div>
              }
            >
              <p className=" text-text-placeholder border-b-[1px] border-dashed border-text-placeholder font-semibold  ">
                {t("Performance Fee")}
              </p>
            </InfoTooltip>
            <p className="font-medium">
              {u32PercentToDecimalPercent(vault.performanceFee)}%
            </p>
          </div>
        </div>
      )}
    </SimpleCard>
  );
};

const u32PercentToDecimalPercent = (num: number) => {
  return new Decimal(num).div(U32_MAX).mul(100).toFixed(2);
};
