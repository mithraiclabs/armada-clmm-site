import { useTranslation } from "react-i18next";
import { ReactComponent as DiscordIcon } from "../assets/discord-icon.svg";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <div className="flex bg-background-panel px-4 md:px-12 lg:px-24 mt-4 py-4 text-text">
      <div className="flex-1 flex text-sm font-semibold space-x-5">
        <Link target="_blank" to="https://docs.armadafi.so">
          {t("Docs")}
        </Link>
        <Link target="_blank" to="https://blog.armadafi.so">
          {t("Blog")}
        </Link>
        <Link
          className="text-text-placeholder"
          target="_blank"
          to="/terms-of-use.pdf"
        >
          {t("Terms of Use")}
        </Link>
        <Link
          className="text-text-placeholder"
          target="_blank"
          to="/privacy-policy.pdf"
        >
          {t("Privacy Policy")}
        </Link>
      </div>
      <p className="text-text-placeholder mx-2 text-[8px] top-1 relative items-center">
        Some price data from
        <a
          className="cursor-pointer mx-1"
          target="_blank"
          href="https://www.coingecko.com/"
        >
          Coingecko API
        </a>
      </p>
      <a href="https://discord.gg/TSBBdfZMhq" target="_blank">
        <DiscordIcon height={20} width={20} />
      </a>
    </div>
  );
};
