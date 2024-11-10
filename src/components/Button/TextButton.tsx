import { HTMLAttributes } from "react";

export const TextButton = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`pointer-cursor p-0 border-0 hover:opacity-75 active:opacity-50 ${
        className ? className : ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
};
