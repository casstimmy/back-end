import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Trash2, Check, AlertCircle, Package, TrendingDown, Send } from "lucide-react";
import Layout from "@/components/Layout";

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "order_received",
    priority: "medium",
    actionLabel: "",
    actionLink: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    order_received: 0,
    low_stock: 0,
    promotion_end: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/notifications", { params: { limit: 100 } });
      if (res.data.success) {
        setNotifications(res.data.data);
        calculateStats(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notifs) => {
    setStats({
      total: notifs.length,
      unread: notifs.filter((n) => !n.isRead).length,
      order_received: notifs.filter((n) => n.type === "order_received").length,
      low_stock: notifs.filter((n) => n.type === "low_stock").length,
      promotion_end: notifs.filter((n) => n.type === "promotion_end").length,
    });
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
      };

      if (formData.actionLabel && formData.actionLink) {
        payload.action = {
          label: formData.actionLabel,
          link: formData.actionLink,
        };
      }

      const res = await axios.post("/api/notifications", payload);
      if (res.data.success) {
        alert("Notification created successfully!");
        setFormData({
          title: "",
          message: "",
          type: "order_received",
          priority: "medium",
          actionLabel: "",
          actionLink: "",
        });
        setShowCreate(false);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      alert("Error creating notification");
    }
  };

  const deleteNotification = async (id) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      try {
        await axios.delete("/api/notifications", { data: { _id: id } });
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        calculateStats(notifications.filter((n) => n._id !== id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const getIcon = (type) => {
    const iconClass = "w-5 h-5";
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notifications Management
          </h1>
          <p className="text-gray-600">
            Create and manage system notifications for orders, stock, and promotions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Unread", value: stats.unread, bg: "bg-yellow-50", border: "border-yellow-200" },
            { label: "Orders", value: stats.order_received, bg: "bg-green-50", border: "border-green-200" },
            { label: "Low Stock", value: stats.low_stock, bg: "bg-orange-50", border: "border-orange-200" },
            { label: "Promos Ended", value: stats.promotion_end, bg: "bg-red-50", border: "border-red-200" },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} border ${stat.border} rounded-lg p-4`}>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Create Button */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition font-medium flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Create Manual Notification
          </button>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">Create Manual Notification</h2>
            <form onSubmit={handleCreateNotification}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="order_received">Order Received</option>
                    <option value="low_stock">Low Stock Alert</option>
                    <option value="promotion_end">Promotion Ended</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.actionLabel}
                    onChange={(e) =>
                      setFormData({ ...formData, actionLabel: e.target.value })
                    }
                    placeholder="e.g., View Order"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.actionLink}
                    onChange={(e) =>
                      setFormData({ ...formData, actionLink: e.target.value })
                    }
                    placeholder="e.g., /manage/orders"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition font-medium"
                >
                  Create Notification
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No notifications yet
                    </td>
                  </tr>
                ) : (
                  notifications.map((notif) => (
                    <tr
                      key={notif._id}
                      className={`border-b hover:bg-gray-50 ${
                        !notif.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getIcon(notif.type)}
                          <span className="capitalize">{notif.type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {notif.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            notif.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : notif.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {notif.priority.charAt(0).toUpperCase() +
                            notif.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {notif.isRead ? (
                          <span className="text-gray-500">Read</span>
                        ) : (
                          <span className="text-blue-600 font-medium">Unread</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteNotification(notif._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
