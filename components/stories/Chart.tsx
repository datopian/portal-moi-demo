import { useEffect, useRef, useState } from "react";
import { parseCsv } from "@/lib/parseCsv";
import type { PlotModule } from "@/types/chartData";

interface ChartProps {
  title: string;
  csvUrl: string;
  spec: (Plot: PlotModule, data: unknown[]) => SVGSVGElement | HTMLElement;
}

export default function Chart({ title, csvUrl, spec }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    async function render() {
      try {
        const proxyUrl = `/api/csv?url=${encodeURIComponent(csvUrl)}`;
        const [res, Plot] = await Promise.all([
          fetch(proxyUrl),
          import("@observablehq/plot"),
        ]);
        const text = await res.text();
        const data = parseCsv(text);
        if (cancelled) return;
        const width = container.clientWidth || 640;
        const plot = spec({ ...Plot, width } as PlotModule, data);
        container.innerHTML = "";
        container.appendChild(plot);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => { cancelled = true; container.innerHTML = ""; };
  }, [csvUrl, spec]);

  return (
    <figure className="my-8">
      {title && (
        <figcaption className="text-sm font-semibold text-gray-600 mb-2">
          {title}
        </figcaption>
      )}
      {loading && !error && (
        <div className="h-[320px] bg-gray-100 animate-pulse rounded-lg" />
      )}
      {error && (
        <div className="h-[320px] flex items-center justify-center text-sm text-red-500">
          Failed to load chart
        </div>
      )}
      <div
        ref={containerRef}
        className="overflow-hidden [&>svg]:max-w-full [&>figure]:max-w-full"
      />
    </figure>
  );
}
