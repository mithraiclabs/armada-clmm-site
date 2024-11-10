import { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { Decimal } from "../../utils/decimal";
import {
  selectUiInvertWhirlpool,
  splMintAtomFamily,
  whirlpoolAtomFamily,
} from "../../state";
import { PriceMath, TickUtil } from "@orca-so/whirlpools-sdk";

export const usePoolTokenPercentagesFromTicks = (whirlpoolKey: string) => {
  const invertedTokens = useRecoilValue(selectUiInvertWhirlpool(whirlpoolKey));
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(whirlpoolKey));
  const mintA = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const mintB = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
  );

  return useCallback(
    (
      lowerPrice: Decimal | string | number,
      upperPrice: Decimal | string | number
    ): [number, number] => {
      if (
        !whirlpool ||
        !mintA ||
        !mintB ||
        !lowerPrice ||
        !upperPrice ||
        !Number(lowerPrice) ||
        !Number(upperPrice)
      ) {
        return [0, 0];
      }
      const inputLowerTick = PriceMath.priceToTickIndex(
        new Decimal(lowerPrice),
        invertedTokens ? mintB.decimals : mintA.decimals,
        invertedTokens ? mintA.decimals : mintB.decimals
      );
      const inputUpperTick = PriceMath.priceToTickIndex(
        new Decimal(upperPrice),
        invertedTokens ? mintB.decimals : mintA.decimals,
        invertedTokens ? mintA.decimals : mintB.decimals
      );
      const lowerTick = invertedTokens
        ? TickUtil.invertTick(inputUpperTick)
        : inputLowerTick;
      const upperTick = invertedTokens
        ? TickUtil.invertTick(inputLowerTick)
        : inputUpperTick;

      if (whirlpool.tickCurrentIndex >= upperTick) {
        return [0, 100];
      } else if (whirlpool.tickCurrentIndex <= lowerTick) {
        return [100, 0];
      }
      const tickDiffA = Math.abs(
        Math.abs(whirlpool.tickCurrentIndex) - Math.abs(lowerTick)
      );
      const tickDiffB = Math.abs(
        Math.abs(upperTick) - Math.abs(whirlpool.tickCurrentIndex)
      );
      const aPercentage = (tickDiffA / (tickDiffA + tickDiffB)) * 100;
      const bPercentage = 100 - aPercentage;
      return [bPercentage, aPercentage];
    },
    [invertedTokens, mintA, mintB, whirlpool]
  );
};
