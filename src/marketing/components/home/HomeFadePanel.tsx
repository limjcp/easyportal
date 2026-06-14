import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";

type HomeFadePanelProps = {
  visible: boolean;
  children: ReactNode;
  className?: string;
};

export function HomeFadePanel({ visible, children, className }: HomeFadePanelProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
