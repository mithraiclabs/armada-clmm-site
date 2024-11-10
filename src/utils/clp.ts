import { AccountMeta, PublicKey } from "@solana/web3.js";
import { VaultPosition } from "./types";
import {
  TickUtil,
  PDAUtil,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from "@orca-so/whirlpools-sdk";

/**
 * Generates an array of AccountMeta for the active VaultPositions
 */
export const getVaultPositionAccounts = (
  vaultPositions: VaultPosition[],
  whirlpoolKey: PublicKey,
  tickSpacing: number
): AccountMeta[] => {
  const remainingAccounts: AccountMeta[] = [];
  vaultPositions.forEach((vaultPosition) => {
    // Return if the vault position is an empty or non-active position
    if (vaultPosition.positionKey.equals(PublicKey.default)) {
      return;
    }
    remainingAccounts.push({
      pubkey: vaultPosition.positionKey,
      isWritable: true,
      isSigner: false,
    });

    const lowerTickArrayStart = TickUtil.getStartTickIndex(
      vaultPosition.lowerTick,
      tickSpacing
    );
    const lowerTickArrayPda = PDAUtil.getTickArray(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      whirlpoolKey,
      lowerTickArrayStart
    ).publicKey;
    const upperTickArrayStart = TickUtil.getStartTickIndex(
      vaultPosition.upperTick,
      tickSpacing
    );
    const upperTickArrayPda = PDAUtil.getTickArray(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      whirlpoolKey,
      upperTickArrayStart
    ).publicKey;

    remainingAccounts.push({
      pubkey: lowerTickArrayPda,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: upperTickArrayPda,
      isWritable: true,
      isSigner: false,
    });
  });
  return remainingAccounts;
};

export const generateCSV = ({
  history,
  symbolA,
  symbolB,
  wallet,
  vaultId,
}: {
  history: {
    amountA: string;
    usdA: string;
    amountB: string;
    usdB: string;
    type: string;
    timestamp: string;
  }[];
  symbolA: string;
  symbolB: string;
  wallet: string;
  vaultId: string;
}) => {
  // Define the header
  const header = [
    "Timestamp",
    "Event",
    `Amount ${symbolA}`,
    `${symbolA} in USD`,
    `Amount ${symbolB}`,
    `${symbolB} in USD`,
  ];
  const csvHeader = header.join(",");

  // Define the data rows
  const rows = history.map((row) => {
    return `${row.timestamp.split(",").join(" ")},${row.type},${row.amountA},${
      row.usdA
    },${row.amountB},${row.usdB}`;
  });

  // Combine header and rows
  const csvContent = [csvHeader, ...rows].join("\n");

  // Create a Blob object from the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Generate a download link and click it programmatically
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${vaultId}_history_for_${wallet}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
