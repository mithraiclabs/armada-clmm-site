import { useRecoilState, useRecoilValue } from "recoil";
import {
  adjustAsPercentageAtom,
  clpVaultAtomFamily,
  selectGetUiTickIndexToPrice,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUiInvertTokenPair,
  splMintAtomFamily,
  splTokenAccountAtomFamily,
  whirlpoolAtomFamily,
  whirlpoolPositionAtomFamily,
} from "../../../state";
import { ReactComponent as WalletIcon } from "../../../assets/icons/wallet.svg";
import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { NumberInput } from "../../../components/common/Input";
import {
  useClpIncreaseLiquidity,
  useGetIncreaseLiquidityQuoteVals,
} from "../../../hooks/Clp/useClpIncreaseLiquidity";
import { useCallback, useMemo, useState } from "react";
import { Decimal } from "../../../utils/decimal";
import { Button } from "../../../components/Button";
import {
  useClpDecreaseLiquidity,
  useGetDecreaseLiquidityQuoteVals,
} from "../../../hooks/Clp/useClpDecreaseLiquidity";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { Checkbox } from "../../../components/common";
import { PoolUtil, PriceMath } from "@orca-so/whirlpools-sdk";
import BN from "bn.js";
import { slippageAsNumber } from "../../../state/misc/selectors";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useSaveTxToHistory } from "../../../hooks/utils/useSaveTxToHistory";
import { TxType } from "../../../utils/types";

export const ChangeLiquidityDialog = ({
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
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const mintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const positionData = useRecoilValue(whirlpoolPositionAtomFamily(positionKey));
  const getTickPrice = useRecoilValue(selectGetUiTickIndexToPrice(clpKey));
  const invertedTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const amountFormatterTokenA = useMintAmountFormatter(
    clpVault?.tokenMintA.toString() ?? ""
  );
  const amountFormatterTokenB = useMintAmountFormatter(
    clpVault?.tokenMintB.toString() ?? ""
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
      {!clpVault || !mintA || !mintB || !positionData ? (
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
                  true
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
                  true
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
  onClose: () => void;
  positionKey: string;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const increaseLiquidity = useClpIncreaseLiquidity(clpKey, positionKey);
  const [slippagePercentage, setSlippagePercentage] = useRecoilState(
    slippageAsNumber(clpKey)
  );
  const { saveTx } = useSaveTxToHistory();
  const symbolTokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const symbolTokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenAccountA = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultA.toString() ?? "")
  );
  const tokenAccountB = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultB.toString() ?? "")
  );
  const tokenMintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenMintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const [loading, setLoading] = useState(false);
  const [amountTokenA, setAmountTokenA] = useState("");
  const [amountTokenB, setAmountTokenB] = useState("");
  const [mint, setMint] = useState(tokenMintA?.address.toString() ?? "");
  const getIncreaseLiquidityQuoteVals = useGetIncreaseLiquidityQuoteVals(
    clpKey,
    positionKey
  );
  const inputTokenAmount =
    mint === tokenMintA?.address.toString() ? amountTokenA : amountTokenB;

  const onIncreaseLiquidity = useCallback(async () => {
    setLoading(true);
    try {
      const signature = await increaseLiquidity(
        slippagePercentage,
        inputTokenAmount,
        mint
      );
      if (signature)
        saveTx({
          message: "Successfully increased liquidity for a position",
          action: `Liquidity increased for a position on ${clpKey.slice(
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
    } finally {
      setLoading(false);
    }
  }, [
    clpKey,
    increaseLiquidity,
    inputTokenAmount,
    mint,
    onClose,
    slippagePercentage,
    saveTx,
  ]);

  const balanceA = new Decimal(tokenAccountA?.amount.toString() ?? 0).div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAccountB?.amount.toString() ?? 0).div(
    10 ** (tokenMintB?.decimals ?? 0)
  );
  const increaseLiquidityVals = getIncreaseLiquidityQuoteVals(
    slippagePercentage,
    inputTokenAmount,
    mint
  );
  const estTokenA = new Decimal(increaseLiquidityVals.tokenEstA.toString())
    .div(10 ** (tokenMintA?.decimals ?? 0))
    .toString();
  const maxTokenA = new Decimal(increaseLiquidityVals.tokenMaxA.toString())
    .div(10 ** (tokenMintA?.decimals ?? 0))
    .toString();
  const estTokenB = new Decimal(increaseLiquidityVals.tokenEstB.toString())
    .div(10 ** (tokenMintB?.decimals ?? 0))
    .toString();
  const maxTokenB = new Decimal(increaseLiquidityVals.tokenMaxB.toString())
    .div(10 ** (tokenMintB?.decimals ?? 0))
    .toString();

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
              setMint(tokenMintA?.address.toString() ?? "");
              setAmountTokenA(val);
            }}
            value={
              mint === tokenMintA?.address.toString() ? amountTokenA : estTokenA
            }
            max={balanceA.toNumber()}
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
              setMint(tokenMintB?.address.toString() ?? "");
              setAmountTokenB(val);
            }}
            value={
              mint === tokenMintB?.address.toString() ? amountTokenB : estTokenB
            }
            max={balanceB.toNumber()}
          />
        </div>
      </div>
      <div className="mt-2">
        <div className="grid grid-cols-12 mt-1">
          <div className="col-span-4 font-bold">Token</div>
          <div className="col-span-4 font-bold">Maximum</div>
          <div className="col-span-4 font-bold">Estimate</div>
          <div className="col-span-4">{symbolTokenA}</div>
          <div className="col-span-4">{maxTokenA}</div>
          <div className="col-span-4">{estTokenA}</div>
          <div className="col-span-4">{symbolTokenB}</div>
          <div className="col-span-4">{maxTokenB}</div>
          <div className="col-span-4">{estTokenB}</div>
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
  onClose,
  positionKey,
}: {
  onClose: () => void;
  positionKey: string;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const positionData = useRecoilValue(whirlpoolPositionAtomFamily(positionKey));
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const tokenMintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenMintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const { saveTx } = useSaveTxToHistory();
  const decreaseLiquidity = useClpDecreaseLiquidity(clpKey, positionKey);
  const [loading, setLoading] = useState(false);
  const [_decreasePercentage, setDecreasePercentage] = useState(50);
  const [slippagePercentage, setSlippagePercentage] = useRecoilState(
    slippageAsNumber(clpKey)
  );
  const [amountTokenA, setAmountTokenA] = useState("");
  const [amountTokenB, setAmountTokenB] = useState("");
  const [enablePercentage, setEnablePercentage] = useRecoilState(
    adjustAsPercentageAtom
  );
  const [mint, setMint] = useState(tokenMintA?.address.toString() ?? "");
  const symbolTokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const symbolTokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const tokenAmounts = useMemo(() => {
    if (!positionData || !whirlpool) {
      return {
        tokenA: new BN(0),
        tokenB: new BN(0),
      };
    }
    return PoolUtil.getTokenAmountsFromLiquidity(
      positionData.liquidity,
      whirlpool.sqrtPrice,
      PriceMath.tickIndexToSqrtPriceX64(positionData.tickLowerIndex),
      PriceMath.tickIndexToSqrtPriceX64(positionData.tickUpperIndex),
      true
    );
  }, [positionData, whirlpool]);
  const balanceA = new Decimal(tokenAmounts.tokenA.toString() || "0").div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAmounts.tokenB.toString() || "0").div(
    10 ** (tokenMintB?.decimals ?? 0)
  );
  const _percentage = useMemo(() => {
    if (enablePercentage) {
      return _decreasePercentage;
    }
    if (mint === tokenMintA?.address.toString()) {
      return new Decimal(amountTokenA || "0")
        .mul(10 ** tokenMintA.decimals)
        .div(tokenAmounts.tokenA.toString())
        .mul(100)
        .toNumber();
    }
    return new Decimal(amountTokenB || "0")
      .mul(10 ** (tokenMintB?.decimals ?? 0))
      .div(tokenAmounts.tokenB.toString())
      .mul(100)
      .toNumber();
  }, [
    amountTokenA,
    amountTokenB,
    _decreasePercentage,
    enablePercentage,
    mint,
    tokenAmounts.tokenA,
    tokenAmounts.tokenB,
    tokenMintA?.address,
    tokenMintA?.decimals,
    tokenMintB?.decimals,
  ]);
  const getDecreaseLiquidityQuoteVals = useGetDecreaseLiquidityQuoteVals(
    clpKey,
    positionKey
  );
  const onDecreaseLiquidity = useCallback(async () => {
    setLoading(true);
    try {
      const signature = await decreaseLiquidity(
        slippagePercentage,
        _percentage
      );
      saveTx({
        message: "Successfully decreased liquidity for a position",
        action: `Liquidity decreased for a position on ${clpKey.slice(
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    decreaseLiquidity,
    slippagePercentage,
    _percentage,
    saveTx,
    clpKey,
    onClose,
  ]);

  const decreaseLiquidityVals = getDecreaseLiquidityQuoteVals(
    slippagePercentage,
    _percentage
  );
  const estTokenA = new Decimal(decreaseLiquidityVals.tokenEstA.toString())
    .div(10 ** (tokenMintA?.decimals ?? 0))
    .toString();
  const minTokenA = new Decimal(decreaseLiquidityVals.tokenMinA.toString())
    .div(10 ** (tokenMintA?.decimals ?? 0))
    .toString();
  const estTokenB = new Decimal(decreaseLiquidityVals.tokenEstB.toString())
    .div(10 ** (tokenMintB?.decimals ?? 0))
    .toString();
  const minTokenB = new Decimal(decreaseLiquidityVals.tokenMinB.toString())
    .div(10 ** (tokenMintB?.decimals ?? 0))
    .toString();

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
      <div className="flex flex-row mb-1 justify-between">
        <label className="mr-4">
          Decrease{enablePercentage && ` by ${_percentage.toFixed(2)}%`}
        </label>
        <Checkbox
          label="Adjust as percentage"
          onChange={(val) => setEnablePercentage(val)}
          value={enablePercentage}
        />
      </div>
      {enablePercentage ? (
        <div className="my-2">
          <input
            type="range"
            min={0}
            max={100}
            onChange={(e) => setDecreasePercentage(parseFloat(e.target.value))}
            value={_decreasePercentage}
            step={0.01}
            className="w-full h-1 mb-6 rounded-lg appearance-none outline-none cursor-pointer range-sm accent-primary"
          />
        </div>
      ) : (
        <div>
          <p className="text-sm text-text-placeholder">
            Adjustments happen as a percentage of Liquidity LP tokens, so the
            amounts show will likely vary from the exact input.
          </p>
          <div className="flex flex-row mt-2">
            <div className="flex-1">
              <p className="flex items-center">
                <span className="mr-1">
                  <WalletIcon className="h-5 w-5" />
                </span>
                {symbolTokenA} Balance:&nbsp;
                <span className="font-semibold">{balanceA.toNumber()}</span>
              </p>
              <NumberInput
                max={balanceA.toNumber()}
                onChange={(val: string) => {
                  setMint(tokenMintA?.address.toString() ?? "");
                  setAmountTokenA(val);
                }}
                value={
                  mint === tokenMintA?.address.toString()
                    ? amountTokenA
                    : estTokenA
                }
              />
            </div>
            <div className="w-4" />
            <div className="flex-1">
              <p className="flex items-center">
                <span className="mr-1">
                  <WalletIcon className="h-5 w-5" />
                </span>
                {symbolTokenB} Balance:&nbsp;
                <span className="font-semibold">{balanceB.toNumber()}</span>
              </p>
              <NumberInput
                max={balanceB.toNumber()}
                onChange={(val: string) => {
                  setMint(tokenMintB?.address.toString() ?? "");
                  setAmountTokenB(val);
                }}
                value={
                  mint === tokenMintB?.address.toString()
                    ? amountTokenB
                    : estTokenB
                }
              />
            </div>
          </div>
        </div>
      )}
      <div className="mt-2">
        <div className="grid grid-cols-12 mt-1">
          <div className="col-span-4 font-bold">Token</div>
          <div className="col-span-4 font-bold">Minimum</div>
          <div className="col-span-4 font-bold">Estimate</div>
          <div className="col-span-4">{symbolTokenA}</div>
          <div className="col-span-4">{minTokenA}</div>
          <div className="col-span-4">{estTokenA}</div>
          <div className="col-span-4">{symbolTokenB}</div>
          <div className="col-span-4">{minTokenB}</div>
          <div className="col-span-4">{estTokenB}</div>
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
