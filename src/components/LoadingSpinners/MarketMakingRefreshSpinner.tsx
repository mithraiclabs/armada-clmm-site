import { useEffect, useState } from "react";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "../common/InfoTooltip";
import { CircularProgress } from "../common/ReloadSpinner";
import { useFetchAndUpdateVaultPositions } from "../../hooks/Clp/useLoadClpVaultPositions";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";
import { useLoadClpVaultFunc } from "../../hooks/Clp/useLoadClpVault";

export const MarketMakingRefreshSpinner = ({
  clpKey,
  refreshInterval,
}: {
  clpKey: string;
  refreshInterval: number;
}) => {
  const [progress, setProgress] = useState(1);
  const loadVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const loadVaultAndWhirlpool = useLoadClpVaultFunc(clpKey);
  const isVisible = usePageVisibility();

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
      loadVaultAndWhirlpool();
      loadVaultPositions();
    }
  }, [isVisible, loadVaultAndWhirlpool, loadVaultPositions, progress]);

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
