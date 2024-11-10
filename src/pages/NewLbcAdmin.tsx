import { useState } from "react";
import { BuyMenu } from "../components/AdminPage/BuyMenu";
import { MaintenanceToolbar } from "../components/AdminPage/MaintenanceToolbar";
import { MintSetup } from "../components/AdminPage/MintSetup";
import { CurveSetup } from "../components/AdminPage/CurveSetup";
import { TokenBondingSetup } from "../components/AdminPage/TokenBondingSetup";
import { useDevnetState } from "../contexts/NetworkProvider";
import { PublicKey } from "@solana/web3.js";
import { USDC_MINT_DEVNET, USDC_MINT_MAINNET } from "../utils/constants";
import { TokenSwapperSetup } from "../components/AdminPage/TokenSwapperSetup";
import { NetworkOption } from "../utils/types";

export const NewLbcAdmin = () => {
  const [network] = useDevnetState();
  const isDevnet = network === NetworkOption.Devnet;
  const [baseMint, setBaseMint] = useState(
    isDevnet
      ? new PublicKey(USDC_MINT_DEVNET)
      : new PublicKey(USDC_MINT_MAINNET)
  );
  const [tokenMint, setTokenMint] = useState(PublicKey.default);
  const [curveKey, setCurveKey] = useState(PublicKey.default);
  const [bondingKey, setBondingKey] = useState(PublicKey.default);
  const [showMaint, setShowMaint] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSwapper, setShowSwapper] = useState(false);
  const toggleMaint = () => setShowMaint((x) => !x);
  const toggleAdmin = () => setShowAdmin((x) => !x);
  const toggleSwapper = () => setShowSwapper((x) => !x);

  const adminDisplay = (
    <>
      <div
        style={{
          paddingLeft: "4vmin",
        }}
      >
        <MintSetup
          isDevnet={isDevnet}
          tokenMint={tokenMint}
          baseMint={baseMint}
          setTokenMint={setTokenMint}
          setBaseMint={setBaseMint}
        />
        <hr className="hr-line-break"></hr>
        <CurveSetup
          isDevnet={isDevnet}
          curveKey={curveKey}
          setCurveKey={setCurveKey}
        />
        <hr className="hr-line-break"></hr>
        <TokenBondingSetup
          isDevnet={isDevnet}
          bondingKey={bondingKey}
          setBonding={setBondingKey}
          tokenMintKey={tokenMint}
          baseMintKey={baseMint}
          curveKey={curveKey}
        />
      </div>
      <hr className="hr-line-break"></hr>
    </>
  );

  const maintenanceContent = (
    <>
      <div
        style={{
          paddingLeft: "4vmin",
        }}
      >
        <MaintenanceToolbar isDevnet={isDevnet} bondingKey={bondingKey} />
      </div>
      <hr className="hr-line-break"></hr>
    </>
  );

  const swapperSetupContext = (
    <>
      <div
        style={{
          paddingLeft: "4vmin",
        }}
      >
        <TokenSwapperSetup isDevnet={isDevnet} />
      </div>
      <hr className="hr-line-break"></hr>
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div className="tiny-vertical-divider"></div>
      <button className="Button-small" onClick={toggleSwapper}>
        {"Show/Hide Token Exchange Setup"}
      </button>
      {showSwapper ? swapperSetupContext : <hr className="hr-line-break"></hr>}

      <button className="Button-small" onClick={toggleAdmin}>
        {"Show/Hide Initial Bonding Setup"}
      </button>
      {showAdmin ? adminDisplay : <hr className="hr-line-break"></hr>}

      <BuyMenu
        isDevnet={isDevnet}
        bondingKey={bondingKey}
        setBonding={setBondingKey}
      />
      <hr className="hr-line-break"></hr>
      <button className="Button-small" onClick={toggleMaint}>
        {"Show/Hide Maintenance Actions"}
      </button>
      {showMaint && maintenanceContent}
    </div>
  );
};
