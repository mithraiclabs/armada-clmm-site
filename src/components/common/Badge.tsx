export const Badge = ({ value }: { value: string }) => {
  return (
    <span
      className={`text-text-tradeGreen border-text-tradeGreen text-sm border-[1px] px-3 py-[3px] rounded-full`}
    >
      {value}
    </span>
  );
};
