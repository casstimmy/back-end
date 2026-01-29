import { withSessionRoute } from "@/lib/session";

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    req.session.destroy();
    res.json({ ok: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("[Logout Error]:", error.message);
    res.status(500).json({ error: "Logout failed" });
  }
});
