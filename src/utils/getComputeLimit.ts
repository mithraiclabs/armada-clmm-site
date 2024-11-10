import { web3 } from "@coral-xyz/anchor";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

/** 10% buffer on CU calculation */
export const COMPUTE_UNIT_BUFFER = 1.05;

export const getComputeUnitsForTransaction = async (
  connection: Connection,
  transaction: web3.Transaction,
  payer: PublicKey,
  lookupTables?: web3.AddressLookupTableAccount[]
) => {
  return getComputeUnitsForInstructions(
    connection,
    transaction.instructions,
    payer,
    lookupTables
  );
};

export const getComputeUnitsForVersionedTransaction = async (
  connection: Connection,
  transaction: web3.VersionedTransaction
) => {
  const simulation = await connection.simulateTransaction(transaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
};

export const getComputeUnitsForInstructions = async (
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables?: web3.AddressLookupTableAccount[]
): Promise<number | undefined> => {
  const testInstructions = [
    web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ...instructions,
  ];

  const testVersionedTxn = new web3.VersionedTransaction(
    new web3.TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
};
