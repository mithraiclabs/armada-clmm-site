import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import {
  MintInputWithDropdown,
  NumberInputWithInfoTooltip,
  SimpleModal,
} from "../../../components/common";
import { TextButton } from "../../../components/Button/TextButton";
import { Button } from "../../../components/Button";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import { useWhirlpoolClient } from "../../../hooks/useWhirlpoolFetcher";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PoolUtil,
  PriceMath,
} from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import useSharedTxLogic from "../../../hooks/useSendTxCommon";
import {
  getComputeUnitsForTransaction,
  COMPUTE_UNIT_BUFFER,
} from "../../../utils/getComputeLimit";
import { selectPriorityFeeIx } from "../../../state";
import { useRecoilValue } from "recoil";
import { useDevnetState } from "../../../contexts/NetworkProvider";
import { NetworkOption } from "../../../utils/types";

const TICK_SPACING = 64;

export const NewWhirlpoolModal = ({
  isOpen,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (clpKey: PublicKey) => void;
}) => {
  const { t } = useTranslation();
  const [baseMint, setMintA] = useState("");
  const [quoteMint, setMintB] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialPrice, setInitialPrice] = useState("");
  const whirlpoolClient = useWhirlpoolClient();
  const program = useMemo(
    () => whirlpoolClient.getContext().program,
    [whirlpoolClient]
  );
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const wallet = useAnchorWallet();
  const { sendTx } = useSharedTxLogic();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);

  const onCreate = useCallback(async () => {
    if (!wallet) return toast.error("No wallet connected");
    setLoading(true);
    try {
      const customConfig = isDevnet
        ? "235TWQXvyE2Ce5MDT1hiNZxufLqnbuiCHhuw7CnfetpV"
        : "35VNM2KsKZKxWpEvde4NHrcfuCfXtKfdCffUmSTceKeC"; // armada config

      const whirlpoolsConfig = new PublicKey(customConfig);

      const [tokenMintA, tokenMintB] = PoolUtil.orderMints(baseMint, quoteMint);

      const whirlpoolPda = PDAUtil.getWhirlpool(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpoolsConfig,
        new PublicKey(tokenMintA),
        new PublicKey(tokenMintB),
        TICK_SPACING
      );

      const [basePk, quotePk] = [baseMint, quoteMint].map(
        (v) => new PublicKey(v)
      );
      const [baseMintAccount, quoteMintAccount] =
        await program.provider.connection.getMultipleAccountsInfo([
          basePk,
          quotePk,
        ]);
      const baseMintInfo = unpackMint(basePk, baseMintAccount);
      const quoteMintInfo = unpackMint(quotePk, quoteMintAccount);
      let actualPrice = new Decimal(initialPrice);
      const shouldInvert = tokenMintA.toString() === quoteMint;
      if (shouldInvert) {
        actualPrice = new Decimal(1).div(actualPrice);
      }

      const initSqrtPrice = PriceMath.priceToSqrtPriceX64(
        actualPrice,
        tokenMintA === baseMint
          ? baseMintInfo.decimals
          : quoteMintInfo.decimals,
        tokenMintB === quoteMint
          ? quoteMintInfo.decimals
          : baseMintInfo.decimals
      );

      const tokenVaultAKeypair = Keypair.generate();
      const tokenVaultBKeypair = Keypair.generate();
      const feeTierPda = PDAUtil.getFeeTier(
        program.programId,
        whirlpoolsConfig,
        TICK_SPACING
      );

      const tx = await program.methods
        .initializePool(
          { whirlpoolBump: whirlpoolPda.bump },
          TICK_SPACING,
          initSqrtPrice
        )
        .accounts({
          whirlpoolsConfig,
          tokenMintA,
          tokenMintB,
          funder: wallet.publicKey,
          whirlpool: whirlpoolPda.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          feeTier: feeTierPda.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      const computeUnits = await getComputeUnitsForTransaction(
        program.provider.connection,
        tx,
        wallet.publicKey
      );

      if (priorityFeeIx) {
        tx.instructions.unshift(priorityFeeIx);
      }
      if (computeUnits) {
        tx.instructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnits * COMPUTE_UNIT_BUFFER,
          })
        );
      }

      await sendTx(
        tx,
        [tokenVaultAKeypair, tokenVaultBKeypair],
        program.idl,
        "Initializing whirlpool"
      );

      if (onUpdated) onUpdated(whirlpoolPda.publicKey);
      onClose();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [
    baseMint,
    initialPrice,
    isDevnet,
    priorityFeeIx,
    program,
    quoteMint,
    wallet,
    sendTx,
    onClose,
    onUpdated,
  ]);

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <div className="w-full flex justify-between items-center min-w-[340px] ">
        <p className="text-xl font-khand text-text-placeholder">
          {t("New Clp Whirlpool")}
        </p>
        <TextButton className=" p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>
      <div className="flex flex-col justify-center space-y-2 my-2 text-text-placeholder ">
        <div>
          <p className="font-semibold mt-2 mb-1">Base mint</p>
          <MintInputWithDropdown
            value={baseMint}
            required={baseMint === ""}
            onChange={setMintA}
          />
        </div>
        <div>
          <p className="font-semibold mt-2 mb-1">Quote mint</p>
          <MintInputWithDropdown
            value={quoteMint}
            required={quoteMint === ""}
            onChange={setMintB}
          />
        </div>
        <NumberInputWithInfoTooltip
          value={initialPrice}
          fullWidth
          required={initialPrice === ""}
          onChange={setInitialPrice}
          fieldName="Initial price"
          description={
            "The initial price is the amount of QUOTE required to purchase 1 whole BASE"
          }
        />
        {/* <NumberInputWithInfoTooltip
          value={feeTier}
          fullWidth
          required={feeTier === ""}
          onChange={setFeeTier}
          fieldName="Fee tier (bps)"
          description={`${feeTier} bps is equivalent to ${(
            Number(feeTier) / 1000
          ).toFixed(2)}%`}
        /> */}
        {/* <TextInputWithInfoTooltip
          value={customConfig}
          fullWidth
          fieldName="Whirlpool config"
          onChange={setCustomConfig}
        /> */}
        <Button fullWidth onClick={onCreate} loading={loading}>
          {t("Create New Whirlpool")}
        </Button>
      </div>
    </SimpleModal>
  );
};
