import * as anchor from "@coral-xyz/anchor";
import { useCallback, useState } from "react";
import { TextButton } from "../../../components/Button/TextButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { Button } from "../../../components/Button";
import { TextInput } from "../../../components/common/Input";
import { useClpVaultProgram } from "../../../hooks/Clp/useClpVaultProgram";
import {
  METADATA_PROGRAM_KEY,
  deriveMetadataKey,
} from "@mithraic-labs/clp-vault";
import { useRecoilValue } from "recoil";
import { clpVaultAtomFamily } from "../../../state";
import { useLoadClpTokenMetadatasFunc } from "../../../hooks/Clp/useLoadClpTokenMetadatas";
import { useParamsWithOverride } from "../../../contexts/ParamOverrideContext";
import { SimpleModal } from "../../../components/common";
import useSharedTxLogic from "../../../hooks/useSendTxCommon";

export const UpdateMetadata = () => {
  const clpVaultProgram = useClpVaultProgram();
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);
  const loadClpTokenMetadatas = useLoadClpTokenMetadatasFunc(clpKey);
  const { sendTx } = useSharedTxLogic();

  const onUpdateMetadata = useCallback(async () => {
    if (!clpVault) {
      return;
    }
    setLoading(true);
    const [metadataKey] = deriveMetadataKey(clpVault.lpMint);
    const [tokenAMetadataKey] = deriveMetadataKey(clpVault.tokenMintA);
    const [tokenBMetadataKey] = deriveMetadataKey(clpVault.tokenMintB);
    try {
      const tx = await clpVaultProgram.methods
        .updateTokenMeta(uri)
        .accounts({
          payer: clpVaultProgram.provider.publicKey,
          metadataAccount: metadataKey,
          tokenAMetadataAccount: tokenAMetadataKey,
          tokenBMetadataAccount: tokenBMetadataKey,
          lpMint: clpVault.lpMint,
          clpVault: clpKey,
          clp: clpVault.clp,
          metadataProgram: METADATA_PROGRAM_KEY,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .transaction();
      await sendTx(tx, [], clpVaultProgram.idl, "Updating token metadata");
      loadClpTokenMetadatas();
      onClose();
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [clpKey, clpVault, clpVaultProgram, loadClpTokenMetadatas, sendTx, uri]);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Update metadata</Button>
      <SimpleModal isOpen={open} onClose={onClose}>
        <div className="w-full flex justify-between items-center">
          <p className="text-xl font-khand text-text-placeholder">
            Update Metadata URL
          </p>
          <TextButton className="mb-2 p-0" onClick={onClose}>
            <CloseIcon height={40} width={40} />
          </TextButton>
        </div>
        <TextInput
          containerClassName="my-2 mb-4"
          placeholder="https://"
          onChange={setUri}
          value={uri}
        />
        <Button loading={loading} onClick={onUpdateMetadata}>
          Update
        </Button>
      </SimpleModal>
    </div>
  );
};
