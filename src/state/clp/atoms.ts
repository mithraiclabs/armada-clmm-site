import { atom, atomFamily } from "recoil";
import { ClpVaultStruct } from "@mithraic-labs/clp-vault";
import { recoilPersist } from "recoil-persist";
import { FirebaseTimestamp, RateDocument } from "./types";

const {
  /* A function that takes an atom and returns a new atom that is persisted to local storage. */
  persistAtom,
} = recoilPersist();

export const clpVaultAtomFamily = atomFamily<ClpVaultStruct | null, string>({
  key: "clpVaultAtomFamily",
  default: null,
  dangerouslyAllowMutability: true,
});

/** List of Vault Addresses to show on /clmm page */
export const clpVaultKeysAtom = atom<string[]>({
  key: "clpVaultKeysAtom",
  default: [],
});

export const clpVaultRateAtomFamily = atomFamily<
  RateDocument<FirebaseTimestamp> | null,
  string
>({
  key: "clpVaultRate",
  default: null,
});

export type ClmmVaultSortType = "tvl" | "rate" | "volume" | "fees";

export const clmmVaultSortAtom = atom<{
  type: ClmmVaultSortType;
  ascending: boolean;
}>({
  key: "clmmVaultSortAtom",
  default: {
    type: "tvl",
    ascending: false,
  },
  effects: [persistAtom],
});

export const clmmVaultSearchFilterAtom = atom({
  key: "clmmVaultSearchFilterAtom",
  default: "",
});

export const clmmVaultManagerFilterAtom = atom<"STS" | "Armada" | "All">({
  key: "clmmVaultManagerFilterAtom",
  default: "All",
});
