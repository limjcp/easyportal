import { useState, type FormEvent } from "react";
import {
  ensureActiveBuildingForUser,
  setActiveBuildingId,
} from "../data/supabase/buildingContext";
import {
  getRememberMe,
  resolvePortalAccess,
  setRememberMe,
  signInWithPassword,
} from "./supabaseAuth";
import { LoginLayout } from "./LoginLayout";
import { ArrowUpRightIcon } from "../marketing/components/icons";
import { pe } from "../marketing/typography";
import type { LoginPortalRole } from "../resident/data/types";

type LoginPageProps = {
  onLogin: (portal: LoginPortalRole, username: string) => void;
  onOpenMarketing: (path?: string) => void;
};

const inputClassName =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-foreground transition-colors duration-300";

export function LoginPage({ onLogin, onOpenMarketing }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const { user } = await signInWithPassword(username.trim(), password);
      if (!user) throw new Error("Login failed");
      const access = await resolvePortalAccess(user.id);
      if (!access.portals.length) {
        setError("Your account has no portal access assigned yet.");
        return;
      }
      if (access.buildingIds[0]) {
        setActiveBuildingId(access.buildingIds[0]);
      }
      if (access.defaultPortal === "resident" || access.portals.includes("resident")) {
        await ensureActiveBuildingForUser(user.id);
      }
      setRememberMe(rememberMe);
      onLogin(access.defaultPortal, username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginLayout onOpenMarketing={onOpenMarketing}>
      <div className="w-full max-w-md">
        <p className={`${pe.eyebrow} text-muted-foreground mb-3`}>Resident & Board Portal</p>
        <h1 className={`${pe.sectionTitleLg} text-foreground`}>Sign In</h1>
        <p className={`mt-4 ${pe.bodySm} text-muted-foreground`}>
          Access your community portal with the credentials provided by your property manager.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div>
            <label htmlFor="login-username" className={`${pe.eyebrowSm} text-muted-foreground`}>
              Username / Email
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="name@example.com"
              className={`${inputClassName} mt-2`}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="login-password" className={`${pe.eyebrowSm} text-muted-foreground`}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${inputClassName} mt-2`}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={`${pe.bodySm} text-red-600`}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className={`group inline-flex items-center gap-3 ${pe.linkAction} text-foreground hover:text-muted-foreground disabled:opacity-40 transition-colors duration-500`}
          >
            <span className="border-b border-foreground/20 pb-0.5 group-hover:border-foreground/60 transition-colors duration-500">
              {submitting ? "Signing in…" : "Sign in"}
            </span>
            <ArrowUpRightIcon className={`${pe.iconSm} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300`} />
          </button>

          <div className="border-t border-border pt-8">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
              />
              <span className={`${pe.bodySm} text-muted-foreground`}>
                Remember me on this device
                <span className={`mt-1 block ${pe.caption} text-muted-foreground/70`}>Do not use on shared devices.</span>
              </span>
            </label>
          </div>

          <div className={`space-y-3 ${pe.bodySm} text-muted-foreground`}>
            <p>
              <button
                type="button"
                className="text-foreground border-b border-foreground/20 pb-0.5 hover:border-foreground/60 transition-colors duration-300"
                onClick={() =>
                  alert("Use Supabase Auth password reset from the dashboard or contact your administrator.")
                }
              >
                Forgot password?
              </button>
            </p>
            <p>
              Having trouble?{" "}
              <button
                type="button"
                className="text-foreground border-b border-foreground/20 pb-0.5 hover:border-foreground/60 transition-colors duration-300"
                onClick={() => alert("Contact support at support@mvpcondos.com")}
              >
                We can help.
              </button>
            </p>
          </div>
        </form>
      </div>
    </LoginLayout>
  );
}
