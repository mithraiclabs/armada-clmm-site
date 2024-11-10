import { clpVaultAtomFamily } from "../../../state";
import { useLoadClpVault } from "../../../hooks/Clp/useLoadClpVault";
import { useLoadSplMintsFromClpVault } from "../../../hooks/useLoadSplMintsFromClpVault";
import { useLoadClpTokenMetadatas } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { useRecoilValue } from "recoil";
import { ClpVaultSymbols } from "../../../components/CLP/ClpVaultSymbols";
import {
  TvlHistoryChart,
  RateHistoryChart,
  RangeSelector,
} from "../../../components/CLP/Stats";
import { ReturnsChart } from "../../../components/CLP/Stats/ReturnsChart";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { Button } from "../../../components/Button";
import { useNavigate } from "react-router";
import { useLoadStatsData } from "../../../hooks/Clp/Stats/useLoadStatsData";

import { EventHistory } from "../../../components/CLP/Stats/EventHistory";
import { ClpVaultLogos } from "../../../components/CLP/ClpVaultLogos";
import { useRef } from "react";

export const ClpStats = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const loadingClpVault = useLoadClpVault(clpKey);
  const navigate = useNavigate();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  useLoadStatsData(clpKey);
  useLoadSplMintsFromClpVault(clpKey);
  useLoadClpTokenMetadatas(clpKey);

  if (!clpVault && loadingClpVault) {
    return <div>loading</div>;
  }

  return (
    <div className="mx-4 md:mx-0 grid grid-cols-12 gap-4">
      <div className="hidden xl:block xl:col-span-2" />
      <div className="col-span-12 xl:col-span-8 flex justify-between items-center p-4">
        <div className="flex flex-row align-middle items-center">
          <Button
            className="py-0 px-0 max-h-8 mr-2"
            onClick={() => {
              navigate(`/clmm/${clpKey}`);
            }}
            variant="outline"
          >
            ←
          </Button>
          <div className="text-text text-center text-2xl font-semibold font-khand uppercase flex">
            <div className="hidden lg:flex flex-row">
              <ClpVaultLogos clpKey={clpKey} noFilter />
            </div>
            <ClpVaultSymbols clpKey={clpKey} /> Vault stats
          </div>
        </div>
        <div className="hidden md:flex md:flex-grow justify-end">
          <RangeSelector />
        </div>
      </div>
      <div className="hidden xl:block xl:col-span-2" />
      <div className="hidden xl:block xl:col-span-2" />

      <div
        className="col-span-12 xl:col-span-8 space-y-4"
        ref={chartContainerRef}
      >
        <div className="md:hidden flex flex-row justify-center">
          <RangeSelector />
        </div>
        <TvlHistoryChart containerRef={chartContainerRef} />
        <ReturnsChart containerRef={chartContainerRef} />
        <RateHistoryChart containerRef={chartContainerRef} />
        <EventHistory />
      </div>
      <div className="hidden xl:block xl:col-span-2" />
    </div>
  );
};
