import { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { splMintAtomFamily, whirlpoolAtomFamily } from "../../state";
import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";
import { Decimal } from "../../utils/decimal";
export const useStepIncrement = (whirlpoolKey: string) => {
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(whirlpoolKey));
  const tokenA = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const tokenB = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
  );

  return useCallback(
    (current: string, increment: boolean) => {
      if (!whirlpool) throw new Error("No whirlpool found");
      if (!tokenA || !tokenB) throw new Error("Mints not loaded or found");
      const closestTickIndex =
        PriceMath.priceToTickIndex(
          new Decimal(Number(current) === 0 ? 0.000001 : current || 1),
          tokenA.decimals,
          tokenB.decimals
        ) + (increment ? 1 : -1);

      const closestValidTickIndex = increment
        ? TickUtil.getNextInitializableTickIndex(
            closestTickIndex,
            whirlpool.tickSpacing
          )
        : TickUtil.getPrevInitializableTickIndex(
            closestTickIndex,
            whirlpool.tickSpacing
          );

      const priceAtTickIndex = PriceMath.tickIndexToPrice(
        closestValidTickIndex,
        tokenA.decimals,
        tokenB.decimals
      );
      return priceAtTickIndex;
    },
    [tokenA, tokenB, whirlpool]
  );
};
