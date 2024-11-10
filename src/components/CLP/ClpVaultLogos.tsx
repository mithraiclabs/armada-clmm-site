import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  selectUiInvertTokenPair,
  tokenMetadataFamily,
} from "../../state";
import { Logo, LogoProps } from "../common/Logo";

interface ClpVaultLogosProps extends LogoProps {
  clpKey: string;
}

export const ClpVaultLogos = ({
  clpKey,
  ...logoProps
}: Omit<ClpVaultLogosProps, "src">) => {
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const mintA = clpVault?.tokenMintA.toString() ?? "";
  const mintB = clpVault?.tokenMintB.toString() ?? "";
  const invertTokens = useRecoilValue(selectUiInvertTokenPair(clpKey));
  return (
    <MintPairLogos
      mintA={invertTokens ? mintB : mintA}
      mintB={invertTokens ? mintA : mintB}
      props={logoProps}
    />
  );
};

export const MintPairLogos = ({
  mintA,
  mintB,
  props,
}: {
  mintA: string;
  mintB: string;
  props?: Omit<ClpVaultLogosProps, "src" | "clpKey">;
}) => {
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));
  if (!tokenA || !tokenB) {
    return null;
  }
  return (
    <>
      <Logo src={tokenA.logoURI} fallbackImage {...props} />
      <Logo src={tokenB.logoURI} fallbackImage {...props} />
    </>
  );
};
