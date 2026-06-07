import type { ChatActor, ChatContact, ChatConversation, ChatMessage } from "../../resident/data/types";
import { canMessageContact } from "../../chat/utils/access";
import { conversationsMatchParticipants } from "../../chat/utils/conversationMatch";
import { mapDbError, sb } from "./base";

async function resolvePrimaryBuildingForProfile(profileId: string): Promise<string | null> {
  const { data: membership } = await sb()
    .from("building_memberships")
    .select("building_id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();
  if (membership?.building_id) return membership.building_id as string;

  const { data: occupancy } = await sb()
    .from("unit_occupancies")
    .select("building_id")
    .eq("profile_id", profileId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  return (occupancy?.building_id as string) ?? null;
}

export const supabaseChatRepository = {
  getContacts: async (actor: ChatActor): Promise<ChatContact[]> => {
    const { data: profiles, error } = await sb().from("profiles").select("id, display_name, email");
    mapDbError(error);
    const { data: memberships } = await sb().from("building_memberships").select("profile_id, building_id, role_label");
    return (profiles ?? [])
      .filter((p) => p.id !== actor.contactId)
      .map((p) => {
        const membership = memberships?.find((m) => m.profile_id === p.id);
        const buildingId = membership?.building_id ?? actor.buildingId;
        if (!canMessageContact(actor.buildingId, buildingId, actor.canMessageAnyBuilding)) return null;
        return {
          id: p.id as string,
          name: p.display_name as string,
          email: p.email as string,
          role: membership?.role_label ?? "Resident",
          buildingId,
          buildingLabel: buildingId,
          kind: membership ? ("building_admin" as const) : ("resident" as const),
        };
      })
      .filter(Boolean) as ChatContact[];
  },

  getConversations: async (actor: ChatActor): Promise<ChatConversation[]> => {
    const { data, error } = await sb()
      .from("chat_conversation_participants")
      .select(`
        conversation_id,
        last_read_at,
        chat_conversations (
          id,
          building_id,
          last_message_at,
          last_message_preview,
          chat_conversation_participants (profile_id, last_read_at)
        )
      `)
      .eq("profile_id", actor.contactId);
    mapDbError(error);
    return (data ?? []).map((row) => {
      const conv = row.chat_conversations as Record<string, unknown> | null;
      if (!conv) {
        return {
          id: row.conversation_id as string,
          buildingId: actor.buildingId,
          participantIds: [actor.contactId],
          lastMessageAt: "",
          lastMessagePreview: "",
          lastReadAtByContact: { [actor.contactId]: String(row.last_read_at) },
        };
      }
      const nestedParticipants = (conv.chat_conversation_participants ?? []) as Array<{
        profile_id: string;
        last_read_at: string;
      }>;
      const participantIds = nestedParticipants.map((p) => p.profile_id);
      const lastReadAtByContact = Object.fromEntries(
        nestedParticipants.map((p) => [p.profile_id, String(p.last_read_at)])
      );
      return {
        id: conv.id as string,
        buildingId: conv.building_id as string,
        participantIds,
        lastMessageAt: String(conv.last_message_at),
        lastMessagePreview: conv.last_message_preview as string,
        lastReadAtByContact,
      };
    });
  },

  getMessages: async (conversationId: string, actor: ChatActor): Promise<ChatMessage[]> => {
    const { data: participant } = await sb()
      .from("chat_conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", conversationId)
      .eq("profile_id", actor.contactId)
      .maybeSingle();
    if (!participant) return [];
    const { data, error } = await sb()
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((m) => ({
      id: m.id as string,
      conversationId: m.conversation_id as string,
      senderId: m.sender_profile_id as string,
      body: m.body as string,
      createdAt: String(m.created_at),
    }));
  },

  sendMessage: async (conversationId: string, actor: ChatActor, body: string): Promise<ChatMessage> => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    const { data: conv } = await sb().from("chat_conversations").select("building_id").eq("id", conversationId).single();
    const { data, error } = await sb()
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        building_id: conv!.building_id,
        sender_profile_id: actor.contactId,
        body: trimmed,
      })
      .select("*")
      .single();
    mapDbError(error);
    await sb()
      .from("chat_conversations")
      .update({ last_message_at: data!.created_at, last_message_preview: trimmed.slice(0, 60) })
      .eq("id", conversationId);
    return {
      id: data!.id as string,
      conversationId,
      senderId: actor.contactId,
      body: trimmed,
      createdAt: String(data!.created_at),
    };
  },

  createConversation: async (actor: ChatActor, recipientIds: string[]): Promise<ChatConversation> => {
    const uniqueRecipients = [...new Set(recipientIds.filter((id) => id !== actor.contactId))];
    if (!uniqueRecipients.length) throw new Error("Select at least one recipient");

    const existingConversations = await supabaseChatRepository.getConversations(actor);
    const existing = existingConversations.find(
      (conv) =>
        conv.participantIds.length > 0 &&
        (actor.canMessageAnyBuilding || conv.buildingId === actor.buildingId) &&
        conversationsMatchParticipants(conv.participantIds, actor.contactId, uniqueRecipients)
    );
    if (existing) return existing;

    let conversationBuildingId = actor.buildingId;
    if (actor.canMessageAnyBuilding) {
      const recipientBuilding = await resolvePrimaryBuildingForProfile(uniqueRecipients[0]);
      if (recipientBuilding) conversationBuildingId = recipientBuilding;
    }

    const { data: conv, error } = await sb()
      .from("chat_conversations")
      .insert({ building_id: conversationBuildingId })
      .select("*")
      .single();
    mapDbError(error);
    const conversationId = conv!.id as string;
    const participants = [actor.contactId, ...uniqueRecipients];

    try {
      const { error: selfError } = await sb().from("chat_conversation_participants").insert({
        conversation_id: conversationId,
        profile_id: actor.contactId,
      });
      mapDbError(selfError);

      if (uniqueRecipients.length > 0) {
        const { error: recipientsError } = await sb().from("chat_conversation_participants").insert(
          uniqueRecipients.map((profile_id) => ({
            conversation_id: conversationId,
            profile_id,
          }))
        );
        mapDbError(recipientsError);
      }
    } catch (err) {
      await sb().from("chat_conversations").delete().eq("id", conversationId);
      throw err;
    }

    return {
      id: conversationId,
      buildingId: conv!.building_id as string,
      participantIds: participants,
      lastMessageAt: String(conv!.last_message_at),
      lastMessagePreview: "",
      lastReadAtByContact: { [actor.contactId]: String(conv!.last_message_at) },
    };
  },

  markRead: async (conversationId: string, actor: ChatActor): Promise<void> => {
    await sb()
      .from("chat_conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("profile_id", actor.contactId);
  },

  getUnreadCount: async (actor: ChatActor): Promise<number> => {
    const conversations = await supabaseChatRepository.getConversations(actor);
    return conversations.filter((conv) => {
      const lastRead = conv.lastReadAtByContact[actor.contactId] ?? "";
      return conv.lastMessagePreview !== "" && conv.lastMessageAt > lastRead;
    }).length;
  },

  getContactById: async (id: string): Promise<ChatContact | undefined> => {
    const { data, error } = await sb().from("profiles").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    if (!data) return undefined;
    return {
      id: data.id as string,
      name: data.display_name as string,
      email: data.email as string,
      role: "Resident",
      buildingId: "",
      buildingLabel: "",
      kind: "resident",
    };
  },

  getContactsByIds: async (ids: string[]): Promise<ChatContact[]> => {
    const contacts = await Promise.all(ids.map((id) => supabaseChatRepository.getContactById(id)));
    return contacts.filter(Boolean) as ChatContact[];
  },

  subscribeToMessages: (
    conversationId: string,
    onMessage: (message: ChatMessage) => void
  ): (() => void) => {
    const channelName = `chat-messages-${conversationId}`;
    const existing = sb().getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) void sb().removeChannel(existing);

    const channel = sb()
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          onMessage({
            id: row.id as string,
            conversationId: row.conversation_id as string,
            senderId: row.sender_profile_id as string,
            body: row.body as string,
            createdAt: String(row.created_at),
          });
        }
      )
      .subscribe();
    return () => {
      void sb().removeChannel(channel);
    };
  },
};
