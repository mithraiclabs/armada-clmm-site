import React, { useCallback, useMemo } from "react";
import { Transition } from "@headlessui/react";
import {
  ErrorIcon,
  Toaster as RHToaster,
  ToastIcon,
  resolveValue,
  CheckmarkIcon,
  LoaderIcon,
} from "react-hot-toast";
import { toast } from "react-hot-toast";
import { ReactComponent as CloseIcon } from "../assets/icons/close.svg";
import { TextButton } from "./Button/TextButton";
import { SimpleCard } from "./common";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  ToastStatus,
  toastHoveredAtom,
  toastOpenAtom,
  toastTransactions,
  toastTxFamily,
} from "../state/toast/atoms";
import { useTxToast } from "../hooks/utils/useTxToast";
import { useDevnetState } from "../contexts/NetworkProvider";
import { Explorers, NetworkOption } from "../utils/types";
import {
  EllipsisHorizontalCircleIcon,
  BanknotesIcon,
  ClockIcon,
} from "@heroicons/react/20/solid";
import { useWSolAccounts } from "../hooks/utils/useWSolAccounts";
import { explorerAtom } from "../state";

export const Toaster = () => {
  return (
    <>
      <RHToaster
        position="bottom-left"
        toastOptions={{
          duration: 8000,
          error: {
            duration: 10000000,
          },
          loading: { duration: 10000000 },
        }}
        containerStyle={{
          zIndex: 1000,
          position: "absolute",
        }}
        containerClassName="z-50"
      >
        {(t) => {
          return (
            <Transition
              appear
              show={t.visible}
              id="toast"
              className="transform p-4 flex bg-background-container rounded shadow-lg"
              enter="transition-all duration-150"
              enterFrom="opacity-0 scale-50"
              enterTo="opacity-100 scale-100"
              leave="transition-all duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-75"
            >
              <ToastIcon toast={t} />
              <p className="px-2">{resolveValue(t.message, t)}</p>
              <TextButton onClick={() => toast.dismiss(t.id)}>
                <CloseIcon />
              </TextButton>
            </Transition>
          );
        }}
      </RHToaster>
    </>
  );
};

export function TxSuccessToast({ message }: { message: string }) {
  return <a href={"/history"}>{message}</a>;
}

export const TransactionToastWindow = () => {
  const [toastOpen, setToastOpen] = useRecoilState(toastOpenAtom);
  const toastList = useRecoilValue(toastTransactions);
  const { removeToast } = useTxToast();
  const setToastHovered = useSetRecoilState(toastHoveredAtom);
  const onClose = useCallback(() => {
    toastList.forEach((id) => removeToast(id));
    setToastOpen(false);
  }, [toastList, setToastOpen, removeToast]);

  if (!toastOpen || !toastList.length) return null;
  return (
    <SimpleCard
      className=" fixed bottom-10 xl:bottom-16 md:left-4 xl:left-24 min-w-80 min-h-40 z-50 bg-background-input "
      contentClassName="bg-background-panel"
      onHover={setToastHovered}
    >
      <div className="w-full justify-between items-center flex fex-row">
        <span className=" font-khand font-semibold text-xl">Transaction</span>
        <TextButton onClick={onClose}>
          <CloseIcon />
        </TextButton>
      </div>
      {toastList.map((tId) => (
        <ToastRow key={tId} id={tId} />
      ))}
    </SimpleCard>
  );
};

export const ToastRow = ({ id }: { id: string }) => {
  const toast = useRecoilValue(toastTxFamily(id));
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const explorer = useRecoilValue(explorerAtom);
  const { closeAccount } = useWSolAccounts();
  const { removeToast } = useTxToast();
  const status = useMemo(() => {
    switch (toast?.status) {
      case ToastStatus.Error:
        return <ErrorIcon />;
      case ToastStatus.Success:
        return <CheckmarkIcon />;
      case ToastStatus.Loading:
        return <LoaderIcon />;
      case ToastStatus.Pending:
        return <EllipsisHorizontalCircleIcon width={22} />;
      case ToastStatus.CloseAccount:
        return <BanknotesIcon width={22} />;
      case ToastStatus.Timeout:
        return <ClockIcon width={22} className="text-text-warning" />;
    }
  }, [toast?.status]);
  const onCloseAccount = useCallback(async () => {
    if (!toast) return;
    if (toast.status === ToastStatus.CloseAccount) {
      const txid = await closeAccount(toast.hash);
      if (txid) {
        removeToast(id);
      }
    }
  }, [closeAccount, id, removeToast, toast]);

  if (!toast) return null;
  const explorerLink = Explorers[explorer].txLink(toast.hash, isDevnet);

  return (
    <>
      <div className="w-full flex flex-row justify-between align-middle items-center space-x-3 my-1">
        <div>{status}</div>
        <div>
          <p>
            {toast.description} &nbsp;
            {toast.status === ToastStatus.CloseAccount && (
              <TextButton onClick={onCloseAccount}>
                <span
                  style={{
                    textDecoration: "underline",
                  }}
                >
                  Reclaim
                </span>
              </TextButton>
            )}
            {[
              ToastStatus.Success,
              ToastStatus.Timeout,
              ToastStatus.Loading,
              ToastStatus.Error,
            ].includes(toast.status) && (
              <a href={explorerLink} target="_blank">
                <span
                  style={{
                    textDecoration: "underline",
                  }}
                >
                  Show in Explorer
                </span>
              </a>
            )}
          </p>
        </div>
      </div>
      {toast.instruction && (
        <div className=" w-fit flex mb-2">
          <p className=" text-text-placeholder text-xs">{toast.instruction}</p>
        </div>
      )}
    </>
  );
};
