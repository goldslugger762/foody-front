import { CURRENT_USER } from "@/lib/current-user";
import {
  getProfileByUserId,
  getProfilePosts,
  type UserProfile,
} from "@/lib/profile-data";
import { getSavedPostIds } from "@/lib/server/bookmark-store";
import { getFollowedUsers } from "@/lib/server/follow-store";
import { getLikedPostIds } from "@/lib/server/like-store";

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
  posts: ReturnType<typeof getProfilePosts>;
  userId: string;
};

export async function getUserProfileSnapshot(
  userId: string
): Promise<UserProfileSnapshot | null> {
  const profile = getProfileByUserId(userId);

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
    profile,
    savedPostIds,
  };
}

export function getUserPostsSnapshot(userId: string): UserPostsSnapshot | null {
  if (!getProfileByUserId(userId)) {
    return null;
  }

  return {
    currentUser: CURRENT_USER.handle,
    posts: getProfilePosts(userId),
    userId,
  };
}
