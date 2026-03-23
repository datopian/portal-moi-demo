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
