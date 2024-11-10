import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";
import { useRecoilValue } from "recoil";
import { splMintAtomFamily, whirlpoolAtomFamily } from "../../state";
import { useCallback } from "react";
import { Decimal } from "../../utils/decimal";

export const usePoolClosestAllowedPrice = (whirlpoolKey: string) => {
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(whirlpoolKey));
  const tokenA = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const tokenB = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
  );

  return useCallback(
    (inputPrice: Decimal | string | number): [Decimal, number] | null => {
      if (!inputPrice || !tokenA || !tokenB || !whirlpool?.tickSpacing) {
        return null;
      }

      // convert to tick index and back to price accounting for tick spacing
      const closestTickIndex = PriceMath.priceToTickIndex(
        new Decimal(
          !Number(inputPrice) || Number(inputPrice) === 0
            ? 0.0000001
            : inputPrice
        ),
        tokenA.decimals,
        tokenB.decimals
      );
      const closestValidTickIndex = TickUtil.getInitializableTickIndex(
        closestTickIndex,
        whirlpool.tickSpacing
      );

      const priceAtTickIndex = PriceMath.tickIndexToPrice(
        closestValidTickIndex,
        tokenA.decimals,
        tokenB.decimals
      );
      return [priceAtTickIndex, closestValidTickIndex];
    },
    [tokenA, tokenB, whirlpool?.tickSpacing]
  );
};
