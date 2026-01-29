import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Trash2, Check, AlertCircle, Package, TrendingDown } from "lucide-react";
import Layout from "@/components/Layout";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/notifications", { params: { limit: 100 } });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put("/api/notifications", { _id: id, isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete("/api/notifications", { data: { _id: id } });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const getIcon = (type) => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case "order_received":
        return <Package className={`${iconClass} text-blue-500`} />;
      case "low_stock":
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case "promotion_end":
        return <TrendingDown className={`${iconClass} text-red-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === "unread") {
      return a.isRead - b.isRead;
    }
    return 0;
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Manage your notifications for orders, promotions, and inventory alerts
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="order_received">Orders Received</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="promotion_end">Promotion Ended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="unread">Unread First</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchNotifications}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "You're all caught up!"
                  : `No ${filter.replace("_", " ")} notifications found.`}
              </p>
            </div>
          ) : (
            sortedNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 transition ${
                  !notification.isRead
                    ? "border-l-blue-500 bg-blue-50"
                    : "border-l-gray-200 hover:shadow-lg"
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            notification.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : notification.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {notification.priority.charAt(0).toUpperCase() +
                            notification.priority.slice(1)}{" "}
                          Priority
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{notification.message}</p>

                    {notification.data && (
                      <div className="bg-gray-50 rounded p-3 mb-4 text-sm text-gray-600">
                        <details>
                          <summary className="cursor-pointer font-medium">
                            View Details
                          </summary>
                          <pre className="mt-2 overflow-x-auto">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}

                    {notification.action && (
                      <a
                        href={notification.action.link}
                        className="inline-block text-amber-600 hover:text-amber-700 font-medium mb-4"
                      >
                        {notification.action.label} →
                      </a>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
