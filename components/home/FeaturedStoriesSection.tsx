import Link from "next/link";
import StoryCard from "@/components/stories/StoryCard";
import type { StoryMeta } from "@/lib/stories";

export default function FeaturedStoriesSection({ stories }: { stories: StoryMeta[] }) {
  if (!stories.length) return null;

  return (
    <section className="py-12 border-t border-gray-100">
      <div className="custom-container mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Featured Data Stories</h2>
            <p className="mt-1 text-sm text-gray-500">
              Data-driven narratives about UAE investment and trade.
            </p>
          </div>
          <Link
            href="/stories"
            className="text-sm font-semibold text-accent hover:underline shrink-0"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
