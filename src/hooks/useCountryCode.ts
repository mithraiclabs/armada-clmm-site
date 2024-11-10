import { useMemo } from "react";
import Cookies from "universal-cookie";

export const useCountryCode = (): string =>
  useMemo(() => new Cookies().get("country-code"), []);
