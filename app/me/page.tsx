import { ProfileScreen } from "@/components/profile/profile-screen";
import { CURRENT_USER } from "@/lib/current-user";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

type MePageProps = {
  searchParams: Promise<{
    profileSaved?: string;
  }>;
};

export default async function MePage({ searchParams }: MePageProps) {
  const { profileSaved } = await searchParams;

  return (
    <ProfileScreen
      brand={TWEAKS.brand}
      density={TWEAKS.density}
      initialUserId={CURRENT_USER.handle}
      ownProfileRoute
      savedNotice={profileSaved === "1"}
    />
  );
}
