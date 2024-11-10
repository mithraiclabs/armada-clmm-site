import { NavBar } from "./Navbar";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import * as Fathom from "fathom-client";
import { confettiAtom } from "../state";
import { CustomConfetti } from "./common/CustomConfetti";
import { Footer } from "./Footer";
import { TransactionToastWindow } from "./Toaster";
import { useIsProhibitedJurisdiction } from "../hooks/useIsProhibitedJurisdiction";
import { ProhibitedJurisdictionBanner } from "./ProhibitedJurisdictionBanner";

export const PageLayout = ({ children }: { children?: React.ReactNode }) => {
  const isProhibitedJurisdiction = useIsProhibitedJurisdiction();
  const isExploding = useRecoilValue(confettiAtom);
  /* Track pageviews wherever PageLayout is used */
  const location = useLocation();
  const isProhibitedRoute =
    location.pathname === "/" ||
    location.pathname.startsWith("/clmm") ||
    location.pathname.startsWith("/clp") ||
    location.pathname.startsWith("/orca") ||
    location.pathname.startsWith("/swapper");
  useEffect(() => {
    if (import.meta.env.VITE_ARMADA_DEPLOY === "true") {
      // defaults to `window.location`, so don't need it explicitly set.
      Fathom.trackPageview();
    }
  }, [location.pathname]);

  return (
    <div className="flex-1 flex flex-col">
      <NavBar />
      {import.meta.env.VITE_ARMADA_DEPLOY === "true" &&
        isProhibitedRoute &&
        isProhibitedJurisdiction && <ProhibitedJurisdictionBanner />}
      <div className="flex-1 flex flex-col">
        {children ? children : <Outlet />}
      </div>
      {isExploding ? <CustomConfetti /> : null}
      <TransactionToastWindow />
      {import.meta.env.VITE_ARMADA_DEPLOY === "true" && <Footer />}
    </div>
  );
};
