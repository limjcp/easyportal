import { getModuleMessage } from "../data/portalConfig";

type ModuleMessageBannerProps = {
  moduleId: string;
};

export function ModuleMessageBanner({ moduleId }: ModuleMessageBannerProps) {
  const message = getModuleMessage(moduleId);
  if (!message.trim()) return null;

  return (
    <div className="mb-4 rounded-sm border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
      {message}
    </div>
  );
}
