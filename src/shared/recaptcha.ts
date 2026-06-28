import { supabase } from "../lib/supabaseClient";

export type RecaptchaAction =
  | "login"
  | "forgot_password"
  | "onboarding_lookup"
  | "onboarding_register"
  | "consultation_submit";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? "";
const SCRIPT_SELECTOR = 'script[data-recaptcha-v3="true"]';
const MAX_LOAD_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;
const GRECAPTCHA_READY_TIMEOUT_MS = 10_000;

let loadPromise: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeRecaptchaScripts(): void {
  document.querySelectorAll(SCRIPT_SELECTOR).forEach((node) => node.remove());
}

function waitForGrecaptcha(timeoutMs = GRECAPTCHA_READY_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.execute) {
      resolve();
      return;
    }

    const deadline = Date.now() + timeoutMs;

    const poll = () => {
      if (window.grecaptcha?.execute) {
        resolve();
        return;
      }

      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(() => {
          if (window.grecaptcha?.execute) {
            resolve();
            return;
          }
          if (Date.now() >= deadline) {
            reject(new Error("Failed to load reCAPTCHA."));
            return;
          }
          setTimeout(poll, 50);
        });
        return;
      }

      if (Date.now() >= deadline) {
        reject(new Error("Failed to load reCAPTCHA."));
        return;
      }

      setTimeout(poll, 50);
    };

    poll();
  });
}

function injectRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(SCRIPT_SELECTOR) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.recaptchaLoadState === "failed") {
        existing.remove();
      } else if (window.grecaptcha?.execute) {
        resolve();
        return;
      } else if (existing.dataset.recaptchaLoadState === "loaded") {
        waitForGrecaptcha()
          .then(resolve)
          .catch(() => {
            existing.remove();
            reject(new Error("Failed to load reCAPTCHA."));
          });
        return;
      } else {
        existing.addEventListener(
          "load",
          () => {
            existing.dataset.recaptchaLoadState = "loaded";
            resolve();
          },
          { once: true }
        );
        existing.addEventListener(
          "error",
          () => {
            existing.dataset.recaptchaLoadState = "failed";
            reject(new Error("Failed to load reCAPTCHA."));
          },
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaV3 = "true";
    script.onload = () => {
      script.dataset.recaptchaLoadState = "loaded";
      resolve();
    };
    script.onerror = () => {
      script.dataset.recaptchaLoadState = "failed";
      reject(new Error("Failed to load reCAPTCHA."));
    };
    document.head.appendChild(script);
  });
}

async function loadRecaptchaScriptWithRetry(): Promise<void> {
  let lastError = new Error("Failed to load reCAPTCHA.");

  for (let attempt = 0; attempt < MAX_LOAD_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      removeRecaptchaScripts();
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }

    try {
      await injectRecaptchaScript();
      await waitForGrecaptcha();
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : lastError;
    }
  }

  removeRecaptchaScripts();
  throw lastError;
}

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

  loadPromise = loadRecaptchaScriptWithRetry().finally(() => {
    if (!window.grecaptcha?.execute) {
      loadPromise = null;
    }
  });

  return loadPromise;
}

/** Warm up the reCAPTCHA script before the user submits a protected form. */
export function preloadRecaptcha(): void {
  if (!SITE_KEY || typeof window === "undefined") {
    return;
  }
  void loadRecaptchaScript().catch(() => {
    // Ignore preload failures; submit will retry with backoff.
  });
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
