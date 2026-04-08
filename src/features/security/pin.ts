export async function hashPin(pin: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(pin);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-secure contexts (HTTP) — simple hash
  let hash = 0;
  const str = 'pin-salt-' + pin;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === hash;
}
