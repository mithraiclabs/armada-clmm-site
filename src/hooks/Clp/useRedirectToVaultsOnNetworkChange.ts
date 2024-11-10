import { useEffect, useRef } from "react";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { useNormalizedPath } from "../useNormalizedPath";
import { useNavigate } from "react-router";
import { usePrevious } from "../usePrevious";

/**
 * If on a vault page and the network changes, we redirect the user
 * back to the page listing all vaults.
 */
export const useRedirectToVaultsOnNetworkChange = () => {
  const mountLockRef = useRef(false);
  const path = useNormalizedPath();
  const [network] = useDevnetState();
  const navigate = useNavigate();
  const prevNetwork = usePrevious(network);

  useEffect(() => {
    if (!mountLockRef.current) {
      // prevent running on mount
      mountLockRef.current = true;
      return;
    }

    if (path === "/clmm/:clpKey" && prevNetwork !== network) {
      navigate("/clmm");
    }
  }, [navigate, network, path, prevNetwork]);
};
