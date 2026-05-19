import { SettingsScreen } from "@/components/profile/settings-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function SettingsPage() {
  return (
    <SettingsScreen brand={TWEAKS.brand} palette={TWEAKS.palette} />
  );
}
