/**
 * Simple in-memory cache with TTL (Time To Live)
 * For server-side caching of frequently accessed data
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 60)
   */
  set(key, value, ttlSeconds = 60) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });

    // Set auto-cleanup timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);
    
    this.timers.set(key, timer);
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., "products:")
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.delete(key);
      }
    }
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
const cache = new MemoryCache();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SETUP: 300,        // 5 minutes - rarely changes
  CATEGORIES: 300,   // 5 minutes - rarely changes
  STAFF: 120,        // 2 minutes
  PRODUCTS: 60,      // 1 minute - changes more frequently
  ORDERS: 30,        // 30 seconds - changes frequently
  TRANSACTIONS: 30,  // 30 seconds
  DASHBOARD: 60,     // 1 minute
  EXPENSES: 120,     // 2 minutes
  STOCK_MOVEMENT: 60, // 1 minute
  NOTIFICATIONS: 15, // 15 seconds for notifications
};

// Cache key generators
export const CACHE_KEYS = {
  SETUP: () => "setup:config",
  CATEGORIES: () => "categories:all",
  STAFF: (page = 1, limit = 50) => `staff:list:${page}:${limit}`,
  STAFF_COUNT: () => "staff:count",
  PRODUCTS: (page = 1, limit = 50, filter = "") => `products:list:${page}:${limit}:${filter}`,
  PRODUCTS_COUNT: (filter = "") => `products:count:${filter}`,
  PRODUCTS_SEARCH: (search) => `products:search:${search}`,
  ORDERS: (page = 1, limit = 10, search = "") => `orders:list:${page}:${limit}:${search}`,
  TRANSACTIONS: (page = 1, limit = 100, days = "") => `transactions:list:${page}:${limit}:${days}`,
  EXPENSES: (page = 1, limit = 50) => `expenses:list:${page}:${limit}`,
  EXPENSE_CATEGORIES: () => "expense:categories",
  STOCK_MOVEMENTS: (page = 1, limit = 50) => `stock:movements:${page}:${limit}`,
  DASHBOARD: (location = "all") => `dashboard:${location}`,
  NOTIFICATIONS: (limit = 20, isRead = 'all', type = 'all') => `notifications:${limit}:${isRead}:${type}`,
};

/**
 * Wrapper function for cached data fetching
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - TTL in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
export async function getCachedData(key, fetchFn, ttl = 60) {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  cache.set(key, data, ttl);
  
  return data;
}

/**
 * Invalidate cache when data is modified
 * @param {string} type - Type of data modified (e.g., "products", "staff")
 */
export function invalidateCache(type) {
  switch (type) {
    case "products":
      cache.invalidatePattern("products:");
      cache.invalidatePattern("dashboard:");
      break;
    case "staff":
      cache.invalidatePattern("staff:");
      break;
    case "orders":
      cache.invalidatePattern("orders:");
      cache.invalidatePattern("dashboard:");
      break;
    case "transactions":
      cache.invalidatePattern("transactions:");
      cache.invalidatePattern("dashboard:");
      break;
    case "expenses":
      cache.invalidatePattern("expenses:");
      break;
    case "categories":
      cache.invalidatePattern("categories:");
      break;
    case "setup":
      cache.invalidatePattern("setup:");
      break;
    case "stock":
      cache.invalidatePattern("stock:");
      break;
    case "notifications":
      cache.invalidatePattern("notifications:");
      break;
    case "all":
      cache.clear();
      break;
    default:
      cache.invalidatePattern(type);
  }
}

export default cache;
