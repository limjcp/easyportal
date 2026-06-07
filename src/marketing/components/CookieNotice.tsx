import { useEffect, useState } from "react";
import { pe } from "../typography";

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
    <div className="fixed bottom-4 left-4 right-4 z-[60] rounded-none border border-border bg-background p-4 shadow-xl sm:left-auto sm:max-w-xl">
      <p className={`${pe.bodySm} text-muted-foreground`}>
        This website uses cookies. We use cookies to analyze website traffic and optimize our visitors&apos; website
        experiences. By accepting our use of cookies, your data will be aggregated with all other user data to make
        things better on this site. Our cookies are Gluten-Free. :D
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className={`${pe.eyebrowSm} border border-border px-4 py-2 text-foreground hover:border-foreground/40 transition-colors duration-300`}
          onClick={() => setIsVisible(false)}
        >
          Later
        </button>
        <button
          type="button"
          className={`${pe.eyebrowSm} bg-foreground px-4 py-2 text-background hover:bg-foreground/90 transition-colors duration-300`}
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

