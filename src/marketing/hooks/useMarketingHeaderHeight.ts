import { useEffect, type RefObject } from "react";

export function useMarketingHeaderHeight(
  headerRef: RefObject<HTMLElement | null>,
  remeasureKey?: unknown
) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--marketing-header-height",
        `${header.offsetHeight}px`
      );
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, [headerRef, remeasureKey]);
}
