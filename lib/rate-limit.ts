type RateLimitEntry = { timestamps: number[] };

export const RATE_LIMIT_MAX = 20;
export const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 10_000;
const clients = new Map<string, RateLimitEntry>();

export function checkRateLimit(clientId: string, now = Date.now()): boolean {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const entry = clients.get(clientId) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    clients.set(clientId, entry);
    return false;
  }

  entry.timestamps.push(now);
  clients.set(clientId, entry);
  if (clients.size > MAX_TRACKED_CLIENTS) {
    const oldest = clients.keys().next().value;
    if (oldest) clients.delete(oldest);
  }
  return true;
}

export function resetRateLimitForTests(): void {
  clients.clear();
}
