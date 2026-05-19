import { readApiJson } from "@/lib/feed-api";
import { getUserProfileHref, type UserProfile } from "@/lib/profile-data";
import type { Post } from "@/lib/mock-data";

export type UserProfileResponse = {
  currentUser: string | null;
  followingUsers: string[];
  isFollowing: boolean;
  likedPostIds: number[];
  profile: UserProfile;
  savedPostIds: number[];
};

export type UserPostsResponse = {
  currentUser: string | null;
  posts: Post[];
  userId: string;
};

export type UpdateUserProfileInput = {
  about: string | null;
  avatarUrl?: string | null;
  city: string | null;
  displayName: string;
  username: string;
};

export type UploadUserAvatarResponse = {
  avatarUrl: string;
};

export async function getCurrentUserProfile() {
  const response = await fetch("/api/profile", {
    cache: "no-store",
  });

  return readApiJson<UserProfileResponse>(response);
}

export async function getUserProfile(userId: string) {
  const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });

  return readApiJson<UserProfileResponse>(response);
}

export async function getUserPosts(userId: string) {
  const response = await fetch(
    `/api/profile/${encodeURIComponent(userId)}/posts`,
    {
      cache: "no-store",
    }
  );

  return readApiJson<UserPostsResponse>(response);
}

export async function updateUserProfile(data: UpdateUserProfileInput) {
  const response = await fetch("/api/profile", {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return readApiJson<UserProfileResponse>(response);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Не удалось прочитать фото."));
    };
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать фото."));
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadUserAvatar(
  file: File
): Promise<UploadUserAvatarResponse> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Выберите изображение для фото профиля.");
  }

  // TODO: replace this mock upload with a real multipart endpoint.
  // The edit screen calls this only during save, so switching to backend upload
  // later will not change the form flow.
  return {
    avatarUrl: await readFileAsDataUrl(file),
  };
}

async function copyTextToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const fallbackField = document.createElement("textarea");
    fallbackField.value = value;
    fallbackField.setAttribute("readonly", "");
    fallbackField.style.position = "fixed";
    fallbackField.style.top = "-999px";
    fallbackField.style.left = "-999px";
    document.body.appendChild(fallbackField);
    fallbackField.select();
    document.execCommand("copy");
    fallbackField.remove();
  }
}

export async function shareUserProfile(userId: string) {
  const profileUrl = new URL(getUserProfileHref(userId), window.location.origin);
  const sharePayload = {
    text: "Профиль в Foody",
    title: `Foody · ${userId}`,
    url: profileUrl.toString(),
  };

  if (typeof navigator.share === "function") {
    await navigator.share(sharePayload);
    return "shared" as const;
  }

  await copyTextToClipboard(profileUrl.toString());
  return "copied" as const;
}
