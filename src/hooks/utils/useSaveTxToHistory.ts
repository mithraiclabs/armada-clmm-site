import { useCallback } from "react";
import { usePushToSignatureStack } from "../../state";
import { TxType } from "../../utils/types";

export const useSaveTxToHistory = () => {
  const saveSignatures = usePushToSignatureStack();

  const saveTx = useCallback(
    ({
      action,
      signatures,
    }: {
      message: string;
      action: string;
      signatures?: {
        signature: string;
        type: TxType;
      }[];
    }) => {
      if (signatures) saveSignatures(action, signatures);
    },
    [saveSignatures]
  );

  return {
    saveTx,
  };
};
