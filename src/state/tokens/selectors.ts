import { selectorFamily } from "recoil";
import {
  splMintAtomFamily,
  associatedTokenAccountAtomFamily,
  splTokenAccountAtomFamily,
  tokenMetadataFamily,
} from "./atoms";
import { Decimal } from "../../utils/decimal";

export const selectTokenAmount = selectorFamily({
  key: "selectTokenAmount",
  get:
    (mintAddress: string) =>
    ({ get }) => {
      const mint = get(splMintAtomFamily(mintAddress));
      const tokenAccount = get(associatedTokenAccountAtomFamily(mintAddress));

      if (!tokenAccount) {
        return null;
      }

      const decimals = mint?.decimals ?? 0;
      return new Decimal(tokenAccount.amount.toString()).div(10 ** decimals);
    },
});

export const selectTokenAmountFromAccount = selectorFamily({
  key: "selectTokenAmountFromAccount",
  get:
    (accountAddress: string) =>
    ({ get }) => {
      const tokenAccount = get(splTokenAccountAtomFamily(accountAddress));
      const mint = get(splMintAtomFamily(tokenAccount?.mint.toString() ?? ""));

      if (!tokenAccount) {
        return null;
      }

      const decimals = mint?.decimals ?? 0;
      return new Decimal(tokenAccount.amount.toString()).div(10 ** decimals);
    },
});

export const selectTokenSymbolFromAccount = selectorFamily({
  key: "selectTokenSymbolFromAccount",
  get:
    (accountAddress: string) =>
    ({ get }) => {
      const tokenAccount = get(splTokenAccountAtomFamily(accountAddress));
      const metadata = get(
        tokenMetadataFamily(tokenAccount?.mint.toString() ?? "")
      );
      return (
        metadata?.symbol ?? tokenAccount?.mint.toString().slice(0, 5) ?? ""
      );
    },
});
