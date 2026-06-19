import { useEffect } from "react";

export function QboConnectedPage() {
  useEffect(() => {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: "qbo-connected" }, window.location.origin);
      }
    } catch {
      // Ignore cross-origin postMessage failures.
    }
    const timer = window.setTimeout(() => window.close(), 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold">QuickBooks Online connected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can close this window and return to EasyPortal.
        </p>
      </div>
    </div>
  );
}
