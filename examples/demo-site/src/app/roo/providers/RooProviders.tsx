"use client";

import React from "react";

import { TaskStateProvider } from "../contexts/TaskStateContext";

interface RooProvidersProps {
  children: React.ReactNode;
}

export const RooProviders: React.FC<RooProvidersProps> = ({ children }) => {
  return <TaskStateProvider>{children}</TaskStateProvider>;
};
