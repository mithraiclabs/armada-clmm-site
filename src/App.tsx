import React, { useEffect } from "react";
import { RecoilRoot } from "recoil";
import * as Fathom from "fathom-client";
import "./App.css";
import "./locale/i18n";
import { Routes } from "./Routes";
import { WalletConnectionProvider } from "./contexts/WalletConnectionProvider";
import { NetworkProvider } from "./contexts/NetworkProvider";
import { DisclaimerModal } from "./components/DisclaimerModal";
import { ToastProvider } from "./contexts/ToastContext";

function App() {
  useEffect(() => {
    if (
      import.meta.env.VITE_ARMADA_DEPLOY === "true" &&
      !import.meta.env.DEV &&
      import.meta.env.VITE_FATHOM_SITE_ID
    ) {
      Fathom.load(import.meta.env.VITE_FATHOM_SITE_ID);
    }
  }, []);

  return (
    <RecoilRoot>
      <ToastProvider>
        <NetworkProvider>
          <WalletConnectionProvider>
            <Routes />
          </WalletConnectionProvider>
        </NetworkProvider>
        {import.meta.env.VITE_ARMADA_DEPLOY === "true" && <DisclaimerModal />}
      </ToastProvider>
    </RecoilRoot>
  );
}

export default App;
