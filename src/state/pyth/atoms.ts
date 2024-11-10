import { atomFamily } from "recoil";
import { PriceData } from "@pythnetwork/client";

export const pythPriceDataAtomFamily = atomFamily<PriceData | null, string>({
  key: "pythPriceDataAtomFamily",
  default: null,
});
