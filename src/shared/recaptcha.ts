import { supabase } from "../lib/supabaseClient";

export type RecaptchaAction =
  | "login"
  | "forgot_password"
  | "onboarding_lookup"
  | "onboarding_register"
  | "consultation_submit";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? "";

let loadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (!SITE_KEY || typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.grecaptcha?.execute) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha-v3="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load reCAPTCHA.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaV3 = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isRecaptchaConfigured(): boolean {
  return Boolean(SITE_KEY);
}

export async function executeRecaptcha(action: RecaptchaAction): Promise<string | null> {
  if (!SITE_KEY) {
    return null;
  }

  await loadRecaptchaScript();

  await new Promise<void>((resolve) => {
    if (!window.grecaptcha?.ready) {
      resolve();
      return;
    }
    window.grecaptcha.ready(() => resolve());
  });

  if (!window.grecaptcha?.execute) {
    throw new Error("Could not verify submission. Please try again.");
  }

  return window.grecaptcha.execute(SITE_KEY, { action });
}

export async function verifyRecaptchaOnServer(action: RecaptchaAction): Promise<string | null> {
  const token = await executeRecaptcha(action);
  if (!token || !supabase) {
    return token;
  }

  const { data, error } = await supabase.functions.invoke("recaptcha-verify", {
    body: { recaptchaToken: token, action },
  });

  const body = data as { error?: string; ok?: boolean } | null;
  if (error || body?.error) {
    throw new Error(body?.error ?? error?.message ?? "Could not verify submission. Please try again.");
  }

  return token;
}

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}
