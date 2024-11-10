import { TextButton } from "../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { useWhirlpoolActions } from "../../hooks/Whirlpool/useWhirlpoolActions";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { TxType } from "../../utils/types";
import { useSaveTxToHistory } from "../../hooks/utils/useSaveTxToHistory";
import { SimpleModal } from "../../components/common";

export const WhirlpoolClosePositionDialog = ({
  onClose,
  open,
  positionKey,
}: {
  onClose: () => void;
  open: boolean;
  positionKey: string;
}) => {
  const { key = "" } = useParamsWithOverride<{ key: string }>();
  const [loading, setLoading] = useState(false);
  const { closePosition } = useWhirlpoolActions(key);
  const { saveTx } = useSaveTxToHistory();

  const onClosePosition = useCallback(async () => {
    setLoading(true);
    try {
      const signatures = await closePosition(positionKey);
      if (signatures.length)
        saveTx({
          message: "Succcessfully closed a position",
          action: `Position closed on pool ${key.slice(0, 8)}...`,
          signatures: signatures.map((signature, i) => ({
            signature,
            type:
              signatures.length > 1 && i === 0
                ? TxType.clmmDecreaseLiq
                : TxType.clmmPositionClose,
          })),
        });
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [closePosition, key, onClose, positionKey, saveTx]);

  return (
    <SimpleModal isOpen={open} onClose={onClose}>
      <div className="w-full flex justify-between items-center">
        <p className="text-xl font-khand text-text-placeholder">
          Close Position
        </p>
        <TextButton className="mb-2 p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>
      <p className="text-lg mt-2">
        Are you sure you want to close the position?
      </p>
      <div className="flex justify-between mt-2">
        <TextButton
          className="text-text-danger font-bold"
          onClick={onClosePosition}
        >
          {loading ? "Closing..." : "Close"}
        </TextButton>
        <TextButton className="font-bold" onClick={onClose}>
          Cancel
        </TextButton>
      </div>
    </SimpleModal>
  );
};
