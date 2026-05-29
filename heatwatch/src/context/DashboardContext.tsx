"use client";

import { createContext, useContext, useState } from "react";

type Mode = "observed" | "predicted";

type DashboardContextType = {
  city: string;
  setCity: (city: string) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState("Kuala Lumpur");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [mode, setMode] = useState<Mode>("observed");

  return (
    <DashboardContext.Provider
      value={{ city, setCity, dateRange, setDateRange, mode, setMode }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }
  return ctx;
}
