// src/pages/Admin/ManageUsers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { X } from "lucide-react";
import { HostelNameDisplay } from "../../components/UI/NameDisplay";

const ManageUsers = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("student");
  const [deleting, setDeleting] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminHostels, setAdminHostels] = useState([]);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    hostelId: "",
  });
  const [adminFormErrors, setAdminFormErrors] = useState({});

  useEffect(() => {
    if (userData) {
      loadAdminHostels();
    }
  }, [userData]);

  useEffect(() => {
    if (userData && (adminHostels.length > 0 || filterRole !== "admin")) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, userData, adminHostels.length]);

  const loadAdminHostels = () => {
    adminService.getAllHostels()
      .then(allHostels => {
        // Filter to show only admin's hostels
        const adminHostelsFiltered = allHostels.filter(hostel => 
          hostel.adminId === userData?.uid || hostel.adminId === userData?.id
        );
        setAdminHostels(adminHostelsFiltered);
        
        // Set default hostel for admin form
        if (adminHostelsFiltered.length > 0 && !adminFormData.hostelId) {
          setAdminFormData({ ...adminFormData, hostelId: adminHostelsFiltered[0].id });
        }
      })
      .catch(err => {
        console.error("Error loading admin hostels:", err);
        setAdminHostels([]);
      });
  };

  const loadUsers = () => {
    setLoading(true);
    
    if (filterRole === "student") {
      if (!userData?.hostelId) {
        setUsers([]);
        setLoading(false);
        return;
      }
      // Load students in background without blocking
      adminService.getAllUsers({ 
        role: "student", 
        hostelId: userData.hostelId,
        limit: 100 
      })
        .then(students => {
          setUsers(students);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading users:", err);
          setUsers([]);
          setLoading(false);
        });
    } else if (filterRole === "worker") {
      if (!userData?.hostelId) {
        setUsers([]);
        setLoading(false);
        return;
      }
      // Load workers in background without blocking
      adminService.getAllUsers({ role: "worker", limit: 200 })
        .then(allWorkers => {
          const filteredWorkers = allWorkers.filter(worker => {
            // Backend uses 'hostels' field (not 'hostelIds')
            if (worker.hostels && Array.isArray(worker.hostels)) {
              return worker.hostels.includes(userData.hostelId);
            }
            // Fallback for old data format
            if (worker.hostelIds && Array.isArray(worker.hostelIds)) {
              return worker.hostelIds.includes(userData.hostelId);
            }
            return worker.hostelId === userData.hostelId;
          });
          setUsers(filteredWorkers);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading users:", err);
          setUsers([]);
          setLoading(false);
        });
    } else if (filterRole === "admin") {
      // Load admins for admin's hostels
      const adminHostelIds = adminHostels.map(h => h.id);
      adminService.getAllUsers({ role: "admin", limit: 200 })
        .then(allAdmins => {
          const filteredAdmins = allAdmins.filter(admin => {
            // Filter admins that belong to any of the current admin's hostels
            if (admin.hostelId) {
              return adminHostelIds.includes(admin.hostelId);
            }
            return false;
          });
          setUsers(filteredAdmins);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading admins:", err);
          setUsers([]);
          setLoading(false);
        });
    } else {
      setUsers([]);
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(userId);
      await adminService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Validate Pakistani phone number
  const validatePakistaniPhone = (phone) => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return /^[0-9]{10}$/.test(digitsOnly);
  };

  const validateAdminForm = () => {
    const newErrors = {};
    
    if (!adminFormData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!adminFormData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!adminFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminFormData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!adminFormData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!validatePakistaniPhone(adminFormData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }
    if (!adminFormData.password) {
      newErrors.password = "Password is required";
    } else if (adminFormData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!adminFormData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (adminFormData.password !== adminFormData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!adminFormData.hostelId) {
      newErrors.hostelId = "Please select a hostel";
    }

    setAdminFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminFormData({ ...adminFormData, [name]: value });
    // Clear error when user starts typing
    if (adminFormErrors[name]) {
      setAdminFormErrors({ ...adminFormErrors, [name]: '' });
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!validateAdminForm()) {
      return;
    }

    setSubmittingAdmin(true);
    
    try {
      // Format phone number with +92 prefix
      const phoneNumber = adminFormData.phoneNumber.trim();
      const formattedPhoneNumber = phoneNumber.startsWith('+92') 
        ? phoneNumber 
        : `+92${phoneNumber}`;

      const adminData = {
        firstName: adminFormData.firstName.trim(),
        lastName: adminFormData.lastName.trim(),
        email: adminFormData.email.trim(),
        password: adminFormData.password,
        phoneNumber: formattedPhoneNumber,
        role: "admin",
        hostelId: adminFormData.hostelId, // Assign to selected hostel
      };

      await adminService.createAdmin(adminData);
      
      // Reset form and close modal
      setAdminFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        hostelId: adminHostels.length > 0 ? adminHostels[0].id : "",
      });
      setAdminFormErrors({});
      setShowAddAdminModal(false);
      
      // Reload users list
      await loadUsers();
      
      alert("Admin added successfully!");
    } catch (err) {
      console.error("Error adding admin:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to add admin. Please try again.";
      alert(errorMessage);
    } finally {
      setSubmittingAdmin(false);
    }
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
      <Header title="Manage Users" />

      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {filterRole === "student" ? "Students" : filterRole === "worker" ? "Workers" : "Admins"} in My Hostel{filterRole === "admin" ? "s" : ""}
            </h2>
            <Link
              to="/dashboard/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <div className="flex gap-4 items-center">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Students</option>
                <option value="worker">Workers</option>
                <option value="admin">Admins</option>
              </select>
              {filterRole === "admin" && (
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Admin
                </button>
              )}
            </div>
            {userData?.hostelId && (
              <p className="text-sm text-gray-500 mt-2">
                Showing users from: <span className="font-medium text-gray-700"><HostelNameDisplay hostelId={userData.hostelId} /></span>
              </p>
            )}
          </div>
        </Card>

        {users.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No users found</p>
              <p className="text-sm text-gray-400">
                No {filterRole === "student" ? "students" : filterRole === "worker" ? "workers" : "admins"} found in your hostel{filterRole === "admin" ? "s" : ""}.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              // Handle both id and uid fields
              const userId = user.id || user.uid;
              return (
                <Card key={userId}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Email: <span className="font-medium text-gray-800">{user.email}</span></div>
                        {user.hostelId && (
                          <div>Hostel: <span className="font-medium text-gray-800"><HostelNameDisplay hostelId={user.hostelId} /></span></div>
                        )}
                        {user.roomNumber && (
                          <div>Room: <span className="font-medium text-gray-800">{user.roomNumber}</span></div>
                        )}
                        {user.skills && user.skills.length > 0 && (
                          <div>
                            Skills: <span className="font-medium text-gray-800">{user.skills.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleDelete(userId, `${user.firstName} ${user.lastName}`)}
                        disabled={deleting === userId}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {deleting === userId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Admin Modal */}
        {showAddAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Add New Admin</h3>
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAdminFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={adminFormData.firstName}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {adminFormErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={adminFormData.lastName}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {adminFormErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={adminFormData.email}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {adminFormErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                      +92
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={adminFormData.phoneNumber}
                      onChange={handleAdminFormChange}
                      placeholder="XXXXXXXXXX"
                      maxLength={10}
                      className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        adminFormErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {adminFormErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={adminFormData.password}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {adminFormErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={adminFormData.confirmPassword}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {adminFormErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hostel *
                  </label>
                  <select
                    name="hostelId"
                    value={adminFormData.hostelId}
                    onChange={handleAdminFormChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      adminFormErrors.hostelId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a hostel</option>
                    {adminHostels.map(hostel => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                  {adminFormErrors.hostelId && (
                    <p className="mt-1 text-sm text-red-600">{adminFormErrors.hostelId}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAdminModal(false);
                      setAdminFormErrors({});
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdmin}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submittingAdmin ? "Adding..." : "Add Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ManageUsers };
export default ManageUsers;

