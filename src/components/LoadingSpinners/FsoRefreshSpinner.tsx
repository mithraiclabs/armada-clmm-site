import { useEffect, useState } from "react";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "../common/InfoTooltip";
import { CircularProgress } from "../common/ReloadSpinner";
import { useLoadPythPriceDataForFsosManual } from "../../hooks/pyth/useLoadPythPriceDataForFsos";
import { useLoadSwitchboardAggregatorsForFsosManual } from "../../hooks/switchboard/useLoadSwitchboardAggregatorsForFsos";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";

export const FsoRefreshSpinner = ({
  refreshInterval,
}: {
  refreshInterval: number;
}) => {
  const [progress, setProgress] = useState(1);
  const loadPythData = useLoadPythPriceDataForFsosManual();
  const loadSwitchBoard = useLoadSwitchboardAggregatorsForFsosManual();
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
      loadSwitchBoard();
      loadPythData();
    }
  }, [isVisible, loadPythData, loadSwitchBoard, progress]);

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
