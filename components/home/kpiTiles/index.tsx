import type { ChartData } from "@/types/chartData";

function formatAED(value: number): string {
  if (value >= 1e12) return `AED ${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `AED ${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `AED ${(value / 1e6).toFixed(0)}M`;
  return `AED ${value.toLocaleString()}`;
}

function growthPct(first: number, last: number): string {
  const pct = ((last - first) / first) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

function KpiTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColor =
    trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-gray-400";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl border border-gray-100 bg-white/60">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-black text-gray-900 leading-tight">{value}</span>
      <span className={`text-sm font-medium ${trendColor}`}>
        {trendIcon} {sub}
      </span>
    </div>
  );
}

export default function KpiTiles({ data }: { data: ChartData }) {
  const { monthlyImports, nonOilExports, topTradePartners, govtFinance } = data;

  // Latest monthly imports
  const latestImport = monthlyImports[monthlyImports.length - 1];

  // Non-oil export growth (first vs last)
  const firstExport = nonOilExports[0];
  const latestExport = nonOilExports[nonOilExports.length - 1];
  const exportGrowth = growthPct(firstExport.value, latestExport.value);

  // Top trade partner
  const topPartner = topTradePartners[0];

  // Govt Q3 revenue
  const q3Revenue = govtFinance.find((d) => d.quarter === "Q3" && d.category === "Revenue");

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <KpiTile
        label="Monthly Imports"
        value={formatAED(latestImport.value)}
        sub={latestImport.period}
        trend="neutral"
      />
      <KpiTile
        label="Non-Oil Export Growth"
        value={exportGrowth}
        sub={`${firstExport.period} → ${latestExport.period}`}
        trend="up"
      />
      <KpiTile
        label="Top Trade Partner"
        value={topPartner.partner}
        sub={formatAED(topPartner.total)}
        trend="neutral"
      />
      <KpiTile
        label="Govt Revenue Q3"
        value={formatAED((q3Revenue?.value ?? 0) * 1e6)}
        sub="2025 (preliminary)"
        trend="neutral"
      />
    </div>
  );
}
