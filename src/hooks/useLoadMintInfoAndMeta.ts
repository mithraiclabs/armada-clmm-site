import { useRecoilCallback } from "recoil";
import {
  getMultipleMints,
  getMultipleTokenMetadata,
  splMintAtomFamily,
  tokenMetadataFamily,
  useUpdateSplMints,
  useUpdateTokenMetadata,
} from "../state";
import { useConnection } from "@solana/wallet-adapter-react";
import { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useTokens } from "./useTokens";

export const useLoadMintInfoAndMeta = () => {
  const { connection } = useConnection();
  const updateSplMints = useUpdateSplMints();
  const updateMetadata = useUpdateTokenMetadata();
  const tokens = useTokens();

  return useRecoilCallback(
    ({ snapshot }) =>
      async (mints: string[]) => {
        const loadable = [] as string[];
        const mintInfos = {} as { [mint: string]: Mint };
        const metadataArr = {} as {
          [mint: string]: {
            name: string;
            symbol: string;
            logoURI: string | undefined;
          };
        };

        for (const mint of mints) {
          const splMintInfo = snapshot
            .getLoadable(splMintAtomFamily(mint))
            .getValue();
          const metadata = snapshot
            .getLoadable(tokenMetadataFamily(mint))
            .getValue();

          if (!splMintInfo) {
            loadable.push(mint);
          } else {
            mintInfos[mint] = splMintInfo;
          }
          if (metadata) metadataArr[mint] = metadata;
        }
        if (loadable.length) {
          const [splMints, tokenMetadatas] = await Promise.all([
            getMultipleMints(
              connection,
              loadable.map((m) => new PublicKey(m))
            ),
            getMultipleTokenMetadata(
              connection,
              tokens,
              mints.map((m) => m.toString())
            ),
          ]);
          const filteredMints = splMints.filter((m) => !!m) as Mint[];
          updateSplMints(filteredMints);
          updateMetadata(tokenMetadatas);
          for (const meta of tokenMetadatas) {
            metadataArr[meta.mint] = meta;
          }
          for (const mintInfo of filteredMints) {
            mintInfos[mintInfo.address.toString()] = mintInfo;
          }
        }
        return { mintInfos, metadataArr };
      },
    [tokens]
  );
};
