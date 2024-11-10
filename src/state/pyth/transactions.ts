import { PublicKey } from "@solana/web3.js";
import { PriceData } from "@pythnetwork/client";
import { useRecoilTransaction_UNSTABLE } from "recoil";
import { pythPriceDataAtomFamily } from ".";

export const useUpdatePythPriceData = () =>
  useRecoilTransaction_UNSTABLE<[[PriceData, PublicKey][]]>(
    ({ set }) =>
      (priceDataTuples) => {
        priceDataTuples.forEach(([priceData, pubkey]) => {
          set(pythPriceDataAtomFamily(pubkey.toString()), priceData);
        });
      },
    []
  );
