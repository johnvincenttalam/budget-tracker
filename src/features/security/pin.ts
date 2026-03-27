export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === hash;
}
