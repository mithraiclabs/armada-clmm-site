import { useRecoilValue } from "recoil";
import {
  associatedTokenAccountAtomFamily,
  selectTickIndexToPrice,
  selectUiInvertWhirlpool,
  splMintAtomFamily,
  tokenMetadataFamily,
  whirlpoolAtomFamily,
  whirlpoolPositionAtomFamily,
} from "../../state";
import { ReactComponent as WalletIcon } from "../../assets/icons/wallet.svg";
import { TextButton } from "../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { NumberInput } from "../../components/common/Input";
import { useCallback, useState } from "react";
import { Button } from "../../components/Button";
import { toast } from "react-hot-toast";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { useSaveTxToHistory } from "../../hooks/utils/useSaveTxToHistory";
import { TxType } from "../../utils/types";
import { useWhirlpoolActions } from "../../hooks/Whirlpool/useWhirlpoolActions";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { SimpleModal } from "../../components/common/SimpleModal";
import { Decimal } from "../../utils/decimal";

export const WhirlpoolChangeLiquidityDialog = ({
  onClose,
  open,
  positionKey,
  increment,
}: {
  onClose: () => void;
  open: boolean;
  positionKey: string;
  increment: boolean;
}) => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const mintA = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const mintB = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
  );
  const positionData = useRecoilValue(whirlpoolPositionAtomFamily(positionKey));
  const getTickPrice = useRecoilValue(selectTickIndexToPrice(key));
  const invertedTokens = useRecoilValue(selectUiInvertWhirlpool(key));
  const amountFormatterTokenA = useMintAmountFormatter(
    whirlpool?.tokenMintA.toString() ?? ""
  );
  const amountFormatterTokenB = useMintAmountFormatter(
    whirlpool?.tokenMintB.toString() ?? ""
  );
  const quoteFormatter = invertedTokens
    ? amountFormatterTokenB
    : amountFormatterTokenA;

  return (
    <SimpleModal isOpen={open} onClose={onClose}>
      <div className="w-full flex justify-between items-center">
        <p className="text-xl font-khand text-text-placeholder">
          {increment ? "Increase" : "Decrease"} Liquidity
        </p>
        <TextButton className="mb-2 p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>
      {!mintA || !mintB || !positionData ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col">
          <div className="flex justify-between">
            <p>
              Lower Price:{" "}
              {quoteFormatter(
                getTickPrice(
                  invertedTokens
                    ? positionData.tickUpperIndex
                    : positionData.tickLowerIndex,
                  false
                ).toString()
              )}
            </p>
            <div className="w-4" />
            <p>
              Upper Price:{" "}
              {quoteFormatter(
                getTickPrice(
                  !invertedTokens
                    ? positionData.tickUpperIndex
                    : positionData.tickLowerIndex,
                  false
                ).toString()
              )}
            </p>
          </div>
          {increment ? (
            <IncreaseLiq onClose={onClose} positionKey={positionKey} />
          ) : (
            <DecreaseLiq onClose={onClose} positionKey={positionKey} />
          )}
        </div>
      )}
    </SimpleModal>
  );
};

const IncreaseLiq = ({
  positionKey,
  onClose,
}: {
  positionKey: string;
  onClose: () => void;
}) => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const mintA = whirlpool?.tokenMintA.toString() ?? "";
  const mintB = whirlpool?.tokenMintB.toString() ?? "";
  const tokenMintA = useRecoilValue(splMintAtomFamily(mintA));
  const tokenMintB = useRecoilValue(splMintAtomFamily(mintB));
  const [slippagePercentage, setSlippagePercentage] = useState(0.1);
  const { saveTx } = useSaveTxToHistory();
  const { increaseLiquidity, getIncreasePositionQuote } =
    useWhirlpoolActions(key);
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  const symbolTokenA = tokenA?.symbol;
  const symbolTokenB = tokenB?.symbol;
  const tokenAccountA = useRecoilValue(associatedTokenAccountAtomFamily(mintA));
  const tokenAccountB = useRecoilValue(associatedTokenAccountAtomFamily(mintB));
  const [loading, setLoading] = useState(false);
  const [amountTokenA, setAmountTokenA] = useState("");
  const [amountTokenB, setAmountTokenB] = useState("");
  const [usingA, setUsingA] = useState(true);
  const inputTokenAmount = usingA ? amountTokenA : amountTokenB;

  const onIncreaseLiquidity = useCallback(async () => {
    setLoading(true);
    try {
      const signature = await increaseLiquidity(
        positionKey,
        usingA,
        inputTokenAmount,
        slippagePercentage
      );
      saveTx({
        message: "Successfully increased liquidity for a position",
        action: `Liquidity increased for a position on ${key.slice(
          0,
          8
        )}... vault`,
        signatures: [
          {
            type: TxType.clmmIncreaseLiq,
            signature,
          },
        ],
      });
      onClose();
    } catch (err) {
      console.log(err);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    increaseLiquidity,
    inputTokenAmount,
    key,
    onClose,
    positionKey,
    slippagePercentage,
    saveTx,
    usingA,
  ]);

  const balanceA = new Decimal(tokenAccountA?.amount.toString() ?? 0).div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAccountB?.amount.toString() ?? 0).div(
    10 ** (tokenMintB?.decimals ?? 0)
  );

  const { estA, estB, maxA, maxB } = getIncreasePositionQuote(
    positionKey,
    usingA,
    inputTokenAmount
  );

  return (
    <div className="flex flex-col mt-4">
      <label className="mb-1">
        Allowed Slippage: {slippagePercentage.toFixed(2)}%
      </label>
      <input
        type="range"
        min={0}
        max={20}
        onChange={(e) => setSlippagePercentage(parseFloat(e.target.value))}
        value={slippagePercentage}
        step={0.01}
        className="w-full h-1 mb-6 rounded-lg appearance-none outline-none cursor-pointer range-sm accent-primary"
      />
      <div className="flex justify-between">
        <div className="flex-1">
          <p className="mt-2 flex items-center  font-bold">
            <span className="mr-1">
              <WalletIcon className="h-5 w-5" />
            </span>
            {symbolTokenA} Balance:
          </p>
          {balanceA.toString()}
          <NumberInput
            onChange={(val: string) => {
              setUsingA(true);
              setAmountTokenA(val);
            }}
            value={usingA ? amountTokenA : estA.toString()}
          />
        </div>
        <div className="w-4" />
        <div className="flex-1">
          <p className="mt-2 flex items-center  font-bold">
            <span className="mr-1">
              <WalletIcon className="h-5 w-5" />
            </span>
            {symbolTokenB} Balance:
          </p>
          {balanceB.toString()}
          <NumberInput
            onChange={(val: string) => {
              setUsingA(false);
              setAmountTokenB(val);
            }}
            value={!usingA ? amountTokenB : estB.toString()}
          />
        </div>
      </div>
      <div className="mt-2">
        <div className="grid grid-cols-12 mt-1">
          <div className="col-span-4 font-bold">Token</div>
          <div className="col-span-4 font-bold">Maximum</div>
          <div className="col-span-4 font-bold">Estimate</div>
          <div className="col-span-4">{symbolTokenA}</div>
          <div className="col-span-4">{maxA.toString()}</div>
          <div className="col-span-4">{estA.toString()}</div>
          <div className="col-span-4">{symbolTokenB}</div>
          <div className="col-span-4">{maxB.toString()}</div>
          <div className="col-span-4">{estB.toString()}</div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          className="px-8"
          loading={loading}
          onClick={onIncreaseLiquidity}
          variant="outline"
        >
          Add
        </Button>
      </div>
    </div>
  );
};

const DecreaseLiq = ({
  positionKey,
  onClose,
}: {
  positionKey: string;
  onClose: () => void;
}) => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const mintA = whirlpool?.tokenMintA.toString() ?? "";
  const mintB = whirlpool?.tokenMintB.toString() ?? "";
  const { saveTx } = useSaveTxToHistory();
  const { decreaseLiquidity, getDecreasePositionQuote } =
    useWhirlpoolActions(key);
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  const symbolTokenA = tokenA?.symbol;
  const symbolTokenB = tokenB?.symbol;

  const [loading, setLoading] = useState(false);
  const [decreasePercentage, setDecreasePercentage] = useState(50);
  const [slippagePercentage, setSlippagePercentage] = useState(0.1);
  const onDecreaseLiquidity = useCallback(async () => {
    setLoading(true);
    try {
      const signature = await decreaseLiquidity(
        positionKey,
        decreasePercentage,
        slippagePercentage
      );
      saveTx({
        message: "Successfully decreased liquidity for a position",
        action: `Liquidity decreased for a position on ${key.slice(
          0,
          8
        )}... vault`,
        signatures: [
          {
            type: TxType.clmmDecreaseLiq,
            signature,
          },
        ],
      });
      onClose();
    } catch (err) {
      console.log({ err });
    } finally {
      setLoading(false);
    }
  }, [
    decreaseLiquidity,
    decreasePercentage,
    key,
    onClose,
    positionKey,
    slippagePercentage,
    saveTx,
  ]);

  const { estA, estB, minA, minB } = getDecreasePositionQuote(
    positionKey,
    decreasePercentage,
    slippagePercentage
  );

  return (
    <div className="flex flex-col mt-4">
      <label className="mb-1">
        Allowed Slippage: {slippagePercentage.toFixed(2)}%
      </label>
      <input
        type="range"
        min={0}
        max={20}
        onChange={(e) => setSlippagePercentage(parseFloat(e.target.value))}
        value={slippagePercentage}
        step={0.01}
        className="w-full h-1 mb-6 rounded-lg appearance-none outline-none cursor-pointer range-sm accent-primary"
      />
      <label className="mb-1">
        Decrease by {decreasePercentage.toFixed(2)}%
      </label>
      <input
        type="range"
        min={0}
        max={100}
        onChange={(e) => setDecreasePercentage(parseFloat(e.target.value))}
        value={decreasePercentage}
        step={0.01}
        className="w-full h-1 mb-6 rounded-lg appearance-none outline-none cursor-pointer range-sm accent-primary"
      />
      <div className="mt-2">
        <div className="grid grid-cols-12 mt-1">
          <div className="col-span-4 font-bold">Token</div>
          <div className="col-span-4 font-bold">Minimum</div>
          <div className="col-span-4 font-bold">Estimate</div>
          <div className="col-span-4">{symbolTokenA}</div>
          <div className="col-span-4">{minA.toString()}</div>
          <div className="col-span-4">{estA.toString()}</div>
          <div className="col-span-4">{symbolTokenB}</div>
          <div className="col-span-4">{minB.toString()}</div>
          <div className="col-span-4">{estB.toString()}</div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button
          className="px-8"
          loading={loading}
          onClick={onDecreaseLiquidity}
          variant="outline"
        >
          Decrease
        </Button>
      </div>
    </div>
  );
};
