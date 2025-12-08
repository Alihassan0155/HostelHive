// src/pages/Admin/ManageHostels.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const ManageHostels = () => {
  const { userData } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalRooms: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (userData) {
      loadHostels();
    }
  }, [userData]);

  const loadHostels = () => {
    setLoading(true);
    adminService.getAllHostels()
      .then(res => {
        // Filter hostels to show only admin's hostels
        const adminHostels = res.filter(hostel => 
          hostel.adminId === userData?.uid || hostel.adminId === userData?.id
        );
        setHostels(adminHostels);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading hostels:", err);
        setHostels([]);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (editing) {
      adminService.updateHostel(editing, formData)
        .then(() => {
          alert("Hostel updated successfully!");
          setShowForm(false);
          setEditing(null);
          setFormData({ name: "", address: "", totalRooms: "" });
          loadHostels();
        })
        .catch(err => {
          console.error("Error updating hostel:", err);
          alert("Failed to update hostel. Please try again.");
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      adminService.createHostel({
        ...formData,
        adminId: userData?.uid || userData?.id,
        totalRooms: parseInt(formData.totalRooms, 10),
      })
        .then(() => {
          alert("Hostel created successfully!");
          setShowForm(false);
          setFormData({ name: "", address: "", totalRooms: "" });
          loadHostels();
        })
        .catch(err => {
          console.error("Error creating hostel:", err);
          alert("Failed to create hostel. Please try again.");
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  const handleEdit = (hostel) => {
    setEditing(hostel.id);
    setFormData({
      name: hostel.name || "",
      address: hostel.address || "",
      totalRooms: hostel.totalRooms?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = (hostelId, hostelName) => {
    if (!window.confirm(`Are you sure you want to delete ${hostelName}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(hostelId);
    adminService.deleteHostel(hostelId)
      .then(() => {
        loadHostels();
      })
      .catch(err => {
        console.error("Error deleting hostel:", err);
        alert("Failed to delete hostel. Please try again.");
      })
      .finally(() => {
        setDeleting(null);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Header title="Manage Hostels" />

      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Hostels</h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditing(null);
                  setFormData({ name: "", address: "", totalRooms: "" });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {showForm ? "Cancel" : "+ Add Hostel"}
              </button>
              <Link
                to="/dashboard/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                ← Back
              </Link>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                <input
                  type="number"
                  value={formData.totalRooms}
                  onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : editing ? "Update Hostel" : "Create Hostel"}
              </button>
            </form>
          )}
        </Card>

        {hostels.length === 0 && !showForm ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No hostels found</p>
              <p className="text-sm text-gray-400">You don't have any hostels yet. Click "Add Hostel" to create one.</p>
            </div>
          </Card>
        ) : hostels.length > 0 ? (
          <div className="space-y-4">
            {hostels.map((hostel) => (
              <Card key={hostel.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{hostel.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Address: <span className="font-medium text-gray-800">{hostel.address}</span></div>
                      <div>Total Rooms: <span className="font-medium text-gray-800">{hostel.totalRooms}</span></div>
                      {hostel.adminId && (
                        <div>Admin ID: <span className="font-medium text-gray-800">{hostel.adminId.substring(0, 8)}...</span></div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(hostel)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hostel.id, hostel.name)}
                      disabled={deleting === hostel.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {deleting === hostel.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export { ManageHostels };
export default ManageHostels;

