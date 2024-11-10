import { useCallback, useState } from "react";
import { NumberInput } from "./Input";

const DAY_IN_SECONDS = 24 * 60 * 60;
const YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS;

export const TimeframeInput = ({
  onChangeDuration,
}: {
  onChangeDuration: (val: number) => void;
}) => {
  const [years, setYears] = useState("");
  const [days, setDays] = useState("");
  const onYearsChange = useCallback(
    (_years: string) => {
      const _yearsNum = parseFloat(_years);
      if (_years && Number.isNaN(_yearsNum)) {
        // Invalid number, do not update
        return;
      }
      const duration =
        (_yearsNum || 0) * YEAR_IN_SECONDS +
        (parseFloat(days) || 0) * DAY_IN_SECONDS;
      setYears(_years);
      onChangeDuration(duration);
    },
    [days, onChangeDuration]
  );
  const onDaysChange = useCallback(
    (_days: string) => {
      const _daysNum = parseFloat(_days);
      if (_days && Number.isNaN(_daysNum)) {
        // Invalid number, do not update
        return;
      }
      const duration =
        (parseFloat(years) || 0) * YEAR_IN_SECONDS +
        (_daysNum || 0) * DAY_IN_SECONDS;
      setDays(_days);
      onChangeDuration(duration);
    },
    [onChangeDuration, years]
  );

  return (
    <div className="flex flex-row justify-between">
      <div className="flex-1">
        <p>Years</p>
        <NumberInput placeholder="0" onChange={onYearsChange} value={years} />
      </div>
      <div className="w-6" />
      <div className="flex-1">
        <p>Days</p>
        <NumberInput placeholder="0" onChange={onDaysChange} value={days} />
      </div>
    </div>
  );
};
