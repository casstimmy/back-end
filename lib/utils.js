/**
 * Utility functions for the application
 */

/**
 * Format a number with comma separators for Nigerian locale
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format currency with Naira symbol and comma separators
 * @param {number|string} value - The amount to format
 * @param {boolean} showSymbol - Whether to show ₦ symbol (default: true)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, showSymbol = true) {
  if (value === null || value === undefined || value === "") {
    return showSymbol ? "₦0" : "0";
  }
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return showSymbol ? "₦0" : "0";
  
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  return showSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format percentage value
 * @param {number|string} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || value === "") return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format quantity with comma separators
 * @param {number|string} value - The quantity
 * @returns {string} Formatted quantity string
 */
export function formatQuantity(value) {
  return formatNumber(value, 0);
}

/**
 * Parse a formatted number string back to a number
 * @param {string} value - The formatted string
 * @returns {number} The parsed number
 */
export function parseFormattedNumber(value) {
  if (!value) return 0;
  // Remove currency symbol, commas, and spaces
  const cleaned = String(value).replace(/[₦,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validate phone number (Nigerian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone is valid
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  // Nigerian phone formats: +234..., 234..., 0...
  const cleaned = phone.replace(/[\s-]/g, "");
  const regex = /^(\+?234|0)[789][01]\d{8}$/;
  return regex.test(cleaned);
}

/**
 * Sanitize string input (remove special characters that could cause issues)
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} Whether ID is valid
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - The date
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return past.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date for display
 * @param {Date|string} date - The date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
  if (!date) return "";
  const d = new Date(date);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  };
  return d.toLocaleDateString("en-NG", options);
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generate a random ID string
 * @param {number} length - Length of ID (default: 8)
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @returns {number} Percentage change
 */
export function calculatePercentChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Group array items by a key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === "function" ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
}
