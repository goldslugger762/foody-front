"use client";

import { useCallback, useMemo, useState } from "react";

import { PostCard } from "@/components/feed/post-card";
import { requestFollowMutation } from "@/lib/feed-api";
import type { Density, Post } from "@/lib/mock-data";

type SearchResultsFeedProps = {
  brand: string;
  currentUser: string | null;
  density: Density;
  initialFollowingUsers: string[];
  posts: Post[];
};

export function SearchResultsFeed({
  brand,
  currentUser,
  density,
  initialFollowingUsers,
  posts,
}: SearchResultsFeedProps) {
  const [followingUsers, setFollowingUsers] = useState(initialFollowingUsers);
  const [pendingAuthors, setPendingAuthors] = useState<Set<string>>(
    () => new Set()
  );
  const [notice, setNotice] = useState<string | null>(null);
  const followingUsersSet = useMemo(
    () => new Set(followingUsers),
    [followingUsers]
  );

  const toggleFollow = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!currentUser || pendingAuthors.has(author)) {
        return;
      }

      setNotice(null);
      setPendingAuthors((currentAuthors) => {
        const nextAuthors = new Set(currentAuthors);
        nextAuthors.add(author);

        return nextAuthors;
      });

      try {
        const result = await requestFollowMutation(author, nextFollowing);

        setFollowingUsers(result.followingUsers);
      } catch {
        setNotice("Не удалось обновить подписку. Попробуйте ещё раз.");
      } finally {
        setPendingAuthors((currentAuthors) => {
          const nextAuthors = new Set(currentAuthors);
          nextAuthors.delete(author);

          return nextAuthors;
        });
      }
    },
    [currentUser, pendingAuthors]
  );

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          brand={brand}
          currentUser={currentUser}
          density={density}
          isAuthorFollowed={followingUsersSet.has(post.user)}
          isFollowPending={pendingAuthors.has(post.user)}
          onFollowToggle={toggleFollow}
        />
      ))}

      {notice && (
        <div className="pointer-events-none fixed right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
          <p role="status">{notice}</p>
        </div>
      )}
    </>
  );
}
