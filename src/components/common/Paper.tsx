import { ReactNode } from "react";

export const Paper = ({ children }: { children: ReactNode }) => {
  return <div className="bg-background-panel rounded-md p-4">{children}</div>;
};
