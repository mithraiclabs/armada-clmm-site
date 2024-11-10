import React from "react";

export const Toggle = ({
  children,
  onChange,
  selectedIndex,
}: {
  children: React.ReactNode;
  onChange: (index: number) => void;
  selectedIndex: number;
}) => {
  const childArray = React.Children.toArray(children);
  const numOptions = childArray.length;
  const translateXPercent = Math.min(selectedIndex, numOptions - 1) * 100;

  return (
    <div className="bg-background-input rounded-lg border-[1px] border-text-placeholder flex flex-1 py-1.5 relative">
      <div
        className={`absolute bg-primary my-[1.5px] mx-[1.2px] top-0 bottom-0  w-1/${
          childArray.length
        } ${
          selectedIndex === numOptions - 1 ? ` -left-[3px]` : ``
        } rounded-md transition-transform transform  `}
        style={{
          transform: `translateX(${translateXPercent}%)`,
        }}
      />
      <div className="relative flex flex-1 justify-between">
        {childArray.map((child, index) => (
          <div
            key={`${index}`}
            className={`flex-1 flex justify-center cursor-pointer font-semibold  ${
              selectedIndex === index
                ? ` text-white ${index === numOptions - 1 && " pr-2"}`
                : "text-text"
            } px-2`}
            onClick={() => {
              onChange(index);
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
