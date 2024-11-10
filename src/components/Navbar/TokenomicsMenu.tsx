import { useTranslation } from "react-i18next";
import { FloatingMenu, FloatingMenuLink } from "./FloatingMenu";
import { useNormalizedPath } from "../../hooks/useNormalizedPath";

export const TokenomicsMenu = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const normalizePath = useNormalizedPath();

  return (
    <FloatingMenu className="md:p-1 md:min-w-[250px]" text={t("Tokenomics")}>
      {/* <FloatingMenuLink
        active={normalizePath.startsWith("/staking/v1/new")}
        onClick={onClose}
        to="/staking/v1/new"
      >
        {t("New StakePool")}
      </FloatingMenuLink> */}
      <FloatingMenuLink
        active={normalizePath.startsWith("/demux/new")}
        onClick={onClose}
        to="/demux/new"
      >
        {t("New DeMUX")}
      </FloatingMenuLink>
    </FloatingMenu>
  );
};
