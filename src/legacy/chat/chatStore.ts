import type { ChatContact, ChatConversation, ChatMessage } from "../../resident/data/types";
import { seedChatContacts } from "../../chat/data/mock/chatContacts";
import { seedChatConversations, seedChatMessages } from "../../chat/data/mock/chatConversations";

export const chatStore = {
  contacts: [...seedChatContacts] as ChatContact[],
  conversations: [...seedChatConversations] as ChatConversation[],
  messages: [...seedChatMessages] as ChatMessage[],
};
