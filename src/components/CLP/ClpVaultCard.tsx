import { useState } from "react";
import { PointsEligibleVaults, usdFormatter } from "../../utils/constants";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import {
  annualizeRatesAtom,
  clpVaultAtomFamily,
  selectClp24HrFees,
  selectClp24HrVolume,
  selectClpDailyFeesYield,
  selectClpVaultUserBalance,
  selectIsVaultDeprecated,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectVaultMaxTvl,
  selectVaultTvl,
} from "../../state";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { ClpVaultSymbols } from "./ClpVaultSymbols";
import { ClpVaultLogos } from "./ClpVaultLogos";
import { VaultCapacity } from "./VaultCapacity";
import { Trans, useTranslation } from "react-i18next";
import { PointsVaultTooltip } from "./ClpVaultRow";

export const ClpVaultCard = ({ vaultId }: { vaultId: string }) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(vaultId));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(vaultId));
  const tvl = useRecoilValue(selectVaultTvl(vaultId));
  const maxTvl = useRecoilValue(selectVaultMaxTvl(vaultId));
  const dailyRate = useRecoilValue(selectClpDailyFeesYield(vaultId));
  const totalDayFees = useRecoilValue(selectClp24HrFees(vaultId));
  const totalDayVolume = useRecoilValue(selectClp24HrVolume(vaultId));
  const ratesAnnualized = useRecoilValue(annualizeRatesAtom);
  const [vaultUserBalanceA, vaultUserBalanceB] = useRecoilValue(
    selectClpVaultUserBalance(vaultId)
  );
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);
  const isDeprecated = useRecoilValue(selectIsVaultDeprecated(vaultId));

  if (!vault) {
    return null;
  }

  const points = PointsEligibleVaults[vaultId];
  return (
    <div className="flex min-w-full cursor-pointer">
      <div
        className={`border-[0.5px] flex-1 flex flex-col border-background-panelStroke
          rounded-2xl ${hovered ? "highlight-green" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          navigate("/clmm/" + vaultId);
        }}
      >
        <div className=" bg-background-panel rounded-2xl p-4 relative">
          {/* Token Pair and logos */}
          <div className="flex flex-row justify-between">
            <div className="flex flex-row items-center space-x-2">
              <p className="text-text text-2xl font-semibold font-khand uppercase pt-1">
                <ClpVaultSymbols clpKey={vaultId} />
              </p>
              {points && <PointsVaultTooltip />}
            </div>
            <div className="flex flex-row align-middle items-center">
              <ClpVaultLogos clpKey={vaultId} noFilter />
            </div>
          </div>
          <div>
            {isDeprecated && (
              <p className="ml-2 text-sm text-text-warning">deprecated</p>
            )}
          </div>
          {/* Daily rate */}
          <div className="flex flex-row justify-between mt-2">
            <div>
              <p className="text-sm font-montserrat font-semibold">
                {ratesAnnualized ? (
                  <Trans>
                    24HR Rate
                    <span className="text-text-placeholder"> (annualized)</span>
                  </Trans>
                ) : (
                  t("24HR Rate")
                )}
              </p>
              <p className="text-primary text-5xl font-semibold font-khand">
                {dailyRate?.gt(0) ? dailyRate.mul(100).toFixed(2) : "-"}%
              </p>
              {/* <p
                className={`text-sm font-montserrat font-semibold ${
                  dailyRewardsRate.gt(0) ? "" : "text-transparent"
                }`}
              >
                {dailyRewardsRate.gt(0)
                  ? dailyRewardsRate?.mul(100)?.toFixed(2) + "%"
                  : "-"}
              </p> */}
            </div>
            <VaultCapacity
              capacity={maxTvl.toNumber()}
              deposited={tvl?.toNumber() ?? 0}
            />
          </div>
          {/* TVL fees and vol */}
          <div className="font-montserrat font-medium my-3">
            <div className="flex flex-row justify-between">
              <p className=" text-text-placeholder">{t("TVL")}</p>
              <p className="">
                {tvl ? usdFormatter.format(tvl.toNumber()) : "-"}
              </p>
            </div>
            <div className="flex flex-row justify-between">
              <p className=" text-text-placeholder">{t("24HR Fees")}</p>
              <p className="">
                {totalDayFees
                  ? usdFormatter.format(totalDayFees.toNumber())
                  : "-"}
              </p>
            </div>
            <div className="flex flex-row justify-between">
              <p className=" text-text-placeholder">{t("24HR Volume")}</p>
              <p className="">
                {totalDayVolume
                  ? usdFormatter.format(totalDayVolume.toNumber())
                  : "-"}
              </p>
            </div>
          </div>
          {/* Your position footer */}
          <div className="flex flex-row items-center justify-between d">
            <p className="font-semibold ">{t("Your Position")}:&nbsp;</p>
            <div
              className={`${hovered ? "text-primary" : "text-text-placeholder"}
               align-middle flex flex-row justify-between gap-2 ${
                 Number(vaultUserBalanceA) || Number(vaultUserBalanceB)
                   ? "font-semibold"
                   : "font-thin"
               }`}
            >
              <p>
                {amountFormatterTokenA(vaultUserBalanceA)} {tokenSymbolA}
              </p>
              <p>
                {amountFormatterTokenB(vaultUserBalanceB)} {tokenSymbolB}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
