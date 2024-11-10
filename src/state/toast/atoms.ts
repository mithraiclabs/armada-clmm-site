import { atom, atomFamily } from "recoil";

export const toastOpenAtom = atom<boolean>({
  key: "toastOpenAtom",
  default: false,
});

export const toastHoveredAtom = atom<boolean>({
  key: "toastHoveredAtom",
  default: false,
});

export const toastTransactions = atom<string[]>({
  key: "toastTransactions",
  default: [],
});

export const toastTxFamily = atomFamily<ToastTx | null, string>({
  key: "toastTxFamily",
  default: null,
});

type ToastTx = {
  description: string;
  status: ToastStatus;
  hash: string;
  instruction?: string;
};

export enum ToastStatus {
  Loading,
  Error,
  Success,
  Pending,
  CloseAccount,
  Timeout,
}
