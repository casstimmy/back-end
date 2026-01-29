"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bell, X, Check, Trash2, AlertCircle, Package, TrendingDown, CheckCheck, PackageX } from "lucide-react";

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, order_received, low_stock, promotion_end
  const [paused, setPaused] = useState(false);
  const [pollIntervalMs, setPollIntervalMs] = useState(30000); // 30 seconds default
  const lastErrorLoggedRef = useRef(null);
  const timerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const lastFetchRef = useRef(0);
  const panelRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const tick = async () => {
      // Skip polling if paused, tab not visible, or panel is closed
      const shouldFetch = !paused && isVisibleRef.current;
      if (shouldFetch) {
        await fetchNotifications();
      }
      // Use longer interval when panel is closed
      const interval = isOpen ? 15000 : pollIntervalMs;
      timerRef.current = setTimeout(tick, interval);
    };

    // Initial fetch only (no immediate polling)
    const now = Date.now();
    if (now - lastFetchRef.current > 5000) {
      fetchNotifications();
      lastFetchRef.current = now;
    }
    timerRef.current = setTimeout(tick, pollIntervalMs);

    // Online/offline listeners to auto-pause/resume
    const handleOnline = () => {
      setPaused(false);
      setErrorMsg("");
      setPollIntervalMs(30000);
      fetchNotifications();
    };
    const handleOffline = () => {
      setPaused(true);
      setErrorMsg("You are offline. Notifications paused.");
      setPollIntervalMs(60000);
    };

    // Visibility change - pause polling when tab is hidden
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      if (isVisibleRef.current && !paused) {
        // Refresh when tab becomes visible again
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch > 30000) {
          fetchNotifications();
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/notifications", { params: { limit: 30 } });
      lastFetchRef.current = Date.now();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
        setErrorMsg("");
        // Only log the first success after an error burst
        if (lastErrorLoggedRef.current) {
          lastErrorLoggedRef.current = null;
        }
        // On successful fetch, ensure normal cadence
        setPaused(false);
        setPollIntervalMs(30000);
      } else {
        setErrorMsg(res.data?.message || "Failed to load notifications");
      }
    } catch (error) {
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      if (!isOnline) {
        setErrorMsg("You are offline. Notifications paused.");
        setPaused(true);
        setPollIntervalMs(60000);
      } else if (error.response) {
        setErrorMsg(error.response.data?.message || `Server error (${error.response.status})`);
        // Server responded with error; keep polling but back off
        setPollIntervalMs((prev) => Math.min(120000, Math.max(30000, prev + 15000)));
      } else {
        // Likely connection refused / server down in dev
        setErrorMsg("Server unreachable. Pausing notifications and will retry.");
        setPaused(true);
        // Exponential backoff upper-bounded at 2 minutes
        setPollIntervalMs((prev) => Math.min(120000, prev ? prev * 2 : 30000));
      }
      // Suppress repeated console error spam; log only first occurrence per burst
      if (!lastErrorLoggedRef.current) {
        lastErrorLoggedRef.current = Date.now();
        console.error("[NotificationsCenter] Fetch error:", error?.code || error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Allow other pages to trigger an immediate refresh (e.g., after status update)
  useEffect(() => {
    const handleRefresh = () => {
      setPaused(false);
      setPollIntervalMs(30000);
      fetchNotifications();
    };
    window.addEventListener("notifications:refresh", handleRefresh);
    return () => window.removeEventListener("notifications:refresh", handleRefresh);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put("/api/notifications", {
        _id: notificationId,
        isRead: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;

      // Mark all unread as read in parallel
      await Promise.all(
        unreadNotifications.map(n => 
          axios.put("/api/notifications", { _id: n._id, isRead: true })
        )
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete("/api/notifications", {
        data: { _id: notificationId },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order_received":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "low_stock":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "out_of_stock":
        return <PackageX className="w-5 h-5 text-red-600" />;
      case "promotion_end":
        return <TrendingDown className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500 bg-red-50";
      case "medium":
        return "border-l-4 border-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-4 border-blue-500 bg-blue-50";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.isRead;
    return notif.type === filter;
  });

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            // Refresh on open to get latest (only if stale)
            const timeSinceLastFetch = Date.now() - lastFetchRef.current;
            setPaused(false);
            if (timeSinceLastFetch > 5000) {
              fetchNotifications();
            }
          }
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {errorMsg && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center" title={errorMsg}>
            !
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div ref={panelRef} className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 flex justify-between items-center">
            <h2 className="text-lg font-bold">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="hover:bg-amber-700 p-1 rounded transition flex items-center gap-1 text-xs"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-amber-700 p-1 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="px-4 py-2 text-xs bg-amber-50 text-amber-700 border-b border-amber-200">
              {errorMsg}
            </div>
          )}

          {/* Filters */}
          <div className="border-b p-3 flex gap-2 flex-wrap bg-gray-50">
            {["all", "unread", "order_received", "out_of_stock", "low_stock", "promotion_end"].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    filter === f
                      ? "bg-amber-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {f === "all"
                    ? "All"
                    : f === "unread"
                    ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`
                    : f === "order_received"
                    ? "Orders"
                    : f === "out_of_stock"
                    ? "Out of Stock"
                    : f === "low_stock"
                    ? "Low Stock"
                    : "Promos"}
                </button>
              )
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {filteredNotifications.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 border-b hover:bg-gray-50 transition cursor-pointer ${getPriorityColor(
                    notif.priority
                  )} ${!notif.isRead ? "bg-blue-50" : ""}`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>

                      {notif.action && (
                        <a
                          href={notif.action.link}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block"
                        >
                          {notif.action.label} →
                        </a>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex flex-col gap-1">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                          className="p-1 hover:bg-gray-200 rounded transition"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                        className="p-1 hover:bg-gray-200 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {loading && (
            <div className="border-t p-3 bg-gray-50 text-center text-xs text-gray-500">Loading…</div>
          )}
          {notifications.length > 0 && !loading && (
            <div className="border-t p-3 bg-gray-50 text-center">
              <a
                href="/notifications"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View All Notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
