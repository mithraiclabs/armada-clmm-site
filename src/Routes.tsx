import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NotFound } from "./pages/NotFound";
import { PageLayout } from "./components/PageLayout";
import { ClpVaultPage, MarketMaking, Clp } from "./pages/Clp";
import { FAQ } from "./pages/FAQ";
import { Faucet } from "./pages/Faucet";
import { TxHistory } from "./pages/TxHistory";
import { CustomOrcaPoolSwap, OrcaSwap } from "./pages/OrcaSwap";
import { ClmmAuctionPage } from "./pages/Clp/Auction";
import { WhirlpoolPositionsPage } from "./pages/Whirlpool/WhirlpoolPositionsPage";
import { ErrorPage } from "./pages/ErrorPage";
import { Whirlpools } from "./pages/Whirlpool/Whirlpools";
import { PsyStakeRewards } from "./pages/Clp/MarketMaking/PsyStakeRewards";
import { NewClmm } from "./pages/Clp/CreateClmm/NewClmm";

// TODO convert to component based Router

const router = createBrowserRouter([
  {
    path: "/",
    element: <PageLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Clp />
      },
    ],
  },
  {
    path: "/history",
    element: <PageLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <TxHistory />,
      },
    ],
  },
  ...(import.meta.env.MODE !== "lbc"
    ? [
        {
          path: "/clmm",
          element: <PageLayout />,
          children: [
            // only include `Clp` page if the build is for Armada
            ...(import.meta.env.VITE_ARMADA_DEPLOY === "true"
              ? [
                  {
                    path: "/clmm",
                    element: <Clp />,
                  },
                ]
              : []),
            {
              path: "new",
              element: <NewClmm />,
            },

            {
              path: ":clpKey",
              children: [
                {
                  path: "",
                  element: <ClpVaultPage />,
                },
                {
                  path: "mm",
                  element: <MarketMaking />,
                },
                {
                  path: "staking",
                  element: <PsyStakeRewards />,
                },
                {
                  path: "auction",
                  element: <ClmmAuctionPage />,
                }
              ],
            },
          ],
          errorElement: <ErrorPage />,
        },
      ]
    : []),
  // The following top level paths are only available for Armada deploys
  ...(import.meta.env.VITE_ARMADA_DEPLOY === "true"
    ? [
        {
          path: "/faucet",
          element: <PageLayout />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: "",
              element: <Faucet />,
            },
          ],
        },
        {
          path: "/faq",
          element: <PageLayout />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: "",
              element: <FAQ />,
            },
          ],
        },
        {
          path: "/orca/whirlpools",
          element: <PageLayout />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: "",
              element: <OrcaSwap />,
            },
            {
              path: ":whirlpoolId",
              element: <CustomOrcaPoolSwap />,
            },
          ],
        },
        {
          path: "/clp",
          element: <PageLayout />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: "",
              element: <Whirlpools />,
            },
            {
              path: ":key",
              element: <WhirlpoolPositionsPage />,
            },
          ],
        },
      ]
    : []),
  {
    path: "*",
    element: <NotFound />,
  },
]);

export const Routes = () => {
  return <RouterProvider router={router} />;
};
