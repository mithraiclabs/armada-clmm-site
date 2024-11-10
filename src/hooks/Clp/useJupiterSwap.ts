import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useRecoilValue } from "recoil";
import { selectPriorityFeeIx, splMintAtomFamily } from "../../state";
import { Decimal } from "../../utils/decimal";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  COMPUTE_UNIT_BUFFER,
  getComputeUnitsForInstructions,
} from "../../utils/getComputeLimit";

export const useJupiterSwap = ({
  inputMint,
  outputMint,
}: {
  inputMint: PublicKey;
  outputMint: PublicKey;
}) => {
  const wallet = useWallet();
  const inputMintInfo = useRecoilValue(splMintAtomFamily(inputMint.toString()));
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const { connection } = useConnection();
  return useCallback(
    async (
      amount: Decimal,
      slippage: Decimal,
      customPk?: PublicKey,
      source?: PublicKey,
      destination?: PublicKey,
      customPreInstructions?: TransactionInstruction[],
      cleanupInstructions?: TransactionInstruction[],
      ignoreJupSetupAndCleanup?: boolean
    ) => {
      if (!customPk && !wallet.publicKey)
        throw new Error("no wallet connected");
      if (!inputMintInfo) throw new Error("mint info unavailable");
      const walletPk = (customPk ?? wallet.publicKey) as PublicKey;
      const quoteResponse = await (
        await fetch(`
    https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${amount
          .mul(Math.pow(10, inputMintInfo.decimals))
          .toFixed(
            0
          )}&maxAccounts=30&asLegacyTransaction=true&slippageBps=${slippage
          .mul(100)
          .toFixed(0)}`)
      ).json();

      const instructions = await (
        await fetch("https://quote-api.jup.ag/v6/swap-instructions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse,
            userPublicKey: walletPk,
            asLegacyTransaction: true,
          }),
        })
      ).json();
      const {
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        setupInstructions, // Setup missing ATA for the users.
        swapInstruction: swapInstructionPayload, // The actual swap instruction.
        cleanupInstruction,
        addressLookupTableAddresses,
      } = instructions as {
        computeBudgetInstructions?: Ix[];
        setupInstructions?: Ix[];
        swapInstruction: Ix;
        cleanupInstruction?: Ix;
        addressLookupTableAddresses?: string[];
      };

      const userSourceAta = getAssociatedTokenAddressSync(
        inputMint,
        walletPk,
        true
      );
      const userDestinationAta = getAssociatedTokenAddressSync(
        outputMint,
        walletPk,
        true
      );

      const swapInstruction = new TransactionInstruction({
        programId: new PublicKey(swapInstructionPayload.programId),
        keys: swapInstructionPayload.accounts.map((acc) => {
          let pubkey = new PublicKey(acc.pubkey);
          if (source && pubkey.equals(userSourceAta)) {
            pubkey = source;
          } else if (destination && pubkey.equals(userDestinationAta)) {
            pubkey = destination;
          }
          return {
            ...acc,
            pubkey,
          };
        }),
        data: Buffer.from(swapInstructionPayload.data, "base64"),
      });

      const preInstructions = [
        ...(customPreInstructions || []),
        ...[
          ...(computeBudgetInstructions || []),
          ...(ignoreJupSetupAndCleanup ? [] : setupInstructions || []),
        ].map(
          (i) =>
            new TransactionInstruction({
              programId: new PublicKey(i.programId),
              keys: i.accounts.map((acc) => ({
                ...acc,
                pubkey: new PublicKey(acc.pubkey),
              })),
              data: Buffer.from(i.data, "base64"),
            })
        ),
      ];

      const postInstruction =
        !ignoreJupSetupAndCleanup && cleanupInstruction
          ? new TransactionInstruction({
              programId: new PublicKey(cleanupInstruction.programId),
              keys: cleanupInstruction.accounts.map((acc) => ({
                ...acc,
                pubkey: new PublicKey(acc.pubkey),
              })),
              data: Buffer.from(cleanupInstruction.data, "base64"),
            })
          : undefined;

      const addressLookupTableAccounts = await getAddressLookupTableAccounts(
        addressLookupTableAddresses ?? [],
        connection
      );
      // add all IXs
      let ixs = [...preInstructions, swapInstruction];
      if (postInstruction) ixs.push(postInstruction);
      if (cleanupInstructions)
        cleanupInstructions.forEach((ix) => ixs.push(ix));
      // Remove any for compute budget set by JUP or prieviously
      ixs = ixs.filter(
        (ix) => !ix.programId.equals(ComputeBudgetProgram.programId)
      );

      const computeUnits = await getComputeUnitsForInstructions(
        connection,
        ixs,
        walletPk,
        addressLookupTableAccounts
      );
      if (priorityFeeIx) {
        ixs.unshift(priorityFeeIx);
      }
      if (computeUnits) {
        ixs.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnits * COMPUTE_UNIT_BUFFER,
          })
        );
      }

      // finally generate TX
      const { blockhash } = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: walletPk,
        recentBlockhash: blockhash,
        instructions: ixs,
      }).compileToV0Message(addressLookupTableAccounts);
      const transaction = new VersionedTransaction(messageV0);

      return {
        swapTx: transaction,
      };
    },
    [
      wallet.publicKey,
      inputMintInfo,
      inputMint,
      outputMint,
      connection,
      priorityFeeIx,
    ]
  );
};

export type Ix = {
  data: string;
  programId: string;
  accounts: {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }[];
};

export const useCheckIfSwappable = () => {
  return useCallback(
    async ({
      inputMint,
      outputMint,
    }: {
      inputMint: PublicKey;
      outputMint: PublicKey;
    }) => {
      try {
        const data = await (
          await fetch(`
    https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${1000}`)
        ).json();
        if (data && data.routePlan && data.routePlan.length) return true;
      } catch (error) {
        console.log({ error });
      }
      return false;
    },
    []
  );
};

export const getAddressLookupTableAccounts = async (
  adresses: string[],
  connection: Connection
) => {
  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
  for (const address of adresses) {
    const lookupTableAccount = (
      await connection.getAddressLookupTable(new PublicKey(address))
    ).value;
    if (lookupTableAccount) addressLookupTableAccounts.push(lookupTableAccount);
  }
  return addressLookupTableAccounts;
};
