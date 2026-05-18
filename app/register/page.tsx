import { RegistrationScreen } from "@/components/auth/registration-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function RegisterPage() {
  return (
    <RegistrationScreen brand={TWEAKS.brand} palette={TWEAKS.palette} />
  );
}
