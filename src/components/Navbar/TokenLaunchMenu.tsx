import { useTranslation } from "react-i18next";
import { FloatingMenu, FloatingMenuLink } from "./FloatingMenu";
import { useNormalizedPath } from "../../hooks/useNormalizedPath";

export const TokenLaunchMenu = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const normalizePath = useNormalizedPath();
  const active = normalizePath.startsWith("/lbc/create");

  return (
    <FloatingMenu className="md:p-1 md:min-w-[200px]" text={t("Token Launch")}>
      <FloatingMenuLink active={active} onClick={onClose} to="/lbp/create">
        {t("New LBP")}
      </FloatingMenuLink>
      <FloatingMenuLink
        active={normalizePath.startsWith("/airdrop/create")}
        onClick={onClose}
        to="/airdrop/create"
      >
        {t("New Airdrop")}
      </FloatingMenuLink>
    </FloatingMenu>
  );
};
