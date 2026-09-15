import React from "react";
import { Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import LandingPage from "../pages/LandingPage";
import LandingPageNew from "../pages/LandingPageNew";

const RootEntryRoute = () => {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPageNew />;
};

export const landingRoutes = [
  {
    path: "/",
    element: <RootEntryRoute />,
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
