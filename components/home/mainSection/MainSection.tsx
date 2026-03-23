import { Group } from "@portaljs/ckan";
import GroupCard from "../../groups/GroupCard";
import Link from "next/link";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";

export default function MainSection({ groups }: { groups: Array<Group> }) {
  return (
    <section className="py-10">
      <div className="custom-container mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Browse by Topic</h2>
            <p className="mt-1 text-sm text-gray-500">Explore datasets organised by sector and theme.</p>
          </div>
          <Link
            href="/topics"
            className="text-sm font-semibold text-accent hover:text-accent-600 flex items-center gap-1 transition-colors shrink-0"
          >
            View all topics
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {groups.map((group) => (
            <article key={group.id} className="shrink-0 w-[220px] lg:flex-1">
              <GroupCard
                description={group.description}
                display_name={group.display_name}
                image_display_url={group.image_display_url}
                name={group.name}
                package_count={group.package_count}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
