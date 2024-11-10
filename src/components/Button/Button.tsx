import { ButtonHTMLAttributes } from "react";
import { Spinner } from "../Spinner";

export type ButtonVariant = "outline" | "filled" | "simple" | "static";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
}

export const Button = ({
  children,
  className,
  fullWidth = false,
  loading = false,
  variant = "filled",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`
      ${fullWidth ? "flex-1" : ""}  
      ${
        loading || props.disabled
          ? ""
          : "hover:shadow-armada-glow active:opacity-50"
      }
      flex justify-center items-center 
      font-semibold border px-2 rounded-lg transition-all delay-50
      ${buttonClassNames(variant)} 
      ${props.disabled ? " opacity-50 " : ""}
      ${className ? className : ""}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <Spinner className="mr-2 w-4 h-4" color={spinnerColor(variant)} />
      )}
      {children}
    </button>
  );
};

const buttonClassNames = (variant: ButtonVariant) => {
  switch (variant) {
    case "outline":
      return "bg-background-container border-text text-text";
    case "filled":
      return "bg-primary text-text-button text-white";
    case "simple":
      return "bg-transparent border-none";
    case "static":
      return `
        bg-background-input text-text-placeholder
        hover:shadow-background-panel active:opacity-100
      `;
  }
};

const spinnerColor = (variant: ButtonVariant) => {
  switch (variant) {
    case "outline":
      return "var(--primary)";
    case "filled":
      return "text-button";
    case "simple":
      return "var(--primary)";
    case "static":
      return "text-placeholder";
  }
};
