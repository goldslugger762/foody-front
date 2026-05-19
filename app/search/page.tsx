import { SearchHistory } from "@/components/search/search-history";
import { DEFAULT_TWEAKS, POPULAR_TAGS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function SearchPage() {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <div className="hide-scroll flex-1 overflow-y-auto pb-25">
          <SearchHistory brand={TWEAKS.brand} popularTags={POPULAR_TAGS} />
        </div>
      </div>
    </main>
  );
}
