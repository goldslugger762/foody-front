"use client";

import { ArrowRight, Heart, MoreHorizontal, Reply, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { UserAvatarProfileLink } from "@/components/feed/user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { createComment, deleteComment } from "@/lib/comments-service";
import {
  applyOptimisticCommentCreate,
  applyOptimisticCommentDelete,
  rollbackOptimisticCommentCreate,
  rollbackOptimisticCommentDelete,
} from "@/lib/comment-count-store";
import { CURRENT_USER as DEMO_CURRENT_USER } from "@/lib/current-user";
import { getReviewChromeStyle } from "@/components/review/review-screen-shell";
import {
  requestDeletedComments,
  requestCommentLikeMutation,
  requestCommentLikes,
} from "@/lib/feed-api";
import type { Post, PostComment } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { HEART_COLOR, canAnimate } from "./post-card/post-card-shared";

type CommentsSheetProps = {
  open: boolean;
  brand: string;
  comments: PostComment[];
  commentsCount: number;
  postId: Post["id"];
  shouldReduceMotion: boolean | null;
  onClose: () => void;
};

type CommentRowProps = {
  brand: string;
  comment: PostComment;
  liked: boolean;
  likePending: boolean;
  deletePending: boolean;
  canDelete: boolean;
  onLikeToggle: (comment: PostComment, nextLiked: boolean) => void;
  onReply: (comment: PostComment) => void;
  onDeleteRequest: (comment: PostComment) => void;
  shouldReduceMotion: boolean | null;
};

type CreateCommentPayload = {
  text: string;
  replyToCommentId?: PostComment["id"];
  replyToUser?: string;
};

const SHEET_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;
const OVERLAY_TRANSITION = { duration: 0.22, ease: "easeOut" } as const;
// MVP: timestamps are hidden in the sheet, but can be restored by flipping this.
const SHOW_COMMENT_TIMESTAMPS = false;
const CURRENT_USER: PostComment = {
  id: 0,
  user: DEMO_CURRENT_USER.handle,
  realName: DEMO_CURRENT_USER.realName,
  when: "только что",
  text: "",
  likes: 0,
};

function getDisplayHandle(user: string) {
  return user.startsWith("@") ? user : `@${user}`;
}

function getCommentIdKey(id: PostComment["id"]) {
  return String(id);
}

function isSameComment(left: PostComment, right: PostComment) {
  return (
    getCommentIdKey(left.id) === getCommentIdKey(right.id) ||
    (Boolean(left.clientId) && left.clientId === right.clientId)
  );
}

function isCommentDescendantOf(
  comment: PostComment,
  ancestorId: PostComment["id"],
  commentsById: Map<string, PostComment>
) {
  const ancestorKey = getCommentIdKey(ancestorId);
  const visitedCommentIds = new Set<string>();
  let currentParentId = comment.replyToCommentId;

  while (currentParentId !== undefined) {
    const currentParentKey = getCommentIdKey(currentParentId);

    if (currentParentKey === ancestorKey) {
      return true;
    }

    if (visitedCommentIds.has(currentParentKey)) {
      return false;
    }

    visitedCommentIds.add(currentParentKey);
    currentParentId = commentsById.get(currentParentKey)?.replyToCommentId;
  }

  return false;
}

function mergeCommentsWithSubmitted(
  comments: PostComment[],
  submittedComments: PostComment[]
) {
  const orderedComments = [...comments];

  for (const submittedComment of submittedComments) {
    if (
      orderedComments.some((comment) => isSameComment(comment, submittedComment))
    ) {
      continue;
    }

    const parentCommentId = submittedComment.replyToCommentId;

    if (parentCommentId === undefined) {
      orderedComments.push(submittedComment);
      continue;
    }

    const parentCommentIndex = orderedComments.findIndex(
      (comment) => getCommentIdKey(comment.id) === getCommentIdKey(parentCommentId)
    );

    if (parentCommentIndex === -1) {
      orderedComments.push(submittedComment);
      continue;
    }

    const commentsById = new Map(
      orderedComments.map((comment) => [getCommentIdKey(comment.id), comment])
    );
    let insertIndex = parentCommentIndex;

    while (
      insertIndex + 1 < orderedComments.length &&
      isCommentDescendantOf(
        orderedComments[insertIndex + 1],
        parentCommentId,
        commentsById
      )
    ) {
      insertIndex += 1;
    }

    orderedComments.splice(insertIndex + 1, 0, submittedComment);
  }

  return orderedComments;
}

function createClientCommentId() {
  if (globalThis.crypto?.randomUUID) {
    return `local-${globalThis.crypto.randomUUID()}`;
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createOptimisticComment(payload: CreateCommentPayload): PostComment {
  const clientId = createClientCommentId();

  return {
    ...CURRENT_USER,
    id: clientId,
    clientId,
    replyTo: payload.replyToUser,
    replyToCommentId: payload.replyToCommentId,
    status: "sending",
    text: payload.text,
  };
}

function getPersistedCommentIds(comments: PostComment[]) {
  return comments
    .filter((comment) => !comment.clientId)
    .map((comment) => comment.id);
}

function isCurrentUserComment(comment: PostComment) {
  return comment.user === DEMO_CURRENT_USER.handle;
}

function CommentAvatar({
  comment,
  size = 42,
  className,
}: {
  comment: PostComment;
  size?: number;
  className?: string;
}) {
  return (
    <UserAvatarProfileLink
      ariaLabel={`Открыть профиль ${getDisplayHandle(comment.user)}`}
      className="shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.55)] after:hidden"
      linkClassName={className}
      name={comment.user}
      size={size}
      src={comment.avatarUrl}
    />
  );
}

export function CommentsSheet({
  open,
  brand,
  comments,
  commentsCount,
  postId,
  shouldReduceMotion,
  onClose,
}: CommentsSheetProps) {
  const [draft, setDraft] = useState("");
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [commentLikesLoaded, setCommentLikesLoaded] = useState(false);
  const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [localLikedCommentIds, setLocalLikedCommentIds] = useState<string[]>(
    []
  );
  const [pendingLikedCommentIds, setPendingLikedCommentIds] = useState<
    Set<string>
  >(() => new Set());
  const [pendingDeletedCommentIds, setPendingDeletedCommentIds] = useState<
    Set<string>
  >(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<PostComment | null>(null);
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);
  const [submittedComments, setSubmittedComments] = useState<PostComment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const mergedComments = useMemo(
    () => mergeCommentsWithSubmitted(comments, submittedComments),
    [comments, submittedComments]
  );
  const deletedCommentIdsSet = useMemo(
    () => new Set(deletedCommentIds),
    [deletedCommentIds]
  );
  const visibleComments = useMemo(
    () =>
      mergedComments.filter(
        (comment) => !deletedCommentIdsSet.has(getCommentIdKey(comment.id))
      ),
    [deletedCommentIdsSet, mergedComments]
  );
  const visibleCommentsCount = Math.max(
    commentsCount,
    visibleComments.length
  );
  const likedCommentIdsSet = useMemo(
    () => new Set(likedCommentIds),
    [likedCommentIds]
  );
  const localLikedCommentIdsSet = useMemo(
    () => new Set(localLikedCommentIds),
    [localLikedCommentIds]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const commentIds = getPersistedCommentIds(mergedComments);

    if (commentIds.length === 0) {
      return;
    }

    let isActive = true;

    void requestDeletedComments(commentIds)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setDeletedCommentIds(response.deletedCommentIds);

        for (const deletedCommentId of response.deletedCommentIds) {
          applyOptimisticCommentDelete(postId, deletedCommentId);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setCommentError("Не удалось обновить список комментариев.");
      });

    return () => {
      isActive = false;
    };
  }, [mergedComments, open, postId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const commentIds = getPersistedCommentIds(visibleComments);

    if (commentIds.length === 0) {
      return;
    }

    let isActive = true;

    void requestCommentLikes(commentIds)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setLikedCommentIds(response.likedCommentIds);
        setCommentLikesLoaded(true);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLikedCommentIds(
          visibleComments
            .filter((comment) => comment.liked)
            .map((comment) => getCommentIdKey(comment.id))
        );
        setCommentLikesLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, [open, visibleComments]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setReplyTarget(null);
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";

    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const maxHeight = lineHeight * 5 + paddingTop + paddingBottom;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft, open]);

  function closeSheet() {
    setReplyTarget(null);
    onClose();
  }

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeSheet();
    }
  }

  function handleReply(comment: PostComment) {
    setReplyTarget(comment);
    textareaRef.current?.focus();
  }

  async function handleLikeToggle(comment: PostComment, nextLiked: boolean) {
    const commentId = getCommentIdKey(comment.id);

    if (comment.clientId) {
      setLocalLikedCommentIds((currentCommentIds) => {
        const nextCommentIds = new Set(currentCommentIds);

        if (nextLiked) {
          nextCommentIds.add(commentId);
        } else {
          nextCommentIds.delete(commentId);
        }

        return Array.from(nextCommentIds);
      });
      return;
    }

    if (pendingLikedCommentIds.has(commentId)) {
      return;
    }

    setPendingLikedCommentIds((currentCommentIds) => {
      const nextCommentIds = new Set(currentCommentIds);
      nextCommentIds.add(commentId);

      return nextCommentIds;
    });

    try {
      const result = await requestCommentLikeMutation(comment.id, nextLiked);

      setLikedCommentIds(result.likedCommentIds);
    } catch {
      return;
    } finally {
      setPendingLikedCommentIds((currentCommentIds) => {
        const nextCommentIds = new Set(currentCommentIds);
        nextCommentIds.delete(commentId);

        return nextCommentIds;
      });
    }
  }

  function handleDeleteRequest(comment: PostComment) {
    setCommentError(null);
    setDeleteTarget(comment);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    const commentId = getCommentIdKey(deleteTarget.id);

    if (pendingDeletedCommentIds.has(commentId)) {
      return;
    }

    setCommentError(null);
    const rollbackToken = applyOptimisticCommentDelete(postId, deleteTarget.id);

    setReplyTarget((currentTarget) =>
      currentTarget && isSameComment(currentTarget, deleteTarget)
        ? null
        : currentTarget
    );
    setDeletedCommentIds((currentCommentIds) =>
      currentCommentIds.includes(commentId)
        ? currentCommentIds
        : [...currentCommentIds, commentId]
    );
    setPendingDeletedCommentIds((currentCommentIds) => {
      const nextCommentIds = new Set(currentCommentIds);
      nextCommentIds.add(commentId);

      return nextCommentIds;
    });

    try {
      await deleteComment(deleteTarget.id);

      if (deleteTarget.clientId) {
        setSubmittedComments((currentComments) =>
          currentComments.filter((comment) => !isSameComment(comment, deleteTarget))
        );
      }
    } catch (error) {
      rollbackOptimisticCommentDelete(postId, rollbackToken);
      setDeletedCommentIds((currentCommentIds) =>
        currentCommentIds.filter((currentCommentId) => currentCommentId !== commentId)
      );
      setCommentError(
        error instanceof Error
          ? error.message
          : "Не удалось удалить комментарий."
      );
    } finally {
      setDeleteTarget(null);
      setPendingDeletedCommentIds((currentCommentIds) => {
        const nextCommentIds = new Set(currentCommentIds);
        nextCommentIds.delete(commentId);

        return nextCommentIds;
      });
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const text = draft.trim();

    if (!text) {
      return;
    }

    const nextComment = createOptimisticComment({
      text,
      replyToCommentId: replyTarget?.id,
      replyToUser: replyTarget?.user,
    });
    const nextCommentId = getCommentIdKey(nextComment.id);

    setCommentError(null);
    applyOptimisticCommentCreate(postId, nextComment.id);
    setSubmittedComments((currentComments) => [...currentComments, nextComment]);
    setDraft("");
    setReplyTarget(null);

    try {
      const result = await createComment({
        comment: nextComment,
        postId,
      });

      setSubmittedComments((currentComments) =>
        currentComments.map((currentComment) =>
          isSameComment(currentComment, nextComment)
            ? result.comment
            : currentComment
        )
      );
    } catch (error) {
      rollbackOptimisticCommentCreate(postId, nextComment.id);
      setSubmittedComments((currentComments) =>
        currentComments.filter(
          (currentComment) =>
            !isSameComment(currentComment, nextComment) &&
            getCommentIdKey(currentComment.id) !== nextCommentId
        )
      );
      setCommentError(
        error instanceof Error
          ? error.message
          : "Не удалось добавить комментарий."
      );
    }
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex h-[100dvh] w-screen items-end justify-center overflow-hidden bg-black/42 px-0 pt-10 [-webkit-tap-highlight-color:transparent]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={OVERLAY_TRANSITION}
          onClick={handleBackdropClick}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="comments-sheet-title"
            className={cn(
              "flex h-[min(86dvh,46rem)] w-full max-w-[33rem] flex-col overflow-hidden rounded-t-[30px] bg-white font-sans text-[#020403]",
              "shadow-[0_-18px_54px_rgba(0,0,0,0.24)] ring-1 ring-black/[0.04]",
              "max-[430px]:h-[88dvh] max-[430px]:rounded-t-[28px]"
            )}
            initial={shouldAnimate ? { y: "100%" } : { y: 0 }}
            animate={{ y: 0 }}
            exit={shouldAnimate ? { y: "100%" } : { opacity: 0 }}
            transition={SHEET_TRANSITION}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 flex-col border-b border-black/[0.06] px-7 pt-3.5 pb-5 max-[430px]:px-5">
              <div
                aria-hidden="true"
                className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-[#D9DADC]"
              />
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="comments-sheet-title"
                  className="min-w-0 text-[20px] leading-tight font-extrabold tracking-normal text-black"
                >
                  Комментарии{" "}
                  <span className="align-baseline text-[11px] font-extrabold text-[#98A1AA] tabular-nums">
                    {visibleCommentsCount}
                  </span>
                </h2>
                <motion.button
                  type="button"
                  aria-label="Закрыть комментарии"
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-black outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-black/15"
                  whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                  onClick={closeSheet}
                >
                  <X className="size-6" strokeWidth={2.3} />
                </motion.button>
              </div>
            </div>

            <div className="hide-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-6 max-[430px]:px-5">
              <AnimatePresence initial={false}>
                {commentError && (
                  <motion.div
                    role="alert"
                    className="mb-4 rounded-[18px] border border-[#F5B7B1]/60 bg-[#FFF2F0] px-4 py-3 font-[family-name:var(--font-roboto)] text-[13.5px] leading-snug font-bold text-[#A13D34] shadow-[inset_1px_1px_0_rgba(255,255,255,0.7)]"
                    initial={shouldAnimate ? { opacity: 0, y: -6 } : { opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldAnimate ? { opacity: 0, y: -6 } : { opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    {commentError}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-7">
                <AnimatePresence initial={false}>
                  {visibleComments.map((comment) => (
                    <CommentRow
                      key={comment.id}
                      brand={brand}
                      comment={comment}
                      liked={
                        comment.clientId
                          ? localLikedCommentIdsSet.has(getCommentIdKey(comment.id))
                          : commentLikesLoaded
                            ? likedCommentIdsSet.has(getCommentIdKey(comment.id))
                            : Boolean(comment.liked)
                      }
                      likePending={pendingLikedCommentIds.has(
                        getCommentIdKey(comment.id)
                      )}
                      deletePending={pendingDeletedCommentIds.has(
                        getCommentIdKey(comment.id)
                      )}
                      canDelete={isCurrentUserComment(comment)}
                      onLikeToggle={handleLikeToggle}
                      onReply={handleReply}
                      onDeleteRequest={handleDeleteRequest}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="shrink-0 border-t border-black/[0.06] bg-white px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] max-[430px]:px-4">
              <AnimatePresence initial={false}>
                {replyTarget && (
                  <motion.div
                    key="reply-target"
                    className="mb-2 flex h-8 items-center gap-2 rounded-full bg-[#F1F3F4] px-3 text-[13px] font-bold text-[#6F7882]"
                    initial={shouldAnimate ? { opacity: 0, y: 5 } : { opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldAnimate ? { opacity: 0, y: 5 } : { opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <Reply className="size-3.5 shrink-0" strokeWidth={2.4} />
                    <span className="min-w-0 flex-1 truncate">
                      {getDisplayHandle(replyTarget.user)}
                    </span>
                    <button
                      type="button"
                      aria-label="Отменить ответ"
                      className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#8B949E] outline-none transition-colors hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-black/10"
                      onClick={() => setReplyTarget(null)}
                    >
                      <X className="size-3.5" strokeWidth={2.4} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                className="flex items-end gap-2.5"
                onSubmit={(event) => void handleSubmit(event)}
              >
                <CommentAvatar
                  comment={CURRENT_USER}
                  size={40}
                  className="mb-0.5"
                />
                <div className="flex min-h-10 min-w-0 flex-1 items-start overflow-hidden rounded-[20px] bg-[#F3F5F6] px-4 py-2 transition-colors focus-within:bg-[#EFF2F0]">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={draft}
                    aria-label={
                      replyTarget
                        ? `Ответить ${getDisplayHandle(replyTarget.user)}`
                        : "Добавить комментарий"
                    }
                    placeholder={
                      replyTarget
                        ? `Ответить ${getDisplayHandle(replyTarget.user)}...`
                        : "Добавить комментарий..."
                    }
                    className="hide-scroll block max-h-[7.5rem] min-h-6 w-full min-w-0 resize-none overflow-x-hidden bg-transparent p-0 font-[family-name:var(--font-roboto)] text-[15px] leading-6 font-medium break-words whitespace-pre-wrap text-[#15291C] outline-none placeholder:text-[#8F98A3]"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleDraftKeyDown}
                  />
                </div>
                <motion.button
                  type="submit"
                  aria-label="Отправить комментарий"
                  disabled={draft.trim().length === 0}
                  className="relative grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-transparent text-[#0B2F1D] shadow-[inset_1px_1px_0_rgba(255,255,255,0.18),inset_-1px_-1px_0_rgba(11,47,29,0.05)] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] transition-opacity focus-visible:ring-2 focus-visible:ring-[#15291C]/18 disabled:cursor-default disabled:opacity-45 [-webkit-tap-highlight-color:transparent]"
                  style={{
                    boxShadow: `0 8px 18px ${brand}1F, inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)`,
                  }}
                  whileTap={shouldAnimate && draft.trim() ? { scale: 0.92 } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(140deg, color-mix(in srgb, ${brand} 60%, transparent), rgba(122,236,164,0.92), rgba(100,218,189,0.60), color-mix(in srgb, ${brand} 88%, transparent))`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-px rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.36),rgba(226,255,235,0.22))]"
                  />
                  <ArrowRight
                    className="relative z-[1] size-5"
                    color="#020403"
                    strokeWidth={2.8}
                  />
                </motion.button>
              </form>
            </div>
          </motion.section>
          <AlertDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(nextOpen) => {
              if (!nextOpen && !pendingDeletedCommentIds.size) {
                setDeleteTarget(null);
              }
            }}
          >
            <AlertDialogContent className="z-[120] rounded-[24px] border-0 bg-white/88 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
              <AlertDialogHeader className="place-items-start text-left">
                <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
                  Удалить комментарий?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
                  Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
                <AlertDialogCancel
                  disabled={
                    deleteTarget
                      ? pendingDeletedCommentIds.has(getCommentIdKey(deleteTarget.id))
                      : false
                  }
                  className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
                  style={getReviewChromeStyle(brand)}
                >
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#8F1D1D] shadow-[0_8px_20px_rgba(60,20,20,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-red-900/15"
                  disabled={
                    deleteTarget
                      ? pendingDeletedCommentIds.has(getCommentIdKey(deleteTarget.id))
                      : false
                  }
                  style={{
                    background:
                      "linear-gradient(#FFFFFF,#FFFFFF) padding-box, linear-gradient(140deg, rgba(127,29,29,0.76), rgba(185,28,28,0.44), rgba(239,68,68,0.24), rgba(127,29,29,0.68)) border-box",
                    boxShadow:
                      "0 6px 14px rgba(60,20,20,0.07), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(47,11,11,0.05)",
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDeleteConfirm();
                  }}
                >
                  {deleteTarget &&
                  pendingDeletedCommentIds.has(getCommentIdKey(deleteTarget.id)) ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Удалить
                    </span>
                  ) : (
                    "Удалить"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function CommentRow({
  brand,
  comment,
  liked,
  likePending,
  deletePending,
  canDelete,
  onLikeToggle,
  onReply,
  onDeleteRequest,
  shouldReduceMotion,
}: CommentRowProps) {
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const likeCount = comment.likes + (liked ? 1 : 0) - (comment.liked ? 1 : 0);

  return (
    <motion.article
      layout
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_2.25rem] gap-x-3",
        comment.replyTo && "pl-11 max-[430px]:pl-8"
      )}
      initial={shouldAnimate ? { opacity: 0, y: 8 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, x: -18, scale: 0.98 } : { opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <CommentAvatar comment={comment} size={42} className="mt-0.5" />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-[15.5px] leading-tight font-extrabold tracking-normal text-black">
              {comment.realName}
            </span>
            {SHOW_COMMENT_TIMESTAMPS && (
              <span className="shrink-0 text-[12px] leading-tight font-bold text-[#99A1AB]">
                {comment.when}
              </span>
            )}
          </div>
        </div>

        <p className="mt-1 font-[family-name:var(--font-roboto)] text-[15.5px] leading-[1.46] font-medium text-black">
          {comment.replyTo && (
            <>
              <span className="font-medium" style={{ color: brand }}>
                {getDisplayHandle(comment.replyTo)}
              </span>{" "}
            </>
          )}
          {comment.text}
        </p>

        <motion.button
          type="button"
          className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-[12.5px] leading-tight font-extrabold text-[#65707A] outline-none transition-colors hover:text-[#15291C] focus-visible:ring-2 focus-visible:ring-black/10"
          whileHover={shouldAnimate ? { y: 1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.96, y: 4 } : undefined}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onClick={() => onReply(comment)}
        >
          Ответить
        </motion.button>
      </div>

      <div className="mt-0.5 flex w-8 flex-col items-center">
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Ещё"
                aria-label="Ещё"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[9px] bg-transparent text-[#8B949E] outline-none transition-colors hover:text-[#65707A] focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
              >
                <motion.span
                  className="grid size-4 place-items-center"
                  whileHover={shouldAnimate ? { y: -1, scale: 1.04 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.88 } : undefined}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <MoreHorizontal className="size-4" strokeWidth={2} />
                </motion.span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={7}
              className={cn(
                "z-[130] w-[178px] translate-x-1.5 rounded-[15px] border-0 bg-[#FFF8FC] p-1.5 text-[#15291C] outline-none ring-0",
                "shadow-[0_12px_28px_rgba(20,40,28,0.16)]",
                "backdrop-blur-none backdrop-saturate-100",
                "data-open:animate-none data-closed:animate-none data-open:zoom-in-100 data-closed:zoom-out-100"
              )}
            >
              <DropdownMenuItem
                variant="destructive"
                disabled={deletePending}
                className={cn(
                  "h-10 cursor-pointer rounded-[12px] px-2.5 text-[13px] font-extrabold tracking-[0px] text-[#B63B34] outline-none",
                  "focus:bg-[#15291C]/8 focus:text-[#9F2E28]",
                  "data-[highlighted]:bg-[#15291C]/8 data-[highlighted]:text-[#9F2E28]",
                  "active:bg-[#15291C]/10"
                )}
                onSelect={() => {
                  onDeleteRequest(comment);
                }}
              >
                <Trash2 className="size-4 text-[#E5443B]" strokeWidth={2.2} />
                <span>Удалить</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          type="button"
          aria-label="Нравится комментарий"
          aria-busy={likePending}
          aria-pressed={liked}
          disabled={likePending}
          className="mt-0.5 flex h-11 w-8 cursor-pointer flex-col items-center justify-start rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onLikeToggle(comment, !liked)}
        >
          <motion.span
            className="grid size-5 place-items-center"
            whileTap={shouldAnimate ? { scale: 0.84 } : undefined}
            animate={liked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Heart
              className="size-5"
              strokeWidth={2}
              color={liked ? HEART_COLOR : "#8B949E"}
              fill={liked ? HEART_COLOR : "none"}
            />
          </motion.span>
          <span className="mt-0.5 text-[11px] leading-none font-bold text-[#65707A] tabular-nums">
          {likeCount}
          </span>
        </button>
      </div>
    </motion.article>
  );
}
