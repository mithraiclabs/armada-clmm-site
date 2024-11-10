import { BACKUP_LOGO_URL } from "../../state";

export interface LogoProps {
  src: string | undefined;
  noFilter?: boolean;
  glow?: boolean;
  size?: number;
  className?: string;
  fallbackImage?: boolean;
}

export const Logo = ({
  src,
  fallbackImage,
  noFilter,
  glow,
  size,
  className,
}: LogoProps) => {
  return (
    <img
      className={`${noFilter ? "" : "img-filter"} ${
        glow ? "shadow-armada-glow" : ""
      } ${className ?? ""}`}
      style={{
        maxHeight: size ?? 30,
        maxWidth: size ?? 30,
        borderRadius: size ?? 25,
      }}
      src={src ? src : fallbackImage ? BACKUP_LOGO_URL : undefined}
    />
  );
};
