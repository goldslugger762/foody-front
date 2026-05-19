"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Post, PostComment } from "@/lib/mock-data";

type CommentCountState = {
  addedCommentIds: string[];
  deletedCommentIds: string[];
};

export type CommentDeleteRollbackToken =
  | {
      commentId: string;
      type: "restore-added";
    }
  | {
      commentId: string;
      type: "remove-deleted";
    }
  | {
      commentId: string;
      type: "noop";
    };

const commentCountStateByPostId = new Map<Post["id"], CommentCountState>();
const listeners = new Set<() => void>();
const EMPTY_COMMENT_COUNT_STATE: CommentCountState = {
  addedCommentIds: [],
  deletedCommentIds: [],
};

function getCommentIdKey(commentId: PostComment["id"]) {
  return String(commentId);
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function normalizeIds(ids: Set<string>) {
  return Array.from(ids).sort();
}

function emitCommentCountChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getCommentCountState(postId: Post["id"]) {
  return commentCountStateByPostId.get(postId) ?? EMPTY_COMMENT_COUNT_STATE;
}

function updateCommentCountState(
  postId: Post["id"],
  updater: (
    addedCommentIds: Set<string>,
    deletedCommentIds: Set<string>
  ) => void
) {
  const currentState = getCommentCountState(postId);
  const addedCommentIds = new Set(currentState.addedCommentIds);
  const deletedCommentIds = new Set(currentState.deletedCommentIds);

  updater(addedCommentIds, deletedCommentIds);

  const nextState = {
    addedCommentIds: normalizeIds(addedCommentIds),
    deletedCommentIds: normalizeIds(deletedCommentIds),
  };

  if (
    areStringArraysEqual(
      currentState.addedCommentIds,
      nextState.addedCommentIds
    ) &&
    areStringArraysEqual(
      currentState.deletedCommentIds,
      nextState.deletedCommentIds
    )
  ) {
    return false;
  }

  if (
    nextState.addedCommentIds.length === 0 &&
    nextState.deletedCommentIds.length === 0
  ) {
    commentCountStateByPostId.delete(postId);
  } else {
    commentCountStateByPostId.set(postId, nextState);
  }

  emitCommentCountChange();

  return true;
}

function subscribeToCommentCount(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getPostCommentsCountSnapshot(
  postId: Post["id"],
  baseCount: number
) {
  const state = getCommentCountState(postId);

  return Math.max(
    baseCount + state.addedCommentIds.length - state.deletedCommentIds.length,
    0
  );
}

export function usePostCommentsCount(postId: Post["id"], baseCount: number) {
  const getSnapshot = useCallback(
    () => getPostCommentsCountSnapshot(postId, baseCount),
    [baseCount, postId]
  );

  return useSyncExternalStore(
    subscribeToCommentCount,
    getSnapshot,
    getSnapshot
  );
}

export function applyOptimisticCommentCreate(
  postId: Post["id"],
  commentId: PostComment["id"]
) {
  const targetCommentId = getCommentIdKey(commentId);

  updateCommentCountState(postId, (addedCommentIds, deletedCommentIds) => {
    deletedCommentIds.delete(targetCommentId);
    addedCommentIds.add(targetCommentId);
  });
}

export function rollbackOptimisticCommentCreate(
  postId: Post["id"],
  commentId: PostComment["id"]
) {
  const targetCommentId = getCommentIdKey(commentId);

  updateCommentCountState(postId, (addedCommentIds) => {
    addedCommentIds.delete(targetCommentId);
  });
}

export function applyOptimisticCommentDelete(
  postId: Post["id"],
  commentId: PostComment["id"]
): CommentDeleteRollbackToken {
  const targetCommentId = getCommentIdKey(commentId);
  const currentState = getCommentCountState(postId);

  if (currentState.addedCommentIds.includes(targetCommentId)) {
    updateCommentCountState(postId, (addedCommentIds) => {
      addedCommentIds.delete(targetCommentId);
    });

    return {
      commentId: targetCommentId,
      type: "restore-added",
    };
  }

  if (currentState.deletedCommentIds.includes(targetCommentId)) {
    return {
      commentId: targetCommentId,
      type: "noop",
    };
  }

  updateCommentCountState(postId, (_addedCommentIds, deletedCommentIds) => {
    deletedCommentIds.add(targetCommentId);
  });

  return {
    commentId: targetCommentId,
    type: "remove-deleted",
  };
}

export function rollbackOptimisticCommentDelete(
  postId: Post["id"],
  token: CommentDeleteRollbackToken
) {
  if (token.type === "noop") {
    return;
  }

  updateCommentCountState(postId, (addedCommentIds, deletedCommentIds) => {
    if (token.type === "restore-added") {
      addedCommentIds.add(token.commentId);
      return;
    }

    deletedCommentIds.delete(token.commentId);
  });
}
