import { useRecoilValue } from "recoil";
import { tokenMetadataFamily } from "../../../state";
import {
  OptionMeta,
  optionMintToMetaFamily,
  selectFsoDiscountPercentage,
} from "../../../state/fso";
import { Logo } from "../../common/Logo";
import { useMintAmountFormatter } from "../../../hooks/utils/useMintAmountFormatter";
import { useTranslation } from "react-i18next";

export const OptionRewardRow = ({
  rewardMint,
  option,
  amount,
}: {
  rewardMint: string;
  option: OptionMeta;
  amount: number;
}) => {
  const { t } = useTranslation();
  const underlyingMint = option.underlyingMint;
  const quoteMint = option.quoteMint;
  const underlyingToken = useRecoilValue(
    tokenMetadataFamily(underlyingMint.toString())
  );
  const quoteToken = useRecoilValue(tokenMetadataFamily(quoteMint.toString()));
  const placeholderName = rewardMint.slice(0, 4) + "..." + rewardMint.slice(-4);
  const amountFormatter = useMintAmountFormatter(rewardMint);
  const optionPK = useRecoilValue(optionMintToMetaFamily(rewardMint));
  const discountPercentage = useRecoilValue(
    selectFsoDiscountPercentage(optionPK ?? "")
  );
  if (!amount) {
    return null;
  }

  return (
    <div key={rewardMint}>
      <div className="grid grid-cols-12 gap-x-2">
        <div className="flex flex-row col-span-2 p-1 items-center justify-center">
          {underlyingToken && (
            <Logo src={underlyingToken.logoURI} noFilter size={22} />
          )}
          {quoteToken && <Logo src={quoteToken.logoURI} noFilter size={22} />}
        </div>
        <div className="flex justify-between col-span-10">
          <p className=" font-khand text-xl">
            {!underlyingToken || !quoteToken
              ? placeholderName
              : `${underlyingToken.symbol}-${quoteToken.symbol}`}
          </p>
          <p className=" text-primary p-1">{amountFormatter(amount)}</p>
        </div>
        <div className="col-span-2" />
        <div className="flex justify-between col-span-10">
          <p className="text-sm text-text-placeholder font-semibold">
            {t("Discount")}
          </p>
          <p className="text-text-placeholder">
            {(100 * discountPercentage).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};
