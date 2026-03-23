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
