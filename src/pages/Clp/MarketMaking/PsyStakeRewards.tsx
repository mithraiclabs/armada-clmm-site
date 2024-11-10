import { useState } from "react";
import { Button } from "../../../components/Button";
import { SimpleCard } from "../../../components/common";
import { useLoadClpVault } from "../../../hooks/Clp/useLoadClpVault";
import { useRecoilValue } from "recoil";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import {
  clpVaultAtomFamily,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { useLoadClpTokenMetadatas } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { useLoadClpVaultPositions } from "../../../hooks/Clp/useLoadClpVaultPositions";
import { useLoadNativeSolBalance } from "../../../hooks/useLoadNativeSolBalance";
import { useLoadSplMintsFromClpVault } from "../../../hooks/useLoadSplMintsFromClpVault";

export const PsyStakeRewards = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [_, setShowRewards] = useState(false);
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(clpKey));
  const loadingClpVault = useLoadClpVault(clpKey);
  useLoadNativeSolBalance();
  useLoadSplMintsFromClpVault(clpKey);
  useLoadClpVaultPositions(clpKey);
  useLoadClpTokenMetadatas(clpKey);
  if (!clpVault && loadingClpVault) {
    return <div>loading</div>;
  }

  return (
    <div className="flex flex-row justify-center">
      <SimpleCard className="mx-0 ">
        <p className="font-khand font-semibold">
          {tokenSymbolA} {tokenSymbolB} Vault: {clpKey}
        </p>
        <div className="w-full">
          <Button
            className="w-full"
            onClick={() => setShowRewards(true)}
            fullWidth
          >
            Set Up Staking Rewards
          </Button>
        </div>
      </SimpleCard>
    </div>
  );
};
