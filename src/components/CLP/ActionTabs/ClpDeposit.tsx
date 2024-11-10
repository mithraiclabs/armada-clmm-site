import { useCallback, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import BN from "bn.js";
import { Decimal } from "../../../utils/decimal";
import { calculateTotalLiquidityOnPositions } from "@mithraic-labs/clp-vault";
import { NATIVE_MINT } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ReactComponent as GearIcon } from "../../../assets/icons/gear.svg";
import { NumberInput, Logo } from "../../common";
import { Button } from "../../Button";
import {
  clpVaultAtomFamily,
  selectWhirlpoolPositionsForClpVault,
  selectTokenAmount,
  splMintAtomFamily,
  tokenMetadataFamily,
  whirlpoolAtomFamily,
  selectTickDataForClpVault,
  splTokenAccountAtomFamily,
  selectUseClpInitialRatio,
  nativeSolBalanceAtom,
  selectVaultTvl,
  selectVaultMaxTvl,
  selectClpVaultMetadataType,
  selectPriceTokenA,
  selectPriceTokenB,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectIsVaultDeprecated,
  slippageAtomFamily,
} from "../../../state";
import { useClpDeposit } from "../../../hooks/Clp/useDeposit";
import { DECIMAL_ZERO } from "../../../utils/math";
import { CLP_VAULT_TOKEN_DECIMALS } from "../../../utils/constants";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { TextButton } from "../../Button/TextButton";
import { formatPercent } from "../../../utils/formatters";
import { SlippageContainer } from "../../SlippageContainer";
import { useSaveTxToHistory } from "../../../hooks/utils/useSaveTxToHistory";
import { ReactComponent as WalletIcon } from "../../../assets/icons/wallet.svg";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSlippage } from "../../../hooks/utils/useSlippage";
import { useIsProhibitedJurisdiction } from "../../../hooks/useIsProhibitedJurisdiction";

export const ClpDeposit = ({ vaultId }: { vaultId: string }) => {
  const { t } = useTranslation();
  const isProhibitedJurisdiction = useIsProhibitedJurisdiction();
  const clpVault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const isDeprecated = useRecoilValue(selectIsVaultDeprecated(vaultId));
  const clpVaultTokenAccountA = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultA.toString() ?? "")
  );
  const clpVaultTokenAccountB = useRecoilValue(
    splTokenAccountAtomFamily(clpVault?.tokenVaultB.toString() ?? "")
  );
  const [loading, setLoading] = useState<boolean>(false);
  const requireInitialRatio = useRecoilValue(selectUseClpInitialRatio(vaultId));
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(vaultId));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(vaultId));
  const solBalance = useRecoilValue(nativeSolBalanceAtom);
  const whirlpool = useRecoilValue(
    whirlpoolAtomFamily(clpVault?.clp.toString() ?? "")
  );
  const whirlpoolPositions = useRecoilValue(
    selectWhirlpoolPositionsForClpVault(vaultId)
  );
  const vaultType = useRecoilValue(selectClpVaultMetadataType(vaultId));
  const isAuction = vaultType === "auction";

  const tvl = useRecoilValue(selectVaultTvl(vaultId));
  const maxTvl = useRecoilValue(selectVaultMaxTvl(vaultId));
  const priceTokenA = useRecoilValue(selectPriceTokenA(vaultId));
  const priceTokenB = useRecoilValue(selectPriceTokenB(vaultId));
  const whirlpoolTickData = useRecoilValue(selectTickDataForClpVault(vaultId));
  const tokenMintA = useRecoilValue(splMintAtomFamily(mintA));
  const tokenMintB = useRecoilValue(splMintAtomFamily(mintB));
  const lpMint = useRecoilValue(
    splMintAtomFamily(clpVault?.lpMint.toString() ?? "")
  );
  const { saveTx } = useSaveTxToHistory();
  const [showSlippage, setShowSlippage] = useState(false);
  const [slippage, setSlippage] = useRecoilState(slippageAtomFamily(vaultId));
  const [depositSizeA, setDepositSizeA] = useState("");
  const [depositSizeB, setDepositSizeB] = useState("");
  const [depositSizeSwap, setDepositSizeSwap] = useState("");
  const [depositMint, setDepositMint] = useState(mintA);
  const [depositType, setDepositType] = useState<DepositType>(0);
  const maxDepositUsd = useMemo(() => maxTvl.sub(tvl ?? 0), [maxTvl, tvl]);
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);
  const swappable = false;

  useSlippage(vaultId);

  const amountToSwap = useMemo(() => {
    if (
      !(
        !isNaN(Number(depositSizeSwap)) &&
        tokenMintA &&
        tokenMintB &&
        whirlpool
      ) ||
      !clpVault ||
      !clpVaultTokenAccountA ||
      !clpVaultTokenAccountB
    ) {
      // Not everything is loaded
      return DECIMAL_ZERO;
    }
    const totalFromPositions = calculateTotalLiquidityOnPositions({
      clpVault,
      whirlpool,
      whirlpoolPositions,
      whirlpoolTickData,
    });
    const totalA = totalFromPositions.totalA.add(
      new BN(clpVaultTokenAccountA.amount.toString())
    );
    const totalB = totalFromPositions.totalB.add(
      new BN(clpVaultTokenAccountB.amount.toString())
    );

    const relativePrice =
      depositType === DepositType.TokenA
        ? (priceTokenA ?? 1) / (priceTokenB ?? 1)
        : (priceTokenB ?? 1) / (priceTokenA ?? 1);

    const R =
      totalA.isZero() || totalB.isZero()
        ? new Decimal(relativePrice)
        : new Decimal(
            (depositType === DepositType.TokenA ? totalB : totalA).toString()
          )
            .div(
              10 **
                (depositType === DepositType.TokenA ? tokenMintB : tokenMintA)
                  .decimals
            )
            .div(
              new Decimal(
                (depositType === DepositType.TokenA
                  ? totalA
                  : totalB
                ).toString()
              ).div(
                10 **
                  (depositType === DepositType.TokenA ? tokenMintA : tokenMintB)
                    .decimals
              )
            );
    return new Decimal(depositSizeSwap || 0).mul(R).div(R.add(relativePrice));
  }, [
    clpVault,
    clpVaultTokenAccountA,
    clpVaultTokenAccountB,
    depositSizeSwap,
    depositType,
    priceTokenA,
    priceTokenB,
    tokenMintA,
    tokenMintB,
    whirlpool,
    whirlpoolPositions,
    whirlpoolTickData,
  ]);

  const [lpAmt, tokenEstA, tokenEstB] = useMemo<
    [Decimal, Decimal, Decimal]
  >(() => {
    if (
      !(
        !isNaN(Number(depositSizeA)) &&
        tokenMintA &&
        tokenMintB &&
        whirlpool
      ) ||
      !clpVault ||
      !lpMint ||
      !clpVaultTokenAccountA ||
      !clpVaultTokenAccountB
    ) {
      // Not everything is loaded
      return [DECIMAL_ZERO, DECIMAL_ZERO, DECIMAL_ZERO];
    }

    let _tokenEstA = new Decimal(depositSizeA || 0);
    let _tokenEstB = new Decimal(depositSizeB || 0);
    const lpMintSupply = new Decimal(lpMint.supply.toString()).div(
      10 ** CLP_VAULT_TOKEN_DECIMALS
    );

    if (amountToSwap.gt(0)) {
      if (depositType === DepositType.TokenA) {
        _tokenEstA = new Decimal(depositSizeSwap || 0).sub(amountToSwap);
      } else if (depositType === DepositType.TokenB) {
        _tokenEstB = new Decimal(depositSizeSwap || 0).sub(amountToSwap);
      }
    }
    if (requireInitialRatio || lpMintSupply.isZero()) {
      const amountPerLpTokenA = new Decimal(
        clpVault.initialTokenRatio.tokenA.toString()
      ).div(10 ** tokenMintA.decimals);
      const amountPerLpTokenB = new Decimal(
        clpVault.initialTokenRatio.tokenB.toString()
      ).div(10 ** tokenMintB.decimals);
      const ratio = amountPerLpTokenB.div(amountPerLpTokenA);

      if (depositMint === mintB) {
        _tokenEstA = new Decimal(depositSizeB || 0).div(ratio);
      } else {
        _tokenEstB = ratio.mul(depositSizeA || 0);
      }

      return [
        _tokenEstA.gt(0)
          ? _tokenEstA
              .mul(10 ** tokenMintA.decimals)
              .div(clpVault.initialTokenRatio.tokenA.toString())
              .mul(10 ** CLP_VAULT_TOKEN_DECIMALS)
              .floor()
          : _tokenEstB
              .mul(10 ** tokenMintB.decimals)
              .div(clpVault.initialTokenRatio.tokenB.toString())
              .mul(10 ** CLP_VAULT_TOKEN_DECIMALS)
              .floor(),
        _tokenEstA,
        _tokenEstB,
      ];
    }

    const totalFromPositions = calculateTotalLiquidityOnPositions({
      clpVault,
      whirlpool,
      whirlpoolPositions,
      whirlpoolTickData,
    });
    const totalA = totalFromPositions.totalA.add(
      new BN(clpVaultTokenAccountA.amount.toString())
    );
    const totalB = totalFromPositions.totalB.add(
      new BN(clpVaultTokenAccountB.amount.toString())
    );

    // get lpTokensToReceive given token A input
    // lpMintAmount = (inputA/totalA) * totalLpMintSupply
    const ratioA = _tokenEstA.div(
      new Decimal(totalA.toString()).div(10 ** tokenMintA.decimals)
    );
    const ratioB = _tokenEstB.div(
      new Decimal(totalB.toString()).div(10 ** tokenMintB.decimals)
    );
    const tokenRatio = depositMint === mintA ? ratioA : ratioB;
    const lpMintAmountToReceive = lpMintSupply.mul(tokenRatio);

    const ratio = lpMintAmountToReceive
      .mul(10 ** CLP_VAULT_TOKEN_DECIMALS)
      .floor()
      .div(lpMint.supply.toString());

    if (depositMint === mintA) {
      _tokenEstB = new Decimal(totalB.toString())
        .mul(ratio)
        .div(10 ** tokenMintB.decimals);
    } else {
      _tokenEstA = new Decimal(totalA.toString())
        .mul(ratio)
        .div(10 ** tokenMintA.decimals);
    }

    return [
      lpMintAmountToReceive.mul(10 ** CLP_VAULT_TOKEN_DECIMALS).floor(),
      _tokenEstA,
      _tokenEstB,
    ];
  }, [
    depositSizeA,
    tokenMintA,
    tokenMintB,
    whirlpool,
    clpVault,
    lpMint,
    clpVaultTokenAccountA,
    clpVaultTokenAccountB,
    depositSizeB,
    requireInitialRatio,
    whirlpoolPositions,
    whirlpoolTickData,
    depositMint,
    mintA,
    mintB,
    amountToSwap,
    depositType,
    depositSizeSwap,
  ]);

  const deposit = useClpDeposit(
    vaultId,
    depositType !== DepositType.Regular
      ? {
          swapTokenA: depositType === DepositType.TokenA,
        }
      : undefined
  );
  const onDeposit = useCallback(async () => {
    try {
      if (!tokenMintB || !tokenMintA) {
        throw new Error(t("State not loaded, please try again"));
      }
      setLoading(true);
      const { signatures, txTypes } = await deposit(
        new BN(
          tokenEstA
            .mul(10 ** tokenMintA.decimals)
            .floor()
            .toString()
        ),
        new BN(
          tokenEstB
            .mul(10 ** tokenMintB.decimals)
            .floor()
            .toString()
        ),
        new BN(lpAmt.toString()),
        true,
        parseFloat(slippage),
        amountToSwap
      );
      setDepositSizeA("");
      const amtA = amountFormatterTokenA(tokenEstA.toString());
      const amtB = amountFormatterTokenB(tokenEstB.toString());
      const sigx = Object.values(signatures);
      saveTx({
        action: t(
          "CLMM Deposit {{tokenSymbolA}}-{{tokenSymbolB}} [{{tokenSymbolA}} {{amountA}}, {{tokenSymbolB}} {{amountB}}]",
          {
            amountA: amtA,
            tokenSymbolA: tokenSymbolA,
            amountB: amtB,
            tokenSymbolB: tokenSymbolB,
          }
        ),
        message: t(
          "Successfully deposited {{amountA}} {{tokenSymbolA}} and {{amountB}} {{tokenSymbolB}}",
          {
            amountA: amtA,
            tokenSymbolA: tokenSymbolA,
            amountB: amtB,
            tokenSymbolB: tokenSymbolB,
          }
        ),
        signatures: sigx.map((s, i) => ({
          signature: s,
          type: txTypes[i],
        })),
      });
    } catch (err) {
      if (amountToSwap.gt(0) && depositType !== DepositType.Regular) {
        setDepositType(DepositType.Regular);
        setDepositMint(depositType === DepositType.TokenA ? mintA : mintB);
        setDepositSizeA(amountToSwap.toString());
      }
      if (
        (err as { code: number }).code === 6010 ||
        (err as { InstructionError: [number, { Custom: number }] })
          .InstructionError?.[1]?.Custom === 6017
      ) {
        toast.error(
          t(
            "Problem matching expected deposit amount. Please try increasing the slippage."
          )
        );
      } else {
        if ((err as { message: string }).message) {
          toast.error(t(String((err as { message: string }).message)));
        } else {
          toast.error(t("Something went wrong"));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [
    tokenMintB,
    tokenMintA,
    deposit,
    tokenEstA,
    tokenEstB,
    lpAmt,
    slippage,
    amountToSwap,
    amountFormatterTokenA,
    amountFormatterTokenB,
    saveTx,
    t,
    tokenSymbolA,
    tokenSymbolB,
    depositType,
    mintA,
    mintB,
  ]);

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

  const exceedsMaxTvl = useMemo(() => {
    switch (depositType) {
      case DepositType.TokenA:
        return maxDepositUsd.lt(Number(depositSizeSwap) * (priceTokenA ?? 0));
      case DepositType.TokenB:
        return maxDepositUsd.lt(Number(depositSizeSwap) * (priceTokenB ?? 0));
      case DepositType.Regular:
      default:
        return tokenEstA
          .mul(priceTokenA ?? 0)
          .add(tokenEstB.mul(priceTokenB ?? 0))
          .gt(maxDepositUsd);
    }
  }, [
    depositSizeSwap,
    depositType,
    maxDepositUsd,
    priceTokenA,
    priceTokenB,
    tokenEstA,
    tokenEstB,
  ]);

  const exceedsBalance = useMemo(() => {
    switch (depositType) {
      case DepositType.TokenA:
        return Number(depositSizeSwap) > tokenABalance;
      case DepositType.TokenB:
        return Number(depositSizeSwap) > tokenBBalance;
      case DepositType.Regular:
      default:
        return tokenEstA.gt(tokenABalance) || tokenEstB.gt(tokenBBalance);
    }
  }, [
    depositSizeSwap,
    depositType,
    tokenABalance,
    tokenBBalance,
    tokenEstA,
    tokenEstB,
  ]);

  const swapDepositToken = depositType === DepositType.TokenA ? tokenA : tokenB;

  return (
    <div className="relative">
      {showSlippage ? (
        <SlippageContainer
          onClose={() => setShowSlippage(false)}
          onUpdate={setSlippage}
          vaultId={vaultId}
          value={slippage}
        />
      ) : (
        <div
          className={`my-4 font-montserrat font-semibold text-sm ${
            showSlippage ? "opacity-0" : ""
          }`}
        >
          {depositType === 0 ? (
            <div>
              <div className="flex flex-row justify-between">
                <p>
                  {t("{{symbol}} Amount", {
                    symbol: tokenSymbolA,
                  })}
                </p>
                {swappable && (
                  <TextButton
                    className="text-primary"
                    onClick={() => {
                      setDepositType(DepositType.TokenA);
                    }}
                  >
                    {t("Use {{symbol}} only", { symbol: tokenSymbolA })}
                  </TextButton>
                )}
              </div>
              <NumberInput
                placeholder={t("Enter amount")}
                startIcon={
                  tokenA ? (
                    <Logo src={tokenA.logoURI} size={18} noFilter />
                  ) : undefined
                }
                value={
                  depositMint === mintB
                    ? tokenEstA
                        .toFixed(
                          tokenMintA?.decimals ?? 20,
                          Decimal.ROUND_FLOOR
                        )
                        .replace(/\.0+$/, "")
                    : depositSizeA
                }
                onChange={(text: string) => {
                  setDepositMint(mintA);
                  setDepositSizeA(text);
                }}
                max={tokenABalance}
              />
              <p className="mt-2 flex items-center ">
                <span className="mr-1">
                  <WalletIcon className="h-5 w-5" />
                </span>
                {t("Balance: {{amount}}", {
                  amount: `${amountFormatterTokenA(
                    tokenABalance
                  )} ${tokenSymbolA}`,
                })}
              </p>
              <div className="flex flex-row justify-between mt-4">
                <p>
                  {t("{{symbol}} Amount", {
                    symbol: tokenSymbolB,
                  })}
                </p>
                {swappable && (
                  <TextButton
                    className="text-primary"
                    onClick={() => {
                      setDepositType(DepositType.TokenB);
                    }}
                  >
                    {t("Use {{symbol}} only", { symbol: tokenSymbolB })}
                  </TextButton>
                )}
              </div>
              <NumberInput
                placeholder={t("Enter amount")}
                startIcon={
                  tokenB ? (
                    <Logo src={tokenB.logoURI} size={18} noFilter />
                  ) : undefined
                }
                value={
                  depositMint === mintA
                    ? tokenEstB
                        .toFixed(
                          tokenMintB?.decimals ?? 20,
                          Decimal.ROUND_FLOOR
                        )
                        .replace(/\.0+$/, "")
                    : depositSizeB
                }
                onChange={(text: string) => {
                  setDepositMint(mintB);
                  setDepositSizeB(text);
                }}
                max={tokenBBalance}
              />
              <p className="my-2 flex items-center ">
                <span className="mr-1">
                  <WalletIcon className="h-5 w-5" />
                </span>
                {t("Balance: {{amount}}", {
                  amount: `${amountFormatterTokenB(
                    tokenBBalance
                  )} ${tokenSymbolB}`,
                })}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-row justify-between">
                <p>
                  {t("{{symbol}} Amount", {
                    symbol: swapDepositToken?.symbol.toUpperCase() ?? "",
                  })}
                </p>
                <TextButton
                  className="text-primary"
                  onClick={() => {
                    setDepositType(DepositType.Regular);
                  }}
                >
                  {t("Use both tokens")}
                </TextButton>
              </div>
              <NumberInput
                placeholder={t("Enter amount")}
                startIcon={
                  swapDepositToken ? (
                    <Logo src={swapDepositToken.logoURI} size={18} />
                  ) : undefined
                }
                value={depositSizeSwap}
                onChange={(text: string) => {
                  setDepositSizeSwap(text);
                  setDepositMint(
                    depositType === DepositType.TokenA ? mintA : mintB
                  );
                }}
                max={
                  depositType === DepositType.TokenA
                    ? tokenABalance
                    : tokenBBalance
                }
              />
              <p className="my-2 flex items-center ">
                <span className="mr-1">
                  <WalletIcon className="h-5 w-5" />
                </span>
                {t("Balance: {{amount}}", {
                  amount: `${
                    depositType === DepositType.TokenA
                      ? amountFormatterTokenA(tokenABalance)
                      : amountFormatterTokenB(tokenBBalance)
                  } ${
                    depositType === DepositType.TokenA
                      ? tokenSymbolA
                      : tokenSymbolB
                  }`,
                })}
              </p>
            </div>
          )}
          <div className="flex justify-center mt-2">
            <TextButton onClick={() => setShowSlippage(true)}>
              <div className="flex items-center text-primary text-base">
                <GearIcon height={16} width={16} />
                <p className="ml-1">
                  {t("Price Tolerance {{slippage}}%", {
                    slippage: formatPercent(slippage),
                  })}
                </p>
              </div>
            </TextButton>
          </div>
          <Button
            disabled={
              isAuction ||
              exceedsMaxTvl ||
              exceedsBalance ||
              isDeprecated ||
              isProhibitedJurisdiction
            }
            loading={loading}
            onClick={onDeposit}
            className=" w-full mt-6"
          >
            {isProhibitedJurisdiction
              ? t("Prohibited Location")
              : isDeprecated
              ? t("Deprecated Vault")
              : isAuction
              ? t("Deposit Disabled For Auction")
              : exceedsMaxTvl
              ? t("Deposit Exceeds Max TVL")
              : exceedsBalance
              ? t("Insufficient Balance")
              : t("Deposit")}
          </Button>
        </div>
      )}
    </div>
  );
};

export enum DepositType {
  Regular,
  TokenA,
  TokenB,
}
