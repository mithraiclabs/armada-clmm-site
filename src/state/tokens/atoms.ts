import { Account, Mint } from "@solana/spl-token";
import { atom, atomFamily } from "recoil";
import { recoilPersist } from "recoil-persist";

const {
  /* A function that takes an atom and returns a new atom that is persisted to local storage. */
  persistAtom,
} = recoilPersist();

export const splMintAtomFamily = atomFamily<Mint | null, string>({
  key: "splMintAtomFamily",
  default: null,
});

/**
 * Token Accounts stored by mint address.
 *
 * NOTE: Only use Associated Token Accounts
 */
export const associatedTokenAccountAtomFamily = atomFamily<
  Account | null,
  string
>({
  key: "associatedTokenAccountAtomFamily",
  default: null,
});

/**
 * Native SOL held by the connected wallet.
 */
export const nativeSolBalanceAtom = atom({
  key: "nativeSolBalanceAtom",
  default: 0,
});

/**
 * Token Accounts stored by their public key.
 */
export const splTokenAccountAtomFamily = atomFamily<Account | null, string>({
  key: "splTokenAccountAtomFamily",
  default: null,
});

export type TokenMetadata = {
  symbol: string;
  name: string;
  logoURI: string | undefined;
  armadaMeta: {
    type: string;
    content: Record<
      string,
      | {
          name: string;
          description: string;
        }
      | undefined
    >;
  } | null;
};

export const tokenMetadataFamily = atomFamily<TokenMetadata | null, string>({
  key: "tokenMetadataFamily",
  default: null,
});

export const spotPriceMap = atomFamily<number | null, string>({
  key: "spotPriceMap",
  default: null,
});

// list of mints for coingecko
export const tokenMintListAtom = atom<string[]>({
  key: "tokenMintListAtom",
  default: [],
  effects: [persistAtom],
});
