export const Checkbox: React.FC<{
  onChange: (value: boolean) => void;
  value: boolean;
  label?: string;
  labelColor?: string;
}> = ({ onChange, value, label, labelColor = "text" }) => {
  const toggleCheckbox = () => {
    onChange(!value);
  };
  return (
    <div
      className="flex justify-start items-center cursor-pointer"
      onClick={toggleCheckbox}
    >
      <div
        className={`relative h-[24px] w-[24px] rounded-md bg-background-input mr-2 border-text-placeholder border`}
      >
        {value && (
          <p
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary font-bold`}
          >
            ✓
          </p>
        )}
      </div>
      <label
        className={`flex font-montserrat text-[16px] font-medium text-${labelColor}`}
      >
        {label}
      </label>
    </div>
  );
};
