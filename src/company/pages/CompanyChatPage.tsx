import { useEffect, useMemo } from "react";
import { ChatInbox } from "../../chat/components/ChatInbox";
import { buildCompanyChatActor } from "../../chat/hooks/useChatActor";
import { setActiveBuildingId } from "../../data/supabase/buildingContext";
import type { CompanyBuilding, CompanyUser } from "../../resident/data/types";

type CompanyChatPageProps = {
  user: CompanyUser;
  buildings: CompanyBuilding[];
};

export function CompanyChatPage({ user, buildings }: CompanyChatPageProps) {
  const defaultBuildingId = buildings[0]?.id;
  const actor = useMemo(
    () => (defaultBuildingId ? buildCompanyChatActor(user, defaultBuildingId) : null),
    [user, defaultBuildingId]
  );

  useEffect(() => {
    if (defaultBuildingId) setActiveBuildingId(defaultBuildingId);
  }, [defaultBuildingId]);

  if (!defaultBuildingId) {
    return (
      <div>
        <div className="mb-4 rounded bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">Chat</div>
        <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
          {buildings.length === 0 ? "Loading buildings…" : "No buildings in your portfolio."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded bg-[#3476ef] px-4 py-2 text-sm font-semibold text-white">Chat</div>
      <p className="mb-4 text-sm text-slate-600">
        Message residents and staff across any building in your portfolio.
      </p>
      {actor ? <ChatInbox actor={actor} showBuildingFilter /> : null}
    </div>
  );
}
