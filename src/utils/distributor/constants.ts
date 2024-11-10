import { SuperCoder } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import { MerkleDistributorTypes } from ".";
import { MerkleDistributorJSON } from "./idls/merkle_distributor";

export const PROGRAM_ID = new PublicKey(
  "MRKGLMizK9XSTaD1d1jbVkdHZbQVCSnPpYiTw9aKQv8"
);

export const MERKLE_DISTRIBUTOR_PROGRAM_ID = PROGRAM_ID;

export const MERKLE_DISTRIBUTOR_CODER = new SuperCoder<MerkleDistributorTypes>(
  MERKLE_DISTRIBUTOR_PROGRAM_ID,
  MerkleDistributorJSON
);
