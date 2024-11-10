import { Menu } from "@headlessui/react";
import { Float } from "@headlessui-float/react";
import { forwardRef, useCallback, useRef } from "react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import React from "react";
import { Link, LinkProps } from "react-router-dom";

/**
 * Navbar specific menu that has dropdown on hover.
 */
export const FloatingMenu = ({
  text,
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  text: string;
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  const handleEnter = useCallback(() => {
    if (!openRef.current) {
      triggerRef.current?.click();
      openRef.current = true;
    }
  }, []);

  const handleLeave = useCallback(() => {
    if (openRef.current) {
      triggerRef.current?.click();
      openRef.current = false;
    }
  }, []);

  return (
    <>
      <div className="hidden md:flex items-center">
        {/* Do not show in Drawer */}
        <Menu
          as="div"
          className="relative inline-block "
          onMouseLeave={handleLeave}
        >
          {({ open }) => {
            openRef.current = open;
            return (
              <Float placement="bottom">
                <Menu.Button
                  as="a"
                  className="hover:text-shadow cursor-pointer"
                  onMouseEnter={handleEnter}
                >
                  <div
                    ref={triggerRef}
                    className="flex flex-row items-center space-x-1 text-text font-semibold "
                  >
                    <p>{text}</p>
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 transform" : ""
                      } h-5 w-5 text-text`}
                    />
                  </div>
                </Menu.Button>
                <Menu.Items className="bg-background-panelSurface border-text-placeholder border rounded-lg space-y-2 py-1 outline-none">
                  <div className={className}>
                    {(
                      React.Children.toArray(children) as (React.ReactNode & {
                        props: {
                          to: string;
                        };
                      })[]
                    ).map((c) => (
                      <Menu.Item key={c.props?.to ?? "-"}>{c}</Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Float>
            );
          }}
        </Menu>
      </div>
      <div className="md:hidden">
        {/* Only show in Drawer on smaller screens */}
        <div className={className}>{children}</div>
      </div>
    </>
  );
};

interface FloatingMenuLinkProps extends LinkProps {
  active?: boolean;
}

export const FloatingMenuLink = forwardRef<
  HTMLAnchorElement,
  FloatingMenuLinkProps
>(({ active, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      className={`flex text-text font-medium px-3 py-[10px] rounded-md hover:bg-background-panel border-[1px] hover:border-primary hover:border-opacity-50 ${
        active
          ? "bg-background-panel border-primary border-opacity-50"
          : "border-transparent"
      }`}
      {...props}
    />
  );
});
