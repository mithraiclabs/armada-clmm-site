import * as anchor from "@coral-xyz/anchor";
import DOMPurify from "dompurify";
import { useRecoilValue } from "recoil";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { SimpleCard } from "../common/SimpleCard";
import { clpVaultAtomFamily, selectClpVaultMetadata } from "../../state";
import { UpdateMetadata } from "../../pages/Clp/MarketMaking/UpdateMetadata";
import { useParamsWithOverride } from "../../contexts/ParamOverrideContext";
import { useTranslation } from "react-i18next";

const purify = DOMPurify();

export const VaultStrategy = () => {
  const { t } = useTranslation();
  const wallet = useAnchorWallet();
  const walletPubkey = wallet?.publicKey ?? anchor.web3.PublicKey.default;
  const { clpKey = "" } = useParamsWithOverride<{ clpKey: string }>();
  const clpVault = useRecoilValue(clpVaultAtomFamily(clpKey));
  const vaultMetadata = useRecoilValue(selectClpVaultMetadata(clpKey));
  const canUpdateMetadata =
    clpVault?.adminKey.equals(walletPubkey) ||
    clpVault?.marketMakingKey.equals(walletPubkey);
  if (!canUpdateMetadata && !vaultMetadata?.content?.en) {
    return null;
  }

  return (
    <SimpleCard className="max-w-full mx-0">
      <p className="font-khand text-2xl text-text-placeholder font-semibold">
        {t("Description")}
      </p>
      {!vaultMetadata?.content?.en?.description ? (
        <div>
          <p className="mb-2">
            A valid description is missing from this Vault LP Mint. As the admin
            or market maker, you may update the metadata URL to a json file that
            has the appropriate structure.{" "}
            <a
              className="text-primary underline"
              target="_blank"
              href="https://docs.armadafi.so/on-chain-liquidity/market-makers/updating-strategy-description"
            >
              Click here for directions
            </a>
          </p>
          <UpdateMetadata />
        </div>
      ) : (
        <p className="text-text font-semibold">
          {purify.sanitize(vaultMetadata.content.en.description)}
        </p>
      )}
    </SimpleCard>
  );
};
