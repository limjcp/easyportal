export function participantSetKey(ids: string[]): string {
  return [...new Set(ids)].sort().join("|");
}

export function conversationsMatchParticipants(
  convParticipantIds: string[],
  actorId: string,
  recipientIds: string[]
): boolean {
  const target = participantSetKey([actorId, ...recipientIds]);
  return participantSetKey(convParticipantIds) === target;
}
