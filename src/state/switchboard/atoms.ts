import { atomFamily } from "recoil";
import { AggregatorAccountData } from "../../utils/switchboard";

export const switchboardAggregatorDataAtomFamily = atomFamily<
  AggregatorAccountData | null,
  string
>({
  key: "switchboardAggregatorDataAtomFamily",
  default: null,
});
