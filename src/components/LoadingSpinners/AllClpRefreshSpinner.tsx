import { useEffect, useState } from "react";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "../common/InfoTooltip";
import { CircularProgress } from "../common/ReloadSpinner";
import { useLoadAllClpVaults } from "../../hooks/Clp/useLoadClpVault";
import { useTokenPriceManual } from "../../hooks/utils/useTokenPrice";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";

export const AllClpRefreshSpinner = ({
  refreshInterval,
}: {
  refreshInterval: number;
}) => {
  const [progress, setProgress] = useState(1);
  const isVisible = usePageVisibility();
  const loadClpVaults = useLoadAllClpVaults();
  const loadTokenPrice = useTokenPriceManual();

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 0 : prevProgress + 1
      );
    }, refreshInterval * 10);
    return () => {
      clearInterval(timer);
    };
  }, [refreshInterval]);

  useEffect(() => {
    if (progress === 0 && isVisible) {
      loadClpVaults();
      loadTokenPrice();
    }
  }, [isVisible, loadClpVaults, loadTokenPrice, progress]);

  return (
    <InfoTooltip
      tooltipContent={<div className="max-w-[120px]">Refresh Timer</div>}
    >
      <TextButton className="mr-4" onClick={() => setProgress(0)}>
        <CircularProgress percentage={progress} />
      </TextButton>
    </InfoTooltip>
  );
};
