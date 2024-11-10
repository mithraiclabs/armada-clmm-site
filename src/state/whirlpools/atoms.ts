import {
  PositionData,
  TickData,
  WhirlpoolData,
  WhirlpoolsConfigData,
} from "@orca-so/whirlpools-sdk";
import { atomFamily } from "recoil";

export const whirlpoolAtomFamily = atomFamily<WhirlpoolData | null, string>({
  key: "whirlpoolAtomFamily",
  default: null,
});

export const whirlpoolConfigAtomFamily = atomFamily<
  WhirlpoolsConfigData | null,
  string
>({
  key: "whirlpoolConfigAtomFamily",
  default: null,
});

export const whirlpoolPositionAtomFamily = atomFamily<
  PositionData | null,
  string
>({
  key: "whirlpoolPositionAtomFamily",
  default: null,
});

export const whirlpoolTickDataAtomFamily = atomFamily<
  {
    upperTickData: TickData;
    lowerTickData: TickData;
  } | null,
  string
>({
  key: "whirlpoolTickDataAtomFamily",
  default: null,
});

// this is to store the positions of a user for a manually loaded whirlpool (no vault)
// indexed by whirlpoolKey
export const whirlpoolOwnedPositionKeys = atomFamily<string[], string>({
  key: "whirlpoolOwnedPositionKeys",
  default: [],
});
