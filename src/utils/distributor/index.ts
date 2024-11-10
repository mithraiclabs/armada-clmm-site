export * from "./constants";
export * from "./pda";
export * from "./sdk";
export * from "./types";
export * as utils from "./utils";
export * from "./wrapper";

export const validDistributorJSON = (json: any) => {
  if (!json) return false;
  if (json.recipientList && Array.isArray(json.recipientList)) return true;
  return false;
};
