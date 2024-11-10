import { useRecoilValue } from "recoil";
import { splMintAtomFamily } from "../../state";
import { formatAmount } from "../../utils/formatters";
import { useCallback } from "react";
import { isUndefined } from "lodash";

export const useMintAmountFormatter = (mint: string) => {
  const decimals = useRecoilValue(splMintAtomFamily(mint))?.decimals;

  return useCallback(
    (amount: number | string | null | undefined) => {
      if (isUndefined(amount)) return "-";
      return formatAmount(amount, decimals);
    },
    [decimals]
  );
};
