import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  if (context.geo.country?.code) {
    context.cookies.set("country-code", context.geo.country.code);
  }

  return context.next();
};

export const config: Config = {
  path: "/",
};
