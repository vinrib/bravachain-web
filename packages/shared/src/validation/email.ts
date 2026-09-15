// Pragmatic e-mail check: good enough for form UX, not RFC 5322 exhaustive.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
