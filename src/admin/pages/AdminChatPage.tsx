import { useEffect, useState } from "react";
import { ChatInbox } from "../../chat/components/ChatInbox";
import { buildAdminChatActor, buildCompanyChatActor } from "../../chat/hooks/useChatActor";
import { canMessageAnyBuilding } from "../../chat/utils/access";
import { companyStore } from "../../company/data/companyStore";
import { DEMO_BUILDING_ID } from "../../resident/data/types";
import type { AdminUser, ChatActor } from "../../resident/data/types";
import { adminRepository } from "../data/adminRepository";

type AdminChatPageProps = {
  activeBuildingId?: string;
  embedded?: boolean;
};

export function AdminChatPage({ activeBuildingId, embedded = false }: AdminChatPageProps) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminRepository.getAdminUser().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
        Loading…
      </div>
    );
  }

  const buildingId = activeBuildingId ?? DEMO_BUILDING_ID;
  let actor: ChatActor;
  if (embedded && canMessageAnyBuilding(companyStore.user.role)) {
    actor = { ...buildCompanyChatActor(companyStore.user), buildingId };
  } else {
    actor = buildAdminChatActor(user, buildingId);
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
