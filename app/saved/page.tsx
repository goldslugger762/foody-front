import { SavedPostsScreen } from "@/components/saved/saved-posts-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function SavedPage() {
  return (
    <SavedPostsScreen brand={TWEAKS.brand} density={TWEAKS.density} />
  );
}
