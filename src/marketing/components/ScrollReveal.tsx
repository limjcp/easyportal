import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { useScrollReveal } from "../hooks/useScrollReveal";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
};

export function ScrollReveal({ children, className, delay = 0, as: Tag = "div" }: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={visible && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
