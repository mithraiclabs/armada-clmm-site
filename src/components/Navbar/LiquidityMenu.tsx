import { useTranslation } from "react-i18next";
import { FloatingMenu, FloatingMenuLink } from "./FloatingMenu";
import { useNormalizedPath } from "../../hooks/useNormalizedPath";

export const LiquidityMenu = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const normalizePath = useNormalizedPath();

  return (
    <FloatingMenu className="md:p-1 md:min-w-[250px]" text={t("Liquidity")}>
      <FloatingMenuLink
        active={normalizePath.startsWith("/clmm")}
        onClick={onClose}
        to="/clmm"
      >
        {t("Managed Vaults")}
      </FloatingMenuLink>
      <FloatingMenuLink
        target="_blank"
        onClick={onClose}
        to="https://docs.armadafi.so/on-chain-liquidity/liquidity-bonds"
      >
        <div className="flex flex-col">
          {t("Liquidity Bonds")}
          <p className="text-sm text-text-placeholder text-right">
            Coming Soon!
          </p>
        </div>
      </FloatingMenuLink>
      <FloatingMenuLink
        active={normalizePath === "/clp"}
        onClick={onClose}
        to="/clp"
      >
        {t("Liquidity Pools")}
      </FloatingMenuLink>
    </FloatingMenu>
  );
};
