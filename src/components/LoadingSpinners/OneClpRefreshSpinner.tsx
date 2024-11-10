import { useEffect, useState } from "react";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "../common/InfoTooltip";
import { CircularProgress } from "../common/ReloadSpinner";
import { useLoadClpVaultFunc } from "../../hooks/Clp/useLoadClpVault";
import { useTokenPriceManual } from "../../hooks/utils/useTokenPrice";
import { useFetchAndUpdateVaultPositions } from "../../hooks/Clp/useLoadClpVaultPositions";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";

export const OneClpRefreshSpinner = ({
  clpKey,
  refreshInterval,
}: {
  clpKey: string;
  refreshInterval: number;
}) => {
  const [progress, setProgress] = useState(1);
  const loadVaultAndWhirlpool = useLoadClpVaultFunc(clpKey);
  const loadVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const loadTokenPrice = useTokenPriceManual();
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
      loadTokenPrice();
      loadVaultPositions();
    }
  }, [
    isVisible,
    loadTokenPrice,
    loadVaultAndWhirlpool,
    loadVaultPositions,
    progress,
  ]);

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
