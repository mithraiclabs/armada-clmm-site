import React from "react";

export const Drawer = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="absolute min-h-screen">
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"
        ></div>
      )}
      <div
        className={`fixed top-0 left-0 h-full px-8 py-16 bg-background-panelSurface
            w-5/6 z-20 transform ease-in-out duration-300 overflow-y-scroll
           ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {isOpen && children}
      </div>
    </div>
  );
};
