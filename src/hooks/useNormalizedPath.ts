import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

/**
 * Converts the current pathname to the canonical route by
 * replacing all path variables with their respective name.
 * @returns string
 */
export const useNormalizedPath = () => {
  const location = useLocation();
  const params = useParams();
  return useMemo(() => {
    let ret = location.pathname;
    Object.entries(params).forEach(([key, val]) => {
      const regex = new RegExp(`/${val}`);
      ret = ret.replace(regex, `/:${key}`);
    });
    return ret;
  }, [location.pathname, params]);
};
