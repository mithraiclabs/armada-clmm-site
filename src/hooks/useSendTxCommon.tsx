import { Idl, parseIdlErrors, translateError } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  VersionedTransaction,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ToastStatus } from "../state/toast/atoms";
import { useTxToast } from "./utils/useTxToast";
import { useDevnetState } from "../contexts/NetworkProvider";
import { NetworkOption } from "../utils/types";
import {
  DEVNET_BROADCAST_URLS,
  MAINNET_BROADCAST_URLS,
} from "../utils/constants";
import { wait } from "../utils/tx-utils";

export async function promiseAllInOrder<T>(
  it: (() => Promise<T>)[]
): Promise<Iterable<T>> {
  const ret: T[] = [];
  for (const i of it) {
    ret.push(await i());
  }
  return ret;
}

const useSharedTxLogic = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { addToast, errorByHash, changeStatus, timeoutByHash } = useTxToast();
  const [network] = useDevnetState();
  const broadCastUrls =
    network === NetworkOption.Devnet
      ? DEVNET_BROADCAST_URLS
      : MAINNET_BROADCAST_URLS;

  const sendMultipleTransactions = useCallback(
    async (
      transactions: (Transaction | VersionedTransaction)[],
      descriptions?: string[],
      idl?: Idl,
      tokenAccounts?: PublicKey[],
      options?: ConfirmOptions
    ) => {
      if (!wallet) throw new Error("wallet not connected");
      const blockhash = await connection.getLatestBlockhash();
      const txnsSigned = await wallet.signAllTransactions(transactions);
      const signatures = txnsSigned.reduce((prev, curr) => {
        const signature = curr.signatures[0];
        if ("signature" in signature) {
          prev.push(bs58.encode(signature.signature ?? []));
        } else {
          prev.push(bs58.encode(signature));
        }
        return prev;
      }, [] as string[]);
      const toastIds = signatures.map((s, i) => {
        const description =
          descriptions && descriptions[i] ? descriptions[i] : "Transaction";
        const toastId = addToast(description, s, ToastStatus.Pending);
        return toastId;
      });

      let lastSentTx = "";
      try {
        return await promiseAllInOrder(
          txnsSigned.map((txn, index) => async () => {
            const buffer = Buffer.isBuffer(txn)
              ? txn
              : Buffer.from(txn.serialize());
            const description = descriptions?.[index];
            const toastId = toastIds[index];
            toastId && changeStatus(toastId, ToastStatus.Loading);
            lastSentTx = signatures[index];

            const broadcastConnections = broadCastUrls.length
              ? broadCastUrls.map((url) => new Connection(url, "processed"))
              : [connection];

            const txId = await adaptiveBroadcast(
              buffer,
              signatures[index],
              broadcastConnections,
              blockhash,
              options ?? {
                commitment: "confirmed",
                skipPreflight: true,
                maxRetries: 5,
              }
            );

            toastId && changeStatus(toastId, ToastStatus.Success, description);
            return txId;
          })
        );
      } catch (err) {
        if (signatures) {
          // this is some extra leeway to ensure a tx that went through isnt accidentally marked as timed out
          await wait(2000);
          const tx = await connection.getParsedTransaction(lastSentTx, {
            commitment: "confirmed",
          });
          if (!tx) {
            timeoutByHash(lastSentTx);
          } else {
            const logs = tx.meta?.logMessages ?? [];
            let errorFound = false;
            if (logs.length) {
              logs.forEach((l) => {
                if (l.includes("Error Message: ")) {
                  errorFound = true;
                  const message = l.split("Error Message: ")[1];
                  console.log({ message });

                  if (
                    message.includes("token amount exceeded") ||
                    message.includes("minimum tokens not returned")
                  ) {
                    errorByHash(
                      lastSentTx,
                      "Price tolerance exceeded",
                      "Price moved too much prior to signing the transaction. Please increase the price tolerance and try again."
                    );
                  } else {
                    errorByHash(lastSentTx, message);
                  }
                }
              });
            }
            if (!errorFound) {
              if (!idl) {
                errorByHash(lastSentTx);
              } else {
                const translated = translateError(err, parseIdlErrors(idl)) as {
                  msg: string;
                };
                errorByHash(lastSentTx, translated.msg);
              }
            }
          }
        }
        if (lastSentTx !== signatures[0] && tokenAccounts?.length) {
          (await connection.getMultipleAccountsInfo(tokenAccounts)).forEach(
            (a, i) => {
              if (!a) return;
              addToast(
                "Reclaim wSOL from temp account",
                tokenAccounts[i].toString(),
                ToastStatus.CloseAccount
              );
            }
          );
        }
        return "";
      }
    },
    [
      wallet,
      connection,
      addToast,
      changeStatus,
      broadCastUrls,
      errorByHash,
      timeoutByHash,
    ]
  );

  const sendTx = useCallback(
    async (
      tx: Transaction | VersionedTransaction,
      signers: Signer[] = [],
      idl?: Idl,
      description?: string,
      options?: ConfirmOptions
    ) => {
      if (!wallet) throw new Error("wallet not connected");
      const recentBlockhash = (await connection.getLatestBlockhash("confirmed"))
        .blockhash;
      if (tx instanceof Transaction) {
        tx.recentBlockhash = recentBlockhash;
        tx.feePayer = wallet.publicKey;
        if (signers.length) {
          tx.partialSign(...signers);
        }
      } else {
        tx.message.recentBlockhash = recentBlockhash;
        signers.forEach((s) =>
          tx.addSignature(s.publicKey, Buffer.from(s.secretKey))
        );
      }
      const [txId] = await sendMultipleTransactions(
        [tx],
        description ? [description] : [],
        idl,
        undefined,
        options
      );
      return txId;
    },
    [wallet, connection, sendMultipleTransactions]
  );

  return { sendTx, sendMultipleTransactions };
};

const adaptiveBroadcast = async (
  txnBuffer: Buffer,
  signature: string,
  broadcastConnections: Connection[],
  blockhash: {
    blockhash: string;
    lastValidBlockHeight: number;
  },
  options: ConfirmOptions
): Promise<string> => {
  let retries = 0;
  const maxRetries = options.maxRetries ?? 5;
  let retryInterval = 5000;

  while (retries < maxRetries) {
    try {
      const txId = await Promise.race(
        broadcastConnections.map((_connection) =>
          sendAndConfirmRawTransaction(
            _connection,
            txnBuffer,
            {
              signature,
              ...blockhash,
              lastValidBlockHeight: blockhash.lastValidBlockHeight + 300,
            },
            options
          )
        )
      );
      return txId;
    } catch (error) {
      retries++;
      const tx = await broadcastConnections[0].getParsedTransaction(signature, {
        commitment: "confirmed",
      });
      if (tx) {
        throw error;
      }
      await wait(retryInterval);
      retryInterval *= 1.2;
    }
  }

  throw new Error("Failed to broadcast transaction after maximum retries.");
};

export default useSharedTxLogic;
