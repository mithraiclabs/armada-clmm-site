import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { useClpClosePosition } from "../../../hooks/Clp/useClpClosePosition";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { SimpleModal } from "../../../components/common/SimpleModal";

export const ClosePositionDialog = ({
  onClose,
  open,
  positionKey,
}: {
  onClose: () => void;
  open: boolean;
  positionKey: string;
}) => {
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const [loading, setLoading] = useState(false);
  const closePosition = useClpClosePosition(clpKey, positionKey);

  const onClosePosition = useCallback(async () => {
    setLoading(true);
    try {
      await closePosition();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [closePosition, onClose]);

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
