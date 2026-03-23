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
