import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import { FEE_RATE_MUL_VALUE } from "@orca-so/whirlpools-sdk";
import {
  whirlpoolAtomFamily,
  selectUiInvertWhirlpool,
  selectWhirlpoolUserPositionSum,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
} from "../../state";
import { MintPairLogos } from "./ClpVaultLogos";
import { WhirlpoolSymbols } from "./ClpVaultSymbols";
import { Decimal } from "../../utils/decimal";

export const WhirlpoolCard = ({ whirlpoolKey }: { whirlpoolKey: string }) => {
  const { t } = useTranslation();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(whirlpoolKey));
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isInverted = useRecoilValue(selectUiInvertWhirlpool(whirlpoolKey));
  const mintA = useMemo(
    () => whirlpool?.tokenMintA.toString() ?? "",
    [whirlpool]
  );
  const mintB = useMemo(
    () => whirlpool?.tokenMintB.toString() ?? "",
    [whirlpool]
  );
  const tokenASymbol = useRecoilValue(
    selectWhirlpoolTokenASymbol(whirlpoolKey)
  );
  const tokenBSymbol = useRecoilValue(
    selectWhirlpoolTokenBSymbol(whirlpoolKey)
  );
  const { totalA, totalB } = useRecoilValue(
    selectWhirlpoolUserPositionSum(whirlpoolKey)
  );
  if (!whirlpool) {
    return null;
  }

  const feeRate = new Decimal(whirlpool.feeRate)
    .div(FEE_RATE_MUL_VALUE.toString())
    .mul(100);

  return (
    <div className="flex min-w-full cursor-pointer overflow-hidden">
      <div
        className={`p-2 border flex-1 flex flex-col border-background-container
        rounded-2xl ${hovered ? "highlight-green" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          navigate("/clp/" + whirlpoolKey);
        }}
      >
        <div className=" bg-background-panel rounded-xl p-4 pb-8 relative">
          {/* Token Pair and logos */}
          <div className="flex flex-row justify-between mb-5">
            <p className="text-text text-2xl font-semibold font-khand uppercase">
              <WhirlpoolSymbols whirlpoolKey={whirlpoolKey} />
            </p>
            <div className="flex flex-row">
              <MintPairLogos
                mintA={isInverted ? mintB : mintA}
                mintB={isInverted ? mintA : mintB}
                props={{ glow: hovered, noFilter: true }}
              />
            </div>
          </div>
          <div>
            <div className="flex flex-row justify-between">
              <p className="mr-1">Fee Rate</p>
              <p className="font-semibold">{feeRate.toNumber()}%</p>
            </div>
            <div className="flex flex-row justify-between">
              <p className="mr-1">Whirlpool Key</p>
              <div className="flex flex-row justify-center items-center">
                <p>{whirlpoolKey.slice(0, 10)}...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-2 py-1 mt-1 font-montserrat items-center">
          <div className="flex flex-row items-center justify-between text-xs">
            <p className="font-semibold ">{t("Your positions:")}&nbsp;</p>

            <div
              className={`${hovered ? "text-primary" : "text-text-placeholder"}
             align-middle flex flex-row justify-between gap-2 font-medium`}
            >
              <p>
                {totalA.toString()} {tokenASymbol}
              </p>
              <p>
                {totalB.toString()} {tokenBSymbol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
