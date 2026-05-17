import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import type {
  LikeCheckResponse,
  LikeMutationResponse,
} from "@/lib/feed-api";
import { POSTS } from "@/lib/mock-data";

type LikeRecord = {
  createdAt: string;
  postId: number;
  user: string;
};

type LikeStore = {
  likes: LikeRecord[];
  schemaVersion: 1;
};

const LIKE_STORE_PATH = join(process.cwd(), ".data", "likes.json");
const EMPTY_STORE: LikeStore = {
  likes: [],
  schemaVersion: 1,
};

let updateQueue: Promise<void> = Promise.resolve();

export class LikeValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function isLikeRecord(value: unknown): value is LikeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof LikeRecord, unknown>>;

  return (
    typeof record.createdAt === "string" &&
    typeof record.postId === "number" &&
    Number.isInteger(record.postId) &&
    typeof record.user === "string"
  );
}

function dedupeLikeRecords(records: LikeRecord[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = `${record.user}\n${record.postId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseLikeStore(value: unknown): LikeStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const candidate = value as Partial<Record<keyof LikeStore, unknown>>;

  if (!Array.isArray(candidate.likes)) {
    return EMPTY_STORE;
  }

  return {
    likes: dedupeLikeRecords(candidate.likes.filter(isLikeRecord)),
    schemaVersion: 1,
  };
}

async function readLikeStore(): Promise<LikeStore> {
  try {
    const serializedStore = await readFile(LIKE_STORE_PATH, "utf8");

    return parseLikeStore(JSON.parse(serializedStore));
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

async function writeLikeStore(store: LikeStore) {
  const tempPath = `${LIKE_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(LIKE_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, LIKE_STORE_PATH);
}

async function updateLikeStore<T>(
  updater: (store: LikeStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readLikeStore();
    const result = await updater(store);

    await writeLikeStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function getLikedPostIdsFromStore(store: LikeStore, user: string) {
  return store.likes
    .filter((record) => record.user === user)
    .map((record) => record.postId);
}

function validatePostId(postId: number) {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new LikeValidationError(
      "invalid_post_id",
      "Нужно выбрать пост для лайка."
    );
  }

  if (!POSTS.some((post) => post.id === postId)) {
    throw new LikeValidationError(
      "unknown_post",
      "Такого поста нет в ленте.",
      404
    );
  }

  return postId;
}

export async function getLikedPostIds(user = CURRENT_USER.handle) {
  const store = await readLikeStore();

  return getLikedPostIdsFromStore(store, user);
}

export async function getLikeCheck(postId: number): Promise<LikeCheckResponse> {
  const targetPostId = validatePostId(postId);
  const likedPostIds = await getLikedPostIds();

  return {
    currentUser: CURRENT_USER.handle,
    liked: likedPostIds.includes(targetPostId),
    likedPostIds,
    postId: targetPostId,
  };
}

export async function likePost(
  postId: number
): Promise<LikeMutationResponse> {
  const targetPostId = validatePostId(postId);

  return updateLikeStore((store) => {
    const alreadyLiked = store.likes.some(
      (record) =>
        record.user === CURRENT_USER.handle && record.postId === targetPostId
    );

    if (!alreadyLiked) {
      store.likes.push({
        createdAt: new Date().toISOString(),
        postId: targetPostId,
        user: CURRENT_USER.handle,
      });
    }

    return {
      currentUser: CURRENT_USER.handle,
      liked: true,
      likedPostIds: getLikedPostIdsFromStore(store, CURRENT_USER.handle),
      postId: targetPostId,
      changed: !alreadyLiked,
    };
  });
}

export async function unlikePost(
  postId: number
): Promise<LikeMutationResponse> {
  const targetPostId = validatePostId(postId);

  return updateLikeStore((store) => {
    const previousLength = store.likes.length;

    store.likes = store.likes.filter(
      (record) =>
        record.user !== CURRENT_USER.handle || record.postId !== targetPostId
    );

    return {
      currentUser: CURRENT_USER.handle,
      liked: false,
      likedPostIds: getLikedPostIdsFromStore(store, CURRENT_USER.handle),
      postId: targetPostId,
      changed: store.likes.length !== previousLength,
    };
  });
}
