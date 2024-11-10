import { useTranslation } from "react-i18next";
import { useRecoilState } from "recoil";
import { SimpleModal } from "../../components/common";
import {
  ClmmVaultSortType,
  clmmVaultManagerFilterAtom,
  clmmVaultSortAtom,
} from "../../state";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { TextButton } from "../../components/Button/TextButton";

export const MobileSortModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      className=" text-text text-xl font-khand bg-background-container min-w-[320px] sm:min-w-[520px]"
    >
      <div className=" flex justify-between flex-row SortItems-center mb-2 text-xl font-bold">
        <p>Sort by...</p>
        <TextButton onClick={onClose}>
          <CloseIcon />
        </TextButton>
      </div>
      <div className="flex flex-col">
        <SortItem name="TVL, High to Low" type="tvl" />
        <SortItem name="TVL, Low to High" type="tvl" ascending />
        <SortItem name="Rate, High to Low" type="rate" />
        <SortItem name="Rate, Low to High" type="rate" ascending />
        <SortItem name="Volume, High to Low" type="volume" />
        <SortItem name="Volume, Low to High" type="volume" ascending />
        <SortItem name="Fees, High to Low" type="fees" />
        <SortItem name="Fees, Low to High" type="fees" ascending />
      </div>
    </SimpleModal>
  );
};

export const ManagerMobileFilterModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useRecoilState(clmmVaultManagerFilterAtom);
  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      className=" text-text text-xl font-khand bg-background-container min-w-[320px] sm:min-w-[520px]"
    >
      <div className=" flex justify-between flex-row SortItems-center mb-2  text-xl font-bold">
        <p>Show vaults managed by...</p>
        <TextButton onClick={onClose}>
          <CloseIcon />
        </TextButton>
      </div>
      <div className="flex flex-col">
        <div
          onClick={() => {
            setFilter("All");
          }}
          className={
            "p-2 " +
            (filter === "All"
              ? "bg-background-panelSurface rounded-md outline"
              : "")
          }
        >
          <p>{t("All")}</p>
        </div>
        <div
          onClick={() => {
            setFilter("Armada");
          }}
          className={
            "p-2 " +
            (filter === "Armada"
              ? "bg-background-panelSurface rounded-md outline"
              : "")
          }
        >
          <p>Armada</p>
        </div>
        <div
          onClick={() => {
            setFilter("STS");
          }}
          className={
            "p-2 " +
            (filter === "STS"
              ? "bg-background-panelSurface rounded-md outline"
              : "")
          }
        >
          <p>STS</p>
        </div>
      </div>
    </SimpleModal>
  );
};

const SortItem = ({
  name,
  type,
  ascending = false,
}: {
  name: string;
  type: ClmmVaultSortType;
  ascending?: boolean;
}) => {
  const { t } = useTranslation();
  const [sortCriteria, setClmmVaultSort] = useRecoilState(clmmVaultSortAtom);
  return (
    <div
      onClick={() => {
        setClmmVaultSort({
          type,
          ascending,
        });
      }}
      className={
        "p-2 " +
        (sortCriteria.type === type && sortCriteria.ascending === ascending
          ? "bg-background-panelSurface rounded-md outline"
          : "")
      }
    >
      <p>{t(name)}</p>
    </div>
  );
};
