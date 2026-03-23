# Data Stories — Design Spec

**Date:** 2026-03-23
**Project:** UAE Ministry of Investment Data Portal (portal-moi-demo)

---

## Overview

A data stories feature that lets authors write narrative-driven editorial pieces in MDX, embedding Observable Plot charts inline. Stories are indexed on a `/stories` page and link back to the underlying CKAN datasets.

---

## File Structure

```
content/
  stories/
    beyond-oil.mdx                  ← story prose + frontmatter
    beyond-oil.cover.ts             ← cover chart spec + csvUrl
    the-world-comes-to-uae.mdx
    the-world-comes-to-uae.cover.ts

lib/
  stories.ts                        ← reads all MDX files, extracts frontmatter
  parseCsv.ts                       ← moved from pages/index.tsx (parseRow + parseCsv)

scripts/
  generate-covers.ts                ← renders cover SVGs via Node.js

components/stories/
  Chart.tsx                         ← MDX-embedded chart component (client-side)
  StoryCard.tsx                     ← card used on the index page

pages/stories/
  index.tsx                         ← story listing (getStaticProps)
  [slug].tsx                        ← individual story (getStaticProps + getStaticPaths)

public/images/story-covers/
  beyond-oil.svg                    ← committed to repo; regenerated on demand
  the-world-comes-to-uae.svg

types/
  chartData.ts                      ← PlotModule type exported from here (new export)
```

---

## Frontmatter Schema

```yaml
---
title: "Beyond Oil: How the UAE Built a New Trade Identity"
date: "2026-03-23"
description: "A narrative about the deliberate policy shift away from oil dependency, told through the rise of non-oil exports decade over decade."
relatedDatasets:
  - foreign-trade-nonoil-exports-by-country-monthly
  - foreign-trade-total-nonoil-exports-by-hs-section-by-country-annual
---
```

Fields:
- `title` — display title of the story
- `date` — publication date (YYYY-MM-DD)
- `description` — 1–2 sentence summary, shown on index cards
- `relatedDatasets` — array of CKAN dataset slugs; rendered as linked cards at the bottom of the story page. Enables multi-dataset stories.

No `coverImage` field — the cover SVG is committed to the repo and regenerated on demand via `npm run generate-covers`.

---

## Chart Component

Charts are embedded in MDX as self-contained components that fetch their own data client-side.

**Usage in MDX** — `coverSpec` and `coverCsvUrl` are injected into the MDX scope by the story page's `getStaticProps` via the `scope` prop on `<MDXRemote>`. No `import` statements are used inside MDX (not supported by `next-mdx-remote`):

```mdx
<Chart
  title="UAE Non-Oil Exports (AED Billions)"
  csvUrl={coverCsvUrl}
  spec={coverSpec}
/>
```

Additional charts in the same story reference their own specs, also passed via `scope`:

```mdx
<Chart
  title="Non-Oil Exports by HS Section"
  csvUrl={hsSectionCsvUrl}
  spec={hsSectionSpec}
/>
```

**`Chart` component props:**
```ts
interface ChartProps {
  title: string;
  csvUrl: string;
  spec: (Plot: PlotModule, data: unknown[], document?: Document) => SVGSVGElement | HTMLElement;
}
```

The component fetches the CSV, parses it using `lib/parseCsv.ts`, then calls `import("@observablehq/plot")` dynamically and calls `spec(Plot, data)` — without a `document` argument, since the browser provides `globalThis.document`. It appends the returned SVG element to a `useRef` container div. A loading skeleton is shown while fetching. The `document` parameter in the spec signature is only used server-side by the cover generation script — it is never passed by the browser `Chart` component.

---

## Companion Cover File

Each story has a `.cover.ts` file that exports all chart specs and data URLs for that story. This file is imported by:
1. The story page's `getStaticProps` (to inject values into `MDXRemote` `scope`)
2. The `generate-covers.ts` script (for server-side SVG generation)

```ts
// content/stories/beyond-oil.cover.ts
import type { PlotModule } from "@/types/chartData";

export const coverCsvUrl =
  "https://blob.datopian.com/resources/.../exports.csv";

export const coverSpec = (Plot: PlotModule, data: unknown[], document?: Document) => {
  const d = data as { period: string; value: number }[];
  return Plot.plot({
    document,          // threaded from jsdom when called server-side
    height: 320,
    marks: [
      Plot.areaY(d, { x: (r) => new Date(r.period + "-01"), y: (r) => r.value / 1e9, fill: "#92722a", fillOpacity: 0.15 }),
      Plot.lineY(d, { x: (r) => new Date(r.period + "-01"), y: (r) => r.value / 1e9, stroke: "#92722a", strokeWidth: 2 }),
    ],
    x: { label: "" },
    y: { label: "AED (B)", grid: true },
  });
};
```

The `document` parameter is optional — when `undefined` (browser), Observable Plot uses the global `document`. When provided (server-side), it uses the jsdom document instance. This is the correct mechanism: Observable Plot reads `document` from the `options` object passed to `Plot.plot()`, not from `globalThis`.

Additional charts in a story are also exported from this file:
```ts
export const hsSectionCsvUrl = "https://...";
export const hsSectionSpec = (Plot, data, document?) => Plot.plot({ document, ... });
```

---

## `getStaticProps` for Story Page

```ts
// pages/stories/[slug].tsx
import * as coverModule from "@/content/stories/[slug].cover";

export const getStaticProps = async ({ params }) => {
  const slug = params.slug as string;
  const source = fs.readFileSync(`content/stories/${slug}.mdx`, "utf8");
  const { content, data: frontmatter } = matter(source);
  const mdxSource = await serialize(content);

  // Dynamically import the companion cover file
  const coverModule = await import(`../../content/stories/${slug}.cover`);

  return {
    props: {
      mdxSource,
      frontmatter,
      scope: coverModule,   // all exports (coverSpec, coverCsvUrl, etc.) passed to MDXRemote scope
    },
  };
};
```

In the page component:
```tsx
<MDXRemote {...mdxSource} components={{ Chart }} scope={scope} />
```

---

## Cover Generation Script

**`scripts/generate-covers.ts`** — run via `npm run generate-covers`.

Steps per story:
1. Discover all `content/stories/*.cover.ts` files
2. Import each file to get `coverSpec` and `coverCsvUrl`
3. Fetch the CSV and parse it with `lib/parseCsv.ts`
4. Create a jsdom `Document` instance
5. Call `coverSpec(Plot, data, dom.window.document)` — the `document` argument is passed explicitly into `Plot.plot({ document, ... })` as per Observable Plot's API
6. Serialize the resulting SVG element to string via `dom.window.XMLSerializer`
7. Write to `public/images/story-covers/[slug].svg`

**Cover SVG strategy:** Generated SVGs are committed to the repository. `npm run generate-covers` is run manually when a story is added or a cover spec changes — not wired into `next build`. This avoids broken builds in network-restricted CI environments where the blob CSV URLs may be unavailable.

---

## `lib/parseCsv.ts` (refactor)

`parseRow` and `parseCsv` are moved from `pages/index.tsx` to `lib/parseCsv.ts` and exported. Both `pages/index.tsx` and `components/stories/Chart.tsx` import from this shared location.

---

## `types/chartData.ts` (addition)

`PlotModule` is exported from `types/chartData.ts`:

```ts
export type PlotModule = typeof import("@observablehq/plot") & { width?: number; document?: Document };
```

Previously defined as a local type alias inside `components/home/visualizationsCarousel/index.tsx` — that local definition is removed and replaced with an import from `types/chartData.ts`. This resolves the duplication and makes the type available to `.cover.ts` files.

---

## New Dependencies

| Package | Purpose |
|---|---|
| `next-mdx-remote` | MDX compilation and rendering |
| `gray-matter` | Frontmatter parsing for the index page |
| `jsdom` | DOM shim for server-side Observable Plot in cover generation |
| `@types/jsdom` | TypeScript types for jsdom (devDependency) |

---

## Pages

### `/stories` — Index Page

- `getStaticProps`: reads all `.mdx` files from `content/stories/`, parses frontmatter with `gray-matter`, returns sorted array (newest first)
- Renders a 2-column grid of `StoryCard` components

**`StoryCard` shows:**
- Cover image (`/images/story-covers/[slug].svg`)
- Title
- Date (formatted as "March 2026")
- Description
- "Read story →" link to `/stories/[slug]`

### `/stories/[slug]` — Individual Story Page

- `getStaticPaths`: returns all story slugs derived from `content/stories/*.mdx` filenames
- `getStaticProps`: reads MDX with `gray-matter`, compiles with `next-mdx-remote`'s `serialize`, dynamically imports the companion `.cover.ts`, passes compiled source + frontmatter + cover module exports as `scope`
- Renders `<MDXRemote>` with `Chart` component injected and `scope` containing all cover exports
- Below content: "Related Datasets" section — linked cards pointing to `/@moi-demo/[dataset-slug]` for each slug in `relatedDatasets`

---

## The Two Stories

### Story 1: "Beyond Oil: How the UAE Built a New Trade Identity"
A narrative tracing the UAE's deliberate economic diversification away from hydrocarbons. Charts show the steady rise of non-oil exports over time, broken down by HS section. The tone is editorial — the data appears mid-narrative as evidence.

**Related datasets:**
- `foreign-trade-nonoil-exports-by-country-monthly`
- `foreign-trade-total-nonoil-exports-by-hs-section-by-country-annual`

### Story 2: "The World Comes to the UAE"
A narrative about the UAE's emergence as a global trade hub — framing top trade partner data as a story of geopolitical relationships, logistics ambition, and economic magnetism.

**Related datasets:**
- `trade-flow-value-per-country`
- `foreign-trade-imports-by-country-monthly`

---

## Styling

Stories follow the existing site design system:
- `custom-container` width constraint
- Gold accent (`#92722a`) for chart colours
- Inter font
- Prose styled with `@tailwindcss/typography` (already installed)

---

## What Is Not In Scope

- Comments or social sharing on stories
- Author profiles
- Story categories or tags
- Search within stories
- CMS integration — stories are file-based only
