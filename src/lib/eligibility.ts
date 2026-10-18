export function canParticipate(past: boolean, ticket: boolean, attended: boolean) {
  return past ? attended : ticket || attended;
}
export function validReelDuration(seconds: number) {
  return Number.isFinite(seconds) && seconds > 0 && seconds <= 10;
}
export function sharingActive(status: string, expiresAt: string | null, now = Date.now()) {
  return status === "active" && expiresAt !== null && Date.parse(expiresAt) > now;
}