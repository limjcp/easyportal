import { useEffect, useRef, useState } from "react";
import type { ChatActor, ChatContact, ChatMessage } from "../../resident/data/types";
import { chatRepository } from "../data/chatRepository";
import { formatChatTime } from "../utils/formatChatTime";

type ChatThreadProps = {
  conversationId: string;
  actor: ChatActor;
  participants: ChatContact[];
  onMessageSent: () => void;
  onIncomingMessage?: () => void;
};

export function ChatThread({
  conversationId,
  actor,
  participants,
  onMessageSent,
  onIncomingMessage,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const load = () => {
    chatRepository.getMessages(conversationId, actor).then(setMessages);
    chatRepository.markRead(conversationId, actor);
  };

  useEffect(() => {
    load();
    const unsubscribe =
      typeof chatRepository.subscribeToMessages === "function"
        ? chatRepository.subscribeToMessages(conversationId, (message) => {
            setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
            onIncomingMessage?.();
          })
        : undefined;
    return () => unsubscribe?.();
  }, [conversationId, actor.contactId, onIncomingMessage]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await chatRepository.sendMessage(conversationId, actor, draft);
      setDraft("");
      load();
      onMessageSent();
    } finally {
      setSending(false);
    }
  };

  const nameFor = (senderId: string) =>
    participants.find((p) => p.id === senderId)?.name ??
    (senderId === actor.contactId ? actor.name : "Unknown");

  return (
    <div className="flex max-h-[480px] min-h-[320px] flex-col">
      <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === actor.contactId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-[#3476ef] text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-semibold opacity-80">{nameFor(m.senderId)}</p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {formatChatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-black"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
