import { Link } from "react-router-dom";

export const ProhibitedJurisdictionBanner = () => {
  return (
    <div className="bg-background-panel p-4 md:px-12 lg:px-24 text-text-placeholder">
      <p>
        Access from prohibited jurisdictions restricted.{" "}
        <Link
          className="underline"
          to="https://docs.armadafi.so/on-chain-liquidity/restrictions"
          target="_blank"
        >
          Learn more.
        </Link>
      </p>
    </div>
  );
};
