import { subDays, subYears } from "date-fns";
import { RangeType } from "../components/CLP/Stats";

export const HOUR_MS = 1000 * 60 * 60;

export const getSampleInterval = (range: RangeType) => {
  switch (range) {
    case RangeType.Day:
      return 1;
    case RangeType.Week:
      return 1;
    case RangeType.Month:
      return 1;
    case RangeType.Year:
      return 6;
    default:
      return 1;
  }
};

/*
this rounds down current time to the nearest hour so that firebase caching works
 (it caches on exact query match so minutes/seconds/ms would cause it to always recalculate the response)
*/
export const getRange = (range: RangeType) => {
  const now = new Date();
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);
  const latestHourTimestamp = now.getTime();
  switch (range) {
    case RangeType.Day: {
      const sub1Day = subDays(latestHourTimestamp, 1);
      return [sub1Day.getTime(), latestHourTimestamp];
    }
    case RangeType.Week: {
      const sub7Days = subDays(latestHourTimestamp, 7);
      return [sub7Days.getTime(), latestHourTimestamp];
    }
    case RangeType.Year: {
      const sub1Year = subYears(latestHourTimestamp, 1);
      return [sub1Year.getTime(), latestHourTimestamp];
    }
    case RangeType.Month:
    default: {
      const sub30Days = subDays(latestHourTimestamp, 30);
      return [sub30Days.getTime(), latestHourTimestamp];
    }
  }
};
