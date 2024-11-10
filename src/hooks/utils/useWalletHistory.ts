import { useCallback } from "react";
import axios from "axios";
import { useDevnetState } from "../../contexts/NetworkProvider";
import { NetworkOption } from "../../utils/types";
import {
  clpVaultAtomFamily,
  splMintAtomFamily,
  tokenMetadataFamily,
} from "../../state";
import { useRecoilValue } from "recoil";
import { loadPriceHistoryForRange } from "../utils/useTokenPrice";
import { Decimal } from "../../utils/decimal";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { generateCSV } from "../../utils/clp";
import toast from "react-hot-toast";
import { HOUR_MS } from "../../utils/stats";
import { DEVELOPMENT_MODE } from "../../utils/constants";

const WALLET_EVENTS_API = DEVELOPMENT_MODE
  ? "http://127.0.0.1:5001/clp-indexer/us-central1/walletEventHistory"
  : "https://walleteventhistory-miqb2uc7eq-uc.a.run.app/";

export const useWalletHistory = (vaultId: string) => {
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const mintA = vault?.tokenMintA ?? "";
  const mintB = vault?.tokenMintB ?? "";
  const aMintInfo = useRecoilValue(splMintAtomFamily(mintA.toString()));
  const bMintInfo = useRecoilValue(splMintAtomFamily(mintB.toString()));
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA.toString()));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB.toString()));
  const [network] = useDevnetState();
  const wallet = useAnchorWallet();

  const downloadDepositWithdrawHistory = useCallback(async () => {
    if (!wallet || !vault) return;
    const isDevnet = network === NetworkOption.Devnet;
    const { data: events } = (await axios.get(
      `${WALLET_EVENTS_API}?${
        isDevnet ? "network=devnet" : "network=mainnet"
      }&wallet=${wallet.publicKey.toString()}&vault=${vaultId}`
    )) as {
      data: {
        a: string;
        b: string;
        event: string;
        createdAt: number;
      }[];
    };
    if (!events.length) {
      toast.error("No Deposit/Withdraw events found for connected wallet");
      return;
    }
    const from = events[0].createdAt - HOUR_MS;
    const to =
      events.length > 1
        ? events[events.length - 1].createdAt
        : new Date().valueOf();

    const priceHistoryA = await loadPriceHistoryForRange({
      mint: mintA.toString(),
      to,
      from,
      isDevnet,
    });
    const priceHistoryB = await loadPriceHistoryForRange({
      mint: mintB.toString(),
      to,
      from,
      isDevnet,
    });

    const vaultEventData = events.map(({ a, b, event, createdAt }) => {
      const type = event === "DepositEvent" ? "Deposit" : "Withdraw";
      const amountA = new Decimal(a).div(10 ** (aMintInfo?.decimals ?? 0));
      const amountB = new Decimal(b).div(10 ** (bMintInfo?.decimals ?? 0));
      const aPrice = priceHistoryA.length
        ? priceHistoryA.find((p) => p.createdAt >= createdAt)?.price ??
          priceHistoryA[priceHistoryA.length - 1].price
        : 1;
      const bPrice = priceHistoryB.length
        ? priceHistoryB.find((p) => p.createdAt >= createdAt)?.price ??
          priceHistoryB[priceHistoryB.length - 1].price
        : 1;

      return {
        amountA: `${amountA.toString()} ${tokenA?.symbol}`,
        usdA: amountA.mul(aPrice).toString(),
        amountB: `${amountB.toString()} ${tokenB?.symbol}`,
        usdB: amountB.mul(bPrice).toString(),
        type,
        timestamp: new Date(createdAt).toUTCString(),
      };
    });
    generateCSV({
      history: vaultEventData,
      symbolA: tokenA?.symbol ?? "A",
      symbolB: tokenB?.symbol ?? "B",
      wallet: wallet.publicKey.toString(),
      vaultId,
    });
  }, [
    aMintInfo?.decimals,
    bMintInfo?.decimals,
    mintA,
    mintB,
    network,
    tokenA?.symbol,
    tokenB?.symbol,
    vault,
    vaultId,
    wallet,
  ]);

  return { downloadDepositWithdrawHistory };
};
