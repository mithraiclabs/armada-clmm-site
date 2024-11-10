import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectTokenASymbol,
  selectTokenAmount,
  selectTokenBSymbol,
  selectUiInvertTokenPair,
  tokenMetadataFamily,
  whirlpoolAtomFamily,
} from "../../../state";
import { Button } from "../../Button";
import { SimpleCard } from "../../common/SimpleCard";
import { useCallback, useEffect, useState } from "react";
import { useOrcaPrediction, useOrcaSwap } from "../../../hooks/useOrcaSwap";
import { useSaveTxToHistory } from "../../../hooks/utils/useSaveTxToHistory";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { NATIVE_MINT } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import toast from "react-hot-toast";
import { Decimal } from "../../../utils/decimal";
import { WalletIcon } from "@heroicons/react/20/solid";
import { Logo } from "../../common/Logo";
import { NumberInput } from "../../common/Input";
import { TxType } from "../../../utils/types";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";

export const AuctionPurchaseContainer = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const solBalance = useRecoilValue(nativeSolBalanceAtom);
  let tokenABalance =
    useRecoilValue(selectTokenAmount(mintA))?.toNumber() ?? 0.0;
  if (mintA === NATIVE_MINT.toString()) {
    tokenABalance = solBalance / LAMPORTS_PER_SOL;
  }
  let tokenBBalance =
    useRecoilValue(selectTokenAmount(mintB))?.toNumber() ?? 0.0;
  if (mintB === NATIVE_MINT.toString()) {
    tokenBBalance = solBalance / LAMPORTS_PER_SOL;
  }
  const tokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const { logoURI: logoURIA } = useRecoilValue(tokenMetadataFamily(mintA)) ?? {
    logoURI: "",
  };
  const { logoURI: logoURIB } = useRecoilValue(tokenMetadataFamily(mintB)) ?? {
    logoURI: "",
  };
  const [prediction, setPrediction] = useState("0.0");

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const { saveTx } = useSaveTxToHistory();
  const invertedTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const swap = useOrcaSwap(clpVault?.clp.toString() ?? "");
  const predict = useOrcaPrediction(clpVault?.clp.toString() ?? "");

  const onSwap = useCallback(async () => {
    if (!tokenA || !tokenB || !amount || !whirlpool) return;
    setLoading(true);
    try {
      const signature = await swap(new Decimal(amount), invertedTokens);

      if (signature)
        saveTx({
          message: "Purchase completed",
          action: `Swapped ${amount} ${invertedTokens ? tokenA : tokenB} to ${
            !invertedTokens ? tokenA : tokenB
          }`,
          signatures: [
            {
              signature,
              type: TxType.swap,
            },
          ],
        });
    } catch (error) {
      toast.error(String(error));
    } finally {
      setLoading(false);
    }
  }, [tokenA, tokenB, amount, whirlpool, swap, invertedTokens, saveTx]);

  useEffect(() => {
    (async () => {
      if (Number(amount)) {
        const p = await predict(new Decimal(amount || 0), invertedTokens);
        setPrediction(
          !invertedTokens ? amountFormatterTokenA(p) : amountFormatterTokenB(p)
        );
      } else {
        setPrediction("0.0");
      }
    })();
  }, [
    invertedTokens,
    amount,
    predict,
    amountFormatterTokenA,
    amountFormatterTokenB,
  ]);

  if (!tokenA || !tokenB) return null;

  return (
    <SimpleCard className="md:w-[350px] max-h-[300px] ml-0">
      <div className="flex flex-row items-center justify-between font-khand font-semibold text-2xl text-text-placeholder mb-2">
        <p className="flex-row flex items-center space-x-2">
          <span>Buy</span>
          <span>{!invertedTokens ? tokenA : tokenB}</span>
          <Logo noFilter src={!invertedTokens ? logoURIA : logoURIB} />
        </p>
      </div>
      <NumberInput placeholder="0" value={amount} onChange={setAmount} />
      <p className="my-4 flex items-center ">
        <span className="mr-1">
          <WalletIcon className="h-5 w-5" />
        </span>
        Balance:{" "}
        <span className=" font-semibold ml-2">
          {invertedTokens
            ? amountFormatterTokenA(tokenABalance)
            : amountFormatterTokenB(tokenBBalance)}{" "}
          {invertedTokens ? tokenA : tokenB}
        </span>
      </p>
      <p className="mb-4 flex items-center ">
        Estimated output:
        <span className="ml-2 font-semibold">
          {prediction} {!invertedTokens ? tokenA : tokenB}
        </span>
      </p>
      <Button loading={loading} onClick={onSwap}>
        Buy
      </Button>
    </SimpleCard>
  );
};
