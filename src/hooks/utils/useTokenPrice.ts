import { useCallback, useEffect } from "react";
import axios from "axios";
import { tokenMintListAtom, useUpdatePrices } from "../../state";
import { useRecoilValue } from "recoil";
import { RangeType } from "../../components/CLP/Stats";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { NetworkOption } from "../../utils/types";
import { chunkArray } from "../../utils/tx-utils";
import { getRange } from "../../utils/stats";
import { DEVELOPMENT_MODE } from "../../utils/constants";

// this is also used as backup when pyth takes a while to start spitting out prices
const LIST_PRICES_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/tokenListPrices"
  : "https://tokenlistprices-miqb2uc7eq-uc.a.run.app/";

const PRICE_HISTORY_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/tokenPriceHistory"
  : "https://tokenpricehistory-miqb2uc7eq-uc.a.run.app/";

export const useTokenPrice = () => {
  const load = useTokenPriceManual();
  useEffect(() => {
    load();
  }, [load]);
};

export const useTokenPriceManual = () => {
  const updatePrices = useUpdatePrices();
  const tokenList = useRecoilValue(tokenMintListAtom);
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;

  return useCallback(async () => {
    if (!tokenList.length) return;
    const mintChunks = chunkArray(tokenList, 10);
    mintChunks.forEach(async (tList) => {
      const mints = (
        isDevnet ? tList.map((t) => devnetMintMap[t] ?? t) : tList
      ).join(",");
      const { data } = await axios.get(`${LIST_PRICES_API}?mints=${mints}`);

      const newPrices = [] as [string, number][];
      for (const [mint, price] of data) {
        if (price)
          newPrices.push([
            isDevnet ? mainnetMintMap[mint] ?? mint : mint,
            price,
          ]);
      }
      updatePrices(newPrices);
    });
  }, [isDevnet, tokenList, updatePrices]);
};

export const loadPriceHistory = async ({
  mint,
  range,
  isDevnet,
}: {
  mint: string;
  range: RangeType;
  isDevnet?: boolean;
}) => {
  const [from, to] = getRange(range);
  return await loadPriceHistoryForRange({ mint, to, from, isDevnet });
};

export const loadPriceHistoryForRange = async ({
  mint,
  from,
  to,
  isDevnet,
}: {
  mint: string;
  from: number;
  to: number;
  isDevnet?: boolean;
}) => {
  if (!mint) return [];
  try {
    const { data: prices } = (await axios.get(
      `${PRICE_HISTORY_API}/?mint=${
        isDevnet ? devnetMintMap[mint] ?? mint : mint
      }&from=${from}&to=${to}`
    )) as PriceHistoryResponse;

    return prices.map(([ts, price]) => ({
      price,
      createdAt: ts * 1000,
    }));
  } catch (error) {
    console.log({ error });
    return [];
  }
};

type PriceHistoryResponse = {
  data: [number, number][];
};

/* maps devnet mints to mainnet alternatives for coingecko
 */
const devnetMintMap = {
  E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF:
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6:
    "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU", // tBTC
} as { [mint: string]: string };

const mainnetMintMap = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:
    "E6Z6zLzk8MWY3TY8E87mr88FhGowEPJTeMWzkqtL6qkF",
  "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU":
    "C6kYXcaRUMqeBF5fhg165RWU7AnpT9z92fvKNoMqjmz6", // tBTC
} as { [mint: string]: string };
