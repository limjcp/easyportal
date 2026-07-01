import type { ChatContact, ChatConversation, ChatMessage } from "../../resident/data/types";

export const chatStore = {
  contacts: [] as ChatContact[],
  conversations: [] as ChatConversation[],
  messages: [] as ChatMessage[],
};
