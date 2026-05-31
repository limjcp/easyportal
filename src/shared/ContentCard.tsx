type ContentCardProps = {
  title: string;
  date: string;
  buttonLabel: string;
  onView: () => void;
};

export function ContentCard({ title, date, buttonLabel, onView }: ContentCardProps) {
  return (
    <div className="flex flex-col rounded-sm bg-white p-5 shadow-md">
      <h3 className="flex-1 text-center text-sm font-semibold leading-snug text-slate-800">{title}</h3>
      <p className="mt-3 text-center text-sm text-slate-400">{date}</p>
      <button
        type="button"
        onClick={onView}
        className="mt-5 w-full rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d68cf]"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
