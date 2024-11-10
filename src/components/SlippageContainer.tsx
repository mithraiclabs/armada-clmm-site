import { Button } from "./Button";
import { TextButton } from "./Button/TextButton";
import { ReactComponent as CloseIcon } from "../assets/icons/close.svg";
import { useEffect, useRef } from "react";
import { Checkbox } from "./common/Checkbox";
import { useTranslation } from "react-i18next";
import { useRecoilState } from "recoil";
import { customSlippageAtomFamily } from "../state";
import { NumberInput } from "./common";

export const SlippageContainer = ({
  onClose,
  onUpdate,
  value,
  vaultId,
  purchase,
}: {
  onClose: () => void;
  onUpdate: (text: string) => void;
  value: string;
  vaultId: string;
  purchase?: boolean;
}) => {
  const { t } = useTranslation();
  const mountRef = useRef(false);
  const [custom, setCustom] = useRecoilState(customSlippageAtomFamily(vaultId));

  useEffect(() => {
    if (!mountRef.current) {
      // prevent overriding value when component mounts
      mountRef.current = true;
      return;
    }
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full justify-between items-center text-text my-4">
        <p className="text-2xl font-semibold font-khand">
          {purchase ? t("Slippage") : t("Price Tolerance")}
        </p>
        <TextButton onClick={onClose}>
          <CloseIcon />
        </TextButton>
      </div>
      <div className="flex flex-col w-full">
        <p className="text-text-placholder text-sm">
          {purchase
            ? t(
                "Changing slippage to a custom value could result in failed transactions."
              )
            : t(
                `Price tolerance sets a threshold for acceptable price shifts during transactions in a CLMM vault.
                 If the price of either token changes beyond this percentage, 
                 the transaction will be halted to prevent unintended outcomes.
                  This ensures that deposits or withdrawals reflect market conditions at the time of execution,
                   protecting against excessive deviations from expected asset distributions.`
              )}
        </p>
        <div className="flex items-center my-4 flex-row justify-between align-middle">
          <Checkbox
            value={!custom}
            onChange={() => setCustom((p) => !p)}
            label={t("Auto")}
          />
          <div className="w-1" />
          <div className="flex items-center relative">
            <NumberInput
              onChange={(value) => {
                setCustom(true);
                onUpdate(value);
              }}
              placeholder={t("Slippage")}
              value={value}
              className=" max-w-[150px] "
            />
            <div className="flex bottom-0 top-0 right-0 absolute items-center mr-4 text-text-placeholder">
              %
            </div>
          </div>
        </div>
        <Button onClick={onClose} variant="outline">
          {t("Confirm")}
        </Button>
      </div>
    </div>
  );
};
