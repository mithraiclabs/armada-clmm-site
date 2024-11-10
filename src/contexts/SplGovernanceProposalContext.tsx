import { Address } from "@coral-xyz/anchor";
import { GOVERNANCE_PROGRAM_ID } from "@mithraic-labs/spl-governance";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  Dispatch,
  Reducer,
  createContext,
  useContext,
  useReducer,
} from "react";

type SplGovernanceProposalState = {
  councilVote: boolean;
  governanceEnabled: boolean;
  governanceProgramId: PublicKey;
  governanceKey: Address | null;
  proposalAddress: Address | null;
  proposalOwnerRecordKey: Address | null;
  realmKey: Address | null;
  transactionList: Transaction[];
};

const initialState = {
  councilVote: false,
  governanceEnabled: false,
  governanceProgramId: GOVERNANCE_PROGRAM_ID,
  governanceKey: null,
  proposalAddress: null,
  proposalOwnerRecordKey: null,
  realmKey: null,
  transactionList: [],
};

const SplGovernanceProposalContext = createContext<
  [
    SplGovernanceProposalState,
    Dispatch<
      | Partial<SplGovernanceProposalState>
      | ((
          prevState: SplGovernanceProposalState
        ) => Partial<SplGovernanceProposalState>)
    >
  ]
>([
  initialState,
  () => {
    //
  },
]);

const formReducer = <S,>(
  prev: S,
  action: Partial<S> | ((prevState: S) => Partial<S>)
): S => {
  if (typeof action === "function") {
    return {
      ...prev,
      ...action(prev),
    };
  }
  return {
    ...prev,
    ...action,
  };
};

export const SplGovernanceProposalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const reducer = useReducer<
    Reducer<
      SplGovernanceProposalState,
      | Partial<SplGovernanceProposalState>
      | ((
          prevState: SplGovernanceProposalState
        ) => Partial<SplGovernanceProposalState>)
    >
  >(formReducer, initialState);
  return (
    <SplGovernanceProposalContext.Provider value={reducer}>
      {children}
    </SplGovernanceProposalContext.Provider>
  );
};

export const useSplGovernanceProposalReducer = () =>
  useContext(SplGovernanceProposalContext);
