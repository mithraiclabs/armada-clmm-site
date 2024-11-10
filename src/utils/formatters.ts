const DAY_IN_SECONDS = 24 * 60 * 60;
const YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS;

export const formatPercent = (percent: string | number) => {
  const percentNumber =
    typeof percent === "string" ? parseFloat(percent) : percent;
  return percentNumber.toLocaleString(undefined, {
    minimumIntegerDigits: 1,
  });
};

export const formatAmount = (amount: number | string | null, decimals = 4) => {
  if (!amount) {
    return "0.0";
  }
  const amountNumber = typeof amount === "string" ? parseFloat(amount) : amount;
  let notation: Intl.NumberFormatOptions["notation"] = "standard";

  if (amountNumber > 0 && amountNumber < 0.0000001) {
    notation = "scientific";
  }

  return amountNumber.toLocaleString(undefined, {
    maximumSignificantDigits: notation === "scientific" ? 3 : 4,
    maximumFractionDigits: decimals,
    notation,
    // @ts-expect-error this exists, TS is wrong
    roundingMode: "trunc",
    minimumFractionDigits: 2,
  });
};

export const formatNumber = (val: string): string => {
  if (val === "") return "";
  const [integerPart, decimalPart] = val.split(".");
  const num = parseNumber(integerPart);
  let formattedNumber = isNaN(num) ? integerPart : num.toLocaleString();
  if (decimalPart !== undefined) {
    formattedNumber += "." + decimalPart;
  }
  return formattedNumber;
};

export const parseNumber = (str: string): number => {
  return parseFloat(str.replace(/,/g, "")) || 0;
};

export const durationYears = (duration: number) => {
  return Math.floor(duration / YEAR_IN_SECONDS);
};

export const durationDays = (duration: number) => {
  return (duration % YEAR_IN_SECONDS) / DAY_IN_SECONDS;
};

export const durationFormatter = (duration: number) => {
  const years = durationYears(duration);
  const days = durationDays(duration);

  const daysString = days === 1 ? "1 day" : `${days} days`;
  const yearsString = years === 1 ? "1 year" : `${years} years`;
  if (!years) {
    return daysString;
  }
  if (!days) {
    return yearsString;
  }

  return `${yearsString} and ${daysString}`;
};
