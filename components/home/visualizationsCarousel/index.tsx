import dynamic from "next/dynamic";
import Link from "next/link";
import type { ChartData } from "@/types/chartData";

const PlotChart = dynamic(() => import("./PlotChart"), { ssr: false });

const ACCENT = "#92722a";
const ACCENT_LIGHT = "#c9a96e";

type PlotModule = typeof import("@observablehq/plot") & { width?: number };

const CHARTS: {
  title: string;
  dataKey: keyof ChartData;
  href: string;
  period: string;
  frequency: string;
  source: string;
  lastUpdated: string;
  spec: (Plot: PlotModule, data: unknown[]) => SVGSVGElement | HTMLElement;
}[] = [
  {
    title: "UAE Total Imports (AED Billions)",
    dataKey: "monthlyImports",
    href: "/@moi-demo/foreign-trade-imports-by-country-monthly",
    period: "2017 – Jun 2025",
    frequency: "Monthly",
    source: "FCSA",
    lastUpdated: "Jun 2025",
    spec: (Plot, data) => {
      const d = data as { period: string; value: number }[];
      return Plot.plot({
        width: Plot.width ?? 1200,
        height: 320,
        marginLeft: 55,
        marginBottom: 40,
        marks: [
          Plot.ruleY([0], { stroke: "#e5e7eb" }),
          Plot.areaY(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
            fill: ACCENT,
            fillOpacity: 0.15,
          }),
          Plot.lineY(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
            stroke: ACCENT,
            strokeWidth: 2,
          }),
          Plot.crosshairX(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
          }),
        ],
        x: { label: "" },
        y: { label: "AED (B)", grid: true },
      });
    },
  },
  {
    title: "Non-Oil Exports (AED Billions)",
    dataKey: "nonOilExports",
    href: "/@moi-demo/foreign-trade-nonoil-exports-by-country-monthly",
    period: "2017 – Jun 2025",
    frequency: "Monthly",
    source: "FCSA",
    lastUpdated: "Jun 2025",
    spec: (Plot, data) => {
      const d = data as { period: string; value: number }[];
      return Plot.plot({
        width: Plot.width ?? 1200,
        height: 320,
        marginLeft: 55,
        marginBottom: 40,
        marks: [
          Plot.ruleY([0], { stroke: "#e5e7eb" }),
          Plot.areaY(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
            fill: ACCENT_LIGHT,
            fillOpacity: 0.2,
          }),
          Plot.lineY(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
            stroke: ACCENT_LIGHT,
            strokeWidth: 2,
          }),
          Plot.crosshairX(d, {
            x: (r) => new Date(r.period + "-01"),
            y: (r) => r.value / 1e9,
          }),
        ],
        x: { label: "" },
        y: { label: "AED (B)", grid: true },
      });
    },
  },
  {
    title: "Top 10 Trade Partners (Total AED Billions)",
    dataKey: "topTradePartners",
    href: "/@moi-demo/trade-flow-value-per-country",
    period: "2012 – 2023",
    frequency: "Annual",
    source: "UAE MoI",
    lastUpdated: "2024",
    spec: (Plot, data) =>
      Plot.plot({
        width: Plot.width ?? 1200,
        height: 320,
        marginLeft: 130,
        marginBottom: 40,
        marks: [
          Plot.ruleX([0], { stroke: "#e5e7eb" }),
          Plot.barX(data as { partner: string; total: number }[], {
            x: (d) => d.total / 1e9,
            y: "partner",
            fill: ACCENT,
            sort: { y: "-x" },
            tip: true,
          }),
        ],
        x: { label: "AED (B)", grid: true },
        y: { label: "" },
      }),
  },
  {
    title: "Government Revenue vs Expense (AED Millions)",
    dataKey: "govtFinance",
    href: "/@moi-demo/-government-financial-statistics-2025-sheet-1-government-financial-statistics",
    period: "2025",
    frequency: "Quarterly",
    source: "UAE MoI",
    lastUpdated: "Q3 2025",
    spec: (Plot, data) =>
      Plot.plot({
        width: Plot.width ?? 1200,
        height: 320,
        marginLeft: 55,
        marginBottom: 40,
        marks: [
          Plot.ruleY([0], { stroke: "#e5e7eb" }),
          Plot.barY(data as { quarter: string; category: string; value: number }[], {
            x: "quarter",
            y: "value",
            fill: "category",
            fx: "quarter",
            tip: true,
          }),
        ],
        color: { domain: ["Revenue", "Expense"], range: [ACCENT, ACCENT_LIGHT], legend: true },
        x: { label: "" },
        y: { label: "AED (M)", grid: true },
      }),
  },
];

export default function ChartsSection({ data }: { data: ChartData }) {
  return (
    <div className="custom-container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-900">Featured Data</h2>
        <Link href="/search" className="text-sm font-semibold text-accent hover:text-accent-600 flex items-center gap-1 transition-colors">
          View all datasets
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {CHARTS.map((chart, i) => (
        <Link
          key={i}
          href={chart.href}
          className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-accent-200 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 group-hover:text-accent transition-colors">
              {chart.title}
            </h3>
            <span className="text-xs text-gray-400 group-hover:text-accent transition-colors flex items-center gap-1">
              View dataset
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </div>
          <PlotChart
            title=""
            data={(data[chart.dataKey] as unknown[]) ?? []}
            spec={chart.spec}
          />
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {chart.period}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              {chart.frequency}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
              {chart.source}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              {chart.lastUpdated}
            </span>
          </div>
        </Link>
      ))}
      </div>
    </div>
  );
}
