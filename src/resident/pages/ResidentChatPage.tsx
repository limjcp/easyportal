import { useEffect, useState } from "react";
import { ChatInbox } from "../../chat/components/ChatInbox";
import { buildResidentChatActor } from "../../chat/hooks/useChatActor";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { residentRepo } from "../data/residentRepository";
import type { ResidentUser } from "../data/types";

export function ResidentChatPage() {
  const [user, setUser] = useState<ResidentUser | null>(null);

  useEffect(() => {
    residentRepo.getUser().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleMessageBanner moduleId="chat" />
      <ChatInbox actor={buildResidentChatActor(user)} />
    </div>
  );
}
