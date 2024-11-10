import { IdlAccounts } from "@coral-xyz/anchor";
import SwitchboardV2Lite from "@switchboard-xyz/sbv2-lite";
import { SwitchboardIdl } from "./SwitchboardIdl";
import { Commitment, PublicKey } from "@solana/web3.js";

type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

// @ts-expect-error should be safe
export type AggregatorAccountData = IdlAccounts<
  Mutable<typeof SwitchboardIdl>
  // @ts-expect-error this exists
>["AggregatorAccountData"];

export type MultpleAggregatorDataResp = {
  pubkey: PublicKey;
  data: AggregatorAccountData;
}[];

export const fetchMultipleAggregators = async (
  switchboardV2Lite: SwitchboardV2Lite,
  aggregatorPubkeys: PublicKey[],
  commitment?: Commitment
): Promise<MultpleAggregatorDataResp> => {
  const aggregators =
    await switchboardV2Lite.program.account.aggregatorAccountData.fetchMultiple(
      aggregatorPubkeys,
      commitment
    );
  return aggregators
    .map((aggregatorData, index) => ({
      pubkey: aggregatorPubkeys[index],
      data: aggregatorData,
    }))
    .filter((a) => !!a) as MultpleAggregatorDataResp;
};
