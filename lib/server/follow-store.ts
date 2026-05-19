import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import type {
  FeedScope,
  FollowCheckResponse,
  FollowMutationResponse,
} from "@/lib/feed-api";
import { POSTS } from "@/lib/mock-data";
import { getSavedPostIds } from "@/lib/server/bookmark-store";
import { getLikedPostIds } from "@/lib/server/like-store";
import { getFeedPosts } from "@/lib/server/review-post-store";

type FollowRecord = {
  createdAt: string;
  follower: string;
  following: string;
};

type FollowStore = {
  follows: FollowRecord[];
  schemaVersion: 1;
};

const FOLLOW_STORE_PATH = join(process.cwd(), ".data", "follows.json");
const EMPTY_STORE: FollowStore = {
  follows: [],
  schemaVersion: 1,
};

let updateQueue: Promise<void> = Promise.resolve();

export class FollowValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeUserHandle(user: string) {
  return user.trim();
}

function getKnownUserHandles() {
  return new Set([CURRENT_USER.handle, ...POSTS.map((post) => post.user)]);
}

function isFollowRecord(value: unknown): value is FollowRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof FollowRecord, unknown>>;

  return (
    typeof record.createdAt === "string" &&
    typeof record.follower === "string" &&
    typeof record.following === "string"
  );
}

function dedupeFollowRecords(records: FollowRecord[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = `${record.follower}\n${record.following}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseFollowStore(value: unknown): FollowStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const candidate = value as Partial<Record<keyof FollowStore, unknown>>;

  if (!Array.isArray(candidate.follows)) {
    return EMPTY_STORE;
  }

  return {
    follows: dedupeFollowRecords(candidate.follows.filter(isFollowRecord)),
    schemaVersion: 1,
  };
}

async function readFollowStore(): Promise<FollowStore> {
  try {
    const serializedStore = await readFile(FOLLOW_STORE_PATH, "utf8");

    return parseFollowStore(JSON.parse(serializedStore));
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

async function writeFollowStore(store: FollowStore) {
  const tempPath = `${FOLLOW_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(FOLLOW_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, FOLLOW_STORE_PATH);
}

async function updateFollowStore<T>(
  updater: (store: FollowStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readFollowStore();
    const result = await updater(store);

    await writeFollowStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function getFollowingUsersFromStore(store: FollowStore, follower: string) {
  return store.follows
    .filter((record) => record.follower === follower)
    .map((record) => record.following);
}

function validateFollowTarget(targetUser: string, options?: { requireKnown: boolean }) {
  const target = normalizeUserHandle(targetUser);

  if (target.length === 0) {
    throw new FollowValidationError(
      "invalid_target_user",
      "Нужно выбрать пользователя для подписки."
    );
  }

  if (target === CURRENT_USER.handle) {
    throw new FollowValidationError(
      "self_follow",
      "Нельзя подписаться на себя."
    );
  }

  if (options?.requireKnown && !getKnownUserHandles().has(target)) {
    throw new FollowValidationError(
      "unknown_user",
      "Такого автора нет в ленте.",
      404
    );
  }

  return target;
}

export async function getFollowedUsers(follower = CURRENT_USER.handle) {
  const store = await readFollowStore();

  return getFollowingUsersFromStore(store, follower);
}

export async function isFollowingUser(targetUser: string) {
  const target = validateFollowTarget(targetUser);
  const followingUsers = await getFollowedUsers();

  return followingUsers.includes(target);
}

export async function getFeedSnapshot(scope: FeedScope) {
  const followingUsers = await getFollowedUsers();
  const likedPostIds = await getLikedPostIds();
  const savedPostIds = await getSavedPostIds();
  const approvedPosts = await getFeedPosts();
  const posts =
    scope === "subs"
      ? approvedPosts.filter((post) => followingUsers.includes(post.user))
      : approvedPosts;

  return {
    currentUser: CURRENT_USER.handle,
    followingUsers,
    likedPostIds,
    posts,
    savedPostIds,
    scope,
  };
}

export async function getFollowCheck(
  targetUser: string
): Promise<FollowCheckResponse> {
  const target = validateFollowTarget(targetUser);
  const followingUsers = await getFollowedUsers();

  return {
    currentUser: CURRENT_USER.handle,
    following: followingUsers.includes(target),
    followingUsers,
    targetUser: target,
  };
}

export async function followUser(
  targetUser: string
): Promise<FollowMutationResponse> {
  const target = validateFollowTarget(targetUser, { requireKnown: true });

  return updateFollowStore((store) => {
    const alreadyFollowing = store.follows.some(
      (record) =>
        record.follower === CURRENT_USER.handle && record.following === target
    );

    if (!alreadyFollowing) {
      store.follows.push({
        createdAt: new Date().toISOString(),
        follower: CURRENT_USER.handle,
        following: target,
      });
    }

    return {
      currentUser: CURRENT_USER.handle,
      following: true,
      followingUsers: getFollowingUsersFromStore(store, CURRENT_USER.handle),
      targetUser: target,
      changed: !alreadyFollowing,
    };
  });
}

export async function unfollowUser(
  targetUser: string
): Promise<FollowMutationResponse> {
  const target = validateFollowTarget(targetUser);

  return updateFollowStore((store) => {
    const previousLength = store.follows.length;

    store.follows = store.follows.filter(
      (record) =>
        record.follower !== CURRENT_USER.handle || record.following !== target
    );

    return {
      currentUser: CURRENT_USER.handle,
      following: false,
      followingUsers: getFollowingUsersFromStore(store, CURRENT_USER.handle),
      targetUser: target,
      changed: store.follows.length !== previousLength,
    };
  });
}
