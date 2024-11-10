import { useEffect } from "react";
import { useLoadAllClpVaults } from "../../hooks/Clp/useLoadClpVault";
import { selectVaultWhirlpoolKeys } from "../../state";
import { useRecoilValue } from "recoil";
import { Portal } from "../../components/Portal";
import { AllClpRefreshSpinner } from "../../components/LoadingSpinners/AllClpRefreshSpinner";
import { WhirlpoolCard } from "../../components/CLP/WhirlpoolCard";
import { useLoadUserPositionsForWhirlpools } from "../../hooks/Whirlpool/useLoadUserPositionsForAllWhirlpools";

export const Whirlpools = () => {
  const load = useLoadAllClpVaults();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-4 md:mx-12 lg:mx-24 mt-2">
      <Portal portalId="spinner">
        <AllClpRefreshSpinner refreshInterval={600} />
      </Portal>
      <WhirlpoolCardView />
    </div>
  );
};

export const WhirlpoolCardView = () => {
  const whirlpoolKeys = useRecoilValue(selectVaultWhirlpoolKeys);
  const loadPositions = useLoadUserPositionsForWhirlpools();
  useEffect(() => {
    if (whirlpoolKeys.length) loadPositions();
  }, [loadPositions, whirlpoolKeys.length]);
  return (
    <div className="grid grid-cols-12 gap-4">
      {whirlpoolKeys.map((k) => (
        <div key={k} className="col-span-12 md:col-span-4 xl:col-span-3 flex">
          <WhirlpoolCard whirlpoolKey={k} />
        </div>
      ))}
    </div>
  );
};
