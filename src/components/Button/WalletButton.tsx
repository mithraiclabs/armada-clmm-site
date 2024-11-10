import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@tiplink/wallet-adapter-react-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonProps } from "./Button";
import { ReactComponent as WalletIcon } from "../../assets/icons/wallet.svg";
import { useTranslation } from "react-i18next";

export const WalletButton = ({
  variant,
}: {
  variant?: ButtonProps["variant"];
}) => {
  const { t } = useTranslation();
  const { connect, connected, publicKey, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLUListElement>(null);

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
  const copyAddress = useCallback(async () => {
    if (base58) {
      await navigator.clipboard.writeText(base58);
      setCopied(true);
      setTimeout(() => setCopied(false), 400);
    }
  }, [base58]);

  const openModal = useCallback(() => {
    setVisible(true);
    setActive(false);
  }, [setVisible]);
  const _disconnect = useCallback(async () => {
    await disconnect();
    setActive(false);
  }, [disconnect]);

  useEffect(() => {
    // Close active wallet dropdown when clicked outside
    const listener = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;

      // Do nothing if clicking dropdown or its descendants
      if (!node || node.contains(event.target as Node)) return;

      setActive(false);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, []);

  return (
    <div className="wallet-adapter-dropdown top-2.5 text-sm">
      {connected ? (
        <Button
          onClick={() => setActive(true)}
          aria-expanded={active}
          style={{ pointerEvents: active ? "none" : "auto" }}
          variant={variant}
          className="h-8"
        >
          {base58?.slice(0, 4) + ".." + base58?.slice(-4)}
        </Button>
      ) : (
        <Button
          fullWidth
          onClick={async () => {
            if (!wallet) {
              return setVisible(true);
            }
            await connect();
          }}
          className="h-8"
          variant={variant}
        >
          <div className="flex flex-row items-center w-36">
            <WalletIcon /> <div className="pl-2">{t("Connect Wallet")}</div>
          </div>
        </Button>
      )}
      <ul
        aria-label="dropdown-list"
        className={`wallet-adapter-dropdown-list ${
          active && "wallet-adapter-dropdown-list-active"
        }`}
        ref={ref}
        role="menu"
      >
        <li
          onClick={copyAddress}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          {copied ? t("Copied") : t("Copy address")}
        </li>
        <li
          onClick={openModal}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          {t("Change wallet")}
        </li>
        <li
          onClick={_disconnect}
          className="wallet-adapter-dropdown-list-item"
          role="menuitem"
        >
          {t("Disconnect")}
        </li>
      </ul>
    </div>
  );
};
