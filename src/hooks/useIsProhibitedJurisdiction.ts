import { useCountryCode } from "./useCountryCode";

export const useIsProhibitedJurisdiction = () => {
  const countryCode = useCountryCode();
  return [
    "US",
    // prohibit countries with US sanctions
    "CU",
    "IR",
    "KP",
    "RU",
    "SY",
    "AF",
    "BY",
    "CF",
  ].includes(countryCode);
};
