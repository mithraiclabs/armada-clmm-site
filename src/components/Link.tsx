import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";

export interface LinkProps extends RouterLinkProps {
  active?: boolean;
  textClassName?: string;
}
export const Link = ({ active, textClassName, ...props }: LinkProps) => {
  return (
    <RouterLink {...props}>
      <p
        className={`hover:text-shadow ${
          active ? "text-shadow-lg" : ""
        } font-semibold text-primary flex ${textClassName ?? ""}`}
      >
        {props.children}
      </p>
    </RouterLink>
  );
};
