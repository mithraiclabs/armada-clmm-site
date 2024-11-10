import { useEffect, useState } from "react";
import { SimpleModal } from "../common";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deBridge: any;
  }
}

export const Debridge = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (
      !document.querySelector(
        'script[src="https://app.debridge.finance/assets/scripts/widget.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://app.debridge.finance/assets/scripts/widget.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && isOpen) {
      initializeWidget();
    }
  }, [scriptLoaded, isOpen]);

  const initializeWidget = () => {
    if (window.deBridge) {
      window.deBridge.widget({
        v: "1",
        element: "debridgeWidget",
        title: "Bridge to Solana",
        description: "Bridge assets from other chains",
        width: "500",
        height: "650",
        r: null,
        supportedChains:
          '{"inputChains":{"1":"all","10":"all","56":"all","137":"all","8453":"all","42161":"all","43114":"all","59144":"all","7565164":"all","245022934":"all"},"outputChains":{"1":"all","10":"all","56":"all","137":"all","8453":"all","42161":"all","43114":"all","59144":"all","7565164":"all","245022934":"all"}}',
        inputChain: 56,
        outputChain: 7565164,
        inputCurrency: "",
        outputCurrency: "",
        address: "",
        showSwapTransfer: true,
        amount: "",
        outputAmount: "",
        isAmountFromNotModifiable: false,
        isAmountToNotModifiable: false,
        lang: "en",
        mode: "deswap",
        isEnableCalldata: false,
        styles:
          "eyJhcHBCYWNrZ3JvdW5kIjoiI2ZmZmZmZiIsImFwcEFjY2VudEJnIjoiI2ZmZmZmZiIsImJhZGdlIjoiIzA5OWNjYSIsImJvcmRlclJhZGl1cyI6OCwicHJpbWFyeSI6IiMwOTljY2EiLCJmb250RmFtaWx5IjoiIiwicHJpbWFyeUJ0bkJnIjoiIzA5OWNjYSIsInByaW1hcnlCdG5UZXh0IjoiI2ZmZmZmZiIsInNlY29uZGFyeUJ0bkJnIjoiIzA5OWNjYSIsImxpZ2h0QnRuQmciOiIifQ",
        theme: "light",
        isHideLogo: true,
        logo: "",
      });
    }
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-background-panel min-w-[370px] p-3 rounded-lg space-y-2">
        <div id="debridgeWidget" />
      </div>
    </SimpleModal>
  );
};
