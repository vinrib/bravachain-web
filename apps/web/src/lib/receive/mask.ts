/**
 * Masks a PIX key for display, keeping enough tail/head to be recognizable
 * without exposing the full value. E-mails keep the first char and domain;
 * everything else shows the last 4 characters.
 */
export function maskPixKey(key: string): string {
  const k = (key ?? "").trim();
  if (!k) return "";
  if (k.includes("@")) {
    const at = k.indexOf("@");
    const user = k.slice(0, at);
    const domain = k.slice(at + 1);
    const head = user.slice(0, 1);
    return `${head}${"•".repeat(Math.max(3, user.length - 1))}@${domain}`;
  }
  if (k.length <= 4) return "•".repeat(k.length);
  return `${"•".repeat(Math.max(4, k.length - 4))}${k.slice(-4)}`;
}
