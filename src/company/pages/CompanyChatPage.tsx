import { ChatInbox } from "../../chat/components/ChatInbox";
import { buildCompanyChatActor } from "../../chat/hooks/useChatActor";
import type { CompanyUser } from "../../resident/data/types";

type CompanyChatPageProps = {
  user: CompanyUser;
};

export function CompanyChatPage({ user }: CompanyChatPageProps) {
  return (
    <div>
      <div className="mb-4 rounded bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">Chat</div>
      <p className="mb-4 text-sm text-slate-600">
        Message residents and staff across any building in your portfolio.
      </p>
      <ChatInbox actor={buildCompanyChatActor(user)} showBuildingFilter />
    </div>
  );
}
