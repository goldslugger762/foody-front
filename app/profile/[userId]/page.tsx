import { ProfileScreen } from "@/components/profile/profile-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

type UserProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
};

function decodeRouteUserId(userId: string) {
  try {
    return decodeURIComponent(userId);
  } catch {
    return userId;
  }
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await params;

  return (
    <ProfileScreen
      brand={TWEAKS.brand}
      density={TWEAKS.density}
      initialUserId={decodeRouteUserId(userId)}
    />
  );
}
