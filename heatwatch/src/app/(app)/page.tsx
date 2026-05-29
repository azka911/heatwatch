import KpiCard from "@/components/dashboard/KpiCard";
import FilterPanel from "@/components/dashboard/FilterPanel";
import MapPlaceholder from "@/components/dashboard/MapPlaceholder";
import InsightPanel from "@/components/dashboard/InsightPanel";
import { DateRange, Mode } from "@/components/dashboard/types";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Avg LST" value="34.5" unit="°C" />
        <KpiCard label="Heat Hotspots" value="18" />
        <KpiCard label="Avg NDVI" value="0.42" />
        <KpiCard label="High-Risk Zones" value="5" />
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <FilterPanel/>
        </div>

        <div className="lg:col-span-6">
          <MapPlaceholder />
        </div>

        <div className="lg:col-span-3">
          <InsightPanel mode={"observed"} />
        </div>
      </div>
    </div>
  );
}
