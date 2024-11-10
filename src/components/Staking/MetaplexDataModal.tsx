import { SimpleModal, TextInputWithInfoTooltip } from "../common";
import { TextButton } from "../Button/TextButton";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { useCallback, useState } from "react";
import { ReactComponent as CopyIcon } from "../../assets/icons/copy.svg";
import ImageUploader from "./ImageUploader";
import { Button } from "../Button";
import toast from "react-hot-toast";
import { useUploadToArweave } from "../../hooks/utils/useUploadToArweave";
import { useTranslation } from "react-i18next";

export const MetaplexDataModal = ({
  isOpen,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (jsonUrl: string, name: string, symbol: string) => void;
}) => {
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const { uploadFile } = useUploadToArweave();
  const [description, setDescription] = useState("");

  const onUpdate = useCallback(async () => {
    const jsonData = {
      symbol,
      name,
      description,
      image: imageUrl,
    };
    const blob = new Blob([JSON.stringify(jsonData)], {
      type: "application/json",
    });
    const file = new File([blob], "metadata.json", {
      type: "application/json",
    });
    const link = await uploadFile(file);
    if (!link) return;
    toast.success("JSON uploaded");
    if (onUpdated) onUpdated(link, name, symbol);
    onClose();
  }, [description, imageUrl, name, onClose, onUpdated, symbol, uploadFile]);

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <div className="w-full flex justify-between items-center min-w-[340px]">
        <p className="text-xl font-khand text-text-placeholder">
          {t("New Metaplex Metadata")}
        </p>
        <TextButton className=" p-0" onClick={onClose}>
          <CloseIcon height={40} width={40} />
        </TextButton>
      </div>

      <div className="flex flex-col justify-center space-y-2 my-2">
        <TextInputWithInfoTooltip
          fieldName="Symbol"
          value={symbol}
          fullWidth
          onChange={setSymbol}
        />
        <TextInputWithInfoTooltip
          fieldName="Name"
          value={name}
          fullWidth
          onChange={setName}
        />
        <TextInputWithInfoTooltip
          fieldName="Description"
          value={description}
          onChange={setDescription}
          fullWidth
        />
        <div
          className={`my-1 font-semibold max-w-2xl text-text-placeholder 
                        `}
        >
          <div className="flex flex-row justify-between items-center">
            <p> {t("Token Logo")}</p>
            {imageUrl.length ? (
              <TextButton
                onClick={() => setImageUrl("")}
                className=" text-primary text-sm"
              >
                reset
              </TextButton>
            ) : (
              <div />
            )}
          </div>
          {imageUrl.length ? (
            <div>
              <TextButton
                className="flex flex-row items-center mb-4"
                onClick={() => {
                  navigator.clipboard.writeText(imageUrl);
                  toast.success("Copied to clipboard", { duration: 1000 });
                }}
              >
                <p className="text-sm font-semibold">
                  {imageUrl.substring(0, 32)}
                  {imageUrl.length > 32 && "..."}
                </p>
                <CopyIcon className="text-text-placeholder ml-1" />
              </TextButton>
            </div>
          ) : (
            <ImageUploader
              onUrlChange={(url) => {
                setImageUrl(url);
              }}
            />
          )}
        </div>
        <Button fullWidth onClick={onUpdate}>
          {t("Create Metaplex Data")}
        </Button>
      </div>
    </SimpleModal>
  );
};
