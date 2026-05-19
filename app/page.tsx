"use client";

import {
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

import { FeedHeader, type FeedTab } from "@/components/feed/feed-header";
import { GlassSurface } from "@/components/feed/glass-surface";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AUTH_REDIRECT_HREF,
  getCurrentUser,
  subscribeToAuthState,
} from "@/lib/auth-api";
import {
  getNextPostIdMembership,
  requestFeed,
  requestBookmarkMutation,
  requestFollowMutation,
  requestLikeMutation,
  type FeedResponse,
} from "@/lib/feed-api";
import { DEFAULT_TWEAKS, type Post, type Tweaks } from "@/lib/mock-data";
import { REVIEW_POSTS_CHANGED_EVENT } from "@/lib/review-api";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;
const FEED_LOADING_OVERLAY_ENABLED = false;
const FEED_LOADING_OVERLAY_STORAGE_KEY = "foody:feed-loading-overlay";
const FEED_LOADING_OVERLAY_CHANGE_EVENT = "foody:feed-loading-overlay-change";

type FeedLoadState = "loading" | "ready" | "error";

function FeedStatusCard({
  action,
  body,
  title,
}: {
  action?: ReactNode;
  body: string;
  title: string;
}) {
  return (
    <div className="flex h-full snap-start snap-always flex-col px-3.5 pt-2 pb-[5.75rem] [scroll-snap-stop:always] [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pb-[5rem]">
      <GlassSurface className="flex flex-1 items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
        <div className="max-w-[282px] px-6 text-center">
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

function getLoadingOverlayEnabledSnapshot() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(FEED_LOADING_OVERLAY_STORAGE_KEY) !== "off";
}

function subscribeToLoadingOverlayPreference(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(FEED_LOADING_OVERLAY_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(FEED_LOADING_OVERLAY_CHANGE_EVENT, listener);
  };
}

function useLoadingOverlayEnabled() {
  return useSyncExternalStore(
    subscribeToLoadingOverlayPreference,
    getLoadingOverlayEnabledSnapshot,
    () => true
  );
}

function FeedLoadingOverlay({
  onDisable,
}: {
  onDisable: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-13 bottom-24 z-20 grid place-items-center px-3.5">
      <GlassSurface
        aria-live="polite"
        role="status"
        className="pointer-events-auto w-full max-w-[260px] rounded-[20px] border border-white/68 bg-white/22 shadow-[0_14px_34px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.72)]"
        contentClassName="flex items-center justify-between gap-3 px-4 py-3"
        tintClassName="before:bg-white/28 before:backdrop-blur-[20px] before:backdrop-saturate-[180%]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Spinner className="size-5 shrink-0 text-[#1B7F45]" />
          <span className="whitespace-nowrap text-[14px] font-extrabold tracking-[0px] text-[#15291C]">
            Загрузка...
          </span>
        </div>
        <button
          type="button"
          onClick={onDisable}
          className="shrink-0 cursor-pointer rounded-full bg-white/42 px-2.5 py-1 text-[10px] leading-none font-extrabold text-[#5C6B62] outline-none transition-colors hover:bg-white/62 focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
        >
          Скрыть
        </button>
      </GlassSurface>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const feedScrollRef = useRef<HTMLElement>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>("new");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [feedLoadState, setFeedLoadState] =
    useState<FeedLoadState>("loading");
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingAuthors, setPendingAuthors] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const [pendingSavePostIds, setPendingSavePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const loadingOverlayEnabled = useLoadingOverlayEnabled();
  const [notice, setNotice] = useState<string | null>(null);
  const followingUsersSet = useMemo(
    () => new Set(followingUsers),
    [followingUsers]
  );
  const likedPostIdsSet = useMemo(
    () => new Set(likedPostIds),
    [likedPostIds]
  );
  const savedPostIdsSet = useMemo(
    () => new Set(savedPostIds),
    [savedPostIds]
  );

  const scrollFeedToTop = useCallback(() => {
    feedScrollRef.current?.scrollTo({
      behavior: "auto",
      top: 0,
    });
  }, []);

  const applyFeedResponse = useCallback((response: FeedResponse) => {
    setFollowingUsers(response.followingUsers);
    setLikedPostIds(response.likedPostIds);
    setSavedPostIds(response.savedPostIds);
    setPosts(response.posts);
  }, []);

  const redirectToLogin = useCallback(() => {
    router.push(AUTH_REDIRECT_HREF);
  }, [router]);

  useEffect(() => {
    let isActive = true;

    async function syncAuthState() {
      const user = await getCurrentUser();

      if (!isActive) {
        return;
      }

      setCurrentUser(user?.handle ?? null);
    }

    void syncAuthState();

    const unsubscribe = subscribeToAuthState(() => {
      void syncAuthState();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const syncFeed = useCallback(
    async (tab: FeedTab, isCurrent: () => boolean = () => true) => {
      try {
        const response = await requestFeed(tab);

        if (!isCurrent()) {
          return;
        }

        applyFeedResponse(response);
        setFeedLoadState("ready");
        requestAnimationFrame(scrollFeedToTop);
      } catch {
        if (!isCurrent()) {
          return;
        }

        setFeedLoadState("error");
        setNotice("Не удалось загрузить ленту. Проверьте соединение.");
      }
    },
    [applyFeedResponse, scrollFeedToTop]
  );

  useEffect(() => {
    function handleReviewPostsChanged() {
      void syncFeed(feedTab, () => true);
    }

    window.addEventListener(REVIEW_POSTS_CHANGED_EVENT, handleReviewPostsChanged);

    return () => {
      window.removeEventListener(
        REVIEW_POSTS_CHANGED_EVENT,
        handleReviewPostsChanged
      );
    };
  }, [feedTab, syncFeed]);

  useEffect(() => {
    let isActive = true;

    void requestFeed(feedTab)
      .then((response) => {
        if (!isActive) {
          return;
        }

        applyFeedResponse(response);
        setFeedLoadState("ready");
        requestAnimationFrame(scrollFeedToTop);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setFeedLoadState("error");
        setNotice("Не удалось загрузить ленту. Проверьте соединение.");
      });

    return () => {
      isActive = false;
    };
  }, [applyFeedResponse, feedTab, scrollFeedToTop]);

  const handleTabChange = useCallback(
    (nextTab: FeedTab) => {
      if (!currentUser) {
        redirectToLogin();
        return;
      }

      if (nextTab === feedTab) {
        return;
      }

      setFeedTab(nextTab);
      setFeedLoadState("loading");
      setNotice(null);
      scrollFeedToTop();
    },
    [currentUser, feedTab, redirectToLogin, scrollFeedToTop]
  );

  const handleGuestInteraction = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (currentUser) {
        return;
      }

      const target = event.target as HTMLElement;
      const interactiveTarget = target.closest(
        "a,button,input,textarea,select,[role='button']"
      );

      if (!interactiveTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      redirectToLogin();
    },
    [currentUser, redirectToLogin]
  );

  const retryFeed = useCallback(() => {
    setFeedLoadState("loading");
    setNotice(null);
    void syncFeed(feedTab);
  }, [feedTab, syncFeed]);

  const disableLoadingOverlay = useCallback(() => {
    window.localStorage.setItem(FEED_LOADING_OVERLAY_STORAGE_KEY, "off");
    window.dispatchEvent(new Event(FEED_LOADING_OVERLAY_CHANGE_EVENT));
  }, []);

  const toggleFollow = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!currentUser || pendingAuthors.has(author)) {
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

        setFollowingUsers(result.followingUsers);

        if (feedTab === "subs" && !result.following) {
          setPosts((currentPosts) =>
            currentPosts.filter((post) => post.user !== result.targetUser)
          );
        }
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
    [currentUser, feedTab, pendingAuthors]
  );

  const toggleLike = useCallback(
    async (postId: number, nextLiked: boolean) => {
      if (!currentUser || pendingLikePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingLikePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });

      try {
        const result = await requestLikeMutation(postId, nextLiked);

        setLikedPostIds(result.likedPostIds);
      } catch {
        setNotice("Не удалось обновить лайк. Попробуйте ещё раз.");
      } finally {
        setPendingLikePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [currentUser, pendingLikePostIds]
  );

  const toggleSave = useCallback(
    async (postId: number, nextSaved: boolean) => {
      if (!currentUser || pendingSavePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingSavePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });
      setSavedPostIds((currentPostIds) =>
        getNextPostIdMembership(currentPostIds, postId, nextSaved)
      );

      try {
        const result = await requestBookmarkMutation(postId, nextSaved);

        setSavedPostIds(result.savedPostIds);
      } catch {
        setSavedPostIds((currentPostIds) =>
          getNextPostIdMembership(currentPostIds, postId, !nextSaved)
        );
        setNotice("Не удалось обновить избранное. Попробуйте ещё раз.");
      } finally {
        setPendingSavePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [currentUser, pendingSavePostIds]
  );

  const retryButton = (
    <Button
      type="button"
      size="sm"
      onClick={retryFeed}
      className="h-8 rounded-full bg-white/62 px-4 text-[12px] font-extrabold text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75)] hover:bg-white/78"
    >
      Повторить
    </Button>
  );

  return (
    <main
      className="absolute inset-0 overflow-hidden"
      onClickCapture={handleGuestInteraction}
    >
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <FeedHeader
          brand={TWEAKS.brand}
          tab={feedTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          onAuthClick={redirectToLogin}
        />

        <section
          ref={feedScrollRef}
          aria-label="Лента"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {feedLoadState === "error" ? (
            <FeedStatusCard
              title="Лента не загрузилась"
              body="Можно попробовать ещё раз — состояние подписок не потеряется."
              action={retryButton}
            />
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                brand={TWEAKS.brand}
                density={TWEAKS.density}
                currentUser={currentUser}
                isAuthorFollowed={!!currentUser && followingUsersSet.has(post.user)}
                isFollowPending={!!currentUser && pendingAuthors.has(post.user)}
                isLiked={!!currentUser && likedPostIdsSet.has(post.id)}
                isLikePending={!!currentUser && pendingLikePostIds.has(post.id)}
                isSaved={!!currentUser && savedPostIdsSet.has(post.id)}
                isSavePending={!!currentUser && pendingSavePostIds.has(post.id)}
                onFollowToggle={toggleFollow}
                onLikeToggle={toggleLike}
                onSaveToggle={toggleSave}
              />
            ))
          ) : feedLoadState === "ready" ? (
            <FeedStatusCard
              title={feedTab === "subs" ? "Подписок пока нет" : "Постов пока нет"}
              body={
                feedTab === "subs"
                  ? "Подпишитесь на авторов из раздела «Новое», и их посты появятся здесь."
                  : "Свежие рекомендации появятся здесь чуть позже."
              }
            />
          ) : null}
        </section>

        {FEED_LOADING_OVERLAY_ENABLED && feedLoadState === "loading" && loadingOverlayEnabled ? (
          <FeedLoadingOverlay onDisable={disableLoadingOverlay} />
        ) : null}

        {notice && (
          <div className="pointer-events-none absolute right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <p role="status">{notice}</p>
          </div>
        )}
      </div>
    </main>
  );
}
