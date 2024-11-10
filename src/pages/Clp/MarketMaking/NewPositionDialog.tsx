import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { NumberInput } from "../../../components/common/Input";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePoolClosestAllowedPrice } from "../../../hooks/Clp/usePoolClosestAllowedPrice";
import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  selectClpCurrentPrice,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { usePoolTokenPercentagesFromTicks } from "../../../hooks/Clp/usePoolTokenPercentagesFromTicks";
import { useClpOpenPosition } from "../../../hooks/Clp/useClpOpenPosition";
import { Button } from "../../../components/Button";
import toast from "react-hot-toast";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { TickPriceIncrementer } from "../../../components/common/TickPriceIncrementer";
import _ from "lodash";
import { SimpleModal } from "../../../components/common";

// TODO show when tick array is not initialized

// TODO handle price inversion for inputs
export const NewPositionDialog = ({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) => {
  const initializedPriceRangeRef = useRef(false);
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const currentPrice = useRecoilValue(
    selectClpCurrentPrice(clpKey)
  )?.toNumber();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const amountFormatterTokenB = useMintAmountFormatter(
    clpVault?.tokenMintB.toString() ?? ""
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const getClpAllowedPrice = usePoolClosestAllowedPrice(
    clpVault?.clp.toString() ?? ""
  );
  const getDepositPercentages = usePoolTokenPercentagesFromTicks(
    clpVault?.clp.toString() ?? ""
  );
  const depositPercentages = getDepositPercentages(minPrice, maxPrice);
  const openPosition = useClpOpenPosition(clpKey);

  const onOpenPosition = useCallback(async () => {
    try {
      setLoading(true);
      await openPosition(minPrice, maxPrice);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [maxPrice, minPrice, onClose, openPosition]);

  const onMinBlur = useCallback(() => {
    if (Number(minPrice)) {
      setMinPrice((prevMin) => {
        const [allowedPrice] = Number(prevMin)
          ? getClpAllowedPrice(prevMin) || []
          : [];
        if (allowedPrice) {
          return allowedPrice.toString();
        }
        return "0";
      });
    }
  }, [getClpAllowedPrice, minPrice]);

  const onMaxBlur = useCallback(() => {
    if (Number(maxPrice)) {
      setMaxPrice((prevMax) => {
        const [allowedPrice] = getClpAllowedPrice(prevMax) || [];
        if (allowedPrice) {
          return allowedPrice.toString();
        }
        return "0";
      });
    }
  }, [getClpAllowedPrice, maxPrice]);

  useEffect(() => {
    // set default min to price - 10% and max to price + 10%
    if (initializedPriceRangeRef.current) {
      // no need to re-init the default prices
      return;
    }
    if (!minPrice && currentPrice) {
      const [allowedPrice] = getClpAllowedPrice(currentPrice * 0.9) || [];
      setMinPrice(allowedPrice?.toString() ?? "");
      initializedPriceRangeRef.current = true;
    }
    if (!maxPrice && currentPrice) {
      const [allowedPrice] = getClpAllowedPrice(currentPrice * 1.1) || [];
      setMaxPrice(allowedPrice?.toString() ?? "");
    }
  }, [currentPrice, getClpAllowedPrice, maxPrice, minPrice]);

  useEffect(() => {
    return () => {
      // reset `initializedPriceRangeRef` only on unmount.
      initializedPriceRangeRef.current = false;
    };
  }, []);

  return (
    <SimpleModal isOpen={open} onClose={onClose}>
      <div className="w-full flex justify-between items-center">
        <p className="text-xl font-khand text-text-placeholder">New Position</p>
        <TextButton className="mb-2 p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>
      <div className="font-medium text-center">
        Current Price:{" "}
        <span className="font-semibold">
          {amountFormatterTokenB(currentPrice)}
        </span>
      </div>
      <div className="grid grid-cols-11">
        <div className="col-span-5 flex flex-row">
          <p>Min</p>
          <TickPriceIncrementer
            value={minPrice}
            setValue={setMinPrice}
            whirlpoolKey={clpVault?.clp.toString() ?? ""}
          />
        </div>
        <div className="col-span-1" />
        <div className="col-span-5 flex flex-row">
          <p>Max</p>
          <TickPriceIncrementer
            value={maxPrice}
            setValue={setMaxPrice}
            whirlpoolKey={clpVault?.clp.toString() ?? ""}
          />
        </div>
        <div className="col-span-5">
          <NumberInput
            onBlur={onMinBlur}
            value={minPrice}
            onChange={setMinPrice}
          />
        </div>
        <div className="col-span-1 flex items-center justify-center">-</div>
        <div className="col-span-5">
          <NumberInput
            onBlur={onMaxBlur}
            onChange={setMaxPrice}
            value={maxPrice}
          />
        </div>
      </div>
      <div className="my-2">
        Deposit Ratio: {depositPercentages[0].toFixed(2)}% {tokenASymbol} /{" "}
        {depositPercentages[1].toFixed(2)}% {tokenBSymbol}
      </div>
      <Button loading={loading} onClick={onOpenPosition}>
        Open Position
      </Button>
    </SimpleModal>
  );
};
