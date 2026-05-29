export type Mode = "observed" | "predicted";
export type DateRange = "7d" | "30d" | "90d";
export type Risk = "low" | "medium" | "high";

export type HotspotRow = {
  id: string;
  name: string;
  risk: Risk;
  severity: number; // 1–3
  lst_c: number | null;
  ndvi: number | null;
  lng: number;
  lat: number;
};
