export interface MonthlyPoint {
  period: string; // "YYYY-MM"
  value: number;
}

export interface TradePartner {
  partner: string;
  total: number;
}

export interface GovtFinancePoint {
  quarter: string; // "Q1" | "Q2" | "Q3"
  category: string; // "Revenue" | "Expense"
  value: number;
}

export interface ChartData {
  monthlyImports: MonthlyPoint[];
  nonOilExports: MonthlyPoint[];
  topTradePartners: TradePartner[];
  govtFinance: GovtFinancePoint[];
}

export type PlotModule = typeof import("@observablehq/plot") & {
  width?: number;
  document?: Document;
};
