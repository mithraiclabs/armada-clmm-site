import { RefObject, useLayoutEffect, useState } from "react";

export const useMeasure = <T extends HTMLElement>(ref: RefObject<T>) => {
  const [dims, setDims] = useState({ width: 0, height: 0, x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const updateDims = () => {
      if (!ref.current) {
        return;
      }
      console.log("what ", ref.current.getBoundingClientRect());
      const rect = ref.current.getBoundingClientRect();
      setDims({
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
      });
    };

    // update dims on mount
    updateDims();

    window.addEventListener("resize", updateDims);

    return () => {
      window.removeEventListener("resize", updateDims);
    };
  }, [ref]);

  return dims;
};
