import { useEffect, useState } from "react";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "../common/InfoTooltip";
import { CircularProgress } from "../common/ReloadSpinner";
import { useLoadLbcStateManual } from "../../state";
import { useLoadLbcAuditLogManual } from "../../hooks/Lbc/useLoadLbcAuditLog";
import { useLoadLbcTokenSwappersManual } from "../../hooks/Lbc/useLoadLbcTokenSwappers";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";

export const LbcRefreshSpinner = ({
  lbcKey,
  refreshInterval,
}: {
  lbcKey: string;
  refreshInterval: number;
}) => {
  const [progress, setProgress] = useState(1);
  const loadLbc = useLoadLbcStateManual(lbcKey);
  const loadLbcAudit = useLoadLbcAuditLogManual(lbcKey);
  const loadLbcSwappers = useLoadLbcTokenSwappersManual(lbcKey);
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
      loadLbc();
      loadLbcAudit();
      loadLbcSwappers();
    }
  }, [isVisible, loadLbc, loadLbcAudit, loadLbcSwappers, progress]);

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
