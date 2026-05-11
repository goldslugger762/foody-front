import { CategoryPicker } from "@/components/search/category-picker";
import { PopularTags } from "@/components/search/popular-tags";
import { RecentSearches } from "@/components/search/recent-searches";
import { SearchHeader } from "@/components/search/search-header";
import {
  DEFAULT_TWEAKS,
  POPULAR_TAGS,
  RECENT_SEARCHES,
  type Tweaks,
} from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function SearchPage() {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <div className="hide-scroll flex-1 overflow-y-auto pb-25">
          <SearchHeader brand={TWEAKS.brand} />
          <CategoryPicker brand={TWEAKS.brand} />
          <RecentSearches initial={RECENT_SEARCHES} />
          <PopularTags tags={POPULAR_TAGS} brand={TWEAKS.brand} />
        </div>
      </div>
    </main>
  );
}
