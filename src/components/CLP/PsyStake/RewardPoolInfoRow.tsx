import toast from "react-hot-toast";
import { Decimal } from "../../../utils/decimal";
import { useRecoilValue } from "recoil";
import { TextButton } from "../../Button/TextButton";
import { Logo } from "../../common";
import { PsyStakeRewardPool, tokenMetadataFamily } from "../../../state";
import { ReactComponent as CopyIcon } from "../../../assets/icons/copy.svg";

export const RewardPoolInfoRow = ({ pool }: { pool: PsyStakeRewardPool }) => {
  const meta = useRecoilValue(
    tokenMetadataFamily(pool.rewardTokenMint.toString())
  );
  const { distributionType, rewardTokenAccount } = pool;

  return (
    <div className="pb-2">
      <div className="flex flex-row justify-between items-center">
        <Logo src={meta?.logoURI} fallbackImage noFilter />
        <p className=" font-khand text-lg font-semibold">{meta?.symbol}</p>
        <p className="font-semibold">
          {distributionType.constant
            ? `${new Decimal(pool.constantRewardPerEpoch.toString())
                .div(10 ** pool.epochRewardDecimals)
                .toString()} per epoch`
            : `${pool.percentageRewardMbpsPerEpoch.toString()}% per epoch`}
        </p>
      </div>
      <div className="flex flex-row justify-between items-center">
        <p className=" font-semibold ">
          {distributionType.constant ? "Constant" : "Pecentage"}
        </p>
        <p>
          Starting epoch :{" "}
          <span className="font-semibold">{pool.startingEpoch}</span>
        </p>
        <p>{pool.isActive ? "Active" : "Inactive"}</p>
      </div>
      <TextButton
        className="flex flex-row items-center mb-4"
        onClick={() => {
          navigator.clipboard.writeText(rewardTokenAccount.toString());
          toast.success("Copied to clipboard", { duration: 1000 });
        }}
      >
        <p className="text-sm font-semibold">
          Reward Account: {rewardTokenAccount.toString()}
        </p>
        <CopyIcon className="text-text-placeholder ml-1" />
      </TextButton>
    </div>
  );
};
