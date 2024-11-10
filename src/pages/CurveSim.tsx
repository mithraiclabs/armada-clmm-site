import { PublicKey } from "@solana/web3.js";
import { CurveSetup } from "../components/AdminPage/CurveSetup";
import { useState } from "react";

export const CurveSim = () => {
  /**
 * Unused dummy state to satisfy CurveSetup's props: doesn't link to the admin page!
 */
const [curveKey, setCurveKey] = useState<PublicKey>(PublicKey.default);

  return (
    <div>
      <CurveSetup
        isDevnet={true}
        curveKey={curveKey}
        setCurveKey={setCurveKey}
      ></CurveSetup>
    </div>
  );
};
