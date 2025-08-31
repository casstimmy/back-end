import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
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
      const res = await axios.get("/api/staff");
      setStaffList(res.data);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      alert("Failed to fetch staff");
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
    if (!formData.name || !formData.username || !formData.password) return;
    try {
      await axios.post("/api/staff", formData);
      setFormData({ name: "", username: "", password: "", role: "staff" });
      fetchStaff();
    } catch (err) {
      alert("Failed to create staff: " + (err.response?.data?.error || err.message));
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Staff Management</h1>

        {/* Form Card */}
        <div className="bg-white shadow-md rounded-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Staff</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              className="border px-3 py-2 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="border px-3 py-2 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="border px-3 py-2 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-sm transition"
            >
              Add Staff
            </button>
          </form>
        </div>

        {/* Staff Table */}
        <div className="overflow-auto bg-white shadow-md rounded-sm">
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
        </div>
      </div>
    </Layout>
  );
}
