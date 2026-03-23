import Link from "next/link";
import Image from "next/image";
import { Group } from "@portaljs/ckan";

export default function TopicsCarousel({ groups }: { groups: Group[] }) {
  if (!groups.length) return null;

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="custom-container mx-auto py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/search?groups=${group.name}`}
              className="flex items-center gap-2.5 shrink-0 px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-accent hover:bg-accent-50 hover:text-accent text-gray-600 text-sm font-medium transition-colors"
            >
              {group.image_display_url && (
                <Image
                  src={group.image_display_url}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-sm object-contain"
                />
              )}
              {group.display_name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
