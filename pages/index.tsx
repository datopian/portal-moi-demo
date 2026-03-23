import type { InferGetServerSidePropsType } from "next";
import MainSection from "../components/home/mainSection/MainSection";
import { searchDatasets } from "@/lib/queries/dataset";
import { getAllGroups } from "@/lib/queries/groups";
import { getAllOrganizations } from "@/lib/queries/orgs";
import HeroSectionLight from "@/components/home/heroSectionLight";
import ChartsSection from "@/components/home/visualizationsCarousel";
import { HomePageStructuredData } from "@/components/schema/HomePageStructuredData";
import type { ChartData, MonthlyPoint, TradePartner, GovtFinancePoint } from "@/types/chartData";

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url);
  const text = await res.text();
  return parseCsv(text);
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

function aggregateByPeriod(rows: Record<string, string>[]): MonthlyPoint[] {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const period = row["TIME_PERIOD"];
    const value = parseFloat(row["OBS_VALUE"]) || 0;
    if (period) totals[period] = (totals[period] ?? 0) + value;
  }
  return Object.entries(totals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, value]) => ({ period, value }));
}

function topTradePartners(rows: Record<string, string>[], n = 10): TradePartner[] {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const partner = row["Partner"]?.replace(/^"|"$/g, "").trim();
    const total = parseFloat(row["Total"]) || 0;
    if (partner) totals[partner] = (totals[partner] ?? 0) + total;
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([partner, total]) => ({ partner, total }));
}

function govtFinancePoints(rows: Record<string, string>[]): GovtFinancePoint[] {
  const revenue = rows.find((r) => r["Code"] === "1");
  const expense = rows.find((r) => r["Code"] === "2");
  const quarters = ["Q1", "Q2", "Q3"] as const;
  const result: GovtFinancePoint[] = [];
  for (const q of quarters) {
    if (revenue) result.push({ quarter: q, category: "Revenue", value: parseFloat(revenue[q]) || 0 });
    if (expense) result.push({ quarter: q, category: "Expense", value: parseFloat(expense[q]) || 0 });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export async function getServerSideProps() {
  const [datasets, visualizations, groups, orgs] = await Promise.all([
    searchDatasets({ offset: 0, limit: 5, tags: [], groups: [], orgs: [], type: "dataset" }),
    searchDatasets({ offset: 0, limit: 0, tags: [], groups: [], orgs: [], type: "visualization" }),
    getAllGroups(),
    getAllOrganizations(),
  ]);

  const stats = {
    datasetCount: datasets.count,
    groupCount: groups.length,
    orgCount: orgs.length,
    visualizationCount: visualizations.count,
  };

  // Fetch CSVs in parallel
  const [importsRows, exportsRows, tradeRows, govtRows] = await Promise.all([
    fetchCsv("https://blob.datopian.com/resources/f2db8c1b-4d2c-448a-9ad9-b894f7224e40/acg-p-apigw-001-M81ax7.csv"),
    fetchCsv("https://blob.datopian.com/resources/5c2e1572-55bf-4d1d-8293-3ca16723469c/acg-p-apigw-001-uG9EKg.csv"),
    fetchCsv("https://blob.datopian.com/resources/a735493f-05fe-42fb-93ac-1ea92c3df0cf/acg-p-apigw-001-qYs9wY.csv"),
    fetchCsv("https://blob.datopian.com/resources/bf63d5e3-7320-4dc5-b98f-28cf87badc70/acg-p-apigw-001-pxGTIm.csv"),
  ]);

  const chartData: ChartData = {
    monthlyImports: aggregateByPeriod(importsRows),
    nonOilExports: aggregateByPeriod(exportsRows),
    topTradePartners: topTradePartners(tradeRows),
    govtFinance: govtFinancePoints(govtRows),
  };

  return {
    props: {
      datasets: datasets.datasets,
      groups,
      stats,
      chartData,
    },
  };
}

export default function Home({
  datasets,
  groups,
  stats,
  chartData,
}: InferGetServerSidePropsType<typeof getServerSideProps>): JSX.Element {
  return (
    <>
      <HomePageStructuredData />
      <HeroSectionLight stats={stats} chartData={chartData} />
<ChartsSection data={chartData} />
      <MainSection groups={groups} />
    </>
  );
}
