import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  WhirlpoolContext,
  buildWhirlpoolClient,
} from "@orca-so/whirlpools-sdk";
import { useMemo } from "react";
import { useClpVaultProgram } from "./Clp/useClpVaultProgram";

export const useWhirlpoolFetcher = () => {
  const client = useWhirlpoolClient();
  return useMemo(() => {
    return client.getFetcher();
  }, [client]);
};

export const useWhirlpoolClient = () => {
  const program = useClpVaultProgram();
  return useMemo(() => {
    const whirlpoolCtx = WhirlpoolContext.withProvider(
      program.provider as any,
      ORCA_WHIRLPOOL_PROGRAM_ID
    );
    const whirlpoolClient = buildWhirlpoolClient(whirlpoolCtx);
    return whirlpoolClient;
  }, [program.provider]);
};
