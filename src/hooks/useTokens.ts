import { useMemo } from "react";
import { useDevnetState } from "../contexts/NetworkProvider";
import { Tokens } from "@mithraic-labs/psy-token-registry";
import { NetworkOption } from "../utils/types";

export const useTokens = () => {
  const [network] = useDevnetState();
  return useMemo(() => {
    return network === NetworkOption.Devnet ? Tokens.devnet : Tokens.mainnet;
  }, [network]);
};
