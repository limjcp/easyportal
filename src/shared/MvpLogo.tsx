import { cn } from "../utils/cn";

type MvpLogoProps = {
  featured?: boolean;
  variant?: "default" | "navbar";
  className?: string;
};

export function MvpLogo({ featured = false, variant = "default", className }: MvpLogoProps) {
  return (
    <img
      src="/images/mvp-condos-logo.png"
      alt="MVP Condos"
      className={cn(
        "w-auto object-contain",
        variant === "navbar"
          ? "h-7 sm:h-8"
          : featured
            ? "h-16 md:h-20"
            : "h-10 md:h-12",
        className
      )}
    />
  );
}
