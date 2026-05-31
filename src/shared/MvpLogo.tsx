import { cn } from "../utils/cn";

export function MvpLogo({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-white",
        featured
          ? "min-h-[104px] min-w-[188px] border-[18px] border-[#3476ef] px-7 py-5 shadow-lg"
          : "px-3 py-1"
      )}
    >
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          {["M", "V", "P"].map((letter) => (
            <div
              key={letter}
              className={cn(
                "grid place-items-center border border-slate-400 bg-[#263e96] font-serif text-white shadow-inner",
                featured ? "h-10 w-10 text-2xl" : "h-9 w-9 text-xl"
              )}
            >
              {letter}
            </div>
          ))}
        </div>
        <div className="translate-y-1 font-serif text-lg italic text-slate-600 sm:text-xl">Condos</div>
      </div>
    </div>
  );
}
