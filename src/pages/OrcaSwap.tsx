import React, { useCallback, useState, useEffect, useMemo } from "react";
import { NumberInput } from "../components/common/Input";
import { SimpleCard } from "../components/common/SimpleCard";
import { useDevnetState } from "../contexts/NetworkProvider";
import { NetworkOption, TxType } from "../utils/types";
import { Button } from "../components/Button";
import { useOrcaPrediction, useOrcaSwap } from "../hooks/useOrcaSwap";
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import {
  clpVaultAtomFamily,
  nativeSolBalanceAtom,
  selectTokenAmount,
  selectSortedVaultKeys,
  selectedSwapWhirlpoolKey,
  tokenMetadataFamily,
  whirlpoolAtomFamily,
} from "../state";
import { Logo } from "../components/common/Logo";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  WalletIcon,
} from "@heroicons/react/20/solid";
import { NATIVE_MINT } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useMintAmountFormatter } from "../hooks/utils/useMintAmountFormatter";
import { useLoadNativeSolBalance } from "../hooks/useLoadNativeSolBalance";
import { useLoadSplAccounts } from "../hooks/useLoadSplAccounts";
import { Decimal } from "../utils/decimal";
import { useSaveTxToHistory } from "../hooks/utils/useSaveTxToHistory";
import toast from "react-hot-toast";
import { useLoadAllClpVaults } from "../hooks/Clp/useLoadClpVault";
import { useWhirlpoolClient } from "../hooks/useWhirlpoolFetcher";
import { WhirlpoolData } from "@orca-so/whirlpools-sdk";
import { useLoadMintInfoAndMeta } from "../hooks/useLoadMintInfoAndMeta";
import { useParamsWithOverride } from "../contexts/ParamOverrideContext";
import { useIsProhibitedJurisdiction } from "../hooks/useIsProhibitedJurisdiction";

export const OrcaSwap = () => {
  const load = useLoadAllClpVaults();
  useLoadNativeSolBalance();
  const selectedClp = useRecoilValue(selectedSwapWhirlpoolKey);
  const clpVaultKeys = useRecoilValue(selectSortedVaultKeys);
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="items-center justify-center flex">
      <SimpleCard>
        <div className="flex flex-col space-y-4 min-w-[350px]">
          <p className="font-khand text-2xl">
            Swap on {isDevnet ? "devnet" : "mainnet"}
          </p>
          <div className="flex flex-col space-y-2">
            {clpVaultKeys.map((k) => (
              <SwapOrcaRow clpKey={k} key={k} />
            ))}
          </div>
          {selectedClp ? <SwapOrcaAction /> : null}
        </div>
      </SimpleCard>
    </div>
  );
};

export const SwapOrcaRow = ({ clpKey }: { clpKey: string }) => {
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const setSelectedWhirlpool = useSetRecoilState(selectedSwapWhirlpoolKey);
  const tokenA = useMemo(() => vault?.tokenMintA.toString() ?? "", [vault]);
  const tokenB = useMemo(() => vault?.tokenMintB.toString() ?? "", [vault]);
  const tokenAInfo = useRecoilValue(tokenMetadataFamily(tokenA));
  const tokenBInfo = useRecoilValue(tokenMetadataFamily(tokenB));
  if (!tokenAInfo || !tokenBInfo || !vault) return null;
  return (
    <Button
      variant="outline"
      onClick={() => {
        setSelectedWhirlpool(vault.clp.toString());
      }}
      className="flex flex-row font-khand text-xl  text-text justify-between align-middle items-center"
    >
      <div className="flex  flex-row ">
        <Logo noFilter src={tokenAInfo.logoURI} size={22} />
        <Logo noFilter src={tokenBInfo.logoURI} size={22} />
      </div>
      <p>
        {tokenAInfo.symbol}-{tokenBInfo.symbol}
      </p>
      <p>{clpKey.slice(0, 9)}...</p>
    </Button>
  );
};

export const SwapOrcaAction = () => {
  const isProhibitedJurisdiction = useIsProhibitedJurisdiction();
  const selectedWhirlpool = useRecoilValue(selectedSwapWhirlpoolKey);
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(selectedWhirlpool));
  const tokenAMintAddress = whirlpool?.tokenMintA.toString() ?? "";
  const tokenBMintAddress = whirlpool?.tokenMintB.toString() ?? "";
  const tokenAInfo = useRecoilValue(tokenMetadataFamily(tokenAMintAddress));
  const tokenBInfo = useRecoilValue(tokenMetadataFamily(tokenBMintAddress));
  const solBalance = useRecoilValue(nativeSolBalanceAtom);
  let tokenABalance =
    useRecoilValue(selectTokenAmount(tokenAMintAddress))?.toNumber() ?? 0.0;
  if (tokenAMintAddress === NATIVE_MINT.toString()) {
    tokenABalance = solBalance / LAMPORTS_PER_SOL;
  }
  let tokenBBalance =
    useRecoilValue(selectTokenAmount(tokenBMintAddress))?.toNumber() ?? 0.0;
  if (tokenBMintAddress === NATIVE_MINT.toString()) {
    tokenBBalance = solBalance / LAMPORTS_PER_SOL;
  }
  const [prediction, setPrediction] = useState(0);
  const amountFormatterTokenA = useMintAmountFormatter(tokenAMintAddress);
  const amountFormatterTokenB = useMintAmountFormatter(tokenBMintAddress);
  const { saveTx } = useSaveTxToHistory();
  const [loading, setLoading] = useState(false);
  const [aToB, setAToB] = useState(true);
  const [amount, setAmount] = useState("0");
  const swap = useOrcaSwap(selectedWhirlpool);
  const predict = useOrcaPrediction(selectedWhirlpool);

  const onSwap = useCallback(async () => {
    if (
      !tokenAMintAddress ||
      !tokenBMintAddress ||
      !tokenAInfo ||
      !tokenBInfo ||
      !amount ||
      !whirlpool
    )
      return;
    setLoading(true);
    try {
      const signature = await swap(new Decimal(amount), aToB);
      if (signature)
        saveTx({
          message: "Swap completed",
          action: `Swapped ${amount} ${
            aToB ? tokenAInfo.symbol : tokenBInfo.symbol
          } to ${!aToB ? tokenAInfo.symbol : tokenBInfo.symbol}`,
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
  }, [
    aToB,
    amount,
    swap,
    saveTx,
    tokenAMintAddress,
    tokenAInfo,
    tokenBMintAddress,
    tokenBInfo,
    whirlpool,
  ]);

  useEffect(() => {
    (async () => {
      const p = await predict(new Decimal(amount), aToB);
      setPrediction(p);
    })();
  }, [aToB, amount, predict]);

  if (!tokenAInfo || !tokenBInfo) return null;
  return (
    <>
      <div className="flex flex-row items-center justify-between font-khand font-semibold text-2xl">
        <p className="flex-row flex items-center">
          <Logo noFilter src={tokenAInfo.logoURI} className="mr-1" />
          {tokenAInfo.symbol}
        </p>
        <Button
          className=" h-6"
          variant="outline"
          onClick={() => setAToB((p) => !p)}
        >
          {aToB ? (
            <ArrowRightIcon height={18} />
          ) : (
            <ArrowLeftIcon height={18} />
          )}
        </Button>
        <p className="flex-row flex items-center">
          <Logo noFilter src={tokenBInfo.logoURI} className="mr-1" />
          {tokenBInfo.symbol}
        </p>
      </div>
      <p className="text-lg font-semibold">
        Amount of {aToB ? tokenAInfo.symbol : tokenBInfo.symbol} to use to buy{" "}
        {!aToB ? tokenAInfo.symbol : tokenBInfo.symbol}
      </p>
      <NumberInput
        value={amount}
        onChange={(a: string) => {
          setAmount(a);
        }}
      />
      <p className="mt-1 flex items-center ">
        <span className="mr-1">
          <WalletIcon className="h-5 w-5" />
        </span>
        Balance:{" "}
        <span className=" font-semibold ml-2">
          {aToB
            ? amountFormatterTokenA(tokenABalance)
            : amountFormatterTokenB(tokenBBalance)}{" "}
          {aToB ? tokenAInfo.symbol : tokenBInfo.symbol}
        </span>
      </p>
      {amount !== "0" && (
        <p className="mt-1 flex items-center ">
          Estimated output:
          <span className="ml-2 font-semibold">
            {prediction} {!aToB ? tokenAInfo.symbol : tokenBInfo.symbol}
          </span>
        </p>
      )}
      <Button
        // must disable swaps for prohibited jurisdictions
        disabled={isProhibitedJurisdiction}
        loading={loading}
        onClick={onSwap}
      >
        {isProhibitedJurisdiction ? "Prohibited Jurisdiction" : "Swap"}
      </Button>
    </>
  );
};

export const CustomOrcaPoolSwap = () => {
  const { whirlpoolId = "" } = useParamsWithOverride<{ whirlpoolId: string }>();
  const setWhirlpool = useRecoilCallback(
    ({ set }) =>
      (whirlpoolKey: string, whirlpool: WhirlpoolData) => {
        set(whirlpoolAtomFamily(whirlpoolKey), whirlpool);
      },
    []
  );
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const [selectedWhirlpool, setSelectedWhirlpool] = useRecoilState(
    selectedSwapWhirlpoolKey
  );
  const loadSplAccs = useLoadSplAccounts();
  const loadMintAndMeta = useLoadMintInfoAndMeta();
  const client = useWhirlpoolClient();
  useEffect(() => {
    (async () => {
      const whirlpool = await client.getPool(whirlpoolId);
      const data = whirlpool.getData();
      setWhirlpool(whirlpoolId, data);
      setSelectedWhirlpool(whirlpoolId);
      loadMintAndMeta([data.tokenMintA.toString(), data.tokenMintB.toString()]);
      loadSplAccs([data.tokenMintA, data.tokenMintB]);
    })();
  }, [
    client,
    loadMintAndMeta,
    loadSplAccs,
    setSelectedWhirlpool,
    setWhirlpool,
    whirlpoolId,
  ]);

  return (
    <div className="items-center justify-center flex">
      <SimpleCard>
        <div className="flex flex-col space-y-4 min-w-[350px]">
          <p className="font-khand text-2xl">
            Swap on {isDevnet ? "devnet" : "mainnet"}
          </p>
          {selectedWhirlpool ? <SwapOrcaAction /> : <p>Not Found</p>}
        </div>
      </SimpleCard>
    </div>
  );
};
