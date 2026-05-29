"use client";

import { ReactNode } from "react";

export default function KpiCard({
  label,
  value,
  sub,
  icon,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon?: ReactNode;

}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-600">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {value}{unit ? <span className="text-lg ml-1">{unit}</span> : null}
          </div>
          {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800">
          {icon}
        </div>
      </div>
    </div>
  );
}
