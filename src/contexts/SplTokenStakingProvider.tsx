import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";

const SplTokenStakingContext = createContext<{ version: 0 | 1 }>({
  version: 1,
});

export const SplTokenStakingProvider = ({
  children,
  version = 1,
}: {
  children?: React.ReactNode;
  version: 0 | 1;
}) => {
  const val = useMemo(
    () => ({
      version,
    }),
    [version]
  );
  return (
    <SplTokenStakingContext.Provider value={val}>
      <Outlet />
      {children}
    </SplTokenStakingContext.Provider>
  );
};

export const useSplTokenStakingContext = () =>
  useContext(SplTokenStakingContext);
