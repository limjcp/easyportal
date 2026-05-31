import type { ChatActor, ChatContact, ChatConversation, ChatMessage } from "../../resident/data/types";
import { canMessageContact } from "../utils/access";
import { chatStore } from "./chatStore";

const delay = <T>(value: T, ms = 50): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

function getContact(id: string): ChatContact | undefined {
  return chatStore.contacts.find((c) => c.id === id);
}

function conversationIncludesActor(conv: ChatConversation, actor: ChatActor): boolean {
  return conv.participantIds.includes(actor.contactId);
}

function assertCanMessageRecipients(actor: ChatActor, recipientIds: string[]): void {
  for (const id of recipientIds) {
    const contact = getContact(id);
    if (!contact) throw new Error("Contact not found");
    if (id === actor.contactId) continue;
    if (!canMessageContact(actor.buildingId, contact.buildingId, actor.canMessageAnyBuilding)) {
      throw new Error("Cannot message users outside your building");
    }
  }
}

function formatNow(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const chatRepository = {
  getContacts: async (actor: ChatActor): Promise<ChatContact[]> => {
    const list = chatStore.contacts.filter(
      (c) =>
        c.id !== actor.contactId &&
        canMessageContact(actor.buildingId, c.buildingId, actor.canMessageAnyBuilding)
    );
    return delay(list);
  },

  getConversations: async (actor: ChatActor): Promise<ChatConversation[]> => {
    const list = chatStore.conversations
      .filter((c) => conversationIncludesActor(c, actor))
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    return delay(list);
  },

  getMessages: async (conversationId: string, actor: ChatActor): Promise<ChatMessage[]> => {
    const conv = chatStore.conversations.find((c) => c.id === conversationId);
    if (!conv || !conversationIncludesActor(conv, actor)) {
      return delay([]);
    }
    const list = chatStore.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return delay(list);
  },

  sendMessage: async (
    conversationId: string,
    actor: ChatActor,
    body: string
  ): Promise<ChatMessage> => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const conv = chatStore.conversations.find((c) => c.id === conversationId);
    if (!conv || !conversationIncludesActor(conv, actor)) {
      throw new Error("Conversation not found");
    }

    const now = formatNow();
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: actor.contactId,
      body: trimmed,
      createdAt: now,
    };

    chatStore.messages.push(message);
    conv.lastMessageAt = now;
    conv.lastMessagePreview = trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
    conv.lastReadAtByContact[actor.contactId] = now;

    return delay(message);
  },

  createConversation: async (
    actor: ChatActor,
    recipientIds: string[]
  ): Promise<ChatConversation> => {
    const uniqueRecipients = [...new Set(recipientIds.filter((id) => id !== actor.contactId))];
    if (uniqueRecipients.length === 0) throw new Error("Select at least one recipient");

    assertCanMessageRecipients(actor, uniqueRecipients);

    const participantIds = [actor.contactId, ...uniqueRecipients].sort();
    const existing = chatStore.conversations.find((c) => {
      const sorted = [...c.participantIds].sort();
      return (
        sorted.length === participantIds.length &&
        sorted.every((id, i) => id === participantIds[i])
      );
    });
    if (existing) return delay(existing);

    const primaryRecipient = getContact(uniqueRecipients[0]);
    const buildingId = actor.canMessageAnyBuilding
      ? primaryRecipient?.buildingId ?? actor.buildingId
      : actor.buildingId;

    const now = formatNow();
    const conv: ChatConversation = {
      id: `conv-${Date.now()}`,
      buildingId,
      participantIds,
      lastMessageAt: now,
      lastMessagePreview: "",
      lastReadAtByContact: { [actor.contactId]: now },
    };

    chatStore.conversations.push(conv);
    return delay(conv);
  },

  markRead: async (conversationId: string, actor: ChatActor): Promise<void> => {
    const conv = chatStore.conversations.find((c) => c.id === conversationId);
    if (!conv || !conversationIncludesActor(conv, actor)) return;
    conv.lastReadAtByContact[actor.contactId] = conv.lastMessageAt;
    return delay(undefined);
  },

  getUnreadCount: async (actor: ChatActor): Promise<number> => {
    const count = chatStore.conversations.filter((c) => {
      if (!conversationIncludesActor(c, actor)) return false;
      const lastRead = c.lastReadAtByContact[actor.contactId] ?? "";
      return c.lastMessageAt > lastRead && c.lastMessagePreview !== "";
    }).length;
    return delay(count);
  },

  getContactById: async (id: string): Promise<ChatContact | undefined> => {
    return delay(getContact(id));
  },

  getContactsByIds: async (ids: string[]): Promise<ChatContact[]> => {
    return delay(chatStore.contacts.filter((c) => ids.includes(c.id)));
  },
};
