import { useEffect, useRef } from "react";

interface Props {
  title: string;
  data: unknown[];
  // Receives the Plot module and data, returns a rendered plot element
  spec: (Plot: typeof import("@observablehq/plot"), data: unknown[]) => SVGSVGElement | HTMLElement;
}

export default function PlotChart({ title, data, spec }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;
    const container = containerRef.current;

    import("@observablehq/plot").then((Plot) => {
      const width = container.clientWidth || 520;
      const plot = spec({ ...Plot, width } as any, data);
      container.innerHTML = "";
      container.appendChild(plot);
    });

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [data, spec]);

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
      <div ref={containerRef} className="overflow-hidden [&>svg]:max-w-full [&>figure]:max-w-full" />
    </div>
  );
}
