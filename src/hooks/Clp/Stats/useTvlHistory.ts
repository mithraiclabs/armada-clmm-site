import { useCallback } from "react";
import axios from "axios";
import { RangeType } from "../../../components/CLP/Stats";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { NetworkOption } from "../../../utils/types";
import {
  RawTvlData,
  useUpdateTVLHistory,
  vaultTvlHistoryAtomFamily,
} from "../../../state";
import { useRecoilValue } from "recoil";
import { getRange } from "../../../utils/stats";
import { DEVELOPMENT_MODE } from "../../../utils/constants";

const TVL_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/allVaultsTvlHistory"
  : "https://allvaultstvlhistory-miqb2uc7eq-uc.a.run.app/";

export const useTvlHistory = (vaultId: string) => {
  const updateTvlHistory = useUpdateTVLHistory();
  const tvlHistory = useRecoilValue(vaultTvlHistoryAtomFamily(vaultId));
  const [network] = useDevnetState();

  return useCallback(
    async (range: RangeType) => {
      if (tvlHistory.length) return;
      const [from, to] = getRange(range);
      const { data: tvlData } = await axios.get(
        `${TVL_API}?${
          network === NetworkOption.Devnet
            ? "network=devnet"
            : "network=mainnet"
        }&from=${from}&to=${to}&vaultId=${vaultId}`
      );
      updateTvlHistory(tvlData as RawTvlData);
    },
    [network, tvlHistory.length, updateTvlHistory, vaultId]
  );
};
