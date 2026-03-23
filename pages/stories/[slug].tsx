import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/_shared/Layout";
import Chart from "@/components/stories/Chart";
import { getAllStories, getStorySource, type StoryMeta } from "@/lib/stories";
import Link from "next/link";

import * as beyondOilCovers from "../../content/stories/beyond-oil.cover";
import * as worldComesCovers from "../../content/stories/the-world-comes-to-uae.cover";

// MDX v3 strips JSX props that reference undeclared variables at compile time,
// so scope injection does not work. Instead, we pass story-specific chart
// components via the `components` prop, which MDX properly supports.
const STORY_COMPONENTS: Record<string, Record<string, React.FC<{ title?: string }>>> = {
  "beyond-oil": {
    CoverChart: ({ title = "" }) => (
      <Chart title={title} csvUrl={beyondOilCovers.coverCsvUrl} spec={beyondOilCovers.coverSpec} />
    ),
    HsSectionChart: ({ title = "" }) => (
      <Chart title={title} csvUrl={beyondOilCovers.hsSectionCsvUrl} spec={beyondOilCovers.hsSectionSpec} />
    ),
  },
  "the-world-comes-to-uae": {
    CoverChart: ({ title = "" }) => (
      <Chart title={title} csvUrl={worldComesCovers.coverCsvUrl} spec={worldComesCovers.coverSpec} />
    ),
    ImportsChart: ({ title = "" }) => (
      <Chart title={title} csvUrl={worldComesCovers.importsCsvUrl} spec={worldComesCovers.importsSpec} />
    ),
  },
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
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
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
  const storyComponents = STORY_COMPONENTS[slug] ?? {};

  return (
    <Layout>
      <div className="custom-container mx-auto py-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-400 mb-3">{formatDate(frontmatter.date)}</p>
          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            {frontmatter.title}
          </h1>
          <p className="text-lg text-gray-500 mb-10 pb-10 border-b border-gray-100">
            {frontmatter.description}
          </p>

          <article className="prose prose-gray max-w-none prose-headings:font-black prose-a:text-accent">
            <MDXRemote {...mdxSource} components={storyComponents} />
          </article>

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
