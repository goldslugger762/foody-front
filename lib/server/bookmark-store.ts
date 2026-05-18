import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import type {
  BookmarkCheckResponse,
  FavoritePostsResponse,
  BookmarkMutationResponse,
} from "@/lib/feed-api";
import { POSTS, type Post } from "@/lib/mock-data";

type BookmarkRecord = {
  createdAt: string;
  postId: number;
  user: string;
};

type BookmarkStore = {
  bookmarks: BookmarkRecord[];
  schemaVersion: 1;
};

const BOOKMARK_STORE_PATH = join(process.cwd(), ".data", "bookmarks.json");
const EMPTY_STORE: BookmarkStore = {
  bookmarks: [],
  schemaVersion: 1,
};

let updateQueue: Promise<void> = Promise.resolve();

export class BookmarkValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function isBookmarkRecord(value: unknown): value is BookmarkRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof BookmarkRecord, unknown>>;

  return (
    typeof record.createdAt === "string" &&
    typeof record.postId === "number" &&
    Number.isInteger(record.postId) &&
    typeof record.user === "string"
  );
}

function dedupeBookmarkRecords(records: BookmarkRecord[]) {
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

function parseBookmarkStore(value: unknown): BookmarkStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const candidate = value as Partial<Record<keyof BookmarkStore, unknown>>;

  if (!Array.isArray(candidate.bookmarks)) {
    return EMPTY_STORE;
  }

  return {
    bookmarks: dedupeBookmarkRecords(
      candidate.bookmarks.filter(isBookmarkRecord)
    ),
    schemaVersion: 1,
  };
}

async function readBookmarkStore(): Promise<BookmarkStore> {
  try {
    const serializedStore = await readFile(BOOKMARK_STORE_PATH, "utf8");

    return parseBookmarkStore(JSON.parse(serializedStore));
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

async function writeBookmarkStore(store: BookmarkStore) {
  const tempPath = `${BOOKMARK_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(BOOKMARK_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, BOOKMARK_STORE_PATH);
}

async function updateBookmarkStore<T>(
  updater: (store: BookmarkStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readBookmarkStore();
    const result = await updater(store);

    await writeBookmarkStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function getSavedPostIdsFromStore(store: BookmarkStore, user: string) {
  return store.bookmarks
    .filter((record) => record.user === user)
    .map((record) => record.postId);
}

function getFavoriteRecordsFromStore(store: BookmarkStore, user: string) {
  return store.bookmarks
    .filter((record) => record.user === user)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function getPostById(postId: number) {
  return POSTS.find((post) => post.id === postId) ?? null;
}

function getFavoritePostsFromStore(store: BookmarkStore, user: string) {
  return getFavoriteRecordsFromStore(store, user)
    .map((record) => getPostById(record.postId))
    .filter((post): post is Post => post !== null);
}

function getRecentFavoriteTagsFromPosts(posts: Post[], limit: number) {
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

function validatePostId(postId: number) {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new BookmarkValidationError(
      "invalid_post_id",
      "Нужно выбрать пост для сохранения."
    );
  }

  if (!POSTS.some((post) => post.id === postId)) {
    throw new BookmarkValidationError(
      "unknown_post",
      "Такого поста нет в ленте.",
      404
    );
  }

  return postId;
}

export async function getSavedPostIds(user = CURRENT_USER.handle) {
  const store = await readBookmarkStore();

  return getSavedPostIdsFromStore(store, user);
}

export async function getFavoritePosts(user = CURRENT_USER.handle) {
  const store = await readBookmarkStore();

  return getFavoritePostsFromStore(store, user);
}

export async function getFavoritePostsCount(user = CURRENT_USER.handle) {
  const savedPostIds = await getSavedPostIds(user);

  return savedPostIds.length;
}

export async function getRecentFavoriteTags(
  user = CURRENT_USER.handle,
  limit = 20
) {
  const posts = await getFavoritePosts(user);

  return getRecentFavoriteTagsFromPosts(posts, limit);
}

export async function getFavoritePostsSnapshot(
  user = CURRENT_USER.handle,
  tagsLimit = 20,
  extra: Pick<
    FavoritePostsResponse,
    "followingUsers" | "likedPostIds"
  > = {
    followingUsers: [],
    likedPostIds: [],
  }
): Promise<FavoritePostsResponse> {
  const store = await readBookmarkStore();
  const posts = getFavoritePostsFromStore(store, user);
  const savedPostIds = getSavedPostIdsFromStore(store, user);

  return {
    currentUser: user,
    followingUsers: extra.followingUsers,
    likedPostIds: extra.likedPostIds,
    posts,
    recentFavoriteTags: getRecentFavoriteTagsFromPosts(posts, tagsLimit),
    savedPostIds,
    savedPostsCount: savedPostIds.length,
  };
}

export async function getBookmarkCheck(
  postId: number
): Promise<BookmarkCheckResponse> {
  const targetPostId = validatePostId(postId);
  const savedPostIds = await getSavedPostIds();

  return {
    currentUser: CURRENT_USER.handle,
    postId: targetPostId,
    saved: savedPostIds.includes(targetPostId),
    savedPostIds,
  };
}

export async function savePost(
  postId: number
): Promise<BookmarkMutationResponse> {
  const targetPostId = validatePostId(postId);

  return updateBookmarkStore((store) => {
    const alreadySaved = store.bookmarks.some(
      (record) =>
        record.user === CURRENT_USER.handle && record.postId === targetPostId
    );

    if (!alreadySaved) {
      store.bookmarks.push({
        createdAt: new Date().toISOString(),
        postId: targetPostId,
        user: CURRENT_USER.handle,
      });
    }

    return {
      currentUser: CURRENT_USER.handle,
      postId: targetPostId,
      saved: true,
      savedPostIds: getSavedPostIdsFromStore(store, CURRENT_USER.handle),
      savedPostsCount: getSavedPostIdsFromStore(store, CURRENT_USER.handle)
        .length,
      changed: !alreadySaved,
    };
  });
}

export async function unsavePost(
  postId: number
): Promise<BookmarkMutationResponse> {
  const targetPostId = validatePostId(postId);

  return updateBookmarkStore((store) => {
    const previousLength = store.bookmarks.length;

    store.bookmarks = store.bookmarks.filter(
      (record) =>
        record.user !== CURRENT_USER.handle || record.postId !== targetPostId
    );

    return {
      currentUser: CURRENT_USER.handle,
      postId: targetPostId,
      saved: false,
      savedPostIds: getSavedPostIdsFromStore(store, CURRENT_USER.handle),
      savedPostsCount: getSavedPostIdsFromStore(store, CURRENT_USER.handle)
        .length,
      changed: store.bookmarks.length !== previousLength,
    };
  });
}
