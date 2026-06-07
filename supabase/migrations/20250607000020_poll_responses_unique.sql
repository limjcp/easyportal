CREATE UNIQUE INDEX IF NOT EXISTS poll_responses_profile_question_unique
  ON public.poll_responses (question_id, profile_id)
  WHERE profile_id IS NOT NULL;
