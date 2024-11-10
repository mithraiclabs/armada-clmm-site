import { Account, Mint, unpackAccount, unpackMint } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useRecoilTransaction_UNSTABLE } from "recoil";
import {
  splMintAtomFamily,
  associatedTokenAccountAtomFamily,
  splTokenAccountAtomFamily,
  tokenMetadataFamily,
  spotPriceMap,
  tokenMintListAtom,
  TokenMetadata,
} from "./atoms";
import { Token } from "@mithraic-labs/psy-token-registry";
import { deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore // TODO fix import issue
import { RpcAccount } from "@metaplex-foundation/umi";
import { getManyAccounts } from "../../utils/tx-utils";

export const useUpdateSplMints = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (mints: Mint[]) => {
        mints.forEach((mint) => {
          set(splMintAtomFamily(mint.address.toString()), mint);
        });
      },
    []
  );

export const getMultipleMints = async (
  connection: Connection,
  mints: PublicKey[]
) => {
  const mintAccountInfos = await getManyAccounts(connection, mints);
  return mintAccountInfos.map((accountInfo, index) => {
    try {
      return unpackMint(mints[index], accountInfo);
    } catch (err) {
      // swallow error from unpackMint
      return null;
    }
  });
};

export const useUpdateAssociatedTokenAccounts = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (accounts: Account[]) => {
        accounts.map((account) => {
          set(
            associatedTokenAccountAtomFamily(account.mint.toString()),
            account
          );
        });
      },
    []
  );

export const useResetAssociatedTokenAccounts = () =>
  useRecoilTransaction_UNSTABLE(
    ({ reset }) =>
      (mints: string[]) => {
        mints.forEach((mint) => {
          reset(associatedTokenAccountAtomFamily(mint));
        });
      },
    []
  );

export const useUpdateSplTokenAccounts = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set }) =>
      (accounts: Account[]) => {
        accounts.map((account) => {
          set(splTokenAccountAtomFamily(account.address.toString()), account);
        });
      },
    []
  );

export const getMultipleTokenAccounts = async (
  connection: Connection,
  addresses: PublicKey[]
) => {
  const tokenAccountInfos = await getManyAccounts(connection, addresses);
  return tokenAccountInfos.map((accountInfo, index) => {
    try {
      return unpackAccount(addresses[index], accountInfo);
    } catch (err) {
      // swallow error from unpackMint
      return null;
    }
  });
};

export const getMultipleTokenMetadata = async (
  connection: Connection,
  tokens: { [mint: string]: Token },
  mints: string[]
) => {
  const derivedMetadataAccounts = deriveMultipleTokenMetadataAccounts(mints);
  const metaBuffers = await getManyAccounts(
    connection,
    derivedMetadataAccounts
  );
  const processed: (TokenMetadata & {
    mint: string;
  })[] = [];
  for (const [index, accountInfo] of metaBuffers.entries()) {
    const fallback = tokens[mints[index]];
    if (accountInfo) {
      try {
        const deserialized = deserializeMetadata({
          ...accountInfo,
          publicKey: derivedMetadataAccounts[index],
        } as unknown as RpcAccount) as {
          symbol: string;
          name: string;
          uri: string;
        };
        let logoURI = fallback?.logoURI;
        let armadaMeta = null;
        if (deserialized.uri.length) {
          try {
            const { data } = await axios.get(deserialized.uri);
            logoURI = data.image;
            armadaMeta = data.armadaMeta;
          } catch (err) {
            console.error(err);
          }
        }
        processed.push({
          mint: mints[index],
          logoURI,
          symbol: deserialized.symbol,
          name: deserialized.name,
          armadaMeta,
        });
      } catch (error) {
        console.log({ error });
      }
    } else {
      processed.push({
        mint: mints[index],
        logoURI: fallback?.logoURI,
        symbol: fallback?.symbol ?? mints[index].substring(0, 3),
        name: fallback?.name ?? mints[index].substring(0, 4),
        armadaMeta: null,
      });
    }
  }
  return processed;
};

export const useUpdateTokenMetadata = () =>
  useRecoilTransaction_UNSTABLE(
    ({ set, get }) =>
      (
        metadata: (TokenMetadata & {
          mint: string;
        })[]
      ) => {
        metadata.map(({ mint, ...tok }) => {
          const current = get(tokenMintListAtom);
          if (!current.includes(mint)) {
            set(tokenMintListAtom, [...current, mint]);
          }
          set(tokenMetadataFamily(mint.toString()), tok);
        });
      },
    []
  );

export const useUpdatePrices = () =>
  useRecoilTransaction_UNSTABLE<[[string, number][]]>(
    ({ set }) =>
      (tuples) => {
        tuples.forEach(([mint, number]) => {
          set(spotPriceMap(mint), number);
        });
      },
    []
  );

export function deriveMultipleTokenMetadataAccounts(mints: string[]) {
  return mints.map((mint) => {
    const [programAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METAPLEX_PROGRAM_ID.toBuffer(),
        new PublicKey(mint).toBuffer(),
      ],
      METAPLEX_PROGRAM_ID
    );
    return programAddress;
  });
}

export const METAPLEX_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
export const BACKUP_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/b/b4/Circle_question_mark.png";
