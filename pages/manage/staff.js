import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state added
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "staff",
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/staff");
      // Handle both old format (array) and new format ({ staff: [...] })
      const staffData = Array.isArray(res.data) ? res.data : res.data?.staff || [];
      setStaffList(staffData);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      alert("Failed to fetch staff");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      alert("Please fill in all required fields (Name, Username, Password)");
      return;
    }
    try {
      await axios.post("/api/staff", formData);
      setFormData({ name: "", username: "", password: "", role: "staff" });
      fetchStaff();
    } catch (err) {
      const errorData = err.response?.data;
      // Show validation errors array if available
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        alert("Validation errors:\n" + errorData.errors.join("\n"));
      } else {
        alert("Failed to create staff: " + (errorData?.error || err.message));
      }
    }
  };

  const startEditing = (staff) => {
    setEditingId(staff._id);
    setEditData({
      name: staff.name,
      username: staff.username,
      role: staff.role,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`/api/staff/${id}`, editData);
      setEditingId(null);
      setEditData({});
      fetchStaff();
    } catch (err) {
      alert("Failed to update staff: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Layout>
      <div className="p-6 w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl text-amber-900 font-bold mb-6">
          Staff Management
        </h1>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Staff</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                name="name"
                placeholder="Name (min 2 chars)"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-sm focus:ring-2 focus:ring-amber-500 outline-none"
                minLength={2}
                required
              />
            </div>
            <div>
              <input
                name="username"
                placeholder="Username (3-30 chars, letters/numbers/_)"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-sm focus:ring-2 focus:ring-amber-500 outline-none"
                pattern="^[a-zA-Z0-9_]{3,30}$"
                title="3-30 characters, only letters, numbers, and underscores"
                required
              />
            </div>
            <div>
              <input
                name="password"
                placeholder="PIN (4 digits)"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-sm focus:ring-2 focus:ring-amber-500 outline-none"
                pattern="\d{4}"
                maxLength={4}
                title="PIN must be exactly 4 digits"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-sm transition"
            >
              Add Staff
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            * Username: 3-30 characters, only letters, numbers, and underscores. PIN: exactly 4 digits.
          </p>
        </div>

        {/* Staff Table */}
        <div className="overflow-auto bg-white shadow-md rounded-sm">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No staff members found.</p>
          ) : (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Username</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff._id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <input
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        staff.name
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <input
                          name="username"
                          value={editData.username}
                          onChange={handleEditChange}
                          className="border px-2 py-1 rounded w-full"
                        />
                      ) : (
                        staff.username
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <select
                          name="role"
                          value={editData.role}
                          onChange={handleEditChange}
                          className="border px-2 py-1 rounded w-full"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      ) : (
                        <span className="capitalize">{staff.role}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === staff._id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => saveEdit(staff._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(staff)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
