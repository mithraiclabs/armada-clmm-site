import { useState } from "react";
import { Checkbox } from "./common/Checkbox";
import { SimpleModal } from "./common/SimpleModal";
import { Button } from "./Button";
import { useRecoilState } from "recoil";
import { acceptToUAtom } from "../state";
import { Trans } from "react-i18next";

export const DisclaimerModal = () => {
  const [acceptDisclaimer, setAcceptDisclaimer] = useRecoilState(acceptToUAtom);
  const [accept, setAccept] = useState(false);
  return (
    <SimpleModal
      className="max-w-md"
      onClose={() => {
        // do not close
      }}
      isOpen={!acceptDisclaimer}
    >
      <div className="text-text-placeholder">
        <p className="mb-2">
          <Trans>
            By using the Armada website and related software, the user agrees to
            the{" "}
            <a
              className="text-primary underline"
              href="/terms-of-use.pdf"
              target="_blank"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              className="text-primary underline"
              href="/privacy-policy.pdf"
              target="_blank"
            >
              Privacy Policy
            </a>
            .
          </Trans>
        </p>
        <Checkbox label="Accept" onChange={setAccept} value={accept} />
      </div>

      <Button
        className="mt-4"
        disabled={!accept}
        onClick={() => setAcceptDisclaimer(true)}
      >
        Continue
      </Button>
    </SimpleModal>
  );
};
