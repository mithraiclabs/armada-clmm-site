import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  selectClpVaultUserBalance,
  selectClpVaultUserUsdBalance,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { usdFormatter } from "../../../utils/constants";
import { InfoTooltip } from "../../../components/common/InfoTooltip";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";

export const YourPositionHeading = () => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [vaultUserBalanceA, vaultUserBalanceB] = useRecoilValue(
    selectClpVaultUserBalance(clpKey)
  );
  const vaultBalancesInUsd = useRecoilValue(
    selectClpVaultUserUsdBalance(clpKey)
  );
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);
  const symbolTokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const symbolTokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const formattedAmountA = amountFormatterTokenA(vaultUserBalanceA);
  const formattedAmountB = amountFormatterTokenB(vaultUserBalanceB);

  return (
    <InfoTooltip
      title={t("Position Breakdown")}
      tooltipContent={
        <div>
          <p>
            {formattedAmountA} {symbolTokenA}
          </p>
          <p>
            {formattedAmountB} {symbolTokenB}
          </p>
        </div>
      }
    >
      <div>
        <p className="text-sm font-semibold text-text-placeholder">
          {t("Your Position")}
        </p>
        <div className="text-base md:text-xl font-khand text-text">
          {vaultBalancesInUsd ? (
            usdFormatter.format(vaultBalancesInUsd.toNumber())
          ) : vaultUserBalanceA && vaultUserBalanceB ? (
            <div className="flex flex-row">
              <p>
                {formattedAmountA} {symbolTokenA}
              </p>
              <div className="w-2" />
              <p>
                {formattedAmountB} {symbolTokenB}
              </p>
            </div>
          ) : (
            0
          )}
        </div>
      </div>
    </InfoTooltip>
  );
};
