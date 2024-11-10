import React, { useEffect, useMemo } from "react";
import { useLoadClpVault } from "../../../hooks/Clp/useLoadClpVault";
import { useLoadSplMintsFromClpVault } from "../../../hooks/useLoadSplMintsFromClpVault";
import { useLoadClpVaultPositions } from "../../../hooks/Clp/useLoadClpVaultPositions";
import { useTokenPrice } from "../../../hooks/utils/useTokenPrice";
import { useRedirectToVaultsOnNetworkChange } from "../../../hooks/Clp/useRedirectToVaultsOnNetworkChange";
import { useLoadClpTokenMetadatas } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { PositionRange } from "../../../components/CLP/PositionRange";
import { AuctionPurchaseContainer } from "../../../components/CLP/Auction/AuctionPurchaseContainer";
import { AuctionInfo } from "../../../components/CLP/Auction/AuctionInfo";
import { useRecoilValue } from "recoil";
import { clpVaultAtomFamily } from "../../../state";
import { useLoadSplAccounts } from "../../../hooks/useLoadSplAccounts";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";

export const ClmmAuctionPage = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const mintLP = clpVault?.lpMint.toString() ?? "";
  const mints = useMemo(
    () => (mintA && mintB && mintLP ? [mintA, mintB, mintLP] : []),
    [mintA, mintB, mintLP]
  );
  const loadSplAccs = useLoadSplAccounts();

  useRedirectToVaultsOnNetworkChange();
  useLoadClpVaultPositions(clpKey);
  useLoadClpVault(clpKey);
  useTokenPrice();
  useLoadSplMintsFromClpVault(clpKey);
  useLoadClpTokenMetadatas(clpKey);

  useEffect(() => {
    loadSplAccs(mints);
  }, [loadSplAccs, mints]);

  return (
    <div className="flex flex-col  mx-auto justify-between">
      <AuctionInfo />
      <div className="flex flex-col md:flex-row md:space-x-5">
        <AuctionPurchaseContainer />
        <PositionRange auction />
      </div>
    </div>
  );
};
