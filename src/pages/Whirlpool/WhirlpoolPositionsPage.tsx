import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import {
  useLoadIndividualClp,
  useLoadUserClpPositions,
} from "../../hooks/Whirlpool/useLoadIndividualWhirlpool";
import { WhirlpoolPositionsChart } from "./WhirlpoolPositionsChart";
import { WhirlpoolUserPositionsInfo } from "./WhirlpoolUserPositionsInfo";
import {
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  whirlpoolAtomFamily,
} from "../../state";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { WhirlpoolUserPositionsFeeInfo } from "./WhirlpoolUserPositionsFeeInfo";

export const WhirlpoolPositionsPage = () => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const load = useLoadIndividualClp(key);
  const loadPositions = useLoadUserClpPositions(key);
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key));
  const tokenASymbol = useRecoilValue(selectWhirlpoolTokenASymbol(key));
  const tokenBSymbol = useRecoilValue(selectWhirlpoolTokenBSymbol(key));
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadPositions();
  }, [whirlpool, loadPositions]);
  if (!whirlpool) return null;

  return (
    <div className="md:px-16 lg:px-24 grid grid-cols-12 gap-2">
      <div className="col-span-2" />
      <div className="col-span-8">
        <p className="text-text text-center text-2xl font-semibold font-khand uppercase">
          {tokenASymbol} {tokenBSymbol} Whirlpool
        </p>
      </div>
      <div className="col-span-2" />
      <div className="col-span-2" />
      <div className="col-span-4 flex flex-col">
        <p className="text-xl font-khand text-text-placeholder">
          Active Positions
        </p>
        <WhirlpoolPositionsChart />
      </div>
      <div className="col-span-4 flex flex-col">
        <WhirlpoolUserPositionsFeeInfo />
        <WhirlpoolUserPositionsInfo />
      </div>
      <div className="col-span-2" />
    </div>
  );
};
