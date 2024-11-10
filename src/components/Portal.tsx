import { createPortal } from "react-dom";

const PORTAL_ID_PREFIX = "@@portal-";

export const PortalProvider = ({ portalId }: { portalId: string }) => {
  return <div id={`${PORTAL_ID_PREFIX}${portalId}`} />;
};

export const Portal = ({
  children,
  portalId,
}: {
  children: React.ReactNode;
  portalId: string;
}) => {
  const element = document.getElementById(`${PORTAL_ID_PREFIX}${portalId}`);
  if (!element) {
    return null;
  }
  return createPortal(children, element);
};
