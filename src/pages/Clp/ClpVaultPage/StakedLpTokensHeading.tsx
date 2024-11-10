import * as anchor from "@coral-xyz/anchor";
import { useRecoilValue } from "recoil";
import { clpVaultAtomFamily } from "../../../state";
import { CLP_VAULT_TOKEN_DECIMALS } from "../../../utils/constants";
import { formatAmount } from "../../../utils/formatters";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";

export const StakedLpTokensHeading = () => {
  const { t } = useTranslation();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));

  if (!clpVault || clpVault.stakePool.equals(anchor.web3.PublicKey.default)) {
    return null;
  }
  return (
    <div>
      <p className="text-sm font-semibold text-text-placeholder">
        {t("Staked LP Tokens")}
      </p>
      <p className="text-base md:text-xl font-khand text-primary">
        {formatAmount("0", CLP_VAULT_TOKEN_DECIMALS)}
      </p>
    </div>
  );
};
