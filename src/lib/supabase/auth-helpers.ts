export const INTERNAL_EMAIL_DOMAIN = "@zeroorigins.in";

export function isZeroOriginsEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN));
}
