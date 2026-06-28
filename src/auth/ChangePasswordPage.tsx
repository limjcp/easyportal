import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import {
  AuthLayout,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from "./AuthLayout";
import { completeRequiredPasswordChange } from "./supabaseAuth";
import type { LoginPortalRole } from "../resident/data/types";

type ChangePasswordPageProps = {
  pendingPortal: LoginPortalRole;
  onComplete: (portal: LoginPortalRole) => void;
  onSignOut: () => void;
};

export function ChangePasswordPage({ pendingPortal, onComplete, onSignOut }: ChangePasswordPageProps) {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await completeRequiredPasswordChange(password);
      await auth.refreshAuth({ force: true });
      onComplete(pendingPortal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Change your password"
      subtitle="You signed in with a temporary password. Choose a new password to continue to your portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="change-password-new" className={authLabelClassName}>
            New password
          </label>
          <input
            id="change-password-new"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${authInputClassName} mt-1.5`}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="change-password-confirm" className={authLabelClassName}>
            Confirm password
          </label>
          <input
            id="change-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className={`${authInputClassName} mt-1.5`}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className={authPrimaryButtonClassName}>
          {submitting ? "Updating…" : "Save password and continue"}
        </button>

        <p className="text-center text-sm text-slate-500">
          <button type="button" className={authSecondaryButtonClassName} onClick={() => void onSignOut()}>
            Sign out
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
