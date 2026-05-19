import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import {
  getProfileByUserId,
  type UserProfile,
} from "@/lib/profile-data";
import { getSavedPostIds } from "@/lib/server/bookmark-store";
import { getFollowedUsers } from "@/lib/server/follow-store";
import { getLikedPostIds } from "@/lib/server/like-store";
import { getMyPosts } from "@/lib/server/review-post-store";

export type ProfileUpdateInput = {
  about: string | null;
  avatarUrl?: string | null;
  city: string | null;
  displayName: string;
  username: string;
};

export type UserProfileSnapshot = {
  currentUser: string | null;
  followingUsers: string[];
  isFollowing: boolean;
  likedPostIds: number[];
  profile: UserProfile;
  savedPostIds: number[];
};

export type UserPostsSnapshot = {
  currentUser: string | null;
  posts: Awaited<ReturnType<typeof getMyPosts>>;
  userId: string;
};

type CurrentProfileOverride = {
  about: string | null;
  avatarUrl: string | null;
  city: string | null;
  displayName: string;
  username: string;
};

type ProfileStore = {
  currentUserProfile?: CurrentProfileOverride;
  schemaVersion: 1;
};

const PROFILE_STORE_PATH = join(process.cwd(), ".data", "profile.json");
const EMPTY_STORE: ProfileStore = {
  schemaVersion: 1,
};
const MAX_NAME_LENGTH = 64;
const MAX_USERNAME_LENGTH = 32;
const MAX_CITY_LENGTH = 64;
const MAX_ABOUT_LENGTH = 250;
const USERNAME_PATTERN = /^@[A-Za-z0-9_.]+$/;

let updateQueue: Promise<void> = Promise.resolve();

export class ProfileValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isCurrentProfileOverride(
  value: unknown
): value is CurrentProfileOverride {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof CurrentProfileOverride, unknown>>;

  return (
    isStringOrNull(record.about) &&
    isStringOrNull(record.avatarUrl) &&
    isStringOrNull(record.city) &&
    typeof record.displayName === "string" &&
    typeof record.username === "string"
  );
}

function parseProfileStore(value: unknown): ProfileStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const candidate = value as Partial<Record<keyof ProfileStore, unknown>>;

  return {
    currentUserProfile: isCurrentProfileOverride(candidate.currentUserProfile)
      ? candidate.currentUserProfile
      : undefined,
    schemaVersion: 1,
  };
}

async function readProfileStore(): Promise<ProfileStore> {
  try {
    const serializedStore = await readFile(PROFILE_STORE_PATH, "utf8");

    return parseProfileStore(JSON.parse(serializedStore));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return EMPTY_STORE;
    }

    throw error;
  }
}

async function writeProfileStore(store: ProfileStore) {
  const tempPath = `${PROFILE_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(PROFILE_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, PROFILE_STORE_PATH);
}

async function updateProfileStore<T>(
  updater: (store: ProfileStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readProfileStore();
    const result = await updater(store);

    await writeProfileStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function normalizeUsername(username: string) {
  const normalized = username.trim().replace(/^@+/, "");

  return `@${normalized}`;
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized.length > 0 ? normalized : null;
}

function validateProfileUpdate(input: ProfileUpdateInput): CurrentProfileOverride {
  const displayName = input.displayName.trim();
  const username = normalizeUsername(input.username);
  const city = normalizeNullableText(input.city);
  const about = normalizeNullableText(input.about);
  const avatarUrl = input.avatarUrl;

  if (!displayName) {
    throw new ProfileValidationError("invalid_display_name", "Укажите имя.");
  }

  if (displayName.length > MAX_NAME_LENGTH) {
    throw new ProfileValidationError(
      "display_name_too_long",
      "Имя слишком длинное."
    );
  }

  if (username.length <= 1) {
    throw new ProfileValidationError("invalid_username", "Укажите никнейм.");
  }

  if (username.length > MAX_USERNAME_LENGTH + 1) {
    throw new ProfileValidationError(
      "username_too_long",
      "Никнейм слишком длинный."
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new ProfileValidationError(
      "invalid_username",
      "Никнейм может содержать буквы, цифры, точку и underscore."
    );
  }

  if (city && city.length > MAX_CITY_LENGTH) {
    throw new ProfileValidationError("city_too_long", "Название города слишком длинное.");
  }

  if (about && about.length > MAX_ABOUT_LENGTH) {
    throw new ProfileValidationError(
      "about_too_long",
      "О себе можно написать до 250 символов."
    );
  }

  if (avatarUrl !== undefined && avatarUrl !== null && !avatarUrl.startsWith("data:image/")) {
    throw new ProfileValidationError(
      "invalid_avatar",
      "Фото профиля должно быть изображением."
    );
  }

  return {
    about,
    avatarUrl: avatarUrl ?? null,
    city,
    displayName,
    username,
  };
}

async function getProfileWithOverrides(userId: string): Promise<UserProfile | null> {
  const profile = getProfileByUserId(userId);

  if (!profile) {
    return null;
  }

  if (userId !== CURRENT_USER.handle) {
    return profile;
  }

  const store = await readProfileStore();

  if (!store.currentUserProfile) {
    return profile;
  }

  return {
    ...profile,
    ...store.currentUserProfile,
    userId: profile.userId,
  };
}

export async function getUserProfileSnapshot(
  userId: string
): Promise<UserProfileSnapshot | null> {
  const profile = await getProfileWithOverrides(userId);

  if (!profile) {
    return null;
  }

  const [followingUsers, likedPostIds, savedPostIds] = await Promise.all([
    getFollowedUsers(CURRENT_USER.handle),
    getLikedPostIds(CURRENT_USER.handle),
    getSavedPostIds(CURRENT_USER.handle),
  ]);

  return {
    currentUser: CURRENT_USER.handle,
    followingUsers,
    isFollowing: followingUsers.includes(userId),
    likedPostIds,
    profile: {
      ...profile,
      postsCount: (await getMyPosts(userId)).length,
    },
    savedPostIds,
  };
}

export async function getUserPostsSnapshot(
  userId: string
): Promise<UserPostsSnapshot | null> {
  if (!getProfileByUserId(userId)) {
    return null;
  }

  return {
    currentUser: CURRENT_USER.handle,
    posts: await getMyPosts(userId),
    userId,
  };
}

export async function updateCurrentUserProfile(
  input: ProfileUpdateInput
): Promise<UserProfileSnapshot> {
  const baseProfile = getProfileByUserId(CURRENT_USER.handle);

  if (!baseProfile) {
    throw new ProfileValidationError(
      "profile_not_found",
      "Профиль не найден.",
      404
    );
  }

  const nextProfile = validateProfileUpdate(input);

  await updateProfileStore((store) => {
    const currentAvatarUrl = store.currentUserProfile?.avatarUrl ?? baseProfile.avatarUrl;

    store.currentUserProfile = {
      ...nextProfile,
      avatarUrl: input.avatarUrl === undefined ? currentAvatarUrl : nextProfile.avatarUrl,
    };
  });

  const snapshot = await getUserProfileSnapshot(CURRENT_USER.handle);

  if (!snapshot) {
    throw new ProfileValidationError(
      "profile_not_found",
      "Профиль не найден.",
      404
    );
  }

  return snapshot;
}
