"use client";

import { useState } from "react";

import { BackgroundBlobs } from "@/components/feed/background-blobs";
import { BottomTabBar, type NavTab } from "@/components/feed/bottom-tab-bar";
import { FeedHeader, type FeedTab } from "@/components/feed/feed-header";
import { PostCard } from "@/components/feed/post-card";
import { DEFAULT_TWEAKS, POSTS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;
const CURRENT_USER: string | null = null;

export default function FeedPage() {
  const [feedTab, setFeedTab] = useState<FeedTab>("new");
  const [navTab, setNavTab] = useState<NavTab>("feed");

  return (
    <main className="absolute inset-0 overflow-hidden">
      <BackgroundBlobs palette={TWEAKS.palette} />

      <div className="absolute inset-0 flex flex-col pt-[50px]">
        <FeedHeader
          brand={TWEAKS.brand}
          tab={feedTab}
          onTabChange={setFeedTab}
          currentUser={CURRENT_USER}
        />

        <section
          aria-label="Лента"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {POSTS.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              brand={TWEAKS.brand}
              density={TWEAKS.density}
            />
          ))}
        </section>
      </div>

      <BottomTabBar active={navTab} onChange={setNavTab} brand={TWEAKS.brand} />
    </main>
  );
}
