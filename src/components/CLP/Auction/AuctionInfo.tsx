import { useRecoilValue } from "recoil";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import {
  clpVaultAtomFamily,
  selectClpCurrentPrice,
  selectClpCurrentTrancheFillPercentage,
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUiInvertTokenPair,
  splMintAtomFamily,
} from "../../../state";
import { InfoLabel } from "../../common/InfoLabel";
import { Decimal } from "../../../utils/decimal";
import { ProgressBar } from "../../ProgressBar";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";

export const AuctionInfo = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const currentPrice = useRecoilValue(
    selectClpCurrentPrice(clpKey)
  )?.toNumber();
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const tokenA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenB = useRecoilValue(selectTokenBSymbol(clpKey));
  const invertedTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const mintInfo = useRecoilValue(
    splMintAtomFamily(invertedTokens ? mintB : mintA)
  );
  const priceFormatter = useMintAmountFormatter(invertedTokens ? mintB : mintA);
  const fillPercentage = useRecoilValue(
    selectClpCurrentTrancheFillPercentage(clpKey)
  );

  return (
    <div className="flex flex-row justify-between">
      <div className="flex flex-col justify-between flex-1 max-w-[250px]">
        <p className="flex font-montserrat font-semibold text-text-placeholder text-md">
          Current Tranche Progress
        </p>
        <ProgressBar percent={fillPercentage?.mul(100).toNumber() ?? 0} />
        <div />
      </div>
      <InfoLabel
        title="Current Price"
        value={
          priceFormatter(currentPrice) +
          " " +
          (invertedTokens ? tokenA : tokenB)
        }
        highlighted
      />
      <InfoLabel
        title="FDV"
        value={
          priceFormatter(
            new Decimal(mintInfo?.supply.toString() ?? "0")
              .div(10 ** (mintInfo?.decimals ?? 0))
              .mul(currentPrice ?? 0)
              .toNumber()
          ) +
          " " +
          (invertedTokens ? tokenA : tokenB)
        }
      />
    </div>
  );
};
