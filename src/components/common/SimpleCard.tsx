import { useEffect, useState } from "react";

export const SimpleCard = ({
  children,
  className,
  onClick,
  onHover,
  highlightOnHover,
  contentClassName,
  pulse,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  highlightOnHover?: boolean;
  onHover?: (a: boolean) => void;
  pulse?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (onHover) onHover(hovered);
  }, [hovered, onHover]);

  useEffect(() => {
    return () => {
      onHover && onHover(false);
    };
  }, [onHover]);
  const highlightClass = `${
    highlightOnHover && hovered ? "highlight-green" : ""
  } `;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`m-2 p-2 border border-background-darkContainer diagonal-lines rounded-2xl flex
        ${highlightClass}
       ${className ? className : ""}`}
    >
      <div
        className={`
      flex flex-1 flex-col border border-background-darkContainer
       bg-background-panel rounded-xl relative
       ${contentClassName ?? ""}
      `}
      >
        <div
          className={` p-4 rounded-xl  ${pulse ? "highlight-pulse " : ""}  `}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
