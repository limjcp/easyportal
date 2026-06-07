import { cn } from "../utils/cn";

type MvpLogoProps = {
  featured?: boolean;
  className?: string;
};

export function MvpLogo({ featured = false, className }: MvpLogoProps) {
  return (
    <img
      src="/images/mvp-condos-logo.png"
      alt="MVP Condos"
      className={cn(
        "w-auto object-contain",
        featured ? "h-16 md:h-20" : "h-10 md:h-12",
        className
      )}
    />
  );
}
