import React, { useMemo } from "react";
import { useState } from "react";
import { Toggle } from "../Toggle";
import { ClpDeposit, ClpWithdraw } from "./ActionTabs";
import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  tokenMetadataFamily,
} from "../../state";
import { SimpleCard } from "../common/SimpleCard";
import { useTranslation } from "react-i18next";

export const ClpVaultAction = ({ vaultId }: { vaultId: string }) => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<0 | 1 | 2>(0);
  const vault = useRecoilValue(clpVaultAtomFamily(vaultId));
  const mintA = useMemo(() => vault?.tokenMintA.toString() ?? "", [vault]);
  const mintB = useMemo(() => vault?.tokenMintB.toString() ?? "", [vault]);
  const tokenA = useRecoilValue(tokenMetadataFamily(mintA));
  const tokenB = useRecoilValue(tokenMetadataFamily(mintB));

  if (!tokenA || !tokenB || !vault) return null;

  return (
    <SimpleCard className="rounded-2xl mx-0">
      <Toggle
        onChange={(i) => {
          setSelectedTab(i as 0 | 1 | 2);
        }}
        selectedIndex={selectedTab}
      >
        <div className="font-medium text-sm">{t("Deposit")}</div>
        <div className="font-medium text-sm">{t("Withdraw")}</div>
      </Toggle>
      {selectedTab === 0 && <ClpDeposit vaultId={vaultId} />}
      {selectedTab === 1 && <ClpWithdraw vaultId={vaultId} />}
    </SimpleCard>
  );
};
