# Data Stories Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a file-based data stories feature where MDX files in `content/stories/` are rendered at `/stories/[slug]` with embedded Observable Plot charts, indexed at `/stories`.

**Architecture:** Stories are MDX files with YAML frontmatter. Each story has a companion `.cover.ts` file exporting chart specs and CSV URLs. The story page imports all cover modules statically and selects the right one by slug — functions never pass through JSON serialization. A Node.js script generates SVG cover images using jsdom + Observable Plot server-side.

**Tech Stack:** next-mdx-remote, gray-matter, jsdom, @observablehq/plot (existing), @tailwindcss/typography (existing), TypeScript, tsx (for running scripts)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `types/chartData.ts` | Export `PlotModule` type |
| Modify | `components/home/visualizationsCarousel/index.tsx` | Import `PlotModule` from types instead of local |
| Create | `lib/parseCsv.ts` | Shared CSV parser (moved from pages/index.tsx) |
| Modify | `pages/index.tsx` | Import parseCsv from lib instead of inline |
| Create | `lib/stories.ts` | Read all story MDX files, return sorted frontmatter list |
| Create | `components/stories/Chart.tsx` | Client-side MDX chart component |
| Create | `components/stories/StoryCard.tsx` | Index page story card |
| Create | `pages/stories/index.tsx` | Stories index (getStaticProps) |
| Create | `content/stories/beyond-oil.cover.ts` | Chart specs for Story 1 (Task 8 — must precede Task 10) |
| Create | `content/stories/beyond-oil.mdx` | Story 1 prose |
| Create | `content/stories/the-world-comes-to-uae.cover.ts` | Chart specs for Story 2 (Task 9 — must precede Task 10) |
| Create | `content/stories/the-world-comes-to-uae.mdx` | Story 2 prose |
| Create | `pages/stories/[slug].tsx` | Individual story page — statically imports cover modules from Tasks 8–9 |
| Create | `scripts/generate-covers.ts` | Server-side SVG cover generator |
| Create | `public/images/story-covers/beyond-oil.svg` | Generated cover (committed) |
| Create | `public/images/story-covers/the-world-comes-to-uae.svg` | Generated cover (committed) |

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] Install runtime dependencies:
```bash
cd /home/deme/Projects/datopian/portal-moi-demo
npm install next-mdx-remote gray-matter jsdom
```

- [ ] Install dev dependencies:
```bash
npm install --save-dev @types/jsdom tsx
```

- [ ] Verify installation:
```bash
node -e "require('next-mdx-remote'); require('gray-matter'); require('jsdom'); console.log('OK')"
```
Expected output: `OK`

- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add next-mdx-remote, gray-matter, jsdom dependencies"
```

---

## Task 2: Export PlotModule from types/chartData.ts

**Files:**
- Modify: `types/chartData.ts`
- Modify: `components/home/visualizationsCarousel/index.tsx:10`

- [ ] Add `PlotModule` export to `types/chartData.ts`. Append after the existing exports:
```ts
export type PlotModule = typeof import("@observablehq/plot") & {
  width?: number;
  document?: Document;
};
```

- [ ] In `components/home/visualizationsCarousel/index.tsx`, replace line 10:
```ts
// REMOVE this line:
type PlotModule = typeof import("@observablehq/plot") & { width?: number };

// ADD this import at the top with the other imports:
import type { PlotModule } from "@/types/chartData";
```

- [ ] Verify TypeScript still compiles:
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors related to PlotModule.

- [ ] Commit:
```bash
git add types/chartData.ts components/home/visualizationsCarousel/index.tsx
git commit -m "refactor: export PlotModule from types/chartData"
```

---

## Task 3: Move parseCsv to lib/parseCsv.ts

**Files:**
- Create: `lib/parseCsv.ts`
- Modify: `pages/index.tsx`

- [ ] Create `lib/parseCsv.ts`:
```ts
export function parseRow(line: string): string[] {
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

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}
```

- [ ] In `pages/index.tsx`, remove the inline `parseRow` and `parseCsv` function definitions (lines ~15–37) and add this import at the top:
```ts
import { parseRow, parseCsv } from "@/lib/parseCsv";
```

- [ ] Verify the dev server still starts without errors:
```bash
npm run dev 2>&1 | head -10
```

- [ ] Commit:
```bash
git add lib/parseCsv.ts pages/index.tsx
git commit -m "refactor: move parseCsv to lib/parseCsv.ts"
```

---

## Task 4: Create lib/stories.ts

**Files:**
- Create: `lib/stories.ts`

- [ ] Create `lib/stories.ts`:
```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface StoryMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  relatedDatasets: string[];
}

const STORIES_DIR = path.join(process.cwd(), "content/stories");

export function getAllStories(): StoryMeta[] {
  const files = fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(STORIES_DIR, filename), "utf8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title ?? "",
        date: data.date ?? "",
        description: data.description ?? "",
        relatedDatasets: data.relatedDatasets ?? [],
      } as StoryMeta;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getStorySource(slug: string): { content: string; frontmatter: StoryMeta } {
  const filePath = path.join(STORIES_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  return {
    content,
    frontmatter: {
      slug,
      title: data.title ?? "",
      date: data.date ?? "",
      description: data.description ?? "",
      relatedDatasets: data.relatedDatasets ?? [],
    },
  };
}
```

- [ ] Create the content directory:
```bash
mkdir -p content/stories
```

- [ ] Commit:
```bash
git add lib/stories.ts
git commit -m "feat: add lib/stories.ts for reading story MDX files"
```

---

## Task 5: Create components/stories/Chart.tsx

**Files:**
- Create: `components/stories/Chart.tsx`

- [ ] Create `components/stories/Chart.tsx`:
```tsx
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
        const [res, Plot] = await Promise.all([
          fetch(csvUrl),
          import("@observablehq/plot"),
        ]);
        const text = await res.text();
        const data = parseCsv(text);
        if (cancelled) return;
        const plot = spec(Plot as PlotModule, data);
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
```

- [ ] Commit:
```bash
git add components/stories/Chart.tsx
git commit -m "feat: add stories Chart component"
```

---

## Task 6: Create components/stories/StoryCard.tsx

**Files:**
- Create: `components/stories/StoryCard.tsx`

- [ ] Create `components/stories/StoryCard.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import type { StoryMeta } from "@/lib/stories";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function StoryCard({ story }: { story: StoryMeta }) {
  const coverSrc = `/images/story-covers/${story.slug}.svg`;
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-accent-200 transition-all overflow-hidden"
    >
      <div className="bg-gray-50 border-b border-gray-100 h-48 flex items-center justify-center overflow-hidden px-4 py-2">
        <img
          src={coverSrc}
          alt=""
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="p-6">
        <p className="text-xs text-gray-400 mb-2">{formatDate(story.date)}</p>
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-accent transition-colors leading-snug mb-2">
          {story.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">{story.description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Read story
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
```

- [ ] Commit:
```bash
git add components/stories/StoryCard.tsx
git commit -m "feat: add StoryCard component"
```

---

## Task 7: Create pages/stories/index.tsx

**Files:**
- Create: `pages/stories/index.tsx`

- [ ] Create `pages/stories/index.tsx`:
```tsx
import type { InferGetStaticPropsType } from "next";
import Layout from "@/components/_shared/Layout";
import StoryCard from "@/components/stories/StoryCard";
import { getAllStories } from "@/lib/stories";

export async function getStaticProps() {
  const stories = getAllStories();
  return { props: { stories } };
}

export default function StoriesIndex({
  stories,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <div className="custom-container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Stories</h1>
          <p className="mt-2 text-gray-500">
            Data-driven narratives about UAE investment and trade.
          </p>
        </div>
        {stories.length === 0 ? (
          <p className="text-gray-400">No stories published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
```

- [ ] Verify: `content/stories/` directory must exist (created in Task 4). If not: `mkdir -p content/stories`

- [ ] Start dev server and visit `http://localhost:3000/stories` — expect a page with "No stories published yet."

- [ ] Commit:
```bash
git add pages/stories/index.tsx
git commit -m "feat: add stories index page"
```

---

## Task 8: Create Story 1 — "Beyond Oil"

**Files:**
- Create: `content/stories/beyond-oil.cover.ts`
- Create: `content/stories/beyond-oil.mdx`

The non-oil exports monthly CSV URL is: `https://blob.datopian.com/resources/5c2e1572-55bf-4d1d-8293-3ca16723469c/acg-p-apigw-001-uG9EKg.csv`

For the second chart (annual HS section exports), fetch the resource URL from CKAN:
```bash
curl -s "https://api.cloud.portaljs.com/@moi-demo/api/3/action/package_show?id=foreign-trade-total-nonoil-exports-by-hs-section-by-country-annual" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['url']) for r in d['result']['resources']]"
```

- [ ] Create `content/stories/beyond-oil.cover.ts` (replace `HS_SECTION_CSV_URL` with the URL from the command above):
```ts
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

export const hsSectionCsvUrl = "HS_SECTION_CSV_URL"; // replace with actual URL

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
```

- [ ] Create `content/stories/beyond-oil.mdx`:
```mdx
---
title: "Beyond Oil: How the UAE Built a New Trade Identity"
date: "2026-03-01"
description: "For decades, oil defined the Gulf. But look at the UAE's export data today and a different story emerges — one of deliberate reinvention, sector by sector."
relatedDatasets:
  - foreign-trade-nonoil-exports-by-country-monthly
  - foreign-trade-total-nonoil-exports-by-hs-section-by-country-annual
---

In 1971, the year the UAE was founded, oil accounted for nearly everything the young nation exported. It was the only story anyone needed to tell. The infrastructure, the ambitions, the skyline that would eventually follow — all of it ran on crude.

More than fifty years later, the data tells a different story.

## The Rise of Non-Oil Exports

Monthly non-oil export figures from the Federal Competitiveness and Statistics Centre show a clear and sustained upward trajectory since 2017. The growth is not linear — global disruptions leave their mark — but the direction is unmistakable.

<Chart
  title="UAE Monthly Non-Oil Exports (AED Billions)"
  csvUrl={coverCsvUrl}
  spec={coverSpec}
/>

The climb reflects deliberate policy. The UAE's Economic Vision 2030 explicitly targeted non-oil trade as a cornerstone of long-term resilience. Free zones, logistics corridors, bilateral trade agreements — each was a lever pulled in service of the same goal: to make the UAE an economy that could thrive without petroleum.

## What the UAE Actually Exports

The shift away from oil is not a retreat into services. The UAE has built a tangible manufacturing and re-export base. Look at non-oil exports broken down by Harmonized System section, and the depth of the transformation becomes clear.

<Chart
  title="Top Non-Oil Export Categories by HS Section (Cumulative AED Billions)"
  csvUrl={hsSectionCsvUrl}
  spec={hsSectionSpec}
/>

Machinery, base metals, chemicals, plastics — these are not the outputs of a nation simply passing goods through a port. They are the fingerprints of an industrial identity being constructed in real time.

## What the Numbers Don't Show

Statistics are good at measuring what exists. They are less good at measuring what was avoided.

The UAE's non-oil export growth happened against a backdrop of oil price volatility that devastated less diversified Gulf neighbours. When Brent crude collapsed below $30 in early 2016, the economic logic of diversification — long argued in policy documents — became viscerally apparent.

The data since then is, in part, a record of that lesson being applied.

## Looking Ahead

The trajectory is clear. The composition is diversifying. The partners are multiplying. Non-oil trade is no longer a hedge against oil — it is becoming a primary engine in its own right.

Whether the pace sustains depends on factors the data cannot yet capture: geopolitical shifts, regulatory evolution, the speed at which new free zones translate ambition into output.

But the numbers already argue that the UAE has done something rare in economic history: it has begun to outgrow the resource that built it.
```

- [ ] Commit:
```bash
git add content/stories/beyond-oil.cover.ts content/stories/beyond-oil.mdx
git commit -m "feat: add Beyond Oil story content"
```

---

## Task 9: Create Story 2 — "The World Comes to the UAE"

**Files:**
- Create: `content/stories/the-world-comes-to-uae.cover.ts`
- Create: `content/stories/the-world-comes-to-uae.mdx`

CSV URLs:
- Trade partners: `https://blob.datopian.com/resources/a735493f-05fe-42fb-93ac-1ea92c3df0cf/acg-p-apigw-001-qYs9wY.csv`
- Monthly imports: `https://blob.datopian.com/resources/f2db8c1b-4d2c-448a-9ad9-b894f7224e40/acg-p-apigw-001-M81ax7.csv`

- [ ] Create `content/stories/the-world-comes-to-uae.cover.ts`:
```ts
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
```

- [ ] Create `content/stories/the-world-comes-to-uae.mdx`:
```mdx
---
title: "The World Comes to the UAE"
date: "2026-03-15"
description: "From China to Germany, India to the United States — the UAE's trade relationships span every continent. Understanding who trades with the UAE reveals something deeper than commerce."
relatedDatasets:
  - trade-flow-value-per-country
  - foreign-trade-imports-by-country-monthly
---

Stand in the cargo terminal at Dubai's Jebel Ali port on any given morning and you will encounter a particular kind of organised chaos. Containers from three continents are being processed simultaneously. Ships from Asia pass ships bound for Africa. The port, the world's ninth busiest, is not simply a loading dock — it is a theory of geography made physical.

The trade data bears this out.

## A Map Drawn by Money

The UAE's top trade partners, measured by total bilateral flow, span every major economic bloc. China leads. India follows. Then Germany, the United States, Japan — an eclectic coalition of industrial powers and emerging markets, each with a different reason to be here.

<Chart
  title="UAE Top 10 Trade Partners by Total Flow (AED Billions)"
  csvUrl={coverCsvUrl}
  spec={coverSpec}
/>

The shape of this chart is not accidental. It is the result of sixty years of infrastructure investment, bilateral trade agreements, and the calculated positioning of free zones that now number in the hundreds.

## The Volume Behind the Names

Partner rankings tell one story. Monthly import volumes tell another.

<Chart
  title="UAE Total Monthly Imports (AED Billions)"
  csvUrl={importsCsvUrl}
  spec={importsSpec}
/>

The volume of goods flowing into the UAE has grown steadily, with periodic disruptions that map almost perfectly onto global events: the 2020 pandemic contraction, the 2021 supply chain rebound, the subsequent normalisation. The UAE absorbs global shocks and recovers quickly. This is not luck — it is the dividend of deep integration with multiple trading partners, no single one of which is large enough to destabilise the whole.

## Why the World Shows Up

There is a question beneath the trade data that the numbers can only partially answer: why here?

The geographic argument is compelling but insufficient. Dubai sits at the intersection of Europe, Asia, and Africa — but so do other cities that never became global trade hubs. Location creates possibility; it does not guarantee outcome.

The more honest answer is institutional. The UAE spent decades building the legal architecture, the tax environment, and the physical infrastructure that serious trading partners require. Free zones with their own regulatory regimes. Airlines connecting 100 countries. A port that invested in automation before automation was fashionable.

The trade data is a consequence of that institutional construction. Each partner on the chart is there because someone, at some point, decided that the conditions the UAE offered were better than the alternatives.

## The Long Game

The composition of trade partners will shift. China's weight will grow or contract depending on policy choices neither the UAE nor China fully controls. India's trajectory will be shaped by its own industrial ambitions.

But the underlying logic — that the UAE's location, infrastructure, and institutional design make it a uniquely useful node in global trade — is not disappearing. If anything, in a world increasingly anxious about supply chain resilience, the case for a well-positioned, politically stable entrepôt grows stronger.

The world keeps coming. The data shows it. The question is only what it comes for next.
```

- [ ] Commit:
```bash
git add content/stories/the-world-comes-to-uae.cover.ts content/stories/the-world-comes-to-uae.mdx
git commit -m "feat: add The World Comes to the UAE story content"
```

---

## Task 10: Create pages/stories/[slug].tsx

**Files:**
- Create: `pages/stories/[slug].tsx`

**Important note on scope:** `next-mdx-remote`'s `MDXRemote` accepts a `scope` prop that injects values into MDX at render time. Since this is a React prop (not JSON-serialized), it can contain functions. We import all cover modules statically at the top of the page and pick the right one by slug.

- [ ] Create `pages/stories/[slug].tsx`:
```tsx
import fs from "fs";
import path from "path";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/_shared/Layout";
import Chart from "@/components/stories/Chart";
import { getAllStories, getStorySource, type StoryMeta } from "@/lib/stories";
import Link from "next/link";

// Import all cover modules statically so functions are available at render time
// (functions cannot be serialized through getStaticProps JSON)
import * as beyondOilCovers from "../../content/stories/beyond-oil.cover";
import * as worldComesCovers from "../../content/stories/the-world-comes-to-uae.cover";

const COVER_MODULES: Record<string, Record<string, unknown>> = {
  "beyond-oil": beyondOilCovers as Record<string, unknown>,
  "the-world-comes-to-uae": worldComesCovers as Record<string, unknown>,
};

export const getStaticPaths: GetStaticPaths = async () => {
  const stories = getAllStories();
  return {
    paths: stories.map((s) => ({ params: { slug: s.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const { content, frontmatter } = getStorySource(slug);
  const mdxSource = await serialize(content);
  return {
    props: { mdxSource, frontmatter, slug },
  };
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function StoryPage({
  mdxSource,
  frontmatter,
  slug,
}: InferGetStaticPropsType<typeof getStaticProps> & {
  mdxSource: MDXRemoteSerializeResult;
  frontmatter: StoryMeta;
  slug: string;
}) {
  const scope = COVER_MODULES[slug] ?? {};

  return (
    <Layout>
      <div className="custom-container mx-auto py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <p className="text-sm text-gray-400 mb-3">{formatDate(frontmatter.date)}</p>
          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            {frontmatter.title}
          </h1>
          <p className="text-lg text-gray-500 mb-10 pb-10 border-b border-gray-100">
            {frontmatter.description}
          </p>

          {/* Story body */}
          <article className="prose prose-gray max-w-none prose-headings:font-black prose-a:text-accent">
            <MDXRemote
              {...mdxSource}
              components={{ Chart }}
              scope={scope}
            />
          </article>

          {/* Related datasets */}
          {frontmatter.relatedDatasets?.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Related Datasets</h2>
              <div className="flex flex-col gap-3">
                {frontmatter.relatedDatasets.map((slug) => (
                  <Link
                    key={slug}
                    href={`/@moi-demo/${slug}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-accent hover:bg-accent-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-accent">
                      {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-accent">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] Commit:
```bash
git add pages/stories/[slug].tsx
git commit -m "feat: add story page with MDXRemote rendering"
```

---

## Task 11: Create scripts/generate-covers.ts

**Files:**
- Create: `scripts/generate-covers.ts`
- Modify: `package.json` (add script)
- Create: `public/images/story-covers/` (directory)

- [ ] Create the output directory:
```bash
mkdir -p public/images/story-covers
```

- [ ] Create `scripts/generate-covers.ts`:
```ts
import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import * as Plot from "@observablehq/plot";
import { parseCsv } from "../lib/parseCsv";

interface CoverModule {
  coverCsvUrl: string;
  coverSpec: (Plot: typeof import("@observablehq/plot"), data: unknown[], document: Document) => SVGSVGElement | HTMLElement;
}

const COVERS_DIR = path.join(process.cwd(), "content/stories");
const OUTPUT_DIR = path.join(process.cwd(), "public/images/story-covers");

async function generateCover(slug: string, mod: CoverModule): Promise<void> {
  console.log(`Generating cover for: ${slug}`);

  const res = await fetch(mod.coverCsvUrl);
  const text = await res.text();
  const data = parseCsv(text);

  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const document = dom.window.document;

  const svgElement = mod.coverSpec(Plot as any, data, document as unknown as Document);

  const serializer = new dom.window.XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const outputPath = path.join(OUTPUT_DIR, `${slug}.svg`);
  fs.writeFileSync(outputPath, svgString, "utf8");
  console.log(`  ✓ Saved to ${outputPath}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Import all cover modules
  const covers: Record<string, CoverModule> = {
    "beyond-oil": await import("../content/stories/beyond-oil.cover"),
    "the-world-comes-to-uae": await import("../content/stories/the-world-comes-to-uae.cover"),
  };

  for (const [slug, mod] of Object.entries(covers)) {
    await generateCover(slug, mod);
  }

  console.log("\nAll covers generated.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] Add `generate-covers` script to `package.json`. In the `"scripts"` section, add:
```json
"generate-covers": "tsx scripts/generate-covers.ts"
```

- [ ] Run the script:
```bash
npm run generate-covers
```
Expected output:
```
Generating cover for: beyond-oil
  ✓ Saved to .../public/images/story-covers/beyond-oil.svg
Generating cover for: the-world-comes-to-uae
  ✓ Saved to .../public/images/story-covers/the-world-comes-to-uae.svg

All covers generated.
```

- [ ] If the script fails with Observable Plot errors, check that the `document` param is being passed correctly. Verify the SVG files are non-empty:
```bash
wc -c public/images/story-covers/*.svg
```
Expected: both files > 1000 bytes.

- [ ] Commit:
```bash
git add scripts/generate-covers.ts package.json public/images/story-covers/
git commit -m "feat: add cover generation script and generated SVGs"
```

---

## Task 12: End-to-end verification

- [ ] Start the dev server:
```bash
npm run dev
```

- [ ] Visit `http://localhost:3000/stories` — expect 2 story cards with cover images, titles, dates, descriptions.

- [ ] Click "Beyond Oil" story — expect:
  - Title renders correctly
  - Prose paragraphs display with typography styles
  - Both charts load and render (may take a moment to fetch CSV data)
  - "Related Datasets" section at the bottom with 2 linked cards

- [ ] Click "The World Comes to the UAE" story — expect same structure with its charts.

- [ ] Click a related dataset link — expect navigation to `/@moi-demo/[dataset-slug]` dataset page.

- [ ] Verify the "Stories" link in the header navigates to `/stories`.

- [ ] Final commit:
```bash
git add -A
git commit -m "feat: complete data stories feature"
```
