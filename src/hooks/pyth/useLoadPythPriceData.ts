import {
  getPythProgramKeyForCluster,
  PriceData,
  PythHttpClient,
} from "@pythnetwork/client";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { useUpdatePythPriceData } from "../../state";
import { NetworkOption } from "../../utils/types";

export const useLoadPythPriceData = () => {
  const { connection } = useConnection();
  const [network] = useDevnetState();
  const updatePythPriceData = useUpdatePythPriceData();
  const client = useMemo(() => {
    const pythProgramId = getPythProgramKeyForCluster(
      network === NetworkOption.Devnet ? "devnet" : "mainnet-beta"
    );
    return new PythHttpClient(connection, pythProgramId, "confirmed");
  }, [connection, network]);

  return useCallback(
    async (priceAccounts: PublicKey[]) => {
      const priceDataList = await client.getAssetPricesFromAccounts(
        priceAccounts
      );
      const priceDataTuples = priceDataList.map((priceData, index) => [
        priceData,
        priceAccounts[index],
      ]) as [PriceData, PublicKey][];
      updatePythPriceData(priceDataTuples);
    },
    [client, updatePythPriceData]
  );
};
