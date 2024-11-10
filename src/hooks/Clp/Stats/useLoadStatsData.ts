import { useRecoilValue, useSetRecoilState } from "recoil";
import { clpVaultAtomFamily, mintPriceHistoryAtomFamily } from "../../../state";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { loadPriceHistory } from "../../utils/useTokenPrice";
import { NetworkOption } from "../../../utils/types";
import { useTvlHistory } from "./useTvlHistory";
import { useRatesHistory } from "./useRatesHistory";
import { RangeType } from "../../../components/CLP/Stats";
import { useEventHistory } from "./useEventHistory";
import { useCallback, useEffect } from "react";

export const useLoadStatsData = (vaultId: string) => {
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const loadTvlHistory = useTvlHistory(vaultId);
  const loadRatesHistory = useRatesHistory(vaultId);
  const loadEventHistory = useEventHistory(vaultId);
  const loadPriceHistory = useLoadPriceHstory(vaultId);

  useEffect(() => {
    if (vault) loadPriceHistory();
  }, [loadPriceHistory, vault]);
  useEffect(() => {
    if (vault) loadTvlHistory(RangeType.Year);
  }, [loadTvlHistory, vault]);
  useEffect(() => {
    if (vault) loadRatesHistory(RangeType.Year);
  }, [loadRatesHistory, vault]);
  useEffect(() => {
    if (vault) loadEventHistory();
  }, [loadEventHistory, vault]);
};

export const useLoadPriceHstory = (vaultId: string) => {
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const mintA = vault?.tokenMintA.toString() ?? "";
  const mintB = vault?.tokenMintB.toString() ?? "";
  const setPriceHistoryA = useSetRecoilState(mintPriceHistoryAtomFamily(mintA));
  const setPriceHistoryB = useSetRecoilState(mintPriceHistoryAtomFamily(mintB));
  const pricesA = useRecoilValue(mintPriceHistoryAtomFamily(mintA));
  const pricesB = useRecoilValue(mintPriceHistoryAtomFamily(mintB));

  const [network] = useDevnetState();
  return useCallback(async () => {
    if (!vault || !mintA || !mintB) return;
    const [historyA, historyB] = await Promise.all([
      pricesA && pricesA.length
        ? []
        : loadPriceHistory({
            mint: mintA.toString(),
            range: RangeType.Year,
            isDevnet: network === NetworkOption.Devnet,
          }),
      pricesB && pricesB.length
        ? []
        : loadPriceHistory({
            mint: mintB.toString(),
            range: RangeType.Year,
            isDevnet: network === NetworkOption.Devnet,
          }),
    ]);

    if (historyA.length) setPriceHistoryA(historyA);
    if (historyB.length) setPriceHistoryB(historyB);
  }, [
    mintA,
    mintB,
    network,
    pricesA,
    pricesB,
    setPriceHistoryA,
    setPriceHistoryB,
    vault,
  ]);
};
