import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLoadAllClpVaults,
  useLoadClpVaultFunc,
} from "../../hooks/Clp/useLoadClpVault";
import { useTokenPriceManual } from "../../hooks/utils/useTokenPrice";
import { useNormalizedPath } from "../../hooks/useNormalizedPath";
import { useFetchAndUpdateVaultPositions } from "../../hooks/Clp/useLoadClpVaultPositions";
import { TextButton } from "../Button/TextButton";
import { InfoTooltip } from "./InfoTooltip";
import { usePageVisibility } from "../../hooks/utils/usePageVisibility";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";

/**
 * @deprecated
 */
export const ReloadSpinner = () => {
  const [progress, setProgress] = useState(1);
  const { clpKey = "" } = useParamsWithOverride<{
    clpKey: string;
  }>();
  const normalizePath = useNormalizedPath();
  const isVisible = usePageVisibility();
  const loadVaultAndWhirlpool = useLoadClpVaultFunc(clpKey);
  const loadVaultPositions = useFetchAndUpdateVaultPositions(clpKey);
  const loadClpVaults = useLoadAllClpVaults();
  const loadTokenPrice = useTokenPriceManual();

  const reloadClp = useCallback(() => {
    loadClpVaults();
    loadTokenPrice();
  }, [loadClpVaults, loadTokenPrice]);

  const interval = useMemo(() => {
    if (normalizePath === "/clmm") return 120;
    if (normalizePath === "/clmm/:clpKey") return 30;
    if (normalizePath.startsWith("/lbc")) return 30;
    if (normalizePath === "/options") return 60;
    if (normalizePath === "/clmm/:clpKey/mm") return 30;
    return 300;
  }, [normalizePath]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 0 : prevProgress + 1
      );
    }, interval * 10);
    return () => {
      clearInterval(timer);
    };
  }, [interval]);

  useEffect(() => {
    setProgress(1);
  }, [normalizePath]);

  useEffect(() => {
    // NOTE: if adding a new route here, please add it to the `return null` block below so the refresher shows up
    if (progress === 0 && isVisible) {
      if (normalizePath === "/clmm") {
        reloadClp();
      } else if (normalizePath === "/clmm/:clpKey") {
        loadVaultAndWhirlpool();
        loadTokenPrice();
        loadVaultPositions();
      } else if (normalizePath === "/clmm/:clpKey/mm") {
        loadVaultPositions();
      }
    }
  }, [normalizePath, progress, isVisible, reloadClp, loadVaultPositions, loadTokenPrice, loadVaultAndWhirlpool]);

  if (
    ![
      "/clmm",
      "/clmm/:clpKey",
      "/clmm/:clpKey/mm",
      "/lbc",
      "/discount-tokens",
    ].includes(normalizePath)
  ) {
    // Do not show the refresher the current route is not supported in the above effect.
    return null;
  }

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

export const CircularProgress = ({
  percentage = 0,
  radius = 10,
  showPercentage = false,
}: {
  percentage?: number;
  radius?: number;
  showPercentage?: boolean;
}) => {
  const strokeWidth = Math.min(radius / 5, 4);
  const circumference = 2 * Math.PI * radius;
  const progress = percentage > 100 ? 1 : percentage / 100;
  const containerSize = (radius + strokeWidth) * 2;

  return (
    <div
      className="relative"
      style={{ width: containerSize, height: containerSize }}
    >
      <svg
        className="absolute top-0 left-0"
        width={containerSize}
        height={containerSize}
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={showPercentage ? "var(--panelStroke)" : "lightgray"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${radius + strokeWidth} ${
            radius + strokeWidth
          })`}
        />
      </svg>
      {showPercentage && (
        <p
          className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 
          -translate-y-1/2 font-khand text-xl
           ${percentage < 100 ? "text-text-placeholder" : "text-primary"}
           `}
          style={{ top: "calc(50% + 1px)" }}
        >
          {percentage < 100 ? `${percentage.toFixed(0)}%` : "FULL"}
        </p>
      )}
    </div>
  );
};
