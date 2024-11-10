import { SimpleCard } from "../common/SimpleCard";
import { PositionChart } from "./PositionChart";
import {
  clpVaultAtomFamily,
  selectClpCurrentPrice,
  selectClpVaultPositionDataList,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../state";
import { useRecoilValue } from "recoil";
import { useMemo, useState } from "react";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";

const areaProps = {
  activeDot: false,
};
export const PositionRange = ({ auction }: { auction?: boolean }) => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const positions = useRecoilValue(selectClpVaultPositionDataList(clpKey));
  const currentPrice = useRecoilValue(
    selectClpCurrentPrice(clpKey)
  )?.toNumber();
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const amountFormatterTokenB = useMintAmountFormatter(
    vault?.tokenMintB.toString() ?? ""
  );
  const [showCurrPrice, setShowCurrPrice] = useState(false);
  const areaChartProps = useMemo(
    () => ({
      onMouseEnter: () => setShowCurrPrice(true),
      onMouseLeave: () => setShowCurrPrice(false),
    }),
    []
  );

  return (
    <SimpleCard className="mx-0">
      <div className="flex flex-col max-w-[840px]">
        <p className="text-2xl font-khand text-text-placeholder font-semibold">
          {auction ? "Auction Liquidity" : "Vault Positions"}
        </p>
        {auction ? (
          <p className="text-sm font-semibold text-text">
            {t(
              "The chart represents how much of the new token will be sold at each price. The project's market maker may adjust the available liquidity based on demand at any time."
            )}
          </p>
        ) : (
          <p className="text-sm font-semibold text-text">
            {t(
              "The chart is a representation of how the market maker is deploying capital into the vault. The area of the chart is the total liquidity deployed."
            )}
          </p>
        )}
      </div>
      <div className="w-[100%] h-[300px] flex relative">
        {positions.length &&
        positions.find((p) => p.liquidityA > 0 || p.liquidityB > 0) ? (
          <div className="absolute bottom-0 top-0 left-0 right-0">
            <PositionChart
              currentPrice={currentPrice}
              positions={positions}
              areaChartProps={areaChartProps}
              areaProps={areaProps}
              monoColor
              tokenASymbol={tokenASymbol}
              tokenBSymbol={tokenBSymbol}
            />
            {!!(showCurrPrice && currentPrice) && (
              <VaultPositionsToolTip
                currentPrice={amountFormatterTokenB(currentPrice)}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-text-placeholder">{t("No active positions")}</p>
          </div>
        )}
      </div>
    </SimpleCard>
  );
};

const VaultPositionsToolTip = ({ currentPrice }: { currentPrice: string }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-background-container rounded-md px-2 py-3 text-text absolute left-[52%] top-0 pointer-events-none border-dashed border-2 border-background-lime">
      <p className="text-sm text-text-placeholder font-semibold">
        {t("Current Price")}
      </p>
      <p className="text-xl font-khand">{currentPrice}</p>
    </div>
  );
};
