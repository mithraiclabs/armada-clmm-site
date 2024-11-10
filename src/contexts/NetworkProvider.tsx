import { createContext, useContext } from "react";
import { useRecoilState } from "recoil";
import { customRpcAtom, networkAtom } from "../state";
import { NetworkOption } from "../utils/types";


const NetworkContext = createContext<
  [
    NetworkOption, React.Dispatch<React.SetStateAction<NetworkOption>>,
    string, React.Dispatch<React.SetStateAction<string>>
  ]
>([
  1,
  () => {
    // ignore noop
  },
  '',
  () => {
    // 
  }
]);
export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const networkState = useRecoilState(networkAtom);
  const customRpcState = useRecoilState(customRpcAtom);

  return (
    <NetworkContext.Provider value={[...networkState, ...customRpcState]}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useDevnetState = () => useContext(NetworkContext);

