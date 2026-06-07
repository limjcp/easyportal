import { supabaseChatRepository } from "../../data/supabase/chatRepository";

export const chatRepository = supabaseChatRepository;
export type ChatRepository = typeof supabaseChatRepository;
