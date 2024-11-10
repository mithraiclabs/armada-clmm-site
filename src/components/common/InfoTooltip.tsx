import { useState } from "react";

interface InfoTooltipProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tooltipContent?: React.ReactNode;
  disabled?: boolean;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  children,
  title,
  tooltipContent,
  disabled,
  className,
}) => {
  const [hovered, setHovered] = useState(false);
  if (disabled) return children;
  return (
    <div>
      <div
        className={className ?? "flex flex-col justify-center items-center"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
      </div>
      {hovered && (
        <div className="flex flex-1 flex-col bg-background-container border border-text-placeholder z-20 rounded-2xl p-4 absolute max-w-[350px]">
          {!!title && (
            <span className="text-sm font-thin text-text-placeholder">
              {title}
            </span>
          )}
          {tooltipContent}
        </div>
      )}
    </div>
  );
};
