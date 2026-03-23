import type { PlotModule } from "@/types/chartData";

export const coverCsvUrl =
  "https://blob.datopian.com/resources/a735493f-05fe-42fb-93ac-1ea92c3df0cf/acg-p-apigw-001-qYs9wY.csv";

export const coverSpec = (Plot: PlotModule, data: unknown[], document?: Document) => {
  const d = data as { Partner: string; Total: string }[];
  const totals: Record<string, number> = {};
  for (const row of d) {
    const partner = row["Partner"]?.replace(/^"|"$/g, "").trim();
    const v = parseFloat(row["Total"]) || 0;
    if (partner) totals[partner] = (totals[partner] ?? 0) + v;
  }
  const points = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([partner, total]) => ({ partner, total }));

  return Plot.plot({
    document,
    height: 320,
    marginLeft: 130,
    marginBottom: 40,
    marks: [
      Plot.ruleX([0], { stroke: "#e5e7eb" }),
      Plot.barX(points, {
        x: (r) => r.total / 1e9,
        y: "partner",
        fill: "#92722a",
        sort: { y: "-x" },
        tip: true,
      }),
    ],
    x: { label: "AED (B)", grid: true },
    y: { label: "" },
  });
};

export const importsCsvUrl =
  "https://blob.datopian.com/resources/f2db8c1b-4d2c-448a-9ad9-b894f7224e40/acg-p-apigw-001-M81ax7.csv";

export const importsSpec = (Plot: PlotModule, data: unknown[], document?: Document) => {
  const d = data as { TIME_PERIOD: string; OBS_VALUE: string }[];
  const totals: Record<string, number> = {};
  for (const row of d) {
    const p = row["TIME_PERIOD"];
    const v = parseFloat(row["OBS_VALUE"]) || 0;
    if (p) totals[p] = (totals[p] ?? 0) + v;
  }
  const points = Object.entries(totals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, value]) => ({ period, value }));

  return Plot.plot({
    document,
    height: 320,
    marginLeft: 55,
    marginBottom: 40,
    marks: [
      Plot.ruleY([0], { stroke: "#e5e7eb" }),
      Plot.areaY(points, {
        x: (r) => new Date(r.period + "-01"),
        y: (r) => r.value / 1e9,
        fill: "#c9a96e",
        fillOpacity: 0.2,
      }),
      Plot.lineY(points, {
        x: (r) => new Date(r.period + "-01"),
        y: (r) => r.value / 1e9,
        stroke: "#c9a96e",
        strokeWidth: 2,
      }),
    ],
    x: { label: "" },
    y: { label: "AED (B)", grid: true },
  });
};
