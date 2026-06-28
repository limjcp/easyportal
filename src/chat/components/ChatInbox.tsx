import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { EmptyState } from "../../shared/EmptyState";
import type { ChatActor, ChatContact, ChatConversation } from "../../resident/data/types";
import { chatRepository } from "../data/chatRepository";
import { formatChatTime } from "../utils/formatChatTime";
import { ChatThread } from "./ChatThread";
import { NewChatModal } from "./NewChatModal";

type ChatInboxProps = {
  actor: ChatActor;
  showBuildingFilter?: boolean;
};

export function ChatInbox({ actor, showBuildingFilter = false }: ChatInboxProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const refresh = useCallback(() => {
    const currentActor = actorRef.current;
    void chatRepository
      .getConversations(currentActor)
      .then(async (convs) => {
        const participantIds = [...new Set(convs.flatMap((c) => c.participantIds))];
        const [cts, participants] = await Promise.all([
          chatRepository.getContacts(currentActor),
          chatRepository.getContactsByIds(participantIds),
        ]);
        const merged = new Map<string, ChatContact>();
        [...participants, ...cts].forEach((c) => merged.set(c.id, c));
        setConversations(convs);
        setContacts(Array.from(merged.values()));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor.contactId, actor.buildingId, actor.canMessageAnyBuilding]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const buildingOptions = useMemo(() => {
    const map = new Map<string, string>();
    conversations.forEach((c) => {
      const label =
        contacts.find((x) => x.buildingId === c.buildingId)?.buildingLabel ?? c.buildingId;
      map.set(c.buildingId, label);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [conversations, contacts]);

  const filteredConversations = useMemo(() => {
    if (!showBuildingFilter || buildingFilter === "all") return conversations;
    return conversations.filter((c) => c.buildingId === buildingFilter);
  }, [conversations, buildingFilter, showBuildingFilter]);

  const contactMap = useMemo(() => {
    const m = new Map<string, ChatContact>();
    contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [contacts]);

  const selected = conversations.find((c) => c.id === selectedId);

  const participantsFor = (conv: ChatConversation): ChatContact[] => {
    const ids = conv.participantIds.filter((id) => id !== actor.contactId);
    const fromContacts = ids.map((id) => contactMap.get(id)).filter(Boolean) as ChatContact[];
    if (fromContacts.length > 0) return fromContacts;
    return ids.map((id) => ({
      id,
      name: id,
      email: "",
      role: "",
      buildingId: conv.buildingId,
      buildingLabel: "",
      kind: "resident" as const,
    }));
  };

  const titleFor = (conv: ChatConversation) => {
    const others = participantsFor(conv);
    if (others.length === 0) return "Conversation";
    return others.map((p) => p.name).join(", ");
  };

  const isUnread = (conv: ChatConversation) => {
    const lastRead = conv.lastReadAtByContact[actor.contactId] ?? "";
    return conv.lastMessagePreview !== "" && conv.lastMessageAt > lastRead;
  };

  if (loading) {
    return (
      <div className="rounded-sm bg-white/95 p-8 text-center text-sm text-slate-500 shadow-lg">
        Loading conversations…
      </div>
    );
  }

  if (conversations.length === 0 && !newOpen) {
    return (
      <>
        <EmptyState
          title="No conversations yet"
          subtitle="Start a chat with someone in your building."
          action={
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf]"
            >
              <FaPlus /> New conversation
            </button>
          }
        />
        <NewChatModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          actor={actor}
          onCreated={(id) => {
            refresh();
            setSelectedId(id);
          }}
        />
      </>
    );
  }

  return (
    <div className="rounded-sm bg-white/95 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-1 rounded bg-[#3476ef] px-3 py-1.5 text-sm text-white hover:bg-[#2d68cf]"
        >
          <FaPlus className="text-xs" /> New
        </button>
      </div>

      {showBuildingFilter && buildingOptions.length > 1 && (
        <div className="border-b border-slate-200 px-4 py-2">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm sm:w-auto"
          >
            <option value="all">All buildings</option>
            {buildingOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex min-h-[400px] flex-col md:flex-row">
        <aside className="w-full border-b border-slate-200 md:w-72 md:border-b-0 md:border-r">
          <ul className="max-h-[280px] overflow-y-auto md:max-h-[480px]">
            {filteredConversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    selectedId === conv.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{titleFor(conv)}</span>
                    {isUnread(conv) && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3476ef]" />
                    )}
                  </div>
                  {conv.lastMessagePreview && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{conv.lastMessagePreview}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-slate-400">{formatChatTime(conv.lastMessageAt)}</p>
                  {showBuildingFilter && actor.canMessageAnyBuilding && (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {contactMap.get(conv.participantIds.find((id) => id !== actor.contactId) ?? "")
                        ?.buildingLabel ?? conv.buildingId}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 px-4 py-2">
                <p className="text-sm font-semibold text-slate-800">{titleFor(selected)}</p>
                <p className="text-xs text-slate-500">
                  {participantsFor(selected)
                    .map((p) => p.role)
                    .join(" · ")}
                </p>
              </div>
              <ChatThread
                key={selected.id}
                conversationId={selected.id}
                actor={actor}
                participants={[
                  ...participantsFor(selected),
                  {
                    id: actor.contactId,
                    name: actor.name,
                    email: "",
                    role: actor.role,
                    buildingId: actor.buildingId,
                    buildingLabel: "",
                    kind: "resident",
                  },
                ]}
                onMessageSent={refresh}
                onIncomingMessage={refresh}
              />
            </div>
          ) : (
            <p className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-500">
              Select a conversation
            </p>
          )}
        </main>
      </div>

      <NewChatModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        actor={actor}
        onCreated={(id) => {
          refresh();
          setSelectedId(id);
        }}
      />
    </div>
  );
}
