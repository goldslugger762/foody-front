import { CURRENT_USER } from "@/lib/current-user";
import { COMMENTS_BY_POST_ID, POSTS, type Post } from "@/lib/mock-data";

export type UserProfile = {
  userId: string;
  username: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
  about: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

type ProfileSeed = Omit<UserProfile, "postsCount">;

const PROFILE_SEEDS: Record<string, ProfileSeed> = {
  [CURRENT_USER.handle]: {
    userId: CURRENT_USER.handle,
    username: CURRENT_USER.handle,
    displayName: CURRENT_USER.realName,
    city: "Москва",
    avatarUrl: null,
    about:
      "Сохраняю места, куда хочется вернуться, и собираю честные заметки про блюда без лишней церемонии.",
    followersCount: 128,
    followingCount: 24,
  },
  "@ivanov_ivan": {
    userId: "@ivanov_ivan",
    username: "@ivanov_ivan",
    displayName: "Иван Иванов",
    city: "Москва",
    avatarUrl: null,
    about:
      "Ищу маленькие места с большой кухней. Люблю морепродукты, острые соусы и честные рекомендации без рекламного шума.",
    followersCount: 999,
    followingCount: 87,
  },
  "@masha.eats": {
    userId: "@masha.eats",
    username: "@masha.eats",
    displayName: "Маша Петрова",
    city: "Москва",
    avatarUrl: null,
    about:
      "Десерты, завтраки и кофе. Запоминаю не только вкус, но и настроение места.",
    followersCount: 1413,
    followingCount: 132,
  },
  "@kostya.cooks": {
    userId: "@kostya.cooks",
    username: "@kostya.cooks",
    displayName: "Костя",
    city: "Тбилиси",
    avatarUrl: null,
    about:
      "Готовлю дома, проверяю рестораны и особенно внимательно отношусь к тесту, сыру и соусам.",
    followersCount: 742,
    followingCount: 56,
  },
  "@nikita.grill": {
    userId: "@nikita.grill",
    username: "@nikita.grill",
    displayName: "Никита",
    city: null,
    avatarUrl: null,
    about: null,
    followersCount: 1186,
    followingCount: 44,
  },
};

function getPostAuthorSeed(userId: string): ProfileSeed | null {
  const authorPost = POSTS.find((post) => post.user === userId);

  if (!authorPost) {
    return null;
  }

  return {
    userId,
    username: userId,
    displayName: authorPost.realName,
    city: null,
    avatarUrl: null,
    about: null,
    followersCount: authorPost.likes,
    followingCount: 0,
  };
}

function getCommentAuthorSeed(userId: string): ProfileSeed | null {
  const authorComment = Object.values(COMMENTS_BY_POST_ID)
    .flat()
    .find((comment) => comment.user === userId);

  if (!authorComment) {
    return null;
  }

  return {
    userId,
    username: userId,
    displayName: authorComment.realName,
    city: null,
    avatarUrl: authorComment.avatarUrl ?? null,
    about: null,
    followersCount: authorComment.likes,
    followingCount: 0,
  };
}

export function getUserProfileHref(userId: string) {
  return `/profile/${encodeURIComponent(userId)}`;
}

export function getProfilePosts(userId: string): Post[] {
  // TODO: replace this mock lookup with a backend request for published posts.
  return POSTS.filter((post) => post.user === userId);
}

export function getProfileByUserId(userId: string): UserProfile | null {
  // TODO: replace these seeded profiles with backend profile data.
  const seed =
    PROFILE_SEEDS[userId] ??
    getPostAuthorSeed(userId) ??
    getCommentAuthorSeed(userId);

  if (!seed) {
    return null;
  }

  return {
    ...seed,
    postsCount: getProfilePosts(userId).length,
  };
}
