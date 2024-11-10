import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { NumberInput } from "../../../components/common/Input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { ReactComponent as GearIcon } from "../../../assets/icons/gear.svg";
import {
  clpVaultAtomFamily,
  selectTokenASymbol,
  selectTokenBSymbol,
  slippageAtomFamily,
  splMintAtomFamily,
  splTokenAccountAtomFamily,
  tokenMetadataFamily,
} from "../../../state";
import { Button } from "../../../components/Button";
import toast from "react-hot-toast";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/20/solid";
import _ from "lodash";
import { Decimal } from "../../../utils/decimal";
import { Logo, SimpleModal } from "../../../components/common";
import { useExternalSwap } from "../../../hooks/Clp/useExternalSwap";
import { useTranslation } from "react-i18next";
import { Spinner } from "../../../components/Spinner";
import { debounce } from "lodash";

export const SwapDialog = ({
  onClose,
  open,
  preventOutsideClick,
}: {
  onClose: () => void;
  open: boolean;
  preventOutsideClick?: boolean;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const tokenASymbol = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenBSymbol = useRecoilValue(selectTokenBSymbol(clpKey));
  const [slippage, setSlippage] = useRecoilState(slippageAtomFamily(clpKey));
  const [estimating, setEstimating] = useState(false);
  const [swapAmount, setSwapAmount] = useState("");
  const [swappingTokenA, setSwappingTokenA] = useState(true);
  const [baseA, setBaseA] = useState(false);
  const [showSlippage, setShowSlippage] = useState(false);
  const { t } = useTranslation();
  const tokenMintA = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenAccountA = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultA.toString() ?? "")
  );
  const tokenMintB = useRecoilValue(
    splMintAtomFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const tokenAccountB = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultB.toString() ?? "")
  );
  const tokenA = useRecoilValue(
    tokenMetadataFamily(clpVault?.tokenMintA.toString() ?? "")
  );
  const tokenB = useRecoilValue(
    tokenMetadataFamily(clpVault?.tokenMintB.toString() ?? "")
  );
  const swap = useExternalSwap(clpKey, swappingTokenA);

  const [estimate, setEstimate] = useState(0);
  const [priceImpact, setPriceImpact] = useState("0");
  const [price, setPrice] = useState("0");

  const balanceA = new Decimal(tokenAccountA?.amount.toString() ?? 0).div(
    10 ** (tokenMintA?.decimals ?? 0)
  );
  const balanceB = new Decimal(tokenAccountB?.amount.toString() ?? 0).div(
    10 ** (tokenMintB?.decimals ?? 0)
  );
  const [loading, setLoading] = useState(false);
  const onSwap = useCallback(async () => {
    try {
      setLoading(true);
      await swap(swapAmount, slippage);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onClose, swap, swapAmount, slippage]);

  const calculateEstimate = useCallback(
    async (val: string) => {
      if (!clpVault) {
        return;
      }
      setEstimating(true);
      const mintA = clpVault.tokenMintA.toString();
      const mintB = clpVault.tokenMintB.toString();
      const decimalsA = tokenMintA?.decimals ?? 0;
      const decimalsB = tokenMintB?.decimals ?? 0;
      try {
        const quoteResponse = await (
          await fetch(`
        https://quote-api.jup.ag/v6/quote?inputMint=${
          swappingTokenA ? mintA : mintB
        }&outputMint=${!swappingTokenA ? mintA : mintB}&amount=${new Decimal(
            val
          )
            .mul(Math.pow(10, swappingTokenA ? decimalsA : decimalsB))
            .toFixed(0)}&maxAccounts=30&slippageBps=5`)
        ).json();
        const estReceive = new Decimal(quoteResponse.outAmount as string)
          .div(10 ** (swappingTokenA ? decimalsB : decimalsA))
          .toNumber();
        const estSent = new Decimal(quoteResponse.inAmount as string)
          .div(10 ** (swappingTokenA ? decimalsA : decimalsB))
          .toNumber();
        // uses the smaller of estReceive and estSent as the base and larger as quote
        if (estReceive > estSent) {
          setBaseA(true);
          setPrice(new Decimal(estReceive).div(estSent).toString());
        } else {
          setBaseA(false);
          setPrice(new Decimal(estSent).div(estReceive).toString());
        }
        setPriceImpact(new Decimal(quoteResponse.priceImpactPct).toFixed(3));
        setEstimate(estReceive);
      } catch (error) {
        console.error(error);
      }
      setEstimating(false);
    },
    [clpVault, swappingTokenA, tokenMintA, tokenMintB]
  );

  const debouncedSave = useMemo(
    () =>
      debounce((nextValue) => {
        calculateEstimate(nextValue);
      }, 2000),
    [calculateEstimate]
  );

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleChange = (value: string) => {
    setSwapAmount(value);
    debouncedSave(value);
  };

  return (
    <SimpleModal
      preventOutsideClick={preventOutsideClick}
      isOpen={open}
      onClose={onClose}
    >
      <div className="w-full flex justify-between items-center min-w-[350px]">
        <p className="text-xl font-khand text-text-placeholder">
          Swap Vault Tokens
        </p>
        <TextButton className="mb-2 p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>
      <span>Vault Balances</span>
      <div className="w-full flex justify-between items-center">
        <span className="font-semibold">
          {balanceA.toString()} {tokenASymbol}
        </span>
        <div className="w-3" />
        <span className="font-semibold">
          {balanceB.toString()} {tokenBSymbol}
        </span>
      </div>
      <div className="my-3">
        <div className="flex-row flex justify-between align-middle items-center">
          Swapping {swappingTokenA ? tokenASymbol : tokenBSymbol}
          <Button
            variant="outline"
            onClick={() => {
              setSwapAmount("");
              setEstimate(0);
              setPrice("");
              setPriceImpact("");
              setSwappingTokenA((p) => !p);
            }}
          >
            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
          </Button>
        </div>
        <NumberInput
          containerClassName="my-2"
          startIcon={
            <Logo src={(swappingTokenA ? tokenA : tokenB)?.logoURI} size={18} />
          }
          placeholder={`Enter amount of ${
            swappingTokenA ? tokenASymbol : tokenBSymbol
          } to swap`}
          value={swapAmount}
          onChange={handleChange}
          onBlur={() => calculateEstimate(swapAmount)}
          max={swappingTokenA ? balanceA.toNumber() : balanceB.toNumber()}
        />
        {estimating ? (
          <div className=" py-8 px-8">
            <Spinner className="mr-2 w-4 h-4" />
          </div>
        ) : (
          <div>
            {estimate > 0 && (
              <div className="flex flex-col space-y-2">
                <div className="flex flex-row justify-between items-center">
                  <p className=" text-text-placeholder">Est. price</p>
                  <p className=" font-bold">
                    1 {baseA ? tokenASymbol : tokenBSymbol} = {price}{" "}
                    {baseA ? tokenBSymbol : tokenASymbol}
                  </p>
                </div>
                <div className="flex flex-row justify-between items-center">
                  <p className=" text-text-placeholder">Est. recieve</p>
                  <p className=" font-bold">
                    {estimate} {swappingTokenA ? tokenBSymbol : tokenASymbol}
                  </p>
                </div>
                <div className="flex flex-row justify-between items-center">
                  <p className=" text-text-placeholder">Price impact</p>
                  <p className=" font-bold">{priceImpact} %</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Button loading={loading} onClick={onSwap}>
        Swap
      </Button>
      {showSlippage ? (
        <div className="flex justify-between items-center mt-3">
          <label className="my-2">Slippage:</label>
          <NumberInput value={slippage} onChange={setSlippage} decimals={3} />%
          <TextButton
            onClick={() => setShowSlippage(false)}
            className="text-primary"
          >
            &#10003;
          </TextButton>
        </div>
      ) : (
        <div className="flex justify-center mt-2">
          <TextButton onClick={() => setShowSlippage(true)}>
            <div className="flex items-center text-primary text-base">
              <GearIcon height={16} width={16} />
              <p className="ml-1">
                {t("Slippage {{slippage}}%", {
                  slippage,
                })}
              </p>
            </div>
          </TextButton>
        </div>
      )}
    </SimpleModal>
  );
};
