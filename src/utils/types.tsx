import { PublicKey } from "@solana/web3.js";
import { PsyStakeRecord } from "../state";

export type SimulationChartData = {
  timestamp: number;
  pricePaidForSale: number;
  pricePaidPerCoin: number;
  soldInSale: number;
  totalEarned: number;
  totalSold: number;
}[];

export type VaultPosition = {
  positionKey: PublicKey;
  lowerTick: number;
  upperTick: number;
};

export enum BuyType {
  Target,
  Base,
}

export interface StakingRecordWithKeyAndVaultId {
  stakingRecord: PsyStakeRecord;
  clpVaultId: string;
  key: PublicKey;
}

export type TxGroupLog = {
  action: string;
  timestamp: number;
  signatures: SignatureLog[];
};

export type SignatureLog = {
  signature: string;
  type: TxType;
};

export enum TxType {
  unknown,
  clmmDeposit,
  clmmWithdraw,
  stake,
  unstake,
  lbcPurchase,
  lbcReserveWithdraw,
  fsoExercise,
  accountsOpen,
  accountsClose,
  swap,
  clmmIncreaseLiq,
  clmmDecreaseLiq,
  clmmPositionOpen,
  clmmPositionClose,
  clmmCollectFees,
  fixedRateSwap,
}

export enum NetworkOption {
  Mainnet,
  Devnet,
  Custom,
}

export enum Explorer {
  Solscan,
  SolanaExplorer,
  Helius,
  SolanaFM,
}

export const Explorers: {
  [key in Explorer]: {
    name: string;
    txLink: (txId: string, devnet: boolean) => string;
    accountLink: (address: string, devnet: boolean) => string;
  };
} = {
  [Explorer.Solscan]: {
    name: "Solscan",
    txLink: (txId: string, devnet: boolean) => {
      return `https://solscan.io/tx/${txId}${devnet ? "?cluster=devnet" : ""}`;
    },
    accountLink: (address: string, devnet: boolean) => {
      return `https://solscan.io/account/${address}${
        devnet ? "?cluster=devnet" : ""
      }`;
    },
  },
  [Explorer.SolanaExplorer]: {
    name: "Solana Explorer",
    txLink: (txId: string, devnet: boolean) => {
      return `https://explorer.solana.com/tx/${txId}${
        devnet ? "?cluster=devnet" : ""
      }`;
    },
    accountLink: (address: string, devnet: boolean) => {
      return `https://explorer.solana.com/address/${address}${
        devnet ? "?cluster=devnet" : ""
      }`;
    },
  },
  [Explorer.Helius]: {
    name: "Helius",
    txLink: (txId: string, devnet: boolean) => {
      return `https://xray.helius.xyz/tx/${txId}${
        devnet ? "?network=devnet" : ""
      }`;
    },
    accountLink: (address: string, devnet: boolean) => {
      return `https://xray.helius.xyz/account/${address}${
        devnet ? "?network=devnet" : ""
      }`;
    },
  },
  [Explorer.SolanaFM]: {
    name: "SolanaFM",
    txLink: (txId: string, devnet: boolean) => {
      return `https://solana.fm/tx/${txId}${
        devnet ? "?cluster=devnet-solana" : ""
      }`;
    },
    accountLink: (address: string, devnet: boolean) => {
      return `https://solana.fm/address/${address}${
        devnet ? "?cluster=devnet-solana" : ""
      }`;
    },
  },
};
