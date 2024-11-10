import { useCallback, useEffect } from "react";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { API_BASE_URL } from "../../utils/constants";
import { VaultHistoryResp, useUpdateVaultHistories } from "../../state";
import { NetworkOption } from "../../utils/types";

export const useLoadClpHistory = () => {
  const load = useLoadClpHistoryManual();

  useEffect(() => {
    load();
  }, [load]);
};

export const useLoadClpHistoryManual = () => {
  const [network] = useDevnetState();
  const updateVaultHistories = useUpdateVaultHistories();

  return useCallback(() => {
    (async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}?${
            network === NetworkOption.Devnet ? "network=devnet" : ""
          }`
        );
        const data: VaultHistoryResp = await resp.json();
        updateVaultHistories(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [network, updateVaultHistories]);
};
