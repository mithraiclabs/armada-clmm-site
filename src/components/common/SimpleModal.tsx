import React, { useEffect, useRef } from "react";
import { SimpleCard } from "./SimpleCard";
import { useRecoilValue } from "recoil";
import { toastHoveredAtom } from "../../state/toast/atoms";

interface SimpleModalProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  preventOutsideClick?: boolean;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  children,
  className,
  isOpen,
  onClose,
  preventOutsideClick = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const toastHovered = useRecoilValue(toastHoveredAtom);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !preventOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !toastHovered
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, preventOutsideClick, toastHovered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-10">
      <div ref={modalRef}>
        <SimpleCard
          className={`w-full bg-background-container ${className ?? ""}`}
        >
          {children}
        </SimpleCard>
      </div>
    </div>
  );
};
