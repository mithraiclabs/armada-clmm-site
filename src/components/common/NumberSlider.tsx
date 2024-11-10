import React from "react";

export const NumberSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className="w-full mx-auto mt-2">
      <input
        type="range"
        id="tokenARatio"
        name="tokenARatio"
        min="0"
        max="100"
        value={value}
        onChange={handleChange}
        className="w-full h-1 mb-2 rounded-lg appearance-none outline-none cursor-pointer range-sm accent-primary"
      />
    </div>
  );
};
