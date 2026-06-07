-- RLS for chat_conversation_participants (no building_id column; join via chat_conversations)

CREATE OR REPLACE FUNCTION public.is_chat_participant(
  p_conversation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants
    WHERE conversation_id = p_conversation_id
      AND profile_id = p_user_id
  );
$$;

ALTER TABLE public.chat_conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS super_admin_all ON public.chat_conversation_participants;
CREATE POLICY super_admin_all ON public.chat_conversation_participants
  FOR ALL TO authenticated
  USING (public.is_super_admin((SELECT auth.uid())))
  WITH CHECK (public.is_super_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS chat_participants_select ON public.chat_conversation_participants;
CREATE POLICY chat_participants_select ON public.chat_conversation_participants
  FOR SELECT TO authenticated
  USING (public.is_chat_participant(conversation_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS chat_participants_insert_self ON public.chat_conversation_participants;
CREATE POLICY chat_participants_insert_self ON public.chat_conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.chat_conversations c
      WHERE c.id = conversation_id
        AND c.building_id IN (SELECT public.get_user_building_ids((SELECT auth.uid())))
    )
  );

DROP POLICY IF EXISTS chat_participants_insert_others ON public.chat_conversation_participants;
CREATE POLICY chat_participants_insert_others ON public.chat_conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_chat_participant(conversation_id, (SELECT auth.uid()))
    AND public.is_building_member(
      profile_id,
      (SELECT building_id FROM public.chat_conversations WHERE id = conversation_id)
    )
  );

DROP POLICY IF EXISTS chat_participants_update_own ON public.chat_conversation_participants;
CREATE POLICY chat_participants_update_own ON public.chat_conversation_participants
  FOR UPDATE TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
