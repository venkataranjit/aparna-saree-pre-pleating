import React from "react";
import LandingPage from "../pages/LandingPage";
import LandingPageNew from "../pages/LandingPageNew";

export const landingRoutes = [
  {
    path: "/",
    element: <LandingPageNew />,
  },
  {
    path: "/landing",
    element: <LandingPageNew />,
  },
  {
    path: "/landing-new",
    element: <LandingPageNew />,
  },
  {
    path: "/landingpage",
    element: <LandingPageNew />,
  },
  {
    path: "/coming-soon",
    element: <LandingPage />,
  },
];
