import { ProfileScreen } from "@/components/profile/profile-screen";
import { CURRENT_USER } from "@/lib/current-user";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function MePage() {
  return (
    <ProfileScreen
      brand={TWEAKS.brand}
      density={TWEAKS.density}
      initialUserId={CURRENT_USER.handle}
      ownProfileRoute
    />
  );
}
