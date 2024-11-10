import { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { slippageAtomFamily, customSlippageAtomFamily } from "../../state";

export const useSlippage = (clpKey: string) => {
  const setSlippage = useSetRecoilState(slippageAtomFamily(clpKey));
  const usingCustomSlippage = useRecoilValue(customSlippageAtomFamily(clpKey));
  useEffect(() => {
    if (!usingCustomSlippage && clpKey) {
      setSlippage(OVERRIDE_VAULT_SLIPPAGE[clpKey] ?? DEFAULT_SLIPPAGE);
    }
  }, [setSlippage, usingCustomSlippage, clpKey]);
};

export const OVERRIDE_VAULT_SLIPPAGE = {
  Beaq19pNYdCTvFTyrCvf5PZkux1j6X452GewqxMMjspK: "1.2", //JUP vault
} as { [vaultid: string]: string };
export const DEFAULT_SLIPPAGE = "0.5";
