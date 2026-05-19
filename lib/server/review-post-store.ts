import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { CURRENT_USER } from "@/lib/current-user";
import { POSTS, type Post, type PostStatus } from "@/lib/mock-data";

export type CreateReviewPostInput = {
  address: string;
  categoryLabel?: string | null;
  clientId?: string | null;
  dish: string;
  photoUrls: string[];
  place: string;
  price: string;
  rating: number;
  tags: string[];
  text: string;
};

type ReviewPostStore = {
  posts: Post[];
  schemaVersion: 1;
};

const REVIEW_POST_STORE_PATH = join(process.cwd(), ".data", "review-posts.json");
const EMPTY_STORE: ReviewPostStore = {
  posts: [],
  schemaVersion: 1,
};
const MAX_TEXT_LENGTH = 2500;
const MAX_TAGS = 3;
const MAX_PHOTOS = 10;
const MAX_PHOTO_URL_LENGTH = 700_000;
const MODERATABLE_STATUSES = new Set<PostStatus>([
  "pending_moderation",
  "approved",
  "rejected",
]);

let updateQueue: Promise<void> = Promise.resolve();

export class ReviewPostValidationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function isPostStatus(value: unknown): value is PostStatus {
  return (
    value === "pending_moderation" ||
    value === "approved" ||
    value === "rejected"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReviewPost(value: unknown): value is Post {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof Post, unknown>>;

  return (
    typeof record.id === "number" &&
    Number.isInteger(record.id) &&
    typeof record.user === "string" &&
    typeof record.realName === "string" &&
    typeof record.when === "string" &&
    typeof record.dish === "string" &&
    typeof record.place === "string" &&
    typeof record.rating === "number" &&
    typeof record.price === "string" &&
    typeof record.text === "string" &&
    isStringArray(record.tags) &&
    typeof record.photos === "number" &&
    Number.isInteger(record.photos) &&
    typeof record.likes === "number" &&
    Number.isInteger(record.likes) &&
    typeof record.comments === "number" &&
    Number.isInteger(record.comments) &&
    typeof record.seed === "number" &&
    Number.isInteger(record.seed) &&
    isPostStatus(record.status) &&
    (record.photoUrls === undefined || isStringArray(record.photoUrls))
  );
}

function dedupePosts(posts: Post[]) {
  const seenPostIds = new Set<number>();

  return posts.filter((post) => {
    if (seenPostIds.has(post.id)) {
      return false;
    }

    seenPostIds.add(post.id);
    return true;
  });
}

function parseReviewPostStore(value: unknown): ReviewPostStore {
  if (!value || typeof value !== "object") {
    return EMPTY_STORE;
  }

  const candidate = value as Partial<Record<keyof ReviewPostStore, unknown>>;

  if (!Array.isArray(candidate.posts)) {
    return EMPTY_STORE;
  }

  return {
    posts: dedupePosts(candidate.posts.filter(isReviewPost)),
    schemaVersion: 1,
  };
}

async function readReviewPostStore(): Promise<ReviewPostStore> {
  try {
    const serializedStore = await readFile(REVIEW_POST_STORE_PATH, "utf8");

    return parseReviewPostStore(JSON.parse(serializedStore));
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

async function writeReviewPostStore(store: ReviewPostStore) {
  const tempPath = `${REVIEW_POST_STORE_PATH}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(REVIEW_POST_STORE_PATH), { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, REVIEW_POST_STORE_PATH);
}

async function updateReviewPostStore<T>(
  updater: (store: ReviewPostStore) => T | Promise<T>
) {
  const queuedUpdate = updateQueue.then(async () => {
    const store = await readReviewPostStore();
    const result = await updater(store);

    await writeReviewPostStore(store);

    return result;
  });

  updateQueue = queuedUpdate.then(
    () => undefined,
    () => undefined
  );

  return queuedUpdate;
}

function normalizeRequiredText(value: string, code: string, message: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new ReviewPostValidationError(code, message);
  }

  return normalized;
}

function normalizePrice(value: string) {
  const price = normalizeRequiredText(
    value,
    "invalid_price",
    "Укажите стоимость блюда."
  );

  return /^₽/.test(price) ? price : `₽${price}`;
}

function normalizeTags(tags: string[]) {
  const normalizedTags = tags
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, MAX_TAGS)
    .map((tag) => `#${tag}`);

  if (normalizedTags.length === 0) {
    throw new ReviewPostValidationError(
      "invalid_tags",
      "Добавьте хотя бы один тэг."
    );
  }

  return Array.from(new Set(normalizedTags));
}

function normalizePhotoUrls(photoUrls: string[]) {
  return photoUrls
    .filter((photoUrl) => photoUrl.startsWith("data:image/"))
    .filter((photoUrl) => photoUrl.length <= MAX_PHOTO_URL_LENGTH)
    .slice(0, MAX_PHOTOS);
}

function getNextPostId(store: ReviewPostStore) {
  return Math.max(0, ...POSTS.map((post) => post.id), ...store.posts.map((post) => post.id)) + 1;
}

function validateCreateReviewPostInput(input: CreateReviewPostInput) {
  const dish = normalizeRequiredText(
    input.dish,
    "invalid_dish",
    "Укажите название блюда."
  );
  const placeName = normalizeRequiredText(
    input.place,
    "invalid_place",
    "Укажите заведение."
  );
  const address = normalizeRequiredText(
    input.address,
    "invalid_address",
    "Укажите адрес заведения."
  );
  const text = normalizeRequiredText(
    input.text,
    "invalid_review",
    "Напишите отзыв."
  );
  const photoUrls = normalizePhotoUrls(input.photoUrls);

  if (text.length > MAX_TEXT_LENGTH) {
    throw new ReviewPostValidationError(
      "review_too_long",
      "Отзыв слишком длинный."
    );
  }

  if (!Number.isFinite(input.rating) || input.rating <= 0 || input.rating > 5) {
    throw new ReviewPostValidationError(
      "invalid_rating",
      "Поставьте оценку от 1 до 5."
    );
  }

  if (photoUrls.length === 0) {
    throw new ReviewPostValidationError(
      "invalid_photos",
      "Добавьте хотя бы одну фотографию."
    );
  }

  return {
    dish,
    photoUrls,
    place: `${placeName} · ${address}`,
    price: normalizePrice(input.price),
    rating: Math.round(input.rating * 10) / 10,
    tags: normalizeTags(input.tags),
    text,
  };
}

export function isPostVisibleInFeed(post: Post) {
  return post.status === "approved";
}

export function isPostPendingModeration(post: Post) {
  return post.status === "pending_moderation";
}

export async function getAllPosts() {
  const store = await readReviewPostStore();

  return [...POSTS, ...store.posts];
}

export async function getKnownPostById(postId: number) {
  const posts = await getAllPosts();

  return posts.find((post) => post.id === postId) ?? null;
}

export async function getFeedPosts() {
  const posts = await getAllPosts();

  return posts.filter(isPostVisibleInFeed);
}

export async function getMyPosts(userId = CURRENT_USER.handle) {
  const posts = await getAllPosts();
  const isCurrentUserProfile = userId === CURRENT_USER.handle;

  return posts.filter(
    (post) =>
      post.user === userId &&
      (isCurrentUserProfile || isPostVisibleInFeed(post))
  );
}

export async function createReviewPost(input: CreateReviewPostInput) {
  const data = validateCreateReviewPostInput(input);

  // TODO: replace this mock persistence with a real review creation endpoint.
  return updateReviewPostStore((store) => {
    const post: Post = {
      ...data,
      clientId: input.clientId ?? undefined,
      comments: 0,
      id: getNextPostId(store),
      likes: 0,
      photos: data.photoUrls.length,
      realName: CURRENT_USER.realName,
      seed: Date.now() % 997,
      status: "pending_moderation",
      user: CURRENT_USER.handle,
      when: "только что",
    };

    store.posts.unshift(post);

    return post;
  });
}

export async function moderatePost(postId: number, status: PostStatus) {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new ReviewPostValidationError(
      "invalid_post_id",
      "Нужно выбрать пост для модерации."
    );
  }

  if (!MODERATABLE_STATUSES.has(status)) {
    throw new ReviewPostValidationError(
      "invalid_status",
      "Неизвестный статус модерации."
    );
  }

  // TODO: protect this mock moderation endpoint with real moderator auth.
  return updateReviewPostStore((store) => {
    const targetPost = store.posts.find((post) => post.id === postId);

    if (!targetPost) {
      throw new ReviewPostValidationError(
        "post_not_found",
        "Пост для модерации не найден.",
        404
      );
    }

    targetPost.status = status;

    return targetPost;
  });
}
