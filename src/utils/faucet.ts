import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN, web3 } from "@coral-xyz/anchor";

export const mintFromFaucet = async (
  connection: web3.Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey,
  amount: BN,
  faucetAddress: web3.PublicKey
) => {
  const receivingAccountPublicKey = getAssociatedTokenAddressSync(mint, owner);
  const tx = new web3.Transaction();
  // Check if the token account exists
  const accountInfo = await connection.getAccountInfo(
    receivingAccountPublicKey
  );

  if (!accountInfo) {
    const ix = createAssociatedTokenAccountInstruction(
      owner,
      receivingAccountPublicKey,
      owner,
      mint
    );
    tx.add(ix);
  }

  const airdropIx = await buildAirdropTokensIx(
    amount,
    undefined, // admin key, not needed
    mint,
    receivingAccountPublicKey,
    faucetAddress
  );
  tx.add(airdropIx);
  return tx;
};

const FAUCET_PROGRAM_ID = new web3.PublicKey(
  "4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt"
);

const buildAirdropTokensIx = async (
  amount: BN,
  adminPubkey: undefined | web3.PublicKey,
  tokenMintPublicKey: web3.PublicKey,
  destinationAccountPubkey: web3.PublicKey,
  faucetPubkey: web3.PublicKey
): Promise<web3.TransactionInstruction> => {
  const [faucetPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("faucet")],
    FAUCET_PROGRAM_ID
  );

  const keys = [
    { pubkey: faucetPda, isSigner: false, isWritable: false },
    {
      pubkey: tokenMintPublicKey,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: destinationAccountPubkey, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: faucetPubkey, isSigner: false, isWritable: false },
  ];

  if (adminPubkey) {
    keys.push({
      pubkey: adminPubkey,
      isSigner: true,
      isWritable: false,
    });
  }

  return new web3.TransactionInstruction({
    programId: FAUCET_PROGRAM_ID,
    data: Buffer.from([1, ...amount.toArray("le", 8)]),
    keys,
  });
};
