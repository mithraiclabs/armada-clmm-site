import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { useCallback, useState } from "react";
import useSharedTxLogic from "../hooks/useSendTxCommon";
import {
  MINT_TO_DECIMALS,
  USDC_MINT_DEVNET,
  USDC_MINT_DEVNET_KEYPAIR,
} from "../utils/constants";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { NumberInput } from "../components/AdminPage/Primitives";
import { Button } from "../components/Button";
import { mintFromFaucet } from "../utils/faucet";

const DEVNET_PSY_MINT = new PublicKey(
  "BzwRWwr1kCLJVUUM14fQthP6FJKrGpXjw3ZHTZ6PQsYa"
);
const DEVNET_FAUCET_PSY = new PublicKey(
  "7jJJnHWagPPG544FtxSVp8eD52FwCsARcqqup1q3XVio"
);

export const Faucet = () => {
  const [amount, setAmount] = useState<number>(100);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { sendTx } = useSharedTxLogic();
  const [psyLoading, setPsyLoading] = useState(false);

  const FaucetMint = async () => {
    if (!wallet) {
      console.error("Wallet is not connected!");
      return;
    }

    const mintKey = new PublicKey(USDC_MINT_DEVNET);
    const ataKey = getAssociatedTokenAddressSync(mintKey, wallet.publicKey);
    const ata = await connection.getAccountInfo(ataKey);

    const ixes: TransactionInstruction[] = [];
    if (!ata) {
      ixes.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          ataKey,
          wallet.publicKey,
          mintKey
        )
      );
    }
    ixes.push(
      createMintToInstruction(
        mintKey,
        ataKey,
        mintKey,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        amount * 10 ** MINT_TO_DECIMALS.get(USDC_MINT_DEVNET)!
      )
    );

    const tx: Transaction = new Transaction();
    tx.add(...ixes);
    await sendTx(tx, [USDC_MINT_DEVNET_KEYPAIR]);
    console.log(
      "Minted from faucet, wallet should have gained: " + amount + " fake USDC"
    );
  };

  const mintDevnetPsy = useCallback(async () => {
    if (!wallet) return;
    setPsyLoading(true);
    const tx = await mintFromFaucet(
      connection,
      DEVNET_PSY_MINT,
      wallet?.publicKey,
      new BN(40_000_000_000_000),
      DEVNET_FAUCET_PSY
    );
    try {
      await sendTx(tx);
    } finally {
      setPsyLoading(false);
    }
  }, [connection, sendTx, wallet]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div className="Standard-input-row">
        <NumberInput
          label="Amount to Mint"
          value={amount}
          setValue={setAmount}
          padTo={5}
          decimals={0}
          addWidth={10}
        />
        <div className="w-2"></div>
        <Button className="Button-small" onClick={FaucetMint}>
          Mint Mock USDC
        </Button>
      </div>

      <div className="Standard-input-row">
        <Button
          className="Button-small"
          onClick={mintDevnetPsy}
          loading={psyLoading}
        >
          Mint 40,000 devnet PSY
        </Button>
      </div>
    </div>
  );
};
