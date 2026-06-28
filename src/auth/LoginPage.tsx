import { useEffect, useState, type FormEvent } from "react";
import {
  ensureActiveBuildingForUser,
  setActiveBuildingId,
} from "../data/supabase/buildingContext";
import { preloadRecaptcha, verifyRecaptchaOnServer } from "../shared/recaptcha";
import {
  clearSupabaseAuthStorage,
  fetchProfile,
  getRememberMe,
  profileMustChangePassword,
  resolvePortalAccess,
  resetPasswordForEmail,
  setRememberMe,
  signInWithPassword,
} from "./supabaseAuth";
import { AuthLayout, authInputClassName, authLabelClassName, authPrimaryButtonClassName, authSecondaryButtonClassName } from "./AuthLayout";
import { SignupWizard } from "./SignupWizard";
import type { LoginPortalRole } from "../resident/data/types";

type AuthMode = "signin" | "signup";

type LoginPageProps = {
  onLogin: (portal: LoginPortalRole, username: string) => void;
  onRequirePasswordChange: (portal: LoginPortalRole) => void;
  onOpenMarketing?: (path?: string) => void;
  initialMode?: AuthMode;
};

function RecaptchaAttribution() {
  return (
    <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
      This site is protected by reCAPTCHA and the Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-slate-600"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-slate-600"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}

export function LoginPage({
  onLogin,
  onRequirePasswordChange,
  onOpenMarketing,
  initialMode = "signin",
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    preloadRecaptcha();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await verifyRecaptchaOnServer("login");
      setRememberMe(rememberMe);
      clearSupabaseAuthStorage();
      const { user } = await signInWithPassword(username.trim(), password);
      if (!user) throw new Error("Login failed");
      const access = await resolvePortalAccess(user.id);
      if (!access.portals.length) {
        setError("Your registration is pending approval. Contact your property manager if you need access.");
        return;
      }
      if (access.buildingIds[0]) {
        setActiveBuildingId(access.buildingIds[0]);
      }
      if (access.defaultPortal === "resident" || access.portals.includes("resident")) {
        await ensureActiveBuildingForUser(user.id);
      }
      const profile = await fetchProfile(user.id);
      if (profileMustChangePassword(profile)) {
        onRequirePasswordChange(access.defaultPortal);
        return;
      }
      onLogin(access.defaultPortal, username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      setError("Enter your email above, then try forgot password again.");
      return;
    }
    setError("");
    try {
      await verifyRecaptchaOnServer("forgot_password");
      await resetPasswordForEmail(username.trim());
      setError("If an account exists, a password reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    }
  };

  return (
    <AuthLayout
      onBack={() => onOpenMarketing?.("/")}
      title={mode === "signin" ? "Sign in" : "Request access"}
      subtitle={
        mode === "signin"
          ? "Access your community portal with your email and password."
          : "Submit your details for property manager review."
      }
    >
      <div className="mb-6 flex rounded border border-slate-200 p-1">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
            mode === "signin" ? "bg-[#0078c8] text-white" : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => {
            setMode("signin");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-[#0078c8] text-white" : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          Request access
        </button>
      </div>

      {mode === "signup" ? (
        <>
          <SignupWizard
            onComplete={() => {
              setMode("signin");
              setError("");
            }}
            onSwitchToSignIn={() => setMode("signin")}
          />
          <RecaptchaAttribution />
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className={authLabelClassName}>
              Email
            </label>
            <input
              id="login-username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="name@example.com"
              className={`${authInputClassName} mt-1.5`}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="login-password" className={authLabelClassName}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${authInputClassName} mt-1.5`}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className={`text-sm ${error.includes("reset link") ? "text-slate-600" : "text-red-600"}`}>{error}</p>
          )}

          <button type="submit" disabled={submitting} className={authPrimaryButtonClassName}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#0078c8]"
              />
              Remember me
            </label>
            <button type="button" className={authSecondaryButtonClassName} onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>

          <p className="text-center text-sm text-slate-500">
            New here?{" "}
            <button type="button" className={authSecondaryButtonClassName} onClick={() => setMode("signup")}>
              Request access
            </button>
          </p>
          <RecaptchaAttribution />
        </form>
      )}
    </AuthLayout>
  );
}
