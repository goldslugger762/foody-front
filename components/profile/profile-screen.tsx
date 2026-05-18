"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  ImageOff,
  Images,
  RefreshCw,
  Send,
  Settings,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DishPhoto } from "@/components/feed/dish-photo";
import { FullScreenPost } from "@/components/feed/full-screen-post";
import { GlassSurface } from "@/components/feed/glass-surface";
import { UserAvatar } from "@/components/feed/user-avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Spinner } from "@/components/ui/spinner";
import {
  getNextPostIdMembership,
  requestFollowMutation,
  requestLikeMutation,
  requestBookmarkMutation,
} from "@/lib/feed-api";
import {
  getCurrentUserProfile,
  getUserPosts,
  getUserProfile,
  shareUserProfile,
  type UserProfileResponse,
} from "@/lib/profile-api";
import type { Density, Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ProfileScreenProps = {
  brand: string;
  density: Density;
  initialUserId: string;
  ownProfileRoute?: boolean;
};

type LoadState = "loading" | "ready" | "error";

const PROFILE_BUTTON_TAP = { scale: 0.96 } as const;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function getProfileButtonTap(shouldReduceMotion: boolean | null) {
  return canAnimate(shouldReduceMotion) ? PROFILE_BUTTON_TAP : undefined;
}

function pluralizeRu(count: number, forms: readonly [string, string, string]) {
  const absCount = Math.abs(count);
  const lastTwoDigits = absCount % 100;
  const lastDigit = absCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

function ProfileHeader({
  isOwnProfile,
  onSettingsClick,
  shouldReduceMotion,
  username,
}: {
  isOwnProfile: boolean;
  username: string;
  shouldReduceMotion: boolean | null;
  onSettingsClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2 pb-0 max-[409px]:px-3">
      <div className="flex h-13 items-center justify-between gap-3 px-1">
        <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[19px] leading-tight font-extrabold tracking-[0px] text-[#15291C] max-[409px]:text-[16px]">
          {username}
        </p>

        {isOwnProfile ? (
          <motion.button
            type="button"
            aria-label="Настройки"
            title="Настройки"
            onClick={onSettingsClick}
            whileTap={getProfileButtonTap(shouldReduceMotion)}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/42 text-[#15291C] outline-none shadow-[inset_1px_1px_0_rgba(255,255,255,0.78)] transition-colors hover:bg-white/62 focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
          >
            <Settings className="size-5" strokeWidth={2.25} />
          </motion.button>
        ) : null}
      </div>
    </header>
  );
}

function ProfileStatus({
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

function ProfileSkeleton() {
  return (
    <div className="px-3.5 pt-3 pb-28 max-[409px]:px-3">
      <div className="animate-pulse">
        <div className="flex items-center gap-4 px-2 pt-2">
          <div className="size-[76px] rounded-full bg-white/55" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-5 w-38 rounded-full bg-white/58" />
            <div className="h-4 w-26 rounded-full bg-white/48" />
            <div className="flex gap-2 pt-1">
              <div className="h-8 flex-1 rounded-full bg-white/52" />
              <div className="h-8 flex-1 rounded-full bg-white/52" />
            </div>
          </div>
        </div>

        <div className="mt-5 h-28 rounded-[24px] bg-white/48" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-20 rounded-[20px] bg-white/45" />
          <div className="h-20 rounded-[20px] bg-white/45" />
          <div className="h-20 rounded-[20px] bg-white/45" />
        </div>
        <div className="mt-7 h-5 w-32 rounded-full bg-white/52" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-[18px] bg-white/48"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({
  brand,
  isFollowPending,
  isOwnProfile,
  onEditClick,
  onFollowClick,
  onShareClick,
  profile,
  shouldReduceMotion,
  subscribed,
}: {
  brand: string;
  isFollowPending: boolean;
  isOwnProfile: boolean;
  onEditClick: () => void;
  onFollowClick: () => void;
  onShareClick: () => void;
  profile: UserProfileResponse["profile"];
  shouldReduceMotion: boolean | null;
  subscribed: boolean;
}) {
  return (
    <section className="px-3.5 pt-3 max-[409px]:px-3">
      <div className="flex items-center gap-4 px-2">
        <UserAvatar
          name={profile.username}
          src={profile.avatarUrl}
          size={76}
          className="shadow-[0_10px_24px_rgba(20,40,28,0.14),inset_0_0_0_1.5px_rgba(255,255,255,0.7)]"
        />

        <div className="min-w-0 flex-1">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[18px] leading-tight font-extrabold tracking-[-0.2px] text-[#15291C]">
            {profile.displayName}
          </p>
          <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-roboto)] text-[13.5px] leading-tight font-medium text-[#5C6B62]">
            {profile.city ?? "Город не указан"}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <motion.button
              type="button"
              onClick={onShareClick}
              whileTap={getProfileButtonTap(shouldReduceMotion)}
              className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/62 bg-white/52 px-3 text-[12px] font-extrabold whitespace-nowrap text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.78)] outline-none transition-colors hover:bg-white/68 focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0"
            >
              <Send className="size-3.5" />
              Поделиться
            </motion.button>

            {isOwnProfile ? (
              <motion.button
                type="button"
                onClick={onEditClick}
                whileTap={getProfileButtonTap(shouldReduceMotion)}
                className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent px-3 text-[12px] font-extrabold whitespace-nowrap text-[#0B2F1D] shadow-[0_8px_18px_rgba(8,58,33,0.14),inset_1px_1px_0_rgba(255,255,255,0.68)] outline-none transition-[filter] hover:brightness-[1.02] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0"
                style={{ backgroundColor: brand }}
              >
                <Edit3 className="size-3.5" />
                Редактировать
              </motion.button>
            ) : (
              <motion.button
                type="button"
                disabled={isFollowPending}
                aria-pressed={subscribed}
                onClick={onFollowClick}
                whileTap={getProfileButtonTap(shouldReduceMotion)}
                className={cn(
                  "inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold whitespace-nowrap shadow-[0_8px_18px_rgba(8,58,33,0.14),inset_1px_1px_0_rgba(255,255,255,0.68)] outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0",
                  subscribed
                    ? "border border-white/62 bg-white/58 text-[#15291C] hover:bg-white/72"
                    : "border border-transparent text-[#0B2F1D] transition-[filter] hover:brightness-[1.02]"
                )}
                style={subscribed ? undefined : { backgroundColor: brand }}
              >
                {isFollowPending ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <UserRoundCheck className="size-3.5" />
                )}
                {subscribed ? "Вы подписаны" : "Подписаться"}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ about }: { about: string | null }) {
  return (
    <section className="px-3.5 pt-5 max-[409px]:px-3">
      <p className="px-1 text-[15px] leading-tight font-extrabold tracking-[0px] text-[#15291C]">
        Обо мне
      </p>
      <GlassSurface
        className="mt-2 rounded-[24px] border border-green-50/80 bg-white/45"
        contentClassName="px-4 py-3.5"
      >
        <p className="font-[family-name:var(--font-roboto)] text-[14px] leading-[1.45] font-medium text-[#15291C]">
          {about ?? "Пользователь пока ничего не рассказал о себе"}
        </p>
      </GlassSurface>
    </section>
  );
}

function StatsSection({
  followersCount,
  followingCount,
  postsCount,
}: {
  followersCount: number;
  followingCount: number;
  postsCount: number;
}) {
  const stats = [
    {
      icon: Images,
      label: pluralizeRu(postsCount, ["пост", "поста", "постов"]),
      value: postsCount,
    },
    {
      icon: Users,
      label: pluralizeRu(followersCount, [
        "подписчик",
        "подписчика",
        "подписчиков",
      ]),
      value: followersCount,
    },
    {
      icon: UserRoundCheck,
      label: pluralizeRu(followingCount, [
        "подписка",
        "подписки",
        "подписок",
      ]),
      value: followingCount,
    },
  ] as const;

  return (
    <section className="grid grid-cols-3 gap-2 px-3.5 pt-5 max-[409px]:px-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <GlassSurface
            key={stat.label}
            className="rounded-[22px] border border-green-50/72 bg-white/42"
            contentClassName="flex min-h-[88px] flex-col items-center justify-center px-2.5 py-3 text-center"
          >
            <Icon className="size-5 text-[#1B7F45]" strokeWidth={2.25} />
            <p className="mt-1.5 text-[18px] leading-none font-black tracking-[0px] text-[#15291C]">
              {stat.value}
            </p>
            <p className="mt-1 font-[family-name:var(--font-roboto)] text-[11px] leading-tight font-medium text-[#5C6B62]">
              {stat.label}
            </p>
          </GlassSurface>
        );
      })}
    </section>
  );
}

function ProfilePostCard({
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
      className="group min-w-0 cursor-pointer rounded-[18px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
      whileTap={getProfileButtonTap(shouldReduceMotion)}
    >
      <AspectRatio
        ratio={1}
        className="relative overflow-hidden rounded-[18px] bg-white/42 shadow-[0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.78)]"
      >
        {hasPhoto ? (
          <DishPhoto seed={post.seed} height="100%" label="" />
        ) : (
          <div className="grid h-full place-items-center bg-[rgba(46,204,113,0.12)]">
            <ImageOff className="size-6 text-[#1B7F45]/55" strokeWidth={2.2} />
          </div>
        )}
      </AspectRatio>
    </motion.button>
  );
}

function PostsSection({
  isOwnProfile,
  loadState,
  onPostClick,
  onRetry,
  posts,
  shouldReduceMotion,
}: {
  isOwnProfile: boolean;
  loadState: LoadState;
  onPostClick: (post: Post) => void;
  onRetry: () => void;
  posts: Post[];
  shouldReduceMotion: boolean | null;
}) {
  const retryButton = (
    <motion.button
      type="button"
      onClick={onRetry}
      whileTap={getProfileButtonTap(shouldReduceMotion)}
      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/62 px-4 text-[12px] font-extrabold whitespace-nowrap text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75)] outline-none transition-colors hover:bg-white/78 focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0"
    >
      <RefreshCw className="size-3.5" />
      Повторить
    </motion.button>
  );

  return (
    <section className="px-3.5 pt-7 pb-28 max-[409px]:px-3">
      <p className="px-1 text-[20px] leading-tight font-extrabold tracking-[0px] text-[#15291C]">
        {isOwnProfile ? "Ваши посты" : "Посты автора"}
      </p>

      {loadState === "loading" ? (
        <div
          aria-live="polite"
          className="mt-4 grid animate-pulse grid-cols-3 gap-2"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-[18px] bg-white/48"
            />
          ))}
        </div>
      ) : loadState === "error" ? (
        <ProfileStatus
          title="Посты не загрузились"
          body="Попробуйте ещё раз — профиль уже открыт."
          action={retryButton}
        />
      ) : posts.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {posts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              shouldReduceMotion={shouldReduceMotion}
              onClick={() => onPostClick(post)}
            />
          ))}
        </div>
      ) : (
        <GlassSurface
          className="mt-4 rounded-[24px] border border-green-50/80 bg-white/45"
          contentClassName="px-4 py-5 text-center"
        >
          <p className="font-[family-name:var(--font-roboto)] text-[14px] leading-[1.4] font-medium text-[#5C6B62]">
            {isOwnProfile
              ? "У вас пока нет опубликованных постов"
              : "У пользователя пока нет опубликованных постов"}
          </p>
        </GlassSurface>
      )}
    </section>
  );
}

export function ProfileScreen({
  brand,
  density,
  initialUserId,
  ownProfileRoute = false,
}: ProfileScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [profileState, setProfileState] = useState<UserProfileResponse | null>(
    null
  );
  const [profileLoadState, setProfileLoadState] =
    useState<LoadState>("loading");
  const [postsLoadState, setPostsLoadState] = useState<LoadState>("loading");
  const [posts, setPosts] = useState<Post[]>([]);
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
  const profile = profileState?.profile ?? null;
  const isOwnProfile =
    !!profileState?.currentUser && profileState.currentUser === profile?.userId;
  const followingUsersSet = useMemo(
    () => new Set(profileState?.followingUsers ?? []),
    [profileState?.followingUsers]
  );
  const likedPostIdsSet = useMemo(
    () => new Set(profileState?.likedPostIds ?? []),
    [profileState?.likedPostIds]
  );
  const savedPostIdsSet = useMemo(
    () => new Set(profileState?.savedPostIds ?? []),
    [profileState?.savedPostIds]
  );

  const loadProfile = useCallback(async () => {
    setProfileLoadState("loading");
    setPostsLoadState("loading");
    setNotice(null);
    setPosts([]);

    try {
      const response = ownProfileRoute
        ? await getCurrentUserProfile()
        : await getUserProfile(initialUserId);

      setProfileState(response);
      setProfileLoadState("ready");

      try {
        const postsResponse = await getUserPosts(response.profile.userId);

        setPosts(postsResponse.posts);
        setPostsLoadState("ready");
      } catch {
        setPostsLoadState("error");
        setNotice("Не удалось загрузить посты профиля.");
      }
    } catch {
      setProfileState(null);
      setProfileLoadState("error");
      setPostsLoadState("ready");
      setNotice("Не удалось загрузить профиль.");
    }
  }, [initialUserId, ownProfileRoute]);

  const loadPosts = useCallback(async () => {
    if (!profile) {
      return;
    }

    setPostsLoadState("loading");
    setNotice(null);

    try {
      const response = await getUserPosts(profile.userId);

      setPosts(response.posts);
      setPostsLoadState("ready");
    } catch {
      setPostsLoadState("error");
      setNotice("Не удалось загрузить посты профиля.");
    }
  }, [profile]);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setProfileLoadState("loading");
      setPostsLoadState("loading");
      setNotice(null);
      setPosts([]);
      setProfileState(null);

      try {
        const response = ownProfileRoute
          ? await getCurrentUserProfile()
          : await getUserProfile(initialUserId);

        if (!isActive) {
          return;
        }

        setProfileState(response);
        setProfileLoadState("ready");

        try {
          const postsResponse = await getUserPosts(response.profile.userId);

          if (!isActive) {
            return;
          }

          setPosts(postsResponse.posts);
          setPostsLoadState("ready");
        } catch {
          if (!isActive) {
            return;
          }

          setPostsLoadState("error");
          setNotice("Не удалось загрузить посты профиля.");
        }
      } catch {
        if (!isActive) {
          return;
        }

        setProfileLoadState("error");
        setPostsLoadState("ready");
        setNotice("Не удалось загрузить профиль.");
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [initialUserId, ownProfileRoute]);

  const toggleFollow = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!profileState?.currentUser || pendingAuthors.has(author)) {
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

        setProfileState((currentState) => {
          if (!currentState) {
            return currentState;
          }

          const isViewedProfile = currentState.profile.userId === result.targetUser;
          const nextFollowersCount = isViewedProfile
            ? Math.max(
                0,
                currentState.profile.followersCount + (result.following ? 1 : -1)
              )
            : currentState.profile.followersCount;

          return {
            ...currentState,
            followingUsers: result.followingUsers,
            isFollowing: currentState.profile.userId === result.targetUser
              ? result.following
              : currentState.isFollowing,
            profile: {
              ...currentState.profile,
              followersCount: nextFollowersCount,
            },
          };
        });
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
    [pendingAuthors, profileState?.currentUser]
  );

  const toggleLike = useCallback(
    async (postId: number, nextLiked: boolean) => {
      if (!profileState?.currentUser || pendingLikePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingLikePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });
      setProfileState((currentState) =>
        currentState
          ? {
              ...currentState,
              likedPostIds: getNextPostIdMembership(
                currentState.likedPostIds,
                postId,
                nextLiked
              ),
            }
          : currentState
      );

      try {
        const result = await requestLikeMutation(postId, nextLiked);

        setProfileState((currentState) =>
          currentState
            ? {
                ...currentState,
                likedPostIds: result.likedPostIds,
              }
            : currentState
        );
      } catch {
        setProfileState((currentState) =>
          currentState
            ? {
                ...currentState,
                likedPostIds: getNextPostIdMembership(
                  currentState.likedPostIds,
                  postId,
                  !nextLiked
                ),
              }
            : currentState
        );
        setNotice("Не удалось обновить лайк. Попробуйте ещё раз.");
      } finally {
        setPendingLikePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [pendingLikePostIds, profileState?.currentUser]
  );

  const toggleSave = useCallback(
    async (postId: number, nextSaved: boolean) => {
      if (!profileState?.currentUser || pendingSavePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingSavePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });
      setProfileState((currentState) =>
        currentState
          ? {
              ...currentState,
              savedPostIds: getNextPostIdMembership(
                currentState.savedPostIds,
                postId,
                nextSaved
              ),
            }
          : currentState
      );

      try {
        const result = await requestBookmarkMutation(postId, nextSaved);

        setProfileState((currentState) =>
          currentState
            ? {
                ...currentState,
                savedPostIds: result.savedPostIds,
              }
            : currentState
        );
      } catch {
        setProfileState((currentState) =>
          currentState
            ? {
                ...currentState,
                savedPostIds: getNextPostIdMembership(
                  currentState.savedPostIds,
                  postId,
                  !nextSaved
                ),
              }
            : currentState
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
    [pendingSavePostIds, profileState?.currentUser]
  );

  async function handleShareClick() {
    if (!profile) {
      return;
    }

    try {
      const result = await shareUserProfile(profile.userId);

      setNotice(
        result === "copied"
          ? "Ссылка на профиль скопирована"
          : "Профиль готов к отправке"
      );
    } catch {
      setNotice("Не удалось поделиться профилем.");
    }
  }

  function handleEditClick() {
    // TODO: route to the profile editor when the edit profile page exists.
    setNotice("Редактирование профиля скоро появится.");
  }

  function handleSettingsClick() {
    // TODO: route to settings when the settings page exists.
    setNotice("Настройки скоро появятся.");
  }

  const retryButton = (
    <motion.button
      type="button"
      onClick={loadProfile}
      whileTap={getProfileButtonTap(shouldReduceMotion)}
      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/62 px-4 text-[12px] font-extrabold whitespace-nowrap text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75)] outline-none transition-colors hover:bg-white/78 focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0"
    >
      <RefreshCw className="size-3.5" />
      Повторить
    </motion.button>
  );

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <ProfileHeader
          isOwnProfile={ownProfileRoute || isOwnProfile}
          shouldReduceMotion={shouldReduceMotion}
          username={profile?.username ?? initialUserId}
          onSettingsClick={handleSettingsClick}
        />

        <section
          aria-label="Профиль"
          className="hide-scroll min-h-0 flex-1 overflow-y-auto pb-28"
        >
          {profileLoadState === "loading" ? (
            <ProfileSkeleton />
          ) : profileLoadState === "error" ? (
            <ProfileStatus
              title="Профиль не загрузился"
              body="Можно попробовать ещё раз — лента и избранное не изменятся."
              action={retryButton}
            />
          ) : profile ? (
            <>
              <ProfileSummary
                brand={brand}
                isFollowPending={pendingAuthors.has(profile.userId)}
                isOwnProfile={isOwnProfile}
                profile={profile}
                shouldReduceMotion={shouldReduceMotion}
                subscribed={followingUsersSet.has(profile.userId)}
                onEditClick={handleEditClick}
                onFollowClick={() =>
                  void toggleFollow(
                    profile.userId,
                    !followingUsersSet.has(profile.userId)
                  )
                }
                onShareClick={() => void handleShareClick()}
              />
              <AboutSection about={profile.about} />
              <StatsSection
                followersCount={profile.followersCount}
                followingCount={profile.followingCount}
                postsCount={profile.postsCount}
              />
              <PostsSection
                isOwnProfile={isOwnProfile}
                loadState={postsLoadState}
                posts={posts}
                shouldReduceMotion={shouldReduceMotion}
                onPostClick={setActivePost}
                onRetry={() => void loadPosts()}
              />
            </>
          ) : null}
        </section>

        {notice && (
          <div className="pointer-events-none absolute right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <p role="status">{notice}</p>
          </div>
        )}

        <AnimatePresence>
          {activePost && profileState && (
            <FullScreenPost
              key={activePost.id}
              post={activePost}
              brand={brand}
              currentUser={profileState.currentUser}
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
