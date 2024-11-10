import { TextButton } from "../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { NumberInput } from "../../components/common/Input";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePoolClosestAllowedPrice } from "../../hooks/Clp/usePoolClosestAllowedPrice";
import { useRecoilValue } from "recoil";
import {
  associatedTokenAccountAtomFamily,
  selectWhirlpoolCurrentPrice,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  splMintAtomFamily,
  whirlpoolAtomFamily,
} from "../../state";
import { usePoolTokenPercentagesFromTicks } from "../../hooks/Clp/usePoolTokenPercentagesFromTicks";
import { Button } from "../../components/Button";
import { toast } from "react-hot-toast";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { useWhirlpoolActions } from "../../hooks/Whirlpool/useWhirlpoolActions";
import { useSaveTxToHistory } from "../../hooks/utils/useSaveTxToHistory";
import { TxType } from "../../utils/types";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { TickPriceIncrementer } from "../../components/common/TickPriceIncrementer";
import _ from "lodash";
import { SimpleModal } from "../../components/common";
import { WalletIcon } from "@heroicons/react/20/solid";
import { Decimal } from "../../utils/decimal";

export const WhirlpoolNewPositionDialog = ({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) => {
  const initializedPriceRangeRef = useRef(false);
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const getDepositPercentages = usePoolTokenPercentagesFromTicks(key);
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const amountFormatterTokenB = useMintAmountFormatter(
    whirlpool?.tokenMintB.toString() ?? ""
  );
  const { saveTx } = useSaveTxToHistory();
  const tokenASymbol = useRecoilValue(selectWhirlpoolTokenASymbol(key));
  const tokenBSymbol = useRecoilValue(selectWhirlpoolTokenBSymbol(key));
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [liquidity, setLiquidity] = useState("");
  const [usingA, setUsingA] = useState(true);
  const [estimatedA, setEstimatedA] = useState(0);
  const [estimatedB, setEstimatedB] = useState(0);
  const [loading, setLoading] = useState(false);
  const getPoolAllowedPrice = usePoolClosestAllowedPrice(key);
  const currentPrice = useRecoilValue(
    selectWhirlpoolCurrentPrice(key)
  )?.toNumber();
  const depositPercentages = getDepositPercentages(minPrice, maxPrice);
  const changeToken = () => setUsingA((p) => !p);
  const mintA = whirlpool?.tokenMintA.toString() ?? "";
  const mintB = whirlpool?.tokenMintB.toString() ?? "";
  const tokenMintA = useRecoilValue(splMintAtomFamily(mintA));
  const tokenMintB = useRecoilValue(splMintAtomFamily(mintB));
  const tokenAccountA = useRecoilValue(associatedTokenAccountAtomFamily(mintA));
  const tokenAccountB = useRecoilValue(associatedTokenAccountAtomFamily(mintB));
  const { openPosition, getQuote } = useWhirlpoolActions(key);
  const onOpenPosition = useCallback(async () => {
    try {
      setLoading(true);
      const signatures = await openPosition(
        minPrice,
        maxPrice.toString(),
        usingA,
        liquidity
      );
      saveTx({
        message: "Succcessfully opened a new position",
        action: `Position open on pool ${key.slice(0, 8)}...`,
        signatures: signatures.map((signature, i) => ({
          signature,
          type:
            signatures.length > 1 && i === 0
              ? TxType.accountsOpen
              : TxType.clmmPositionOpen,
        })),
      });
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    key,
    liquidity,
    maxPrice,
    minPrice,
    onClose,
    openPosition,
    saveTx,
    usingA,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedGetQuote = useCallback(
    _.debounce(
      (
        minPrice: string,
        maxPrice: string,
        usingA: boolean,
        liquidity: string
      ) => {
        const { estA, estB } = getQuote(minPrice, maxPrice, usingA, liquidity);
        setEstimatedA(estA.toNumber());
        setEstimatedB(estB.toNumber());
        setLoading(false);
      },
      400
    ),
    [getQuote]
  );

  const onMinBlur = useCallback(() => {
    if (Number(minPrice)) {
      setMinPrice((prevMin) => {
        const [allowedPrice] = Number(prevMin)
          ? getPoolAllowedPrice(prevMin) || []
          : [];
        if (allowedPrice) {
          return allowedPrice.toString();
        }
        return "0";
      });
    }
  }, [getPoolAllowedPrice, minPrice]);

  const onMaxBlur = useCallback(() => {
    if (Number(maxPrice)) {
      setMaxPrice((prevMax) => {
        const [allowedPrice] = getPoolAllowedPrice(prevMax) || [];
        if (allowedPrice) {
          return allowedPrice.toString();
        }
        return "0";
      });
    }
  }, [getPoolAllowedPrice, maxPrice]);

  useEffect(() => {
    // set default min to price - 10% and max to price + 10%
    if (initializedPriceRangeRef.current) {
      // no need to re-init the default prices
      return;
    }
    if (!minPrice && currentPrice) {
      const [allowedPrice] = getPoolAllowedPrice(currentPrice * 0.9) || [];
      setMinPrice(allowedPrice?.toString() ?? "");
      initializedPriceRangeRef.current = true;
    }
    if (!maxPrice && currentPrice && maxPrice.toString() !== "0") {
      const [allowedPrice] = getPoolAllowedPrice(currentPrice * 1.1) || [];
      setMaxPrice(allowedPrice?.toString() ?? "0");
    }
  }, [currentPrice, getPoolAllowedPrice, maxPrice, minPrice]);

  useEffect(() => {
    return () => {
      // reset `initializedPriceRangeRef` only on unmount.
      initializedPriceRangeRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (whirlpool && !!liquidity && Number(maxPrice)) {
      setLoading(true);
      debouncedGetQuote(minPrice, maxPrice.toString(), usingA, liquidity);
    }
    return () => {
      debouncedGetQuote.cancel();
    };
  }, [
    debouncedGetQuote,
    getQuote,
    liquidity,
    maxPrice,
    minPrice,
    usingA,
    whirlpool,
  ]);

  const balanceA = new Decimal(tokenAccountA?.amount.toString() ?? 0).div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAccountB?.amount.toString() ?? 0).div(
    10 ** (tokenMintB?.decimals ?? 0)
  );

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
        <div className="col-span-5 flex-row flex">
          <p>Min</p>
          <TickPriceIncrementer
            value={minPrice}
            setValue={setMinPrice}
            whirlpoolKey={key}
            range={{ min: "0", max: maxPrice.toString() }}
          />
        </div>
        <div className="col-span-1" />
        <div className="col-span-5 flex-row flex">
          <p>Max</p>
          <TickPriceIncrementer
            value={maxPrice.toString()}
            setValue={setMaxPrice}
            whirlpoolKey={key}
            range={{ min: minPrice, max: Infinity.toString() }}
          />
        </div>
        <div className="col-span-5">
          <NumberInput
            onBlur={onMinBlur}
            value={minPrice}
            onChange={setMinPrice}
            max={Number(maxPrice ?? "0")}
            hideMax
          />
        </div>
        <div className="col-span-1 flex items-center justify-center">-</div>
        <div className="col-span-5">
          <NumberInput
            onBlur={onMaxBlur}
            onChange={setMaxPrice}
            value={maxPrice.toString()}
          />
        </div>
      </div>
      <div className="grid grid-cols-11">
        <div className="col-span-5">
          <p>{usingA ? tokenASymbol : tokenBSymbol} Amount</p>
          <p className="mt-2 flex items-center  font-bold">
            <span className="mr-1">
              <WalletIcon className="h-5 w-5" />
            </span>
            {usingA ? tokenASymbol : tokenBSymbol} Balance:
          </p>
          {usingA ? balanceA.toString() : balanceB.toString()}
        </div>

        <div className="col-span-6" />

        <div className="col-span-5">
          <NumberInput
            onChange={setLiquidity}
            value={liquidity}
            max={usingA ? balanceA.toNumber() : balanceB.toNumber()}
          />
        </div>
        <div className="col-span-1 flex items-center justify-center" />
        <div className="col-span-5">
          <Button variant="outline" onClick={changeToken}>
            Estimate using {!usingA ? tokenASymbol : tokenBSymbol}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-11">
        <div className="col-span-5">
          <p>{tokenASymbol}</p>
        </div>
        <div className="col-span-1" />
        <div className="col-span-5">
          <p>{tokenBSymbol}</p>
        </div>
        <div className="col-span-5">{estimatedA}</div>
        <div className="col-span-1 flex items-center justify-center"></div>
        <div className="col-span-5">{estimatedB}</div>
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
