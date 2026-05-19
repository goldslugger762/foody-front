import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import type {
  DeleteCommentResponse,
  DeletedCommentsResponse,
} from "@/lib/feed-api";
import { COMMENTS_BY_POST_ID } from "@/lib/mock-data";

type DeletedCommentRecord = {
  commentId: string;
  deletedAt: string;
  user: string;
};

type CommentStore = {
  deletedComments: DeletedCommentRecord[];
  schemaVersion: 1;
};

const COMMENT_STORE_PATH = join(process.cwd(), ".data", "comments.json");

let updateQueue: Promise<void> = Promise.resolve();

export class CommentValidationError extends Error {
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

function createSeededStore(): CommentStore {
  return {
    deletedComments: [],
    schemaVersion: 1,
  };
}

function isDeletedCommentRecord(value: unknown): value is DeletedCommentRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof DeletedCommentRecord, unknown>>;

  return (
    typeof record.commentId === "string" &&
    typeof record.deletedAt === "string" &&
    typeof record.user === "string"
  );
}

function dedupeDeletedCommentRecords(records: DeletedCommentRecord[]) {
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

function parseCommentStore(value: unknown): CommentStore {
  if (!value || typeof value !== "object") {
    return createSeededStore();
  }

  const candidate = value as Partial<Record<keyof CommentStore, unknown>>;

  if (!Array.isArray(candidate.deletedComments)) {
    return createSeededStore();
  }

  return {
    deletedComments: dedupeDeletedCommentRecords(
      candidate.deletedComments.filter(isDeletedCommentRecord)
    ),
    schemaVersion: 1,
  };
}

async function readCommentStore(): Promise<CommentStore> {
  try {
    const serializedStore = await readFile(COMMENT_STORE_PATH, "utf8");

    return parseCommentStore(JSON.parse(serializedStore));
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

async function writeCommentStore(store: CommentStore) {
  const tempPath = `${COMMENT_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(COMMENT_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, COMMENT_STORE_PATH);
}

async function updateCommentStore<T>(
  updater: (store: CommentStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readCommentStore();
    const result = await updater(store);

    await writeCommentStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function getDeletedCommentIdsFromStore(store: CommentStore, user: string) {
  return store.deletedComments
    .filter((record) => record.user === user)
    .map((record) => record.commentId);
}

function validateOwnedCommentId(commentId: string) {
  const targetCommentId = commentId.trim();

  if (targetCommentId.length === 0) {
    throw new CommentValidationError(
      "invalid_comment_id",
      "Нужно выбрать комментарий для удаления."
    );
  }

  const targetComment = getAllKnownComments().find(
    (comment) => String(comment.id) === targetCommentId
  );

  if (!targetComment) {
    throw new CommentValidationError(
      "unknown_comment",
      "Такого комментария нет.",
      404
    );
  }

  if (targetComment.user !== CURRENT_USER.handle) {
    throw new CommentValidationError(
      "comment_not_owned",
      "Можно удалить только свой комментарий.",
      403
    );
  }

  return targetCommentId;
}

export async function getDeletedCommentIds(
  user = CURRENT_USER.handle,
  requestedCommentIds?: string[]
) {
  const store = await readCommentStore();
  const deletedCommentIds = getDeletedCommentIdsFromStore(store, user);

  if (!requestedCommentIds) {
    return deletedCommentIds;
  }

  const requestedCommentIdSet = new Set(requestedCommentIds);

  return deletedCommentIds.filter((commentId) =>
    requestedCommentIdSet.has(commentId)
  );
}

export async function getDeletedCommentsSnapshot(
  requestedCommentIds?: string[]
): Promise<DeletedCommentsResponse> {
  return {
    currentUser: CURRENT_USER.handle,
    deletedCommentIds: await getDeletedCommentIds(
      CURRENT_USER.handle,
      requestedCommentIds
    ),
  };
}

export async function deleteCommentById(
  commentId: string
): Promise<DeleteCommentResponse> {
  const targetCommentId = validateOwnedCommentId(commentId);

  return updateCommentStore((store) => {
    const alreadyDeleted = store.deletedComments.some(
      (record) =>
        record.user === CURRENT_USER.handle &&
        record.commentId === targetCommentId
    );

    if (!alreadyDeleted) {
      store.deletedComments.push({
        commentId: targetCommentId,
        deletedAt: new Date().toISOString(),
        user: CURRENT_USER.handle,
      });
    }

    return {
      changed: !alreadyDeleted,
      commentId: targetCommentId,
      currentUser: CURRENT_USER.handle,
      deletedCommentIds: getDeletedCommentIdsFromStore(
        store,
        CURRENT_USER.handle
      ),
    };
  });
}
