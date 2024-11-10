import React, { useCallback, useEffect, useState } from "react";
import { Toggle } from "../Toggle";
import { TextInput } from "../common";
import { Button } from "../Button";
import { useUploadToArweave } from "../../hooks/utils/useUploadToArweave";
import { useTranslation } from "react-i18next";

const ImageUploader = ({
  onUrlChange,
}: {
  onUrlChange: (t: string) => void;
}) => {
  const { t } = useTranslation();
  const [useLink, setUseLink] = useState(false);
  const { url: uploadedUrl, uploadFile } = useUploadToArweave();
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errMsg, setErrMsg] = useState(false);

  useEffect(() => {
    if (uploadedUrl) {
      setUrl(uploadedUrl);
      onUrlChange(url);
    }
  }, [onUrlChange, uploadedUrl, url]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 100_000) {
        setErrMsg(true);
        setFile(null);
      } else {
        setErrMsg(false);
        setFile(file);
      }
    }
  };

  const onUpload = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    await uploadFile(file);
    setIsLoading(false);
  }, [file, uploadFile]);

  return (
    <div className=" space-y-2">
      <Toggle onChange={(i) => setUseLink(!!i)} selectedIndex={Number(useLink)}>
        <div className="font-medium text-sm"> {t("Existing Image URL")}</div>
        <div className="font-medium text-sm"> {t("Upload Image")}</div>
      </Toggle>
      <div>
        {!useLink ? (
          <div className="flex flex-col space-y-2">
            <TextInput
              placeholder="Enter image URL"
              onChange={setUrl}
              value={url}
            />
            <Button
              variant="outline"
              disabled={!url.length}
              onClick={() => onUrlChange(url)}
            >
              {t("Set")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {errMsg ? (
              <span className=" text-text-danger font-bold">
                Uploaded file must be under 100KB
              </span>
            ) : (
              <span>max 100KB</span>
            )}
            <input
              type="file"
              accept="image/*"
              className=" p-2 rounded-xl bg-background-panelSurface"
              onChange={handleFileChange}
            />
            <Button
              loading={isLoading}
              variant="outline"
              disabled={!file}
              onClick={onUpload}
            >
              {isLoading ? t("Uploading...") : t("Upload")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
