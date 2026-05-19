import { LoginScreen } from "@/components/auth/login-screen";
import { DEFAULT_TWEAKS, type Tweaks } from "@/lib/mock-data";

const TWEAKS: Tweaks = DEFAULT_TWEAKS;

export default function LoginPage() {
  return (
    <LoginScreen brand={TWEAKS.brand} palette={TWEAKS.palette} />
  );
}
