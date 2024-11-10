import { useCallback, useState } from "react";
import { WebIrys } from "@irys/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRecoilValue } from "recoil";
import { networkAtom } from "../../state";
import { NetworkOption } from "../../utils/types";
import { usePsyStakeProgram } from "../Staking/useStakingProgram";

// this setup relies on files being under 100KB (no need to fund)
// in an ideal scenario we should ALWAYS use devnet for uploading images since we can fund it for free
export const useUploadToArweave = () => {
  const [url, setUrl] = useState<string | null>(null);
  const network = useRecoilValue(networkAtom);
  const { provider } = usePsyStakeProgram();
  // anchor wallet doesnt allow message signing so we need useWallet
  const wallet = useWallet();

  const uploadFile = useCallback(
    async (file: File) => {
      file;
      if (!wallet || !provider.publicKey) return;
      const irys = new WebIrys({
        network: network === NetworkOption.Devnet ? "devnet" : "mainnet",
        token: "solana",
        wallet: {
          provider: { ...wallet, publicKey: provider.publicKey },
          name: "solana",
          rpcUrl: provider.connection.rpcEndpoint,
        },
        config:
          network === NetworkOption.Devnet
            ? { providerUrl: provider.connection.rpcEndpoint }
            : undefined,
      });
      await irys.ready();
      try {
        const receipt = await irys.uploadFile(file);
        const link = `https://gateway.irys.xyz/${receipt.id}`;
        setUrl(link);
        return link;
      } catch (error) {
        console.error("Error uploading file to Arweave:", error);
        return;
      }
    },
    [network, provider, wallet]
  );

  return { uploadFile, url, setUrl };
};
