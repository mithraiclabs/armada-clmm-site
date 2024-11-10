import { createContext, useContext, useMemo } from "react";
import { useParams, Params } from "react-router";

const ParamOverrideContext = createContext<Record<string, string>>({});

/**
 * Allows hardcoded params for consumption with `useParamsWithOverride`
 */
export const ParamOverrideProvider = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Record<string, string>;
}) => {
  const val = useMemo(() => params ?? {}, [params]);
  return (
    <ParamOverrideContext.Provider value={val}>
      {children}
    </ParamOverrideContext.Provider>
  );
};

export const useParamsWithOverride = <
  T extends string | Record<string, string | undefined>
>(): Readonly<[T] extends [string] ? Params<T> : Partial<T>> => {
  const overrideParams = useContext(ParamOverrideContext);
  const _params = useParams<T>();
  return useMemo(
    () => ({
      ..._params,
      ...overrideParams,
    }),
    [_params, overrideParams]
  );
};
