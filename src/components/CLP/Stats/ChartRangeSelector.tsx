import { useRecoilState } from "recoil";
import { Toggle } from "../../Toggle";
import { customTimeframeAtom, historyRangeTypeAtom } from "../../../state";
import { DateTimePicker } from "../../common/DateTimePicker";

export const enum RangeType {
  Day,
  Week,
  Month,
  Year,
  Custom,
}

export const RangeSelector = () => {
  const [rangeType, setRangeType] = useRecoilState(historyRangeTypeAtom);
  const [customTimeframe, setCustomTimeframe] =
    useRecoilState(customTimeframeAtom);

  return (
    <div className="text-xs  w-full max-w-md">
      <Toggle onChange={(i) => setRangeType(i)} selectedIndex={rangeType}>
        <div className="font-medium min-w-full px-2 text-center line-clamp-1">
          24H
        </div>
        <div className="font-medium  min-w-full px-2 text-center line-clamp-1">
          1 Week
        </div>
        <div className="font-medium  min-w-full px-2 text-center line-clamp-1">
          30 Days
        </div>
        <div className="font-medium  min-w-full px-2 text-center line-clamp-1">
          1 Year
        </div>
      </Toggle>
      {rangeType === RangeType.Custom && (
        <div className="flex flex-row mt-4 space-x-4">
          <div>
            <p className="my-1 font-semibold text-text-placeholder">
              Start Time
            </p>
            <DateTimePicker
              onChange={(val) =>
                setCustomTimeframe((prev) => [parseInt(val), prev[1]])
              }
              value={customTimeframe[0].toString()}
            />
          </div>
          <div>
            <p className="my-1 font-semibold text-text-placeholder">End Time</p>
            <DateTimePicker
              onChange={(val) =>
                setCustomTimeframe((prev) => [prev[0], parseInt(val)])
              }
              value={customTimeframe[1].toString()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
