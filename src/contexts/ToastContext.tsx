import React, { createContext } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import {
  ToastStatus,
  toastOpenAtom,
  toastTransactions,
  toastTxFamily,
} from "../state/toast/atoms";
import { Toaster } from "../components/Toaster";

type ToastContextType = {
  addToast: (description: string, hash: string, status?: ToastStatus) => string;
  changeStatus: (
    id: string,
    status: ToastStatus,
    newDescription?: string
  ) => void;
  removeToast: (id: string) => void;
  errorByHash: (
    hash: string,
    newDescription?: string,
    instruction?: string
  ) => void;
  timeoutByHash: (hash: string) => void;
  clearToasts: () => void;
  toastOpen: boolean;
  toastList: string[];
};

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const toastOpen = useRecoilValue(toastOpenAtom);
  const toastList = useRecoilValue(toastTransactions);

  const addToast = useRecoilCallback(
    ({ set, snapshot }) =>
      (description: string, hash: string, status?: ToastStatus) => {
        const id = Math.random().toString(12).slice(2);
        const list = snapshot.getLoadable(toastTransactions).getValue();
        set(toastOpenAtom, true);
        set(toastTxFamily(id), {
          description,
          hash,
          status: status ?? ToastStatus.Success,
        });
        set(toastTransactions, [...list, id]);
        return id;
      },
    []
  );

  const changeStatus = useRecoilCallback(
    ({ snapshot, set }) =>
      (id: string, status: ToastStatus, newDescription?: string) => {
        const t = snapshot.getLoadable(toastTxFamily(id)).getValue();
        if (!t) return;
        set(toastOpenAtom, true);
        set(toastTxFamily(id), {
          ...t,
          description: newDescription ?? t.description,
          status,
        });
        return;
      },
    []
  );

  const errorByHash = useRecoilCallback(
    ({ snapshot, set }) =>
      (hash: string, newDescription?: string, instruction?: string) => {
        const list = snapshot.getLoadable(toastTransactions).getValue();
        list.forEach((t) => {
          const toastRow = snapshot.getLoadable(toastTxFamily(t)).getValue();
          if (toastRow && toastRow.hash === hash) {
            set(toastTxFamily(t), {
              ...toastRow,
              status: ToastStatus.Error,
              description:
                toastRow.description +
                (newDescription ? ` (${newDescription})` : ""),
              instruction,
            });
          }
        });
      },
    []
  );

  const timeoutByHash = useRecoilCallback(
    ({ snapshot, set }) =>
      (hash: string) => {
        const list = snapshot.getLoadable(toastTransactions).getValue();
        list.forEach((t) => {
          const toastRow = snapshot.getLoadable(toastTxFamily(t)).getValue();
          if (toastRow && toastRow.hash === hash) {
            set(toastTxFamily(t), {
              ...toastRow,
              status: ToastStatus.Timeout,
              description: toastRow.description + " timed out",
            });
          }
        });
      },
    []
  );

  const removeToast = useRecoilCallback(
    ({ set, snapshot }) =>
      (id: string) => {
        const list = snapshot.getLoadable(toastTransactions).getValue();
        set(
          toastTransactions,
          list.filter((t) => t !== id)
        );
        set(toastTxFamily(id), null);
        return;
      },
    []
  );

  const clearToasts = useRecoilCallback(
    ({ set }) =>
      () => {
        set(toastTransactions, []);
        set(toastOpenAtom, false);
      },
    []
  );

  return (
    <ToastContext.Provider
      value={{
        addToast,
        changeStatus,
        removeToast,
        errorByHash,
        timeoutByHash,
        clearToasts,
        toastOpen,
        toastList,
      }}
    >
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};
