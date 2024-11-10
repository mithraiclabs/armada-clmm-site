import { useRecoilValue } from "recoil";
import { tokenMetadataFamily } from "../../../state";
import { Logo } from "../../common/Logo";
import { formatAmount } from "../../../utils/formatters";

export const TokenRewardRow = ({
  rewardMint,
  amount,
  decimals,
}: {
  rewardMint: string;
  amount: number;
  decimals: number;
}) => {
  const rewardToken = useRecoilValue(tokenMetadataFamily(rewardMint));
  const placeholderName = rewardMint.slice(0, 4) + "..." + rewardMint.slice(-4);
  const formatted = formatAmount(amount, decimals);
  return (
    <div key={rewardMint}>
      <div className="grid grid-cols-12 gap-x-2">
        <div className="flex flex-row col-span-2 p-1 items-center justify-center">
          {rewardToken && <Logo src={rewardToken.logoURI} noFilter size={22} />}
        </div>
        <div className="flex justify-between col-span-10">
          <p className=" font-khand text-xl">
            {!rewardToken ? placeholderName : rewardToken.symbol}
          </p>
          <p className=" text-primary p-1"> {formatted}</p>
        </div>
      </div>
    </div>
  );
};
