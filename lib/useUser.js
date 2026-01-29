import { useEffect, useState, useCallback } from "react";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[useUser] Failed to fetch user:", err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("[useUser] Logout failed:", err);
      // Still clear user on error
      setUser(null);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, logout, refresh };
}
