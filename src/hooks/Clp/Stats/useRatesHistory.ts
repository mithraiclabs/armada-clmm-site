import { useCallback } from "react";
import axios from "axios";
import { RangeType } from "../../../components/CLP/Stats";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { NetworkOption } from "../../../utils/types";
import {
  RawRateData,
  useUpdateRateHistory,
  vaultRateHistoryAtomFamily,
} from "../../../state";
import { useRecoilValue } from "recoil";
import { getRange } from "../../../utils/stats";
import { DEVELOPMENT_MODE } from "../../../utils/constants";

const RATES_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/allVaultsRatesHistory"
  : "https://allvaultsrateshistory-miqb2uc7eq-uc.a.run.app/";

export const useRatesHistory = (vaultId: string) => {
  const updateRateHistory = useUpdateRateHistory();
  const feeHistory = useRecoilValue(vaultRateHistoryAtomFamily(vaultId));
  const [network] = useDevnetState();

  return useCallback(
    async (range: RangeType) => {
      if (feeHistory.length) return;
      const [from, to] = getRange(range);
      const { data: rateData } = await axios.get(
        `${RATES_API}?${
          network === NetworkOption.Devnet
            ? "network=devnet"
            : "network=mainnet"
        }&from=${from}&to=${to}&vaultId=${vaultId}`
      );
      updateRateHistory(rateData as RawRateData);
    },
    [feeHistory.length, network, updateRateHistory, vaultId]
  );
};
