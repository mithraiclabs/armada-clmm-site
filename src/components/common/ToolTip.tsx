import { Popover, Transition } from "@headlessui/react";
import React, { useEffect } from "react";
import { Fragment, useCallback, useRef } from "react";

export const ToolTip = ({
  className,
  children,
  content,
}: {
  className?: string;
  children: React.ReactNode;
  content: React.ReactNode;
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleEnter = useCallback((isOpen: boolean) => {
    !isOpen && triggerRef.current?.click();
  }, []);

  const handleLeave = useCallback((isOpen: boolean) => {
    isOpen && triggerRef.current?.click();
  }, []);

  return (
    <Popover className="relative">
      {({ open }) => (
        <div
          onMouseEnter={() => handleEnter(open)}
          onMouseLeave={() => handleLeave(open)}
        >
          <Popover.Button className="hidden" ref={triggerRef} />
          {children}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              className={`absolute left-1/2 z-50 mt-1 -translate-x-1/2 transform p-2 px-3 bg-background-container min-w-[50px] flex rounded-md ${
                className ?? ""
              }`}
            >
              {content}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
};

export const BeakTooltip = ({
  className,
  children,
  content,
  colorClassname,
  force,
}: {
  className?: string;
  children: React.ReactNode;
  content: React.ReactNode;
  colorClassname?: string;
  force?: boolean;
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleEnter = useCallback((isOpen: boolean) => {
    !isOpen && triggerRef.current?.click();
  }, []);

  const handleLeave = useCallback((isOpen: boolean) => {
    isOpen && triggerRef.current?.click();
  }, []);

  useEffect(() => {
    if (force) {
      handleEnter(true);
    } else handleLeave(true);
  }, [force, handleEnter, handleLeave]);

  return (
    <Popover className="relative">
      {({ open }) => (
        <div
          onMouseEnter={() => handleEnter(open)}
          onMouseLeave={() => handleLeave(open)}
        >
          <Popover.Button className="hidden" ref={triggerRef} />
          {children}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              className={`absolute left-1/2 z-50 mt-1 translate-x-4 -top-4 transform p-2 px-3 ${
                colorClassname ?? "bg-background-container"
              } min-w-[50px] flex rounded-md ${className ?? ""}`}
            >
              <div
                className={`absolute -left-1 w-3 h-3 ${
                  colorClassname ?? "bg-background-container"
                } transform rotate-45 translate-y-2`}
              />
              {content}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
};
