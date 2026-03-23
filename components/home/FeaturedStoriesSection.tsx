import Link from "next/link";
import StoryCard from "@/components/stories/StoryCard";
import type { StoryMeta } from "@/lib/stories";

export default function FeaturedStoriesSection({ stories }: { stories: StoryMeta[] }) {
  if (!stories.length) return null;

  return (
    <section className="py-12 border-t border-gray-100">
      <div className="custom-container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">Featured Data Stories</h2>
          <Link
            href="/stories"
            className="text-sm font-semibold text-accent hover:text-accent-600 flex items-center gap-1 transition-colors"
          >
            View all stories
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
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
