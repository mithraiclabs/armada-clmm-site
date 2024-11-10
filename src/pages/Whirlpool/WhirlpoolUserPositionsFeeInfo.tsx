import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import { SimpleCard } from "../../components/common/SimpleCard";
import {
  selectWhirlpoolUserPositionsUncollectedFeesUiAmounts,
  tokenMetadataFamily,
  whirlpoolAtomFamily,
} from "../../state";
import { useLoadClpVaultBalances } from "../../hooks/Clp/useLoadClpVaultBalances";
import { Button } from "../../components/Button";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { useWhirlpoolActions } from "../../hooks/Whirlpool/useWhirlpoolActions";
import { useSaveTxToHistory } from "../../hooks/utils/useSaveTxToHistory";
import { TxType } from "../../utils/types";
import toast from "react-hot-toast";

export const WhirlpoolUserPositionsFeeInfo = () => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const whirlpool = useRecoilValue(whirlpoolAtomFamily(key.toString() ?? ""));
  const tokenA = useRecoilValue(
    tokenMetadataFamily(whirlpool?.tokenMintA.toString() ?? "")
  );
  const tokenB = useRecoilValue(
    tokenMetadataFamily(whirlpool?.tokenMintB.toString() ?? "")
  );
  const [loading, setLoading] = useState(false);

  const { saveTx } = useSaveTxToHistory();
  const estUncollectedFees = useRecoilValue(
    selectWhirlpoolUserPositionsUncollectedFeesUiAmounts(key)
  );
  const { collectFees } = useWhirlpoolActions(key);

  const onCollectFees = useCallback(async () => {
    setLoading(true);
    try {
      const signatures = await collectFees();
      if (signatures)
        saveTx({
          message: "Succcessfully collected fees",
          action: `Swept fees for user positions on pool ${key.slice(0, 8)}...`,
          signatures: signatures.map((signature, i) => ({
            signature,
            type:
              signatures.length > 1 && i === 0
                ? TxType.accountsOpen
                : TxType.clmmCollectFees,
          })),
        });
    } catch (err) {
      console.log(err);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [collectFees, saveTx, key]);

  useLoadClpVaultBalances(key);

  return (
    <SimpleCard>
      <div className="flex flex-row justify-between mx-4">
        <p>Est. Uncollected Fees {tokenA?.symbol}</p>
        <p>{estUncollectedFees?.feeOwedA.toString() ?? "-"}</p>
      </div>

      <div className="flex flex-row justify-between mx-4">
        <p>Est. Uncollected Fees {tokenB?.symbol}</p>
        <p>{estUncollectedFees?.feeOwedB.toString() ?? "-"}</p>
      </div>
      {!!(
        estUncollectedFees?.feeOwedA.greaterThan(0) ||
        estUncollectedFees?.feeOwedB.greaterThan(0)
      ) && (
        <Button
          className="self-end mt-2 px-4"
          loading={loading}
          onClick={onCollectFees}
          variant="outline"
        >
          Collect Fees
        </Button>
      )}
    </SimpleCard>
  );
};
