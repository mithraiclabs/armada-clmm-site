import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { ClpVaultAction } from "../../../components/CLP/ClpVaultAction";
import { RateBreakdown } from "../../../components/CLP/ReturnsBreakdown";
import { PositionRange } from "../../../components/CLP/PositionRange";
import { clpVaultAtomFamily, selectIsVaultDeprecated } from "../../../state";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useRecoilValue } from "recoil";
import { useLoadClpVault } from "../../../hooks/Clp/useLoadClpVault";
import { useLoadSplAccounts } from "../../../hooks/useLoadSplAccounts";
import { useLoadSplMintsFromClpVault } from "../../../hooks/useLoadSplMintsFromClpVault";
import { useLoadClpVaultPositions } from "../../../hooks/Clp/useLoadClpVaultPositions";
import { useTokenPrice } from "../../../hooks/utils/useTokenPrice";
import { useLoadClpHistory } from "../../../hooks/Clp/useLoadClpHistory";
import { useRedirectToVaultsOnNetworkChange } from "../../../hooks/Clp/useRedirectToVaultsOnNetworkChange";
import { TotalValueLocked } from "../../../components/CLP/TotalValueLocked";
import { YourPositionHeading } from "./YourPositionHeading";
import { useLoadClpTokenMetadatas } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { Button } from "../../../components/Button";
import { ClpVaultSymbols } from "../../../components/CLP/ClpVaultSymbols";
import { ClpVaultLogos } from "../../../components/CLP/ClpVaultLogos";
import { VaultStrategy } from "../../../components/CLP/VaultStrategy";
import { StakedLpTokensHeading } from "./StakedLpTokensHeading";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { TextButton } from "../../../components/Button/TextButton";
import { useWalletHistory } from "../../../hooks/utils/useWalletHistory";
import { OneClpRefreshSpinner } from "../../../components/LoadingSpinners/OneClpRefreshSpinner";
import { Portal } from "../../../components/Portal";
import { useTranslation } from "react-i18next";
import { PointsEligibleVaults, PointsInfo } from "../../../utils/constants";
import { ReactComponent as StatsIcon } from "../../../assets/icons/stats.svg";
import { SimpleCard } from "../../../components/common";
import { FeeBreakdown } from "../../../components/CLP/FeeBreakdown";

export const ClpVaultPage = () => {
  const { t } = useTranslation();
  const wallet = useAnchorWallet();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const mintLP = clpVault?.lpMint.toString() ?? "";
  const mints = useMemo(
    () => (mintA && mintB && mintLP ? [mintA, mintB, mintLP] : []),
    [mintA, mintB, mintLP]
  );
  const isDeprecated = useRecoilValue(selectIsVaultDeprecated(clpKey));
  const { downloadDepositWithdrawHistory } = useWalletHistory(clpKey);
  const loadSplAccs = useLoadSplAccounts();
  const navigate = useNavigate();
  const location = useLocation();

  useRedirectToVaultsOnNetworkChange();
  useLoadClpVaultPositions(clpKey);
  useLoadClpVault(clpKey);
  useTokenPrice();
  useLoadClpHistory();
  useLoadSplMintsFromClpVault(clpKey);
  useLoadClpTokenMetadatas(clpKey);

  useEffect(() => {
    loadSplAccs(mints);
  }, [loadSplAccs, mints]);

  if (!clpVault) {
    return null;
  }
  const points = PointsEligibleVaults[clpKey];

  return (
    <>
      <div className="mx-4 md:mx-0 grid grid-cols-12 gap-4">
        <Portal portalId="spinner">
          <OneClpRefreshSpinner clpKey={clpKey} refreshInterval={30} />
        </Portal>
        {/* Top of grid for navigation and meta data */}
        <div className="hidden xl:block xl:col-span-3" />
        <div className="col-span-6 xl:col-span-3 flex justify-between items-center">
          <div className="flex-1 flex flex-row justify-between">
            <div className="flex flex-row align-middle">
              <Button
                className="py-0 px-0 max-h-8"
                onClick={() => {
                  navigate("/clmm");
                }}
                variant="outline"
              >
                ←
              </Button>
              <div className="flex flex-row items-center">
                <p className="text-text text-2xl font-semibold font-khand uppercase px-2">
                  <ClpVaultSymbols clpKey={clpKey} />
                </p>
                {isDeprecated && (
                  <p className="ml-2 text-sm text-text-warning">deprecated</p>
                )}
              </div>
            </div>
            <div className="hidden md:flex flex-row">
              <ClpVaultLogos clpKey={clpKey} noFilter />
            </div>
          </div>
        </div>
        <div className="flex flex-row col-span-6 xl:col-span-3 justify-end md:justify-between space-x-6 items-center text-end md:text-start mr-1">
          <YourPositionHeading />
          <StakedLpTokensHeading />
        </div>
        <div className="hidden xl:block xl:col-span-3" />
        {/* Main content */}
        <div className="hidden xl:block xl:col-span-3" />
        <div className="col-span-12 md:col-span-6 xl:col-span-3 space-y-4">
          <ClpVaultAction vaultId={clpKey} />
          {clpVault.marketMakingKey.toString() ===
            wallet?.publicKey.toString() && (
            <div className="my-2 text-center flex-1">
              <Link className="text-primary" to="mm">
                {t("Market Making")}
              </Link>
            </div>
          )}

          <FeeBreakdown />

          <Button
            className=" w-full "
            variant="outline"
            onClick={() => {
              const currentPath = location.pathname;
              const newPath = `${currentPath}/stats`;
              navigate(newPath);
            }}
          >
            <StatsIcon className="mr-4" />
            View Strategy Stats
          </Button>

          {wallet && (
            <div className="mb-2 text-center flex-1">
              <TextButton
                className="text-primary"
                onClick={downloadDepositWithdrawHistory}
              >
                {t("Download History (.csv)")}
              </TextButton>
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-3 space-y-4">
          {points && <PointsCard points={points} />}
          <RateBreakdown />
          <TotalValueLocked />
          <VaultStrategy />
          <PositionRange />
        </div>
        <div className="hidden xl:block xl:col-span-3" />
      </div>
    </>
  );
};

export const PointsCard = ({ points }: { points: PointsInfo }) => {
  return (
    <SimpleCard className="max-w-full mx-0" pulse>
      <p className="font-khand text-2xl text-text-placeholder font-semibold">
        {points.tokenSymbol} Points Eligibility
      </p>
      <span className="font-semibold">{points.description}</span>
      <div className="flex flex-row justify-start">
        <TextButton className="mt-4 text-primary">
          <a href={points.infoLink} target="_blank">
            Learn more
          </a>
        </TextButton>
      </div>
    </SimpleCard>
  );
};
