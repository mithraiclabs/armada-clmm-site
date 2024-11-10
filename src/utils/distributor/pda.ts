import { utils } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";
import BN from "bn.js";

export const findDistributorKey = (base: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("MerkleDistributor"), base.toBytes()],
    PROGRAM_ID
  );
};

export const findClaimStatusKey = (index: BN, distributor: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode("ClaimStatus"),
      index.toArrayLike(Buffer, "le", 8),
      distributor.toBytes(),
    ],
    PROGRAM_ID
  );
};
