import { useCallback } from "react";
import axios from "axios";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { NetworkOption } from "../../../utils/types";
import {
  useUpdateEventHistory,
  vaultEventHistoryAtomFamily,
} from "../../../state";
import { useRecoilValue } from "recoil";
import { EventDocument, FirebaseTimestamp } from "../../../../../types/events";
import { DEVELOPMENT_MODE } from "../../../utils/constants";

const EVENTS_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/eventHistory"
  : "https://eventhistory-miqb2uc7eq-uc.a.run.app/";

export const useEventHistory = (vaultId: string) => {
  const updateEventHistory = useUpdateEventHistory();
  const eventHistory = useRecoilValue(vaultEventHistoryAtomFamily(vaultId));
  const [network] = useDevnetState();

  return useCallback(async () => {
    if (eventHistory.length) return;
    const { data: eventData } = await axios.get(
      `${EVENTS_API}?${
        network === NetworkOption.Devnet ? "network=devnet" : "network=mainnet"
      }&vault=${vaultId}`
    );

    updateEventHistory({ [vaultId]: eventData } as {
      [vaultId: string]: EventDocument<FirebaseTimestamp>[];
    });
  }, [eventHistory.length, network, vaultId, updateEventHistory]);
};
