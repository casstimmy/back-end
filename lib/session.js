import { getIronSession } from "iron-session";

// Ensure SESSION_SECRET is set in production
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || "dev_only_secret_at_least_32_characters_long_12345",
  cookieName: "oma_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

/**
 * Wrapper for API routes that require session
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with session
 */
export function withSessionRoute(handler) {
  return async (req, res) => {
    try {
      req.session = await getIronSession(req, res, sessionOptions);
      return await handler(req, res);
    } catch (error) {
      console.error("[Session Error]:", error.message);
      return res.status(500).json({ error: "Session error" });
    }
  };
}

/**
 * Wrapper for API routes that require authentication
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with auth check
 */
export function withAuth(handler) {
  return withSessionRoute(async (req, res) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    return await handler(req, res);
  });
}

/**
 * Wrapper for API routes that require admin privileges
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with admin check
 */
export function withAdminAuth(handler) {
  return withSessionRoute(async (req, res) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    if (!req.session.user.isAdmin) {
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }
    return await handler(req, res);
  });
}
