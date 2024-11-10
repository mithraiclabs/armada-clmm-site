import { useRecoilValue } from "recoil";
import {
  selectTokenASymbol,
  selectTokenBSymbol,
  selectUiInvertWhirlpool,
  selectUiInvertTokenPair,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  clpVaultAtomFamily,
} from "../../state";

export const ClpVaultSymbols = ({ clpKey }: { clpKey: string }) => {
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(clpKey));
  const invertTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  const vault = useRecoilValue(clpVaultAtomFamily(clpKey));
  if (!vault) return null;
  return (
    <>
      {invertTokens
        ? `${tokenSymbolB}-${tokenSymbolA}`
        : `${tokenSymbolA}-${tokenSymbolB}`}
    </>
  );
};

export const WhirlpoolSymbols = ({
  whirlpoolKey: key,
}: {
  whirlpoolKey: string;
}) => {
  const tokenASymbol = useRecoilValue(selectWhirlpoolTokenASymbol(key));
  const tokenBSymbol = useRecoilValue(selectWhirlpoolTokenBSymbol(key));
  const invertTokens = useRecoilValue(selectUiInvertWhirlpool(key));
  return (
    <>
      {invertTokens ? tokenBSymbol : tokenASymbol}-
      {invertTokens ? tokenASymbol : tokenBSymbol}
    </>
  );
};
