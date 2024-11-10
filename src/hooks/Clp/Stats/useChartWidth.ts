import { RefObject, useCallback, useEffect, useState } from "react";

export const useChartWidth = (containerRef: RefObject<HTMLDivElement>) => {
  const [chartWidth, setChartWidth] = useState<number>(0);

  const updateChartSize = useCallback(() => {
    if (containerRef.current) {
      setChartWidth(containerRef.current.offsetWidth);
    }
  }, [containerRef]);

  useEffect(() => {
    updateChartSize();
    window.addEventListener("resize", updateChartSize);

    return () => {
      window.removeEventListener("resize", updateChartSize);
    };
  }, [containerRef, updateChartSize]);
  return chartWidth;
};
