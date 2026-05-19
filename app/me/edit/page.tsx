import { EditProfileScreen } from "@/components/profile/edit-profile-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function EditProfilePage() {
  return (
    <EditProfileScreen brand={TWEAKS.brand} palette={TWEAKS.palette} />
  );
}
