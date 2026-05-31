import type { ChatConversation, ChatMessage } from "../../../resident/data/types";
import { DEMO_BUILDING_ID } from "../../../resident/data/types";

export const seedChatConversations: ChatConversation[] = [
  {
    id: "conv-1",
    buildingId: DEMO_BUILDING_ID,
    participantIds: ["contact-resident-claudio", "contact-admin-mayflor"],
    lastMessageAt: "2026-05-22 2:15 PM",
    lastMessagePreview: "Thanks, I'll check the parking assignment.",
    lastReadAtByContact: {
      "contact-resident-claudio": "2026-05-22 2:15 PM",
      "contact-admin-mayflor": "2026-05-22 1:00 PM",
    },
  },
];

export const seedChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "contact-admin-mayflor",
    body: "Hi Claudio, your parking spot request has been approved.",
    createdAt: "2026-05-22 1:45 PM",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    senderId: "contact-resident-claudio",
    body: "Thanks, I'll check the parking assignment.",
    createdAt: "2026-05-22 2:15 PM",
  },
];
