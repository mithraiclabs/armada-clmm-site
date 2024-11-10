import { PublicKey } from "@solana/web3.js";
import SwitchboardV2Lite from "@switchboard-xyz/sbv2-lite";
import { useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { useUpdateSwitchboardAggregatorDatas } from "../../state";
import { fetchMultipleAggregators } from "../../utils/switchboard";
import { NetworkOption } from "../../utils/types";

export const useLoadSwitchboardAggregators = () => {
  const [network] = useDevnetState();
  const { connection } = useConnection();
  const updateSwitchboardAggregatorDatas =
    useUpdateSwitchboardAggregatorDatas();

  return useCallback(
    async (aggregatorAccounts: PublicKey[]) => {
      const switchboardProgram = await (network === NetworkOption.Devnet
        ? SwitchboardV2Lite.loadDevnet(connection)
        : SwitchboardV2Lite.loadMainnet(connection));
      const aggregators = await fetchMultipleAggregators(
        switchboardProgram,
        aggregatorAccounts
      );
      updateSwitchboardAggregatorDatas(aggregators);
    },
    [connection, network, updateSwitchboardAggregatorDatas]
  );
};
