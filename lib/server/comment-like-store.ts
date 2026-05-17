import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import type {
  CommentLikeCheckResponse,
  CommentLikeMutationResponse,
} from "@/lib/feed-api";
import { COMMENTS_BY_POST_ID } from "@/lib/mock-data";

type CommentLikeRecord = {
  commentId: string;
  createdAt: string;
  user: string;
};

type CommentLikeStore = {
  commentLikes: CommentLikeRecord[];
  schemaVersion: 1;
};

const COMMENT_LIKE_STORE_PATH = join(
  process.cwd(),
  ".data",
  "comment-likes.json"
);

let updateQueue: Promise<void> = Promise.resolve();

export class CommentLikeValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function getAllKnownComments() {
  return Object.values(COMMENTS_BY_POST_ID).flat();
}

function createSeededStore(): CommentLikeStore {
  return {
    commentLikes: getAllKnownComments()
      .filter((comment) => comment.liked)
      .map((comment) => ({
        commentId: String(comment.id),
        createdAt: "seed",
        user: CURRENT_USER.handle,
      })),
    schemaVersion: 1,
  };
}

function getKnownCommentIds() {
  return new Set(getAllKnownComments().map((comment) => String(comment.id)));
}

function isCommentLikeRecord(value: unknown): value is CommentLikeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof CommentLikeRecord, unknown>>;

  return (
    typeof record.commentId === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.user === "string"
  );
}

function dedupeCommentLikeRecords(records: CommentLikeRecord[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = `${record.user}\n${record.commentId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseCommentLikeStore(value: unknown): CommentLikeStore {
  if (!value || typeof value !== "object") {
    return createSeededStore();
  }

  const candidate = value as Partial<Record<keyof CommentLikeStore, unknown>>;

  if (!Array.isArray(candidate.commentLikes)) {
    return createSeededStore();
  }

  return {
    commentLikes: dedupeCommentLikeRecords(
      candidate.commentLikes.filter(isCommentLikeRecord)
    ),
    schemaVersion: 1,
  };
}

async function readCommentLikeStore(): Promise<CommentLikeStore> {
  try {
    const serializedStore = await readFile(COMMENT_LIKE_STORE_PATH, "utf8");

    return parseCommentLikeStore(JSON.parse(serializedStore));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return createSeededStore();
    }

    throw error;
  }
}

async function writeCommentLikeStore(store: CommentLikeStore) {
  const tempPath = `${COMMENT_LIKE_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(COMMENT_LIKE_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, COMMENT_LIKE_STORE_PATH);
}

async function updateCommentLikeStore<T>(
  updater: (store: CommentLikeStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readCommentLikeStore();
    const result = await updater(store);

    await writeCommentLikeStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function getLikedCommentIdsFromStore(store: CommentLikeStore, user: string) {
  return store.commentLikes
    .filter((record) => record.user === user)
    .map((record) => record.commentId);
}

function validateCommentId(commentId: string) {
  const targetCommentId = commentId.trim();

  if (targetCommentId.length === 0) {
    throw new CommentLikeValidationError(
      "invalid_comment_id",
      "Нужно выбрать комментарий для лайка."
    );
  }

  if (!getKnownCommentIds().has(targetCommentId)) {
    throw new CommentLikeValidationError(
      "unknown_comment",
      "Такого комментария нет.",
      404
    );
  }

  return targetCommentId;
}

export async function getLikedCommentIds(
  user = CURRENT_USER.handle,
  requestedCommentIds?: string[]
) {
  const store = await readCommentLikeStore();
  const likedCommentIds = getLikedCommentIdsFromStore(store, user);

  if (!requestedCommentIds) {
    return likedCommentIds;
  }

  const requestedCommentIdSet = new Set(requestedCommentIds);

  return likedCommentIds.filter((commentId) =>
    requestedCommentIdSet.has(commentId)
  );
}

export async function getCommentLikeCheck(
  commentId: string
): Promise<CommentLikeCheckResponse> {
  const targetCommentId = validateCommentId(commentId);
  const likedCommentIds = await getLikedCommentIds();

  return {
    commentId: targetCommentId,
    currentUser: CURRENT_USER.handle,
    liked: likedCommentIds.includes(targetCommentId),
    likedCommentIds,
  };
}

export async function likeComment(
  commentId: string
): Promise<CommentLikeMutationResponse> {
  const targetCommentId = validateCommentId(commentId);

  return updateCommentLikeStore((store) => {
    const alreadyLiked = store.commentLikes.some(
      (record) =>
        record.user === CURRENT_USER.handle &&
        record.commentId === targetCommentId
    );

    if (!alreadyLiked) {
      store.commentLikes.push({
        commentId: targetCommentId,
        createdAt: new Date().toISOString(),
        user: CURRENT_USER.handle,
      });
    }

    return {
      commentId: targetCommentId,
      currentUser: CURRENT_USER.handle,
      liked: true,
      likedCommentIds: getLikedCommentIdsFromStore(
        store,
        CURRENT_USER.handle
      ),
      changed: !alreadyLiked,
    };
  });
}

export async function unlikeComment(
  commentId: string
): Promise<CommentLikeMutationResponse> {
  const targetCommentId = validateCommentId(commentId);

  return updateCommentLikeStore((store) => {
    const previousLength = store.commentLikes.length;

    store.commentLikes = store.commentLikes.filter(
      (record) =>
        record.user !== CURRENT_USER.handle ||
        record.commentId !== targetCommentId
    );

    return {
      commentId: targetCommentId,
      currentUser: CURRENT_USER.handle,
      liked: false,
      likedCommentIds: getLikedCommentIdsFromStore(
        store,
        CURRENT_USER.handle
      ),
      changed: store.commentLikes.length !== previousLength,
    };
  });
}
