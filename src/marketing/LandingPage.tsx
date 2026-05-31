import { HomePage } from "./pages/HomePage";

type LandingPageProps = {
  onOpenLogin: () => void;
};

export function LandingPage({ onOpenLogin }: LandingPageProps) {
  return <HomePage onNavigate={(path) => (path === "/login" ? onOpenLogin() : window.history.pushState({}, "", path))} />;
}
