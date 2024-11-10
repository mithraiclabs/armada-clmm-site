import { useState } from "react";
import { Helmet } from "react-helmet";
import { WalletButton } from "../Button/WalletButton";
import { NetworkMenu } from "../NetworkMenu";
import { Button } from "../Button";
import { Drawer } from "../common/Drawer";
import { BACKUP_LOGO_URL } from "../../state";
import { PortalProvider } from "../Portal";
import { LiquidityMenu } from "./LiquidityMenu";
import { TokenomicsMenu } from "./TokenomicsMenu";
import { ReactComponent as ArmadaLogo } from "../../assets/armada_logo.svg";
import { useNavigate } from "react-router";
// import { LanguageSelector } from "./LanguageSelector";

const logoUrl = import.meta.env.VITE_LOGO_PATH
  ? new URL(`../../assets/${import.meta.env.VITE_LOGO_PATH}`, import.meta.url)
      .href
  : BACKUP_LOGO_URL;
const isArmada = import.meta.env.VITE_ARMADA_DEPLOY === "true";

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        {!isArmada && <link rel="icon" type="image/svg+xml" href={logoUrl} />}
        <title>{import.meta.env.VITE_NAME}</title>
      </Helmet>
      <div className="flex flex-row justify-between items-center pt-4 mx-4 md:mx-12 lg:mx-24">
        <div className="flex flex-row items-center gap-7 text-text">
          {isArmada ? (
            <ArmadaLogo
              className=" cursor-pointer"
              onClick={() => navigate("/clmm")}
              width="100"
            />
          ) : (
            <img src={logoUrl} width="35" height="35" />
          )}
          <div className={`flex-row items-center hidden md:flex text-center`}>
            <MenuLinks onClose={() => setIsMenuOpen(false)} />
          </div>
        </div>
        <div className="md:hidden">
          <Drawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
            <MenuLinks onClose={() => setIsMenuOpen(false)} />
          </Drawer>
        </div>

        <div className="flex flex-row items-center">
          <PortalProvider portalId="spinner" />
          <div className="hidden md:flex flex-row">
            <WalletButton variant="outline" />
            <NetworkMenu />
            {/* <LanguageSelector /> */}
          </div>
          <div className="md:hidden">
            <Button variant="simple" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export const MenuLinks = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="flex-col md:flex-row flex md:space-x-4">
      {import.meta.env.VITE_ARMADA_DEPLOY === "true" && (
        <>
          <LiquidityMenu onClose={onClose} />
          <div className="border-text-placeholder border-r-[2px]" />
          <TokenomicsMenu onClose={onClose} />
          <hr className="border-text-placeholder opacity-50 mb-4 mt-4" />
        </>
      )}
      <div className="md:hidden">
        <WalletButton variant="outline" />
        <NetworkMenu simple />
      </div>
    </div>
  );
};
