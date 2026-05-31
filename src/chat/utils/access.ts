export function canMessageAnyBuilding(role: string): boolean {
  return role === "Company Owner" || role === "Company Administrator";
}

export function canMessageContact(
  actorBuildingId: string,
  contactBuildingId: string,
  canMessageAny: boolean
): boolean {
  if (canMessageAny) return true;
  return actorBuildingId === contactBuildingId;
}
