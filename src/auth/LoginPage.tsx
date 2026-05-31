import { useState, type FormEvent } from "react";
import { FaKey, FaUser } from "react-icons/fa";
import {
  getRememberMe,
  resolveLoginPortal,
  setRememberMe,
  validateMockLogin,
  validateVendorLogin,
} from "./mockAuth";
import { LoginLayout } from "./LoginLayout";
import type { LoginPortalRole } from "../resident/data/types";

type LoginPageProps = {
  onLogin: (portal: LoginPortalRole, username: string) => void;
  onOpenMarketing: (path?: string) => void;
};

export function LoginPage({ onLogin, onOpenMarketing }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(getRememberMe);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateMockLogin(username, password)) {
      setError("Please enter your username/email and password.");
      return;
    }
    const portal = resolveLoginPortal(username);
    if (portal === "vendor") {
      const vendorError = validateVendorLogin(username);
      if (vendorError) {
        setError(vendorError);
        return;
      }
    }
    setError("");
    setRememberMe(rememberMe);
    onLogin(portal, username);
  };

  return (
    <LoginLayout onOpenMarketing={onOpenMarketing}>
      <div className="w-full max-w-[400px] rounded-sm bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-800">Account Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center rounded border border-slate-300 bg-white focus-within:border-[#3476ef] focus-within:ring-1 focus-within:ring-[#3476ef]">
              <span className="pl-3 text-slate-400">
                <FaUser />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username / Email"
                className="w-full border-0 bg-transparent px-3 py-2.5 text-sm outline-none"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center rounded border border-slate-300 bg-white focus-within:border-[#3476ef] focus-within:ring-1 focus-within:ring-[#3476ef]">
              <span className="pl-3 text-slate-400">
                <FaKey />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border-0 bg-transparent px-3 py-2.5 text-sm outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded bg-[#3476ef] py-2.5 text-sm font-medium text-white transition hover:bg-[#2d68cf]"
          >
            Sign in
          </button>

          <div className="pt-1">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#3476ef]"
              />
              <span className="text-sm text-slate-700">
                Remember me on this device
                <span className="mt-0.5 block text-xs text-slate-400">(do not use on shared device)</span>
              </span>
            </label>
          </div>

          <p className="text-center text-sm">
            <button
              type="button"
              className="text-[#3476ef] hover:underline"
              onClick={() => alert("Forgot password — coming soon.")}
            >
              Forgot password?
            </button>
            <span className="text-slate-400"> | </span>
            <button
              type="button"
              className="text-[#3476ef] hover:underline"
              onClick={() => alert("Sign up for free — coming soon.")}
            >
              Sign up for free
            </button>
          </p>

          <p className="text-center text-sm text-slate-600">
            Having trouble?{" "}
            <button
              type="button"
              className="text-[#3476ef] hover:underline"
              onClick={() => alert("Contact support at support@mvpcondos.com — demo.")}
            >
              We can help.
            </button>
          </p>
        </form>
      </div>
    </LoginLayout>
  );
}
