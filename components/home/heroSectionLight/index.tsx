import Image from "next/image";
import SearchForm from "./SearchForm";
import type { ChartData } from "@/types/chartData";

const SUGGESTED_PROMPTS = [
  "Show UAE import trends since 2020",
  "Who are the top trade partners?",
  "Compare revenue vs expense in 2025",
  "Non-oil export growth over time",
];

export default function HeroSectionLight({
  stats,
  chartData,
}: {
  stats: {
    orgCount: number;
    groupCount: number;
    datasetCount: number;
    visualizationCount: number;
  };
  chartData: ChartData;
}) {
  const handlePrompt = (prompt: string) => {
    window.dispatchEvent(new CustomEvent("queryless:open", { detail: { message: prompt } }));
  };

  return (
    <section
      className="h-[calc(100vh-100px)] flex flex-col px-4 hero-glow"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 w-full max-w-3xl mx-auto">
        <Image
          src="/images/moi-logo.svg"
          alt="UAE Ministry of Investment"
          width={280}
          height={137}
          style={{ objectFit: "contain" }}
          priority
        />

        <div className="flex flex-col gap-3">
          <h1 className="font-black text-[42px] md:text-[58px] leading-tight text-gray-900">
            UAE Investment{" "}
            <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-gray-500 text-[17px] md:text-[19px] max-w-xl mx-auto">
            Explore trade flows, investment statistics, and financial data.
            Ask anything in plain English.
          </p>
        </div>

        <div className="w-full">
          <SearchForm />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePrompt(prompt)}
              className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-accent hover:text-accent transition-colors bg-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Portal stats pinned to the bottom */}
      <div className="mt-auto w-full">
        <div className="custom-container mx-auto py-5 flex flex-wrap gap-8 justify-center">
          <span className="text-sm text-gray-500"><span className="font-bold text-gray-900 text-base">{stats.datasetCount}</span> Datasets</span>
          <span className="text-sm text-gray-500"><span className="font-bold text-gray-900 text-base">{stats.orgCount}</span> Organizations</span>
          <span className="text-sm text-gray-500"><span className="font-bold text-gray-900 text-base">{stats.groupCount}</span> Topics</span>
          {!!stats.visualizationCount && (
            <span className="text-sm text-gray-500"><span className="font-bold text-gray-900 text-base">{stats.visualizationCount}</span> Visualizations</span>
          )}
        </div>
      </div>
    </section>
  );
}
