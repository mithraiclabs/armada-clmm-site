import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import {
  clpVaultAtomFamily,
  explorerAtom,
  selectTokenASymbol,
  selectTokenBSymbol,
} from "../../../state";
import { useLoadClpVault } from "../../../hooks/Clp/useLoadClpVault";
import { useLoadClpVaultPositions } from "../../../hooks/Clp/useLoadClpVaultPositions";
import { useLoadSplMintsFromClpVault } from "../../../hooks/useLoadSplMintsFromClpVault";
import { VaultInfo } from "./VaultInfo";
import { MarketMakingChart } from "./MarketMakingChart";
import { PositionsInfo } from "./PositionsInfo";
import { useLoadNativeSolBalance } from "../../../hooks/useLoadNativeSolBalance";
import { TotalValueLocked } from "../../../components/CLP/TotalValueLocked";
import { useLoadClpTokenMetadatas } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { TextButton } from "../../../components/Button/TextButton";
import { ClpVaultSymbols } from "../../../components/CLP/ClpVaultSymbols";
import { ClipboardDocumentIcon, LinkIcon } from "@heroicons/react/20/solid";
import { Button } from "../../../components/Button";
import { SimpleCard } from "../../../components/common/SimpleCard";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Explorers, NetworkOption } from "../../../utils/types";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { VaultStrategy } from "../../../components/CLP/VaultStrategy";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { Portal } from "../../../components/Portal";
import { MarketMakingRefreshSpinner } from "../../../components/LoadingSpinners/MarketMakingRefreshSpinner";
import { useTokenPrice } from "../../../hooks/utils/useTokenPrice";

export const MarketMaking = () => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const [showKeys, setShowKeys] = useState(false);
  const loadingClpVault = useLoadClpVault(clpKey);
  useTokenPrice();
  useLoadNativeSolBalance();
  useLoadSplMintsFromClpVault(clpKey);
  useLoadClpVaultPositions(clpKey);
  useLoadClpTokenMetadatas(clpKey);
  const tokenSymbolA = useRecoilValue(selectTokenASymbol(clpKey));
  const tokenSymbolB = useRecoilValue(selectTokenBSymbol(clpKey));

  if (!clpVault && loadingClpVault) {
    return <div>loading</div>;
  }

  return (
    <div className="md:px-16 lg:px-24 grid grid-cols-12 gap-2">
      <Portal portalId="spinner">
        <MarketMakingRefreshSpinner clpKey={clpKey} refreshInterval={30} />
      </Portal>
      <div className="col-span-2" />
      <div className="col-span-8">
        <p className="text-text text-center text-2xl font-semibold font-khand uppercase">
          <TextButton onClick={() => setShowKeys((p) => !p)}>
            <ClpVaultSymbols clpKey={clpKey} /> Vault
          </TextButton>
        </p>
        {showKeys && (
          <SimpleCard>
            <AddressDisplayRow name="Vault" address={clpKey} />
            <AddressDisplayRow
              name="Whirlpool"
              address={clpVault?.clp.toString()}
            />
            <AddressDisplayRow
              name="LP Mint"
              address={clpVault?.lpMint.toString()}
            />
            <AddressDisplayRow
              name={`${tokenSymbolA} Mint`}
              address={clpVault?.tokenMintA.toString()}
            />
            <AddressDisplayRow
              name={`${tokenSymbolB} Mint`}
              address={clpVault?.tokenMintB.toString()}
            />
          </SimpleCard>
        )}
      </div>
      <div className="col-span-2" />
      <div className="col-span-2" />
      <div className="col-span-4 flex flex-col">
        <p className="text-xl font-khand text-text-placeholder">
          Active Positions
        </p>
        <MarketMakingChart />
        <VaultStrategy />
      </div>
      <div className="col-span-4 flex flex-col px-2">
        <VaultInfo />
        <TotalValueLocked />
        <PositionsInfo />
      </div>
      <div className="col-span-2" />
    </div>
  );
};

export const AddressDisplayRow = ({
  name,
  address,
  small,
  short,
}: {
  name?: string;
  address?: string;
  small?: boolean;
  short?: boolean;
}) => {
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const explorer = useRecoilValue(explorerAtom);
  if (!address) return null;
  return (
    <div
      className={`flex flex-row align-middle justify-between items-center ${
        small ? "text-sm" : ""
      }`}
    >
      {name && <p className="flex">{name}:</p>}
      <Button
        variant="simple"
        onClick={() => {
          navigator.clipboard.writeText(address);
          toast.success("Copied to clipboard", { duration: 1000 });
        }}
      >
        <p className={small ? "text-xs" : ""}>
          {short ? address.slice(0, 10) + "..." : address}
        </p>
        <ClipboardDocumentIcon className={`ml-2 h-5 w-5`} />
      </Button>
      <Link
        target="_blank"
        rel="noopener noreferrer"
        to={Explorers[explorer].accountLink(address, isDevnet)}
      >
        <LinkIcon className="w-5 h-5" />
      </Link>
    </div>
  );
};
