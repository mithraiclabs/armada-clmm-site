import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@tiplink/wallet-adapter-react-ui";
import { TipLinkWalletAdapter } from "@tiplink/wallet-adapter";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import React, { useMemo } from "react";
// Default styles for Phantom logo and such
import "@tiplink/wallet-adapter-react-ui/styles.css";
import { useDevnetState } from "./NetworkProvider";
import { NetworkOption } from "../utils/types";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const WalletConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [network, , customRpc] = useDevnetState();
  const rpcEndpoint =
    network === NetworkOption.Devnet
      ? import.meta.env.VITE_DEVNET_RPC_URL
      : network === NetworkOption.Custom && customRpc.length
      ? customRpc
      : import.meta.env.VITE_MAINNET_RPC_URL;
  const wallets = useMemo(
    () => [
      new WalletConnectWalletAdapter({
        network:
          network === NetworkOption.Devnet
            ? WalletAdapterNetwork.Devnet
            : WalletAdapterNetwork.Mainnet,
        options: {
          relayUrl: "wss://relay.walletconnect.com",
          projectId: "69f137f7c3cf351fb47c530bb7e46117",
          metadata: {
            name: "Armada",
            description:
              "Armada provides all token infrastructure so teams can focus on their core product.",
            url: "https://app.armadafi.so",
            icons: ["https://app.armadafi.so/assets/armada-db1f9030.png"],
          },
        },
      }),
      new TipLinkWalletAdapter({
        clientId: "bf4f6cd6-4c36-45bd-987f-c2c66dbe6926",
        theme: "light",
        title: "Armada",
      }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
