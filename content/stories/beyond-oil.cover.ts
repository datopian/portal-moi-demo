import type { PlotModule } from "@/types/chartData";

export const coverCsvUrl =
  "https://blob.datopian.com/resources/5c2e1572-55bf-4d1d-8293-3ca16723469c/acg-p-apigw-001-uG9EKg.csv";

export const coverSpec = (Plot: PlotModule, data: unknown[], document?: Document) => {
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
    width: Plot.width,
    height: 320,
    marginLeft: 55,
    marginBottom: 40,
    marks: [
      Plot.ruleY([0], { stroke: "#e5e7eb" }),
      Plot.areaY(points, {
        x: (r) => new Date(r.period + "-01"),
        y: (r) => r.value / 1e9,
        fill: "#92722a",
        fillOpacity: 0.15,
      }),
      Plot.lineY(points, {
        x: (r) => new Date(r.period + "-01"),
        y: (r) => r.value / 1e9,
        stroke: "#92722a",
        strokeWidth: 2,
      }),
    ],
    x: { label: "" },
    y: { label: "AED (B)", grid: true },
  });
};

export const hsSectionCsvUrl = "https://blob.datopian.com/resources/93fbbfe3-dba3-495b-9e4b-a456dc253316/acg-p-apigw-001-qiyJ3b.csv";

export const hsSectionSpec = (Plot: PlotModule, data: unknown[], document?: Document) => {
  const d = data as { HS_SECTION: string; OBS_VALUE: string; TIME_PERIOD: string }[];
  // Aggregate total by HS section across all years
  const totals: Record<string, number> = {};
  for (const row of d) {
    const section = row["HS_SECTION"];
    const v = parseFloat(row["OBS_VALUE"]) || 0;
    if (section && section !== "_Z") totals[section] = (totals[section] ?? 0) + v;
  }
  const points = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([section, value]) => ({ section, value }));

  return Plot.plot({
    document,
    width: Plot.width,
    height: 320,
    marginLeft: 80,
    marginBottom: 40,
    marks: [
      Plot.ruleX([0], { stroke: "#e5e7eb" }),
      Plot.barX(points, {
        x: (r) => r.value / 1e9,
        y: "section",
        fill: "#92722a",
        sort: { y: "-x" },
        tip: true,
      }),
    ],
    x: { label: "AED (B)", grid: true },
    y: { label: "" },
  });
};
