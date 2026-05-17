import { SearchResultsHeader } from "@/components/search/search-results-header";
import { GlassSurface } from "@/components/feed/glass-surface";
import { SaveRecentSearchQuery } from "@/components/search/save-recent-search-query";
import { SearchResultsFeed } from "@/components/search/search-results-feed";
import { CURRENT_USER } from "@/lib/current-user";
import {
  DEFAULT_TWEAKS,
  POSTS,
  type Tweaks,
} from "@/lib/mock-data";
import {
  filterPostsBySearchQuery,
  getSingleSearchParam,
  normalizeSearchQuery,
} from "@/lib/search";
import { getFollowedUsers } from "@/lib/server/follow-store";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

type SearchResultsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchResultsPage({
  searchParams,
}: SearchResultsPageProps) {
  const params = await searchParams;
  const query = getSingleSearchParam(params.q);
  const normalizedQuery = normalizeSearchQuery(query);
  const matchingPosts = filterPostsBySearchQuery(POSTS, query);
  const followingUsers = await getFollowedUsers(CURRENT_USER.handle);

  return (
    <main className="absolute inset-0 overflow-hidden">
      <SaveRecentSearchQuery query={query} />
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <SearchResultsHeader key={query.trim()} initialQuery={query.trim()} />

        <section
          aria-label="Результаты поиска"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {matchingPosts.length > 0 ? (
            <SearchResultsFeed
              brand={TWEAKS.brand}
              currentUser={CURRENT_USER.handle}
              density={TWEAKS.density}
              initialFollowingUsers={followingUsers}
              posts={matchingPosts}
            />
          ) : (
            <div className="flex h-full snap-start snap-always flex-col px-3.5 pt-2 pb-[5.75rem] [scroll-snap-stop:always] [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pb-[5rem]">
              <GlassSurface className="mt-2 flex flex-1 items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
                <div className="max-w-[260px] px-6 text-center">
                  <p className="text-[20px] leading-tight font-extrabold tracking-[-0.35px] text-[#15291C]">
                    Ничего не нашли
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-roboto)] text-[14.5px] leading-[1.45] font-medium text-[#5C6B62]">
                    {normalizedQuery
                      ? `По запросу «${query.trim()}» пока нет постов.`
                      : "Введите запрос, чтобы собрать ленту результатов."}
                  </p>
                </div>
              </GlassSurface>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
