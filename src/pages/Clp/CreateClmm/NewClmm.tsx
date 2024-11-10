import toast from "react-hot-toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useRecoilValue } from "recoil";
import { TextButton } from "../../../components/Button/TextButton";
import { TextInput, NumberInput } from "../../../components/common";
import { Paper } from "../../../components/common/Paper";
import {
  selectPriorityFeeIx,
  selectWhirlpoolTokenASymbol,
  selectWhirlpoolTokenBSymbol,
  splMintAtomFamily,
  whirlpoolAtomFamily,
} from "../../../state";
import { ReactComponent as CopyIcon } from "../../../assets/icons/copy.svg";
import { Button } from "../../../components/Button";
import { useClpVaultProgram } from "../../../hooks/Clp/useClpVaultProgram";
import {
  StrategyType,
  decimalToPercent,
  deriveClpVaultKey,
  deriveLpMint,
  deriveTokenVaultA,
  deriveTokenVaultB,
} from "@mithraic-labs/clp-vault";
import { NewWhirlpoolModal } from "./NewWhirlpoolModal";
import { useLoadIndividualClp } from "../../../hooks/Whirlpool/useLoadIndividualWhirlpool";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { NumberSlider } from "../../../components/common/NumberSlider";
import useSharedTxLogic from "../../../hooks/useSendTxCommon";
import { useNavigate } from "react-router";
import { Spinner } from "../../../components/Spinner";

export const NewClmm = () => {
  const wallet = useAnchorWallet();
  const navigate = useNavigate();
  const { sendTx } = useSharedTxLogic();
  const [whirlpoolModalOpen, setWhirlpoolModalOpen] = useState(false);
  const program = useClpVaultProgram();
  const priorityFeeIx = useRecoilValue(selectPriorityFeeIx);
  const [adminKey, setAdminKey] = useState(wallet?.publicKey.toString() ?? "");
  const [tokenMintA, setMintA] = useState("");
  const [tokenMintB, setMintB] = useState("");
  const [clpKey, setClpKey] = useState<PublicKey | "">("");
  const [feeOwner, setFeeOwner] = useState<PublicKey | "">(
    wallet?.publicKey ?? ""
  );
  const [marketMakingKey, setMarketMakingKey] = useState<PublicKey | "">("");
  const [tokenARatio, setTokenARatio] = useState(50);
  const tokenASymbol = useRecoilValue(
    selectWhirlpoolTokenASymbol(clpKey.toString())
  );
  const tokenBSymbol = useRecoilValue(
    selectWhirlpoolTokenBSymbol(clpKey.toString())
  );

  const whirlpool = useRecoilValue(whirlpoolAtomFamily(clpKey.toString()));
  const tokenAMintInfo = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const tokenBMintInfo = useRecoilValue(
    splMintAtomFamily(whirlpool?.tokenMintB.toString() ?? "")
  );
  const [nonce, setNonce] = useState("0");

  const [perfomanceFeePct, setPerformanceFee] = useState("9.5");
  const [withdrawalFeePct, setWithdrawalFee] = useState("0");
  const [marketFeePct, setMarketFee] = useState("10");

  const [loading, setLoading] = useState(false);

  const [selectedStrategy, setSelectedStrategy] =
    useState<keyof StrategyType>("volatilePair");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as keyof StrategyType;
    setSelectedStrategy(value);
  };

  const loadClp = useLoadIndividualClp(clpKey.toString());

  useEffect(() => {
    if (whirlpool) {
      setMintA(whirlpool.tokenMintA.toString());
      setMintB(whirlpool.tokenMintB.toString());
    }
  }, [whirlpool]);

  useEffect(() => {
    if (clpKey !== "") {
      loadClp();
    }
  }, [clpKey, loadClp]);

  const newClmmKey = useMemo(() => {
    try {
      const [clpVaultKey] = deriveClpVaultKey(
        program.programId,
        new PublicKey(tokenMintA),
        new PublicKey(tokenMintB),
        new PublicKey(adminKey),
        Number(nonce)
      );
      return clpVaultKey;
    } catch {
      return null;
    }
  }, [adminKey, nonce, program.programId, tokenMintA, tokenMintB]);

  const init = useCallback(async () => {
    if (!wallet) {
      return toast.error("Please connect wallet and try again.");
    }
    if (!tokenAMintInfo || !tokenBMintInfo) {
      return toast.error("Incorrect mints");
    }
    setLoading(true);

    try {
      const mintA = new PublicKey(tokenMintA);
      const mintB = new PublicKey(tokenMintB);
      const admin = new PublicKey(adminKey);
      const [clpVaultKey] = deriveClpVaultKey(
        program.programId,
        mintA,
        mintB,
        admin,
        Number(nonce)
      );
      const performanceFee = decimalToPercent(Number(perfomanceFeePct));
      const withdrawalFee = decimalToPercent(Number(withdrawalFeePct));
      const marketMakingFee = decimalToPercent(Number(marketFeePct));
      const [tokenVaultA] = deriveTokenVaultA(program.programId, clpVaultKey);
      const [tokenVaultB] = deriveTokenVaultB(program.programId, clpVaultKey);
      const [lpMint] = deriveLpMint(program.programId, clpVaultKey);

      const TOKEN_A_RATIO = tokenARatio / 100;
      const TOKEN_B_RATIO = 1 - TOKEN_A_RATIO;
      const initialTokenRatio = {
        tokenA: new BN(10)
          .pow(new BN(tokenAMintInfo.decimals))
          .muln(2 * TOKEN_A_RATIO * 1_000)
          .divn(1_000),
        tokenB: new BN(tokenAMintInfo.decimals)
          .muln(2 * TOKEN_B_RATIO * 1_000)
          .divn(1_000),
      };

      const preInstructions: TransactionInstruction[] = [];
      if (priorityFeeIx) {
        preInstructions.push(priorityFeeIx);
      }

      const tx = await program.methods
        .initialize(
          Number(nonce),
          new PublicKey(adminKey),
          new PublicKey(marketMakingKey),
          new PublicKey(feeOwner),
          performanceFee,
          withdrawalFee,
          marketMakingFee,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { [selectedStrategy]: {} } as any,
          initialTokenRatio,
          0
        )
        .accounts({
          payer: wallet.publicKey,
          tokenMintA: tokenMintA,
          tokenMintB: tokenMintB,
          clp: clpKey,
          clpVault: clpVaultKey,
          tokenVaultA: tokenVaultA,
          tokenVaultB: tokenVaultB,
          lpMint: lpMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const success = await sendTx(tx, [], program.idl, "Creating CLMM vault");
      if (success.length) {
        navigate(`/clmm/${newClmmKey}/mm`);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [
    adminKey,
    clpKey,
    feeOwner,
    marketFeePct,
    marketMakingKey,
    navigate,
    newClmmKey,
    nonce,
    perfomanceFeePct,
    priorityFeeIx,
    program,
    selectedStrategy,
    sendTx,
    tokenAMintInfo,
    tokenARatio,
    tokenBMintInfo,
    tokenMintA,
    tokenMintB,
    wallet,
    withdrawalFeePct,
  ]);

  return (
    <div className="flex justify-center">
      <Paper>
        <div className="w-[700px] rounded-md p-4">
          <p className="text-xl mb-6">Create CLMM Vault</p>
          {!!newClmmKey && (
            <TextButton
              className="flex flex-row items-center mb-4"
              onClick={() => {
                navigator.clipboard.writeText(newClmmKey.toString());
                toast.success("Copied to clipboard", { duration: 1000 });
              }}
            >
              <p className="text-sm font-semibold">
                CLMM Vault Key: {newClmmKey.toString()}
              </p>
              <CopyIcon className="text-text-placeholder ml-1" />
            </TextButton>
          )}
          <p className="text-sm font-semibold">Whirlpool Key</p>
          <TextInput
            required={clpKey === ""}
            placeholder="Whirlpool Address"
            onChange={(val: string) => setClpKey(new PublicKey(val))}
            value={clpKey?.toString() ?? ""}
          />
          <div className="flex justify-center">
            <TextButton
              className="flex flex-row items-center mt-2"
              onClick={() => {
                setWhirlpoolModalOpen(true);
              }}
            >
              Create new whirlpool
            </TextButton>
          </div>
          {whirlpool ? (
            <div>
              <p className="text-sm font-semibold">
                Token A - <span>{tokenASymbol}</span>
              </p>
              <TextInput
                onChange={() => {
                  //
                }}
                value={tokenMintA}
                disabled
              />
              <p className="text-sm font-semibold mt-2">
                Token B - <span>{tokenBSymbol}</span>
              </p>
              <TextInput
                onChange={() => {
                  //
                }}
                value={tokenMintB}
                disabled
              />
              <div className="w-full mx-auto mt-2">
                <label htmlFor="strategy" className="text-sm font-semibold ">
                  Select Strategy Type
                </label>
                <select
                  id="strategy"
                  name="strategy"
                  value={selectedStrategy || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full font-medium py-2.5 pl-2 rounded-xl border-text-placeholder border bg-background-panel"
                >
                  <option value="priceDiscovery">Price Discovery</option>
                  <option value="volatilePair">Volatile Pair</option>
                  <option value="stablePair">Stable Pair</option>
                  <option value="StableSlowlyDiverging">
                    Stable Slowly Diverging
                  </option>
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold mt-2">
                  Initial Token Ratio: {tokenASymbol} {tokenARatio}% -{" "}
                  {tokenBSymbol} {100 - tokenARatio}%
                </p>
                <NumberSlider onChange={setTokenARatio} value={tokenARatio} />
              </div>
              <p className="text-sm font-semibold mt-2">Admin Wallet</p>
              <TextInput
                placeholder="Admin Key"
                onChange={setAdminKey}
                value={adminKey}
              />
              <p className="text-sm font-semibold mt-2">Fee Owner</p>
              <TextInput
                placeholder="Fee Owner"
                onChange={(val: string) => setFeeOwner(new PublicKey(val))}
                value={feeOwner?.toString() ?? ""}
              />
              <div className="flex flex-row justify-between items-center mt-2">
                <p className="text-sm font-semibold ">Performance Fee (%)</p>
                <NumberInput
                  containerClassName="w-[70%]"
                  value={perfomanceFeePct}
                  onChange={setPerformanceFee}
                />
              </div>
              <div className="flex flex-row justify-between items-center mt-2">
                <p className="text-sm font-semibold">Withdrawal Fee (%)</p>
                <NumberInput
                  containerClassName="w-[70%]"
                  value={withdrawalFeePct}
                  onChange={setWithdrawalFee}
                />
              </div>
              <div className="flex flex-row justify-between items-center mt-2">
                <p className="text-sm font-semibold">Marketmaking Fee (%)</p>
                <NumberInput
                  containerClassName="w-[70%]"
                  value={marketFeePct}
                  onChange={setMarketFee}
                />
              </div>

              <p className="text-sm font-semibold mt-2">Marketmaking Key</p>
              <TextInput
                placeholder="MM Key"
                onChange={(val: string) =>
                  setMarketMakingKey(new PublicKey(val))
                }
                value={marketMakingKey?.toString() ?? ""}
              />

              <p className="font-semibold mt-2 text-sm">Nonce</p>
              <p className="text-sm text-text-placeholder">
                Leave 0 if you have not set up a CLMM vault from this wallet.
              </p>
              <NumberInput onChange={setNonce} value={nonce} />
              <div className="my-2" />
              <div className="mt-4 flex justify-end">
                <Button onClick={init} loading={loading}>
                  Initialize
                </Button>
              </div>
            </div>
          ) : clpKey !== "" ? (
            <Spinner className="w-36 h-36 mx-auto my-20" />
          ) : null}
        </div>
      </Paper>
      <NewWhirlpoolModal
        isOpen={whirlpoolModalOpen}
        onClose={() => setWhirlpoolModalOpen(false)}
        onUpdated={(v) => setClpKey(v)}
      />
    </div>
  );
};
