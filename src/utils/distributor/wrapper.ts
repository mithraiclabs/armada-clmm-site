import { TransactionEnvelope } from "@saberhq/solana-contrib";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  TransactionInstruction,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import { findClaimStatusKey, findDistributorKey } from "./pda";
import { MerkleDistributorSDK } from "./sdk";
import {
  ClaimArgs,
  ClaimStatus,
  CreateDistributorArgs,
  DistributorData,
  MerkleDistributorProgram,
  PendingDistributor,
} from "./types";
import { toBytes32Array } from "./utils";
import BN from "bn.js";

export class MerkleDistributorWrapper {
  readonly program: MerkleDistributorProgram;
  readonly key: PublicKey;
  readonly distributorATA: PublicKey;
  data: DistributorData;

  constructor(
    readonly sdk: MerkleDistributorSDK,
    key: PublicKey,
    distributorATA: PublicKey,
    data: DistributorData
  ) {
    this.program = sdk.program;
    this.key = key;
    this.distributorATA = distributorATA;
    this.data = data;
  }

  static async load(
    sdk: MerkleDistributorSDK,
    key: PublicKey
  ): Promise<MerkleDistributorWrapper> {
    const data = await sdk.program.account.merkleDistributor.fetch(key);
    return new MerkleDistributorWrapper(
      sdk,
      key,
      getAssociatedTokenAddressSync(data.mint, key, true),
      data
    );
  }

  static async createDistributor(
    args: CreateDistributorArgs
  ): Promise<PendingDistributor> {
    const { root, tokenMint } = args;

    const { sdk } = args;
    const { provider } = sdk;

    const baseKey = args.base ?? Keypair.generate();
    const [distributor, bump] = findDistributorKey(baseKey.publicKey);

    const ixs: TransactionInstruction[] = [];
    ixs.push(
      sdk.program.instruction.newDistributor(
        bump,
        toBytes32Array(root),
        args.maxTotalClaim,
        args.maxNumNodes,
        {
          accounts: {
            base: baseKey.publicKey,
            distributor,
            mint: tokenMint,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );
    const distributorATA = getAssociatedTokenAddressSync(
      tokenMint,
      distributor,
      true
    );
    if (!(await provider.connection.getAccountInfo(distributorATA))) {
      const instruction = await createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        distributorATA,
        distributor,
        tokenMint
      );
      if (instruction) {
        ixs.push(instruction);
      }
    }

    return {
      base: baseKey.publicKey,
      bump,
      distributor,
      distributorATA,
      tx: new TransactionEnvelope(provider, ixs, [baseKey]),
    };
  }

  async claimIX(
    args: ClaimArgs,
    payer: PublicKey
  ): Promise<TransactionInstruction> {
    const { amount, claimant, index, proof } = args;
    const [claimStatus, bump] = await findClaimStatusKey(index, this.key);

    return this.program.instruction.claim(
      bump,
      index,
      amount,
      proof.map((p) => toBytes32Array(p)),
      {
        accounts: {
          distributor: this.key,
          claimStatus,
          from: this.distributorATA,
          to: getAssociatedTokenAddressSync(this.data.mint, claimant),
          claimant,
          payer,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  }

  async claim(args: ClaimArgs): Promise<TransactionEnvelope> {
    const { provider } = this.sdk;
    const tx = new TransactionEnvelope(provider, [
      await this.claimIX(args, provider.wallet.publicKey),
    ]);
    const claimantATA = getAssociatedTokenAddressSync(
      this.data.mint,
      args.claimant
    );

    if (!(await provider.connection.getAccountInfo(claimantATA))) {
      const instruction = await createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        claimantATA,
        args.claimant,
        this.data.mint
      );
      if (instruction) {
        tx.instructions.unshift(instruction);
      }
    }
    return tx;
  }

  getClaimStatus(index: BN): Promise<ClaimStatus> {
    const [key] = findClaimStatusKey(index, this.key);
    return this.program.account.claimStatus.fetch(key);
  }

  async reload(): Promise<void> {
    this.data = await this.program.account.merkleDistributor.fetch(this.key);
  }
}
