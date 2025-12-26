/**
 * Performance utilities: caching, debouncing, throttling
 */

// LRU Cache for AI responses
export class LRUCache<T> {
  private cache: Map<string, { value: T; timestamp: number }>;
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize = 50, maxAgeMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAgeMs;
  }

  private hash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  get(key: string): T | null {
    const hashed = this.hash(key);
    const entry = this.cache.get(hashed);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(hashed);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(hashed);
    this.cache.set(hashed, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    const hashed = this.hash(key);

    if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(hashed, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle function
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize function results
export function memoize<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// AI Response Cache (singleton)
export const aiCache = new LRUCache<string>(100, 10 * 60 * 1000); // 100 entries, 10 min TTL

// Request deduplication for in-flight requests
const pendingRequests = new Map<string, Promise<unknown>>();

export async function dedupeRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Measure performance
export function measurePerf<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.debug(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Async version
export async function measurePerfAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.debug(`[Perf] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}
