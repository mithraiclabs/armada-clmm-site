import React, { useCallback, useMemo, useState } from "react";
import { NumberInput } from "../../common/Input";
import { Button } from "../../Button";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  associatedTokenAccountAtomFamily,
  clpVaultAtomFamily,
  selectClpTotalTokenAmountsWithoutFees,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUserTotalLpBalance,
  slippageAtomFamily,
  splMintAtomFamily,
  tokenMetadataFamily,
} from "../../../state";
import { Decimal } from "../../../utils/decimal";
import { useClpWithdraw } from "../../../hooks/Clp/useWithdraw";
import toast from "react-hot-toast";
import BN from "bn.js";
import { CLP_VAULT_TOKEN_DECIMALS } from "../../../utils/constants";
import { ReactComponent as GearIcon } from "../../../assets/icons/gear.svg";
import { SlippageContainer } from "../../SlippageContainer";
import { TextButton } from "../../Button/TextButton";
import { formatPercent } from "../../../utils/formatters";
import { useSaveTxToHistory } from "../../../hooks/utils/useSaveTxToHistory";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { ReactComponent as WalletIcon } from "../../../assets/icons/wallet.svg";
import { Logo } from "../../common/Logo";
import { InfoTooltip } from "../../common/InfoTooltip";
import { useTranslation } from "react-i18next";
import { useSlippage } from "../../../hooks/utils/useSlippage";

export const ClpWithdraw = ({ vaultId }: { vaultId: string }) => {
  const { t } = useTranslation();
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const totals = useRecoilValue(selectClpTotalTokenAmountsWithoutFees(vaultId));
  const withdraw = useClpWithdraw(vaultId);
  const [loading, setLoading] = useState(false);
  const { saveTx } = useSaveTxToHistory();
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const mintLP = vault?.lpMint.toString() ?? "";
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(vaultId));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(vaultId));
  const tokenMintA = useRecoilValue(splMintAtomFamily(mintA));
  const tokenMintB = useRecoilValue(splMintAtomFamily(mintB));
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);
  const psyStakingRecord = null;
  // -------------------------------------
  const lpTokenMint = useRecoilValue(splMintAtomFamily(mintLP));
  const tokenLPAta = useRecoilValue(associatedTokenAccountAtomFamily(mintLP));
  // this includes staked + unstaked LP tokens
  const tokenLPBalanceTotal = useRecoilValue(selectUserTotalLpBalance(vaultId));
  // ----------------------------------------
  const [withdrawSize, setWithdrawSize] = useState("");
  const [showSlippage, setShowSlippage] = useState(false);
  const [slippage, setSlippage] = useRecoilState(slippageAtomFamily(vaultId));
  useSlippage(vaultId);
  const [estimateA, estimateB] = useMemo(() => {
    if (
      withdrawSize.length &&
      Number(withdrawSize) > 0 &&
      tokenMintA &&
      tokenMintB &&
      lpTokenMint &&
      totals
    ) {
      const totalSupply = new Decimal(lpTokenMint.supply.toString()).div(
        10 ** CLP_VAULT_TOKEN_DECIMALS
      );
      const shareOfSupply = new Decimal(withdrawSize).div(totalSupply);
      const totalA = new Decimal(totals.tokenA.toString()).div(
        10 ** tokenMintA.decimals
      );
      const totalB = new Decimal(totals.tokenB.toString()).div(
        10 ** tokenMintB.decimals
      );
      return [
        shareOfSupply.mul(totalA).toString(),
        shareOfSupply.mul(totalB).toString(),
      ];
    }
    return ["0.0", "0.0"];
  }, [lpTokenMint, tokenMintA, tokenMintB, totals, withdrawSize]);

  const onWithdraw = useCallback(async () => {
    try {
      if (!tokenMintB || !tokenMintA) {
        throw new Error(t("State not loaded, please try again"));
      }
      setLoading(true);

      const estA = new Decimal(estimateA);
      const estB = new Decimal(estimateB);
      const { signatures, txTypes } = await withdraw(
        new BN(
          new Decimal(withdrawSize)
            .mul(10 ** CLP_VAULT_TOKEN_DECIMALS)
            .floor()
            .toString()
        ),
        new BN(
          estA
            .mul(10 ** tokenMintA.decimals)
            .floor()
            .toString()
        ),
        new BN(
          estB
            .mul(10 ** tokenMintB.decimals)
            .floor()
            .toString()
        ),
        parseFloat(slippage)
      );

      const sigx = Object.values(signatures);
      saveTx({
        action: t(
          "CLMM Withdraw {{tokenSymbolA}}-{{tokenSymbolB}} [{{tokenSymbolA}} {{amountA}}, {{tokenSymbolB}} {{amountB}}]",
          {
            tokenSymbolA,
            tokenSymbolB,
            amountA: amountFormatterTokenA(estimateA),
            amountB: amountFormatterTokenB(estimateB),
          }
        ),
        message: t(
          "Successfully withdrew {{amountA}} {{tokenSymbolA}} and {{amountB}} {{tokenSymbolB}}",
          {
            tokenSymbolA,
            tokenSymbolB,
            amountA: amountFormatterTokenA(estimateA),
            amountB: amountFormatterTokenB(estimateB),
          }
        ),
        signatures: sigx.map((s, i) => ({
          signature: s,
          type: txTypes[i],
        })),
      });
      setWithdrawSize("");
    } catch (err) {
      console.log({ err });
      if ((err as { code: number }).code === 6017) {
        toast.error(
          t(
            "Problem matching expected withdrawal amount. Please try increasing the slippage."
          )
        );
      } else {
        if ((err as { message?: string }).message)
          toast.error((err as { message: string }).message);
      }
    } finally {
      setLoading(false);
    }
  }, [
    tokenMintB,
    tokenMintA,
    estimateA,
    estimateB,
    withdraw,
    withdrawSize,
    slippage,
    saveTx,
    t,
    tokenSymbolA,
    tokenSymbolB,
    amountFormatterTokenA,
    amountFormatterTokenB,
  ]);

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
        <div className={`my-4 font-montserrat font-semibold text-sm`}>
          <p className="mt-4">{t("LP Token Amount")}</p>
          <NumberInput
            placeholder={
              !tokenLPBalanceTotal
                ? t("Nothing to withdraw")
                : t("Enter amount")
            }
            value={withdrawSize}
            onChange={setWithdrawSize}
            max={tokenLPBalanceTotal.toNumber()}
            disabled={!tokenLPBalanceTotal}
          />
          <div className="mt-1 flex items-center">
            <span className="mr-1">
              <WalletIcon className="h-5 w-5" />
            </span>
            <InfoTooltip
              disabled={!psyStakingRecord}
              tooltipContent={
                psyStakingRecord ? (
                  <p className="mt-1 font-bold">
                    {t("Unstaked: {{unstaked}} | Staked: {{staked}}", {
                      unstaked: new Decimal(tokenLPAta?.amount.toString() ?? 0)
                        .div(10 ** CLP_VAULT_TOKEN_DECIMALS)
                        .toString(),
                      staked: new Decimal(0)
                        .div(10 ** CLP_VAULT_TOKEN_DECIMALS)
                        .toString(),
                    })}
                  </p>
                ) : null
              }
            >
              <p
                className={`${
                  psyStakingRecord ? "border-b-[1px] border-dashed" : ""
                }  border-text-placeholder`}
              >
                {t("Balance: {{balance}} LP Tokens", {
                  balance: tokenLPBalanceTotal.toNumber(),
                })}
              </p>
            </InfoTooltip>
          </div>

          <div className="mt-4 bg-background-panelSurface p-3 rounded-lg">
            <p className="text-text-placeholder">{t("You receive")}</p>
            <div className="flex justify-between flex-row align-middle items-center">
              <div className="flex flex-row items-center space-x-1 ">
                <Logo size={19} src={tokenA?.logoURI ?? ""} noFilter />
                <p className="text-text font-khand mt-1 text-xl">
                  {tokenA?.symbol}
                </p>
              </div>
              <p className="text-lg text-primary font-medium">
                {amountFormatterTokenA(estimateA)} {tokenA?.symbol}
              </p>
            </div>
            <div className="flex justify-between flex-row align-middle items-center">
              <div className="flex flex-row items-center space-x-1 ">
                <Logo size={19} src={tokenB?.logoURI ?? ""} noFilter />
                <p className="text-text font-khand mt-1 text-xl">
                  {" "}
                  {tokenB?.symbol}
                </p>
              </div>
              <p className="text-lg text-primary font-medium">
                {amountFormatterTokenB(estimateB)} {tokenB?.symbol}
              </p>
            </div>
          </div>
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
            loading={loading}
            className="w-full mt-6"
            onClick={onWithdraw}
          >
            {t("Withdraw")}
          </Button>
        </div>
      )}
    </div>
  );
};
