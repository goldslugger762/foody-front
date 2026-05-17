"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FeedHeader, type FeedTab } from "@/components/feed/feed-header";
import { GlassSurface } from "@/components/feed/glass-surface";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/lib/current-user";
import {
  requestFeed,
  requestFollowMutation,
  type FeedResponse,
} from "@/lib/feed-api";
import { DEFAULT_TWEAKS, type Post, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

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
      <GlassSurface className="mt-2 flex flex-1 items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
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

export default function FeedPage() {
  const [feedTab, setFeedTab] = useState<FeedTab>("new");
  const [currentUser, setCurrentUser] = useState<string | null>(
    CURRENT_USER.handle
  );
  const [feedLoadState, setFeedLoadState] =
    useState<FeedLoadState>("loading");
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingAuthors, setPendingAuthors] = useState<Set<string>>(
    () => new Set()
  );
  const [notice, setNotice] = useState<string | null>(null);
  const followingUsersSet = useMemo(
    () => new Set(followingUsers),
    [followingUsers]
  );

  const applyFeedResponse = useCallback((response: FeedResponse) => {
    setCurrentUser(response.currentUser);
    setFollowingUsers(response.followingUsers);
    setPosts(response.posts);
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
      } catch {
        if (!isCurrent()) {
          return;
        }

        setFeedLoadState("error");
        setNotice("Не удалось загрузить ленту. Проверьте соединение.");
      }
    },
    [applyFeedResponse]
  );

  useEffect(() => {
    let isActive = true;

    void requestFeed(feedTab)
      .then((response) => {
        if (!isActive) {
          return;
        }

        applyFeedResponse(response);
        setFeedLoadState("ready");
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
  }, [applyFeedResponse, feedTab]);

  const handleTabChange = useCallback(
    (nextTab: FeedTab) => {
      if (nextTab === feedTab) {
        return;
      }

      setFeedTab(nextTab);
      setFeedLoadState("loading");
      setNotice(null);
    },
    [feedTab]
  );

  const retryFeed = useCallback(() => {
    setFeedLoadState("loading");
    setNotice(null);
    void syncFeed(feedTab);
  }, [feedTab, syncFeed]);

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
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <FeedHeader
          brand={TWEAKS.brand}
          tab={feedTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
        />

        <section
          aria-label="Лента"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {feedLoadState === "loading" ? (
            <FeedStatusCard
              title="Загружаем ленту"
              body="Собираем свежие посты и ваши подписки."
            />
          ) : feedLoadState === "error" ? (
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
                isAuthorFollowed={followingUsersSet.has(post.user)}
                isFollowPending={pendingAuthors.has(post.user)}
                onFollowToggle={toggleFollow}
              />
            ))
          ) : (
            <FeedStatusCard
              title={feedTab === "subs" ? "Подписок пока нет" : "Постов пока нет"}
              body={
                feedTab === "subs"
                  ? "Подпишитесь на авторов из раздела «Новое», и их посты появятся здесь."
                  : "Свежие рекомендации появятся здесь чуть позже."
              }
            />
          )}
        </section>

        {notice && (
          <div className="pointer-events-none absolute right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <p role="status">{notice}</p>
          </div>
        )}
      </div>
    </main>
  );
}
