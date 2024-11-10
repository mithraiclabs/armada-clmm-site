import { AnchorTypes } from "@saberhq/anchor-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MerkleDistributorIDL } from "./idls/merkle_distributor";
import { MerkleDistributorSDK } from "./sdk";
import BN from "bn.js";

export type MerkleDistributorTypes = AnchorTypes<
  MerkleDistributorIDL,
  {
    claimStatus: ClaimStatus;
    merkleDistributor: DistributorData;
  }
>;

type Accounts = MerkleDistributorTypes["Accounts"];
export type DistributorData = Accounts["MerkleDistributor"];
export type ClaimStatus = Accounts["ClaimStatus"];

export type MerkleDistributorError = MerkleDistributorTypes["Error"];
export type MerkleDistributorEvents = MerkleDistributorTypes["Events"];
export type MerkleDistributorProgram = MerkleDistributorTypes["Program"];

export type CreateDistributorArgs = {
  sdk: MerkleDistributorSDK;
  root: Buffer;
  maxTotalClaim: BN;
  maxNumNodes: BN;
  tokenMint: PublicKey;
  base?: Keypair;
};

export type PendingDistributor = {
  bump: number;
  base: PublicKey;
  distributor: PublicKey;
  distributorATA: PublicKey;
  tx: TransactionEnvelope;
};

export type ClaimArgs = {
  index: BN;
  amount: BN;
  proof: Buffer[];
  claimant: PublicKey;
};
