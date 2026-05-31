import { useEffect, useState } from "react";

const COOKIE_KEY = "mvp-marketing-cookie-accepted";

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setIsVisible(window.localStorage.getItem(COOKIE_KEY) !== "1");
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:left-auto sm:max-w-xl">
      <p className="text-sm leading-6 text-slate-700">
        This website uses cookies. We use cookies to analyze website traffic and optimize our visitors&apos; website
        experiences. By accepting our use of cookies, your data will be aggregated with all other user data to make
        things better on this site. Our cookies are Gluten-Free. :D
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          onClick={() => setIsVisible(false)}
        >
          Later
        </button>
        <button
          type="button"
          className="rounded-full bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            window.localStorage.setItem(COOKIE_KEY, "1");
            setIsVisible(false);
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

