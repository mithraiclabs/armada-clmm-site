import { PositionData, TickData, WhirlpoolData } from "@orca-so/whirlpools-sdk";
import { useRecoilTransaction_UNSTABLE } from "recoil";
import { whirlpoolAtomFamily, whirlpoolPositionAtomFamily, whirlpoolTickDataAtomFamily } from "./atoms";

export const useUpdateWhirlpools = () =>
  useRecoilTransaction_UNSTABLE<[[string, WhirlpoolData][]]>(
    ({ set }) =>
      (whirlpoolTuples) => {
        whirlpoolTuples.forEach(([address, whirlpool]) => {
          set(whirlpoolAtomFamily(address), whirlpool);
        });
      },
    []
  );
  
export const useUpdateWhirlpoolPositions = () =>
  useRecoilTransaction_UNSTABLE<[[string, PositionData][]]>(
    ({ set }) =>
      (positionTuples) => {
        positionTuples.forEach(([address, positionData]) => {
          set(whirlpoolPositionAtomFamily(address), positionData);
        });
      },
    []
  );

export const useUpdateWhirlpoolTickData = () =>
  useRecoilTransaction_UNSTABLE<
    [
      [
        string,
        {
          upperTickData: TickData;
          lowerTickData: TickData;
        }
      ][]
    ]
  >(
    ({ set }) =>
      (tickTuples) => {
        tickTuples.forEach(([address, tickData]) => {
          set(whirlpoolTickDataAtomFamily(address), tickData);
        });
      },
    []
  );