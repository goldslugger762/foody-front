import { NewReviewForm } from "@/components/review/new-review-form";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function NewReviewPage() {
  return <NewReviewForm brand={TWEAKS.brand} />;
}
