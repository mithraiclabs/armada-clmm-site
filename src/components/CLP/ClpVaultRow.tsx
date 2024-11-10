import { useState } from "react";
import { PointsEligibleVaults, usdFormatter } from "../../utils/constants";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  selectClp24HrFees,
  selectClp24HrVolume,
  selectClpDailyFeesYield,
  selectClpVaultUserBalance,
  selectVaultMaxTvl,
  selectVaultTvl,
  tokenMetadataFamily,
} from "../../state";
import { useMintAmountFormatter } from "../../hooks/utils/useMintAmountFormatter";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { ClpVaultSymbols } from "./ClpVaultSymbols";
import { ClpVaultLogos } from "./ClpVaultLogos";
import { ReactComponent as Badge } from "../../assets/icons/exclamationBadge.svg";
import { BeakTooltip } from "../common/ToolTip";

export const ClpVaultRow = ({ vaultId }: { vaultId: string }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const wallet = useAnchorWallet();
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  const tvl = useRecoilValue(selectVaultTvl(vaultId));
  const maxTvl = useRecoilValue(selectVaultMaxTvl(vaultId));
  const dailyRate = useRecoilValue(selectClpDailyFeesYield(vaultId));
  const totalDayFees = useRecoilValue(selectClp24HrFees(vaultId));
  const totalDayVolume = useRecoilValue(selectClp24HrVolume(vaultId));
  const [vaultUserBalanceA, vaultUserBalanceB] = useRecoilValue(
    selectClpVaultUserBalance(vaultId)
  );
  const amountFormatterTokenA = useMintAmountFormatter(mintA);
  const amountFormatterTokenB = useMintAmountFormatter(mintB);

  if (!tokenA || !tokenB || !vault) {
    return null;
  }
  const points = PointsEligibleVaults[vaultId];
  return (
    <div
      className={`
        grid grid-cols-12 mt-2
        bg-background-panel
        rounded-xl cursor-pointer text-center border
        border-background-panelStroke
        font-semibold text-xs lg:text-sm
        ${hovered ? "highlight-green text-primary outline outline-1" : ""}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        navigate("/clmm/" + vaultId);
      }}
    >
      {/* Asset */}
      <div className="col-span-2 flex items-center">
        <div className="py-4 px-2 md:px-4 text-left">
          <div className="flex flex-grow-0 flex-row items-center">
            <ClpVaultLogos
              clpKey={vaultId}
              glow={hovered}
              noFilter
              className="h-5"
            />
            <div className="w-2" />
            <ClpVaultSymbols clpKey={vaultId} />
            <div className="w-2" />
            {points && <PointsVaultTooltip />}
          </div>
        </div>
      </div>
      {/* User Position */}
      <div className="col-span-2 flex items-center justify-center">
        {wallet?.publicKey ? (
          <div className="items-center flex flex-col xl:flex-row justify-evenly lg:space-x-1">
            <div>
              {amountFormatterTokenA(vaultUserBalanceA)} {tokenA.symbol}
            </div>

            <div>
              {amountFormatterTokenB(vaultUserBalanceB)} {tokenB.symbol}
            </div>
          </div>
        ) : (
          <p>-</p>
        )}
      </div>
      {/* 24HR Rate */}
      <div className="col-span-1 flex items-center justify-center">
        {dailyRate?.gt(0) ? dailyRate.mul(100).toFixed(2) : "-"}%
      </div>
      {/* TVL */}
      <div className="col-span-3 flex items-center justify-center">
        {tvl ? usdFormatter.format(tvl.toNumber()) : "-"}
        <span className="text-text-placeholder">
          /{usdFormatter.format(maxTvl.toNumber())}
        </span>
      </div>
      {/* 24Hr Fees */}
      <div className="col-span-1 flex items-center justify-center">
        {totalDayFees ? usdFormatter.format(totalDayFees.toNumber()) : "-"}
      </div>
      {/* 24Hr Volume */}
      <div className="col-span-2 flex items-center justify-center">
        {totalDayVolume ? usdFormatter.format(totalDayVolume.toNumber()) : "-"}
      </div>
    </div>
  );
};

export const PointsVaultTooltip = () => {
  const [show, setShow] = useState(false);
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShow((s) => !s);
      }}
    >
      <BeakTooltip
        force={show}
        content={"Points eligible"}
        colorClassname="bg-background-lime "
      >
        <Badge />
      </BeakTooltip>
    </div>
  );
};
