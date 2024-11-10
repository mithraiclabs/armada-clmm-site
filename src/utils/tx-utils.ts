import {
  SendTransactionOptions,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionError,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { MAX_TX_RETRIES_DEFAULT, TX_TIMEOUT_DEFAULT } from "./constants";
import { AnchorProvider, Provider } from "@coral-xyz/anchor";
import { splTokenProgram } from "@coral-xyz/spl-token";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "./getComputeLimit";
import { TransactionBuilder } from "@orca-so/common-sdk";

/**
 * Minimum cost in lamports for a TX.
 *
 * TODO make this dynamic.
 */
export const BASE_NETWORK_FEES = 0.00001 * 10 ** 9;

/**
 * Returns connection and context information for sending and confirming a tx with sendTransaction.
 *
 * Signs tx as needed.
 * @param wallet
 * @param userWalletKey
 * @param rpcEndpoint - typically connection.rpcEndpoint
 * @param tx - gets partial signed (as needed)
 * @param signers
 * @returns
 */
export const prepareSimpleTx = async (
  wallet: AnchorWallet | undefined,
  userWalletKey: PublicKey | null,
  rpcEndpoint: string,
  tx: Transaction | VersionedTransaction,
  signers: Signer[]
) => {
  if (!wallet || !userWalletKey) {
    console.error("Tried to refresh tx sender but no wallet was connected.");
    throw new WalletNotConnectedError();
  }

  const relaxedConnection = new Connection(rpcEndpoint, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: TX_TIMEOUT_DEFAULT,
  });

  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await relaxedConnection.getLatestBlockhashAndContext();

  if ("version" in tx) {
    // tx is a VersionedTransaction
    if (signers.length > 0) tx.sign([...signers]);
  } else {
    // tx is a Transaction
    (tx as Transaction).recentBlockhash = blockhash;
    (tx as Transaction).feePayer = wallet.publicKey;
    if (signers.length > 0) (tx as Transaction).partialSign(...signers);
  }

  return { relaxedConnection, minContextSlot, blockhash, lastValidBlockHeight };
};

/**
 * Send a basic single tx and return the promise for the confirmation.
 */
export const prepareAndSendTransaction = async (
  wallet: AnchorWallet | undefined,
  userWalletKey: PublicKey | null,
  rpcEndpoint: string,
  tx: Transaction | VersionedTransaction,
  signers: Signer[],
  sendTransaction: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options: SendTransactionOptions
  ) => Promise<string>
) => {
  const { relaxedConnection, minContextSlot, blockhash, lastValidBlockHeight } =
    await prepareSimpleTx(wallet, userWalletKey, rpcEndpoint, tx, signers);
  try {
    const signature = await sendTransaction(tx, relaxedConnection, {
      minContextSlot,
      maxRetries: MAX_TX_RETRIES_DEFAULT,
    });

    const resp = await relaxedConnection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });

    if (resp.value.err) {
      throw new TxError(resp.value.err, [signature]);
    }

    return signature;
  } catch (error) {
    const signatures = tx.signatures;
    const sgx = signatures.map((s) => {
      if ("signature" in s) {
        // is signature
        return s.signature?.toString() ?? "";
      } else {
        // unintarray
        const buffer = Buffer.from(s);
        return buffer.toString();
      }
    });
    throw new TxError(error as TransactionError, sgx);
  }
};

/**
 * Gets the SPL token program's IDL
 * @param provider - if used in the browser, a valid non-local provider
 * @returns
 */
export const getSplIdl = (provider: Provider) => {
  const splIdl = splTokenProgram({
    provider: provider as AnchorProvider,
  }).idl;
  return splIdl;
};

/**
 * Get rent required for storage bytes, with additional of 128 bytes of metadata
 * per account (excluding first account that is already included).
 */
export const getSolanaFeeAmount = async (
  connection: Connection,
  bytes: number,
  accounts: number
) => {
  if (!bytes || !accounts) {
    return BASE_NETWORK_FEES;
  }
  const feeAmount = await connection.getMinimumBalanceForRentExemption(
    bytes + (accounts - 1) * 128,
    "confirmed"
  );
  return feeAmount + BASE_NETWORK_FEES;
};

export const chunkArray = <T>(array: T[], chunkLength?: number): T[][] => {
  const chunks = [];
  const length = chunkLength ?? 100;
  for (let i = 0; i < array.length; i += length) {
    chunks.push(array.slice(i, i + length));
  }
  return chunks;
};

export const getManyAccounts = async (
  connection: Connection,
  addresses: PublicKey[]
) => {
  const addressChunks = chunkArray(addresses);

  const promises = addressChunks.map(async (addressChunk) => {
    return await connection.getMultipleAccountsInfo(addressChunk);
  });

  const results = await Promise.all(promises);
  return results.flat();
};

export class TxError extends Error {
  error: TransactionError;
  signatures: string[];
  logs: string[] | undefined;
  constructor(
    error: TransactionError | Error,
    signatures: string[],
    message?: string
  ) {
    super(message);
    this.error = error;
    this.signatures = signatures;
  }
}

export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

export const buildFromTxBuilder = async (
  txBuilder: unknown,
  connection: Connection,
  publicKey: PublicKey,
  latestBlockhash: {
    blockhash: string;
    lastValidBlockHeight: number;
  },
  priorityFeeIx: TransactionInstruction | null,
  presign: boolean
) => {
  const builtTx = (txBuilder as TransactionBuilder).buildSync({
    latestBlockhash,
    maxSupportedTransactionVersion: "legacy",
    blockhashCommitment: "confirmed",
  });
  const tx = builtTx.transaction as Transaction;
  const computeUnits = await getComputeUnitsForTransaction(
    connection,
    tx,
    publicKey
  );
  if (priorityFeeIx) {
    tx.instructions.unshift(priorityFeeIx);
  }
  if (computeUnits) {
    tx.instructions.unshift(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits * COMPUTE_UNIT_BUFFER,
      })
    );
  }
  if (builtTx.signers.length && presign) tx.partialSign(...builtTx.signers);
  return { tx, signers: builtTx.signers };
};
