import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { ClpVaultCard } from "../../components/CLP/ClpVaultCard";
import { ClpVaultRow } from "../../components/CLP/ClpVaultRow";
import { useLoadAllClpVaults } from "../../hooks/Clp/useLoadClpVault";
import { ReactComponent as TinyArrow } from "../../assets/icons/arrow.svg";
import { ReactComponent as CrossIcon } from "../../assets/icons/cross.svg";
import {
  ClmmVaultSortType,
  annualizeRatesAtom,
  clmmVaultSearchFilterAtom,
  clmmVaultSortAtom,
  selectSortText,
  selectSortedVaultKeys,
} from "../../state";
import { useTokenPrice } from "../../hooks/utils/useTokenPrice";
import { useLoadClpHistory } from "../../hooks/Clp/useLoadClpHistory";
import { Button } from "../../components/Button";
import {
  ArrowLongDownIcon,
  ArrowLongUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { ReactComponent as FilterIcon } from "../../assets/icons/filter.svg";
import { Portal } from "../../components/Portal";
import { AllClpRefreshSpinner } from "../../components/LoadingSpinners/AllClpRefreshSpinner";
import { useTranslation } from "react-i18next";
import { TextButton } from "../../components/Button/TextButton";
import { TextInput } from "../../components/common";
import { MobileSortModal } from "./Filter";

export const Clp = () => {
  const load = useLoadAllClpVaults();
  useTokenPrice();
  useLoadClpHistory();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-4 md:mx-12 lg:mx-24 mt-2">
      <Portal portalId="spinner">
        <AllClpRefreshSpinner refreshInterval={300} />
      </Portal>
      <ClmmViewSelector />
      <div className="hidden lg:block">
        <ClmmListView />
      </div>
      <div className="lg:hidden">
        <ClmmMobileView />
      </div>
    </div>
  );
};

export const ClmmViewSelector = () => {
  const [clmmVaultSearchFilter, setClmmVaultSearchFilter] = useRecoilState(
    clmmVaultSearchFilterAtom
  );
  const [mobileSortModalOpen, setMobileSortModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const sortCriteria = useRecoilValue(clmmVaultSortAtom);
  const sortText = useRecoilValue(selectSortText);
  const { t } = useTranslation();

  return (
    <div className="bg-background w-full sticky top-0 z-[2] py-1">
      <div className="lg:hidden">
        <MobileSortModal
          isOpen={mobileSortModalOpen}
          onClose={() => setMobileSortModalOpen(false)}
        />
      </div>
      <div className="flex flex-row justify-between my-2  z-[2]">
        <TextInput
          startIcon={
            clmmVaultSearchFilter ? (
              <TextButton
                onClick={() => setClmmVaultSearchFilter("")}
                className="flex items-end"
              >
                <div className="text-text">
                  <XMarkIcon height={16} />
                </div>
              </TextButton>
            ) : (
              <div className="text-text-placeholder">
                <MagnifyingGlassIcon height={16} />
              </div>
            )
          }
          placeholder="Token Symbol"
          value={clmmVaultSearchFilter}
          onChange={setClmmVaultSearchFilter}
        />
        <div className="hidden md:flex flex-row justify-end space-x-2">
          <div
            className={inputButtonClassname + " md:px-3 lg:hidden"}
            onClick={() => setMobileSortModalOpen(true)}
          >
            <div className="flex flex-row items-center">
              {t(`Sort by ${sortText}`)}{" "}
              {sortCriteria.ascending ? (
                <ArrowLongUpIcon height={16} />
              ) : (
                <ArrowLongDownIcon height={16} />
              )}
            </div>
            <TinyArrow height={16} />
          </div>
        </div>
        <div className="md:hidden">
          <Button variant="outline" onClick={() => setExpanded((p) => !p)}>
            {expanded ? (
              <CrossIcon height={20} width={20} />
            ) : (
              <FilterIcon height={20} width={20} />
            )}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="flex flex-row justify-between space-x-4 my-4 z-[2] md:hidden">
          <div
            className={inputButtonClassname + " w-full"}
            onClick={() => setMobileSortModalOpen(true)}
          >
            <div className="flex flex-row items-center">
              {t(`Sort by ${sortText}`)}{" "}
              {sortCriteria.ascending ? (
                <ArrowLongUpIcon height={16} />
              ) : (
                <ArrowLongDownIcon height={16} />
              )}
            </div>
            <TinyArrow height={16} />
          </div>
        </div>
      )}
    </div>
  );
};

export const ClmmMobileView = () => {
  const clpVaultKeys = useRecoilValue(selectSortedVaultKeys);

  return (
    <div className="grid grid-cols-12 gap-4">
      {clpVaultKeys.map((k) => (
        <div key={k} className="col-span-12 md:col-span-6 xl:col-span-3 flex">
          <ClpVaultCard vaultId={k} />
        </div>
      ))}
    </div>
  );
};

const ClmmListSortableHeader = ({
  children,
  type,
}: {
  children: React.ReactNode;
  type: ClmmVaultSortType;
}) => {
  const [{ type: sortType, ascending }, setClmmVaultSort] =
    useRecoilState(clmmVaultSortAtom);
  const activeSortType = sortType === type;
  return (
    <TextButton
      onClick={() => {
        setClmmVaultSort((prev) => ({
          type,
          // when switching sort type, default to descending
          ascending: prev.type === type ? !prev.ascending : false,
        }));
      }}
      className={`flex flex-1 flex-row justify-center items-center ${
        activeSortType ? "text-text text-medium font-semibold" : ""
      }`}
    >
      <p>{children} </p>
      {activeSortType && (
        // only show arrows when the header is the active sort
        <>
          {ascending ? (
            <ArrowLongUpIcon height={16} />
          ) : (
            <ArrowLongDownIcon height={16} />
          )}
        </>
      )}
    </TextButton>
  );
};

export const ClmmListView = () => {
  const { t } = useTranslation();
  const clpVaultKeys = useRecoilValue(selectSortedVaultKeys);
  const ratesAnnualized = useRecoilValue(annualizeRatesAtom);
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-12 text-center text-sm text-text-placeholder font-semibold">
        <div className="col-span-2 flex justify-center items-center">
          <p>{t("Asset")}</p>
        </div>
        <div className="col-span-2 flex justify-center items-center">
          <p>{t("Your Balance")}</p>
        </div>
        <div className="col-span-1 flex justify-center items-center">
          <ClmmListSortableHeader type="rate">
            {ratesAnnualized ? t("24HR Rate (annualized)") : t("24HR Rate")}
          </ClmmListSortableHeader>
        </div>
        <div className="col-span-3 flex justify-center items-center">
          <ClmmListSortableHeader type="tvl">{t("TVL")}</ClmmListSortableHeader>
        </div>
        <div className="col-span-1 flex justify-center items-center">
          <ClmmListSortableHeader type="fees">
            {t("24HR Fees")}
          </ClmmListSortableHeader>
        </div>
        <div className="col-span-2 flex justify-center items-center">
          <ClmmListSortableHeader type="volume">
            {t("24HR Volume")}
          </ClmmListSortableHeader>
        </div>
      </div>
      <div>
        {clpVaultKeys.map((k) => (
          <ClpVaultRow vaultId={k} key={k} />
        ))}
      </div>
    </div>
  );
};

const inputButtonClassname =
  "bg-background-input p-2 items-center font-medium py-2.5 rounded-xl text-text-placeholder flex flex-row justify-between border border-text-placeholder";
