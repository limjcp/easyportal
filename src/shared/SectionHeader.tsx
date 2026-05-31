export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-[#3476ef] px-3 py-2 text-sm font-medium text-white">
      <span>{title}</span>
      {action}
    </div>
  );
}
