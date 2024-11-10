import "react-router";
declare module "react-router" {
  /**
   * @deprecated
   * Please use the `useParamsWithOverride` instead. This allows us to
   * inject our own params outside of routes as a workaround for building
   * with certain pages as the index route.
   */
  export function useParams();
}
