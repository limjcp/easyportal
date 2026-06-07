import { useEffect, useState } from "react";
import { ChatInbox } from "../../chat/components/ChatInbox";
import { buildAdminChatActor, buildCompanyChatActor } from "../../chat/hooks/useChatActor";
import { canMessageAnyBuilding } from "../../chat/utils/access";
import { companyRepository } from "../../company/data/companyRepository";
import type { AdminUser, ChatActor } from "../../resident/data/types";
import { adminRepository } from "../data/adminRepository";

type AdminChatPageProps = {
  activeBuildingId?: string;
  embedded?: boolean;
};

export function AdminChatPage({ activeBuildingId, embedded = false }: AdminChatPageProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [companyUser, setCompanyUser] = useState<Awaited<ReturnType<typeof companyRepository.getCompanyUser>> | null>(
    null
  );

  useEffect(() => {
    adminRepository.getAdminUser().then(setUser);
    if (embedded) companyRepository.getCompanyUser().then(setCompanyUser).catch(() => setCompanyUser(null));
  }, [embedded]);

  if (!user) {
    return (
      <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
        Loading…
      </div>
    );
  }

  if (!activeBuildingId) {
    return (
      <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
        Select a building to use chat.
      </div>
    );
  }

  let actor: ChatActor;
  if (embedded && companyUser && canMessageAnyBuilding(companyUser.role)) {
    actor = { ...buildCompanyChatActor(companyUser, activeBuildingId), buildingId: activeBuildingId };
  } else {
    actor = buildAdminChatActor(user, activeBuildingId);
  }

  return (
    <div>
      <div className="mb-4 rounded bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">Chat</div>
      <ChatInbox
        actor={actor}
        showBuildingFilter={actor.canMessageAnyBuilding}
      />
    </div>
  );
}
