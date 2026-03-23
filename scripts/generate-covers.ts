import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import * as Plot from "@observablehq/plot";
import { parseCsv } from "../lib/parseCsv";

interface CoverModule {
  coverCsvUrl: string;
  coverSpec: (Plot: typeof import("@observablehq/plot"), data: unknown[], document: Document) => SVGSVGElement | HTMLElement;
}

const OUTPUT_DIR = path.join(process.cwd(), "public/images/story-covers");

async function generateCover(slug: string, mod: CoverModule): Promise<void> {
  console.log(`Generating cover for: ${slug}`);

  const res = await fetch(mod.coverCsvUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${mod.coverCsvUrl}: ${res.status} ${res.statusText}`);
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
