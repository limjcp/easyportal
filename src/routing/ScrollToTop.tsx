import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollPageToTop } from "../utils/scroll";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollPageToTop();
  }, [pathname]);

  return null;
}
