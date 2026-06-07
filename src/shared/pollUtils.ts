import type { PollQuestion } from "../resident/data/types";

export const POLL_QUESTION_TYPE_SINGLE = "single";

export function parsePollAnswerOptions(question: PollQuestion): string[] {
  return question.answerOptions
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
}

export function formatPollAnswerOptions(options: string[]): string {
  return options
    .map((option) => option.trim())
    .filter(Boolean)
    .join("\n");
}
