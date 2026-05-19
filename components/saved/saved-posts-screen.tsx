"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DishPhoto } from "@/components/feed/dish-photo";
import { FullScreenPost } from "@/components/feed/full-screen-post";
import { GlassSurface } from "@/components/feed/glass-surface";
import { PostTagButton } from "@/components/feed/post-card/post-tags";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSearchSubmit } from "@/components/search/use-search-submit";
import {
  getFavoritePosts,
  getNextPostIdMembership,
  requestFollowMutation,
  requestLikeMutation,
  togglePostBookmark,
  type FavoritePostsResponse,
} from "@/lib/feed-api";
import type { Density, Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SavedPostsScreenProps = {
  brand: string;
  density: Density;
};

type LoadState = "loading" | "ready" | "error";

type SavedState = {
  currentUser: string | null;
  followingUsers: string[];
  likedPostIds: number[];
  posts: Post[];
  recentFavoriteTags: string[];
  savedPostIds: number[];
  savedPostsCount: number;
};

const EMPTY_SAVED_STATE: SavedState = {
  currentUser: null,
  followingUsers: [],
  likedPostIds: [],
  posts: [],
  recentFavoriteTags: [],
  savedPostIds: [],
  savedPostsCount: 0,
};
const SAVED_LOADING_OVERLAY_ENABLED = false;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function pluralizePosts(count: number) {
  const absCount = Math.abs(count);
  const lastTwoDigits = absCount % 100;
  const lastDigit = absCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "постов";
  }

  if (lastDigit === 1) {
    return "пост";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "поста";
  }

  return "постов";
}

function getRecentSecondaryTags(posts: Post[], limit = 20) {
  const tags: string[] = [];
  const seenTags = new Set<string>();

  for (const post of posts) {
    for (const tag of post.tags.slice(1)) {
      if (seenTags.has(tag)) {
        continue;
      }

      seenTags.add(tag);
      tags.push(tag);

      if (tags.length >= limit) {
        return tags;
      }
    }
  }

  return tags;
}

function applyFavoriteResponse(response: FavoritePostsResponse): SavedState {
  return {
    currentUser: response.currentUser,
    followingUsers: response.followingUsers,
    likedPostIds: response.likedPostIds,
    posts: response.posts,
    recentFavoriteTags: response.recentFavoriteTags,
    savedPostIds: response.savedPostIds,
    savedPostsCount: response.savedPostsCount,
  };
}

function SavedHeader({ count }: { count: number }) {
  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2 pb-0 max-[409px]:px-3">
      <div className="flex h-13 items-center px-1">
        <p className="min-w-0 text-[19px] leading-tight font-extrabold tracking-[0px] text-[#15291C] max-[409px]:text-[13.5px]">
          Вы добавили в избранное {count} {pluralizePosts(count)}
        </p>
      </div>
    </header>
  );
}

function FavoriteTagsCarousel({
  brand,
  tags,
}: {
  brand: string;
  tags: string[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const submitSearchQuery = useSearchSubmit();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="pt-1">
      <div
        aria-label="Последние тэги из избранного"
        className="hide-scroll flex gap-1.5 overflow-x-auto overflow-y-hidden px-3.5 pb-1 max-[409px]:px-3"
      >
        {tags.map((tag) => (
          <PostTagButton
            key={tag}
            brand={brand}
            onClick={() => submitSearchQuery(tag)}
            shouldReduceMotion={shouldReduceMotion}
          >
            {tag}
          </PostTagButton>
        ))}
      </div>
    </div>
  );
}

function SavedStatus({
  action,
  body,
  title,
}: {
  action?: React.ReactNode;
  body: string;
  title: string;
}) {
  return (
    <div className="px-3.5 pt-3 pb-28 max-[409px]:px-3">
      <GlassSurface className="flex min-h-[360px] items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
        <div className="max-w-[272px] px-6 text-center">
          <p className="text-[20px] leading-tight font-extrabold tracking-[-0.35px] text-[#15291C]">
            {title}
          </p>
          <p className="mt-2 font-[family-name:var(--font-roboto)] text-[14.5px] leading-[1.45] font-medium text-[#5C6B62]">
            {body}
          </p>
          {action && <div className="mt-4 flex justify-center">{action}</div>}
        </div>
      </GlassSurface>
    </div>
  );
}

function SavedLoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-13 bottom-24 z-20 grid place-items-center px-3.5">
      <GlassSurface
        aria-live="polite"
        role="status"
        className="pointer-events-auto w-full max-w-[260px] rounded-[20px] border border-white/68 bg-white/22 shadow-[0_14px_34px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.72)]"
        contentClassName="flex items-center justify-center gap-2.5 px-4 py-3"
        tintClassName="before:bg-white/28 before:backdrop-blur-[20px] before:backdrop-saturate-[180%]"
      >
        <Spinner className="size-5 shrink-0 text-[#1B7F45]" />
        <span className="whitespace-nowrap text-[14px] font-extrabold tracking-[0px] text-[#15291C]">
          Загрузка...
        </span>
      </GlassSurface>
    </div>
  );
}

function SavedPostGridCard({
  onClick,
  post,
  shouldReduceMotion,
}: {
  onClick: () => void;
  post: Post;
  shouldReduceMotion: boolean | null;
}) {
  const hasPhoto = post.photos > 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "group min-w-0 cursor-pointer rounded-[24px] text-left outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
      )}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.97 } : undefined}
    >
      <AspectRatio
        ratio={0.94}
        className="relative overflow-hidden rounded-[24px] bg-white/42 shadow-[0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.78)]"
      >
        {hasPhoto ? (
          <DishPhoto
            seed={post.seed}
            height="100%"
            label=""
            src={post.photoUrls?.[0]}
          />
        ) : (
          <div className="grid h-full place-items-center bg-[rgba(46,204,113,0.12)]">
            <Bookmark className="size-7 text-[#1B7F45]/55" strokeWidth={2.2} />
          </div>
        )}
        <div className="absolute inset-x-2 bottom-2 rounded-[12px] bg-black/15 px-2.5 py-2 text-white shadow-[0_4px_14px_rgba(0,0,0,0.16)] backdrop-blur-[10px]">
          <p className="line-clamp-2 text-[12px] leading-[1.08] font-extrabold tracking-[0px]">
            {post.dish}
          </p>
          <p className="mt-1 line-clamp-2 font-[family-name:var(--font-roboto)] text-[10.5px] leading-[1.12] font-medium text-white/82">
            {post.place}
          </p>
        </div>
      </AspectRatio>
    </motion.button>
  );
}

export function SavedPostsScreen({ brand, density }: SavedPostsScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [savedState, setSavedState] =
    useState<SavedState>(EMPTY_SAVED_STATE);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [pendingAuthors, setPendingAuthors] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const [pendingSavePostIds, setPendingSavePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const [notice, setNotice] = useState<string | null>(null);
  const followingUsersSet = useMemo(
    () => new Set(savedState.followingUsers),
    [savedState.followingUsers]
  );
  const likedPostIdsSet = useMemo(
    () => new Set(savedState.likedPostIds),
    [savedState.likedPostIds]
  );
  const savedPostIdsSet = useMemo(
    () => new Set(savedState.savedPostIds),
    [savedState.savedPostIds]
  );

  const syncFavorites = useCallback(async () => {
    const response = await getFavoritePosts(20);

    setSavedState(applyFavoriteResponse(response));
  }, []);

  const loadFavorites = useCallback(async () => {
    setLoadState("loading");
    setNotice(null);

    try {
      await syncFavorites();
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setNotice("Не удалось загрузить избранное. Проверьте соединение.");
    }
  }, [syncFavorites]);

  useEffect(() => {
    let isActive = true;

    void getFavoritePosts(20)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setSavedState(applyFavoriteResponse(response));
        setLoadState("ready");
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLoadState("error");
        setNotice("Не удалось загрузить избранное. Проверьте соединение.");
      });

    return () => {
      isActive = false;
    };
  }, []);

  const toggleFollow = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!savedState.currentUser || pendingAuthors.has(author)) {
        return;
      }

      setNotice(null);
      setPendingAuthors((currentAuthors) => {
        const nextAuthors = new Set(currentAuthors);
        nextAuthors.add(author);

        return nextAuthors;
      });

      try {
        const result = await requestFollowMutation(author, nextFollowing);

        setSavedState((currentState) => ({
          ...currentState,
          followingUsers: result.followingUsers,
        }));
      } catch {
        setNotice("Не удалось обновить подписку. Попробуйте ещё раз.");
      } finally {
        setPendingAuthors((currentAuthors) => {
          const nextAuthors = new Set(currentAuthors);
          nextAuthors.delete(author);

          return nextAuthors;
        });
      }
    },
    [pendingAuthors, savedState.currentUser]
  );

  const toggleLike = useCallback(
    async (postId: number, nextLiked: boolean) => {
      if (!savedState.currentUser || pendingLikePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingLikePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });

      setSavedState((currentState) => ({
        ...currentState,
        likedPostIds: getNextPostIdMembership(
          currentState.likedPostIds,
          postId,
          nextLiked
        ),
      }));

      try {
        const result = await requestLikeMutation(postId, nextLiked);

        setSavedState((currentState) => ({
          ...currentState,
          likedPostIds: result.likedPostIds,
        }));
      } catch {
        setSavedState((currentState) => ({
          ...currentState,
          likedPostIds: getNextPostIdMembership(
            currentState.likedPostIds,
            postId,
            !nextLiked
          ),
        }));
        setNotice("Не удалось обновить лайк. Попробуйте ещё раз.");
      } finally {
        setPendingLikePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [pendingLikePostIds, savedState.currentUser]
  );

  const toggleSave = useCallback(
    async (postId: number, nextSaved: boolean) => {
      if (!savedState.currentUser || pendingSavePostIds.has(postId)) {
        return;
      }

      const previousState = savedState;
      const targetPost =
        savedState.posts.find((post) => post.id === postId) ??
        (activePost?.id === postId ? activePost : null);

      setNotice(null);
      setPendingSavePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });

      setSavedState((currentState) => {
        const nextSavedPostIds = getNextPostIdMembership(
          currentState.savedPostIds,
          postId,
          nextSaved
        );
        const nextPosts = nextSaved
          ? targetPost && !currentState.posts.some((post) => post.id === postId)
            ? [targetPost, ...currentState.posts]
            : currentState.posts
          : currentState.posts.filter((post) => post.id !== postId);

        return {
          ...currentState,
          posts: nextPosts,
          recentFavoriteTags: getRecentSecondaryTags(nextPosts, 20),
          savedPostIds: nextSavedPostIds,
          savedPostsCount: nextSavedPostIds.length,
        };
      });

      try {
        const result = await togglePostBookmark(postId, nextSaved);

        setSavedState((currentState) => ({
          ...currentState,
          savedPostIds: result.savedPostIds,
          savedPostsCount: result.savedPostsCount,
        }));
        void syncFavorites().catch(() => undefined);
      } catch {
        setSavedState(previousState);
        setNotice("Не удалось обновить избранное. Изменение отменено.");
      } finally {
        setPendingSavePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [
      activePost,
      pendingSavePostIds,
      savedState,
      syncFavorites,
    ]
  );

  const retryButton = (
    <Button
      type="button"
      size="sm"
      onClick={loadFavorites}
      className="h-8 rounded-full bg-white/62 px-4 text-[12px] font-extrabold text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75)] hover:bg-white/78"
    >
      <RefreshCw className="size-3.5" />
      Повторить
    </Button>
  );

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <SavedHeader count={savedState.savedPostsCount} />
        <FavoriteTagsCarousel
          brand={brand}
          tags={savedState.recentFavoriteTags}
        />

        <section
          aria-label="Сохранённые посты"
          className="hide-scroll min-h-0 flex-1 overflow-y-auto pb-28"
        >
          {loadState === "loading" ? (
            null
          ) : loadState === "error" ? (
            <SavedStatus
              title="Избранное не загрузилось"
              body="Можно попробовать ещё раз — локальные сохранения не потеряются."
              action={retryButton}
            />
          ) : savedState.posts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-4 px-3.5 pt-3 pb-2 max-[409px]:gap-x-3 max-[409px]:px-3">
              {savedState.posts.map((post) => (
                <SavedPostGridCard
                  key={post.id}
                  post={post}
                  shouldReduceMotion={shouldReduceMotion}
                  onClick={() => setActivePost(post)}
                />
              ))}
            </div>
          ) : (
            <SavedStatus
              title="Вы пока ничего не добавили в избранное"
              body="Сохраняйте посты и они появятся здесь."
            />
          )}
        </section>

        {SAVED_LOADING_OVERLAY_ENABLED && loadState === "loading" ? (
          <SavedLoadingOverlay />
        ) : null}

        {notice && (
          <div className="pointer-events-none absolute right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <p role="status">{notice}</p>
          </div>
        )}

        <AnimatePresence>
          {activePost && (
            <FullScreenPost
              key={activePost.id}
              post={activePost}
              brand={brand}
              currentUser={savedState.currentUser}
              density={density}
              isAuthorFollowed={followingUsersSet.has(activePost.user)}
              isFollowPending={pendingAuthors.has(activePost.user)}
              isLiked={likedPostIdsSet.has(activePost.id)}
              isLikePending={pendingLikePostIds.has(activePost.id)}
              isSaved={savedPostIdsSet.has(activePost.id)}
              isSavePending={pendingSavePostIds.has(activePost.id)}
              onClose={() => setActivePost(null)}
              onFollowToggle={toggleFollow}
              onLikeToggle={toggleLike}
              onSaveToggle={toggleSave}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
