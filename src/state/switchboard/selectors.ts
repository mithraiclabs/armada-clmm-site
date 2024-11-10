import { selectorFamily } from "recoil";
import { switchboardAggregatorDataAtomFamily } from "./atoms";
import { DECIMAL_ZERO } from "../../utils/math";
import { Decimal } from "../../utils/decimal";

export const selectLatestSwitchboardValue = selectorFamily({
  key: "selectLatestSwitchboardValue",
  get:
    (aggregatorKey: string) =>
    ({ get }) => {
      const aggregatorData = get(
        switchboardAggregatorDataAtomFamily(aggregatorKey)
      );
      if (!aggregatorData) {
        return DECIMAL_ZERO;
      }
      return new Decimal(
        aggregatorData.latestConfirmedRound.result.mantissa.toString()
      ).div(10 ** aggregatorData.latestConfirmedRound.result.scale);
    },
});
