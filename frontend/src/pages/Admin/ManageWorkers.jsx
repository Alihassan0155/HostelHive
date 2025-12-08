// src/pages/Admin/ManageWorkers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const ManageWorkers = () => {
  const { userData } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [adminHostels, setAdminHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [managing, setManaging] = useState(null);

  useEffect(() => {
    if (userData) {
      loadData();
    }
  }, [userData]);

  useEffect(() => {
    if (adminHostels.length > 0) {
      loadWorkers();
    }
  }, [selectedHostel, filterSkill, adminHostels]);

  const loadData = () => {
    setLoading(true);
    // Load admin's hostels only
    adminService.getAllHostels()
      .then(hostelsData => {
        // Filter to show only admin's hostels
        const adminHostelsFiltered = hostelsData.filter(hostel => 
          hostel.adminId === userData?.uid || hostel.adminId === userData?.id
        );
        setAdminHostels(adminHostelsFiltered);
        
        // Set default selected hostel to first one
        if (adminHostelsFiltered.length > 0 && !selectedHostel) {
          setSelectedHostel(adminHostelsFiltered[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setAdminHostels([]);
        setLoading(false);
      });
  };

  const loadWorkers = () => {
    if (!userData || adminHostels.length === 0) return;

    // Get all admin's hostel IDs
    const adminHostelIds = adminHostels.map(h => h.id);

    // Load all workers and filter by admin's hostels
    adminService.getAllUsers({ role: 'worker', limit: 200 })
      .then(allWorkers => {
        console.log('All workers loaded:', allWorkers);
        console.log('Admin hostel IDs:', adminHostelIds);
        
        // Filter workers that are attached to any of admin's hostels
        // Backend uses 'hostels' field (not 'hostelIds')
        let filteredWorkers = allWorkers.filter(worker => {
          // Check if worker is attached to any of admin's hostels
          if (worker.hostels && Array.isArray(worker.hostels)) {
            return worker.hostels.some(hId => adminHostelIds.includes(hId));
          }
          // Fallback for old data format
          if (worker.hostelIds && Array.isArray(worker.hostelIds)) {
            return worker.hostelIds.some(hId => adminHostelIds.includes(hId));
          }
          if (worker.hostelId) {
            return adminHostelIds.includes(worker.hostelId);
          }
          return false;
        });

        // Further filter by selected hostel if one is selected
        if (selectedHostel) {
          filteredWorkers = filteredWorkers.filter(worker => {
            if (worker.hostels && Array.isArray(worker.hostels)) {
              return worker.hostels.includes(selectedHostel);
            }
            // Fallback
            if (worker.hostelIds && Array.isArray(worker.hostelIds)) {
              return worker.hostelIds.includes(selectedHostel);
            }
            return worker.hostelId === selectedHostel;
          });
        }

        // Filter by skill if selected
        if (filterSkill) {
          filteredWorkers = filteredWorkers.filter(w => 
            w.skills && w.skills.includes(filterSkill)
          );
        }

        setWorkers(filteredWorkers);
      })
      .catch(err => {
        console.error("Error loading workers:", err);
        setWorkers([]);
      });
  };

  const handleAddToHostel = (workerId) => {
    if (!selectedHostel) {
      alert("Please select a hostel first");
      return;
    }

    setManaging(workerId);
    adminService.addWorkerToHostel(selectedHostel, workerId)
      .then(() => {
        alert("Worker added to hostel successfully!");
        loadWorkers();
      })
      .catch(err => {
        console.error("Error adding worker to hostel:", err);
        alert("Failed to add worker. Please try again.");
      })
      .finally(() => {
        setManaging(null);
      });
  };

  const handleRemoveFromHostel = (workerId) => {
    if (!selectedHostel) {
      return;
    }

    if (!window.confirm("Are you sure you want to remove this worker from the hostel?")) {
      return;
    }

    setManaging(workerId);
    adminService.removeWorkerFromHostel(selectedHostel, workerId)
      .then(() => {
        alert("Worker removed from hostel successfully!");
        loadWorkers();
      })
      .catch(err => {
        console.error("Error removing worker from hostel:", err);
        alert("Failed to remove worker. Please try again.");
      })
      .finally(() => {
        setManaging(null);
      });
  };

  const skills = ['electrical', 'plumbing', 'cleaning', 'carpentry', 'painting', 'general', 'internet', 'furniture'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Header title="Manage Workers" />

      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Workers in My Hostels</h2>
            <Link
              to="/dashboard/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Hostel</label>
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All My Hostels</option>
                {adminHostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Skill</label>
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Skills</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {adminHostels.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No hostels found</p>
              <p className="text-sm text-gray-400">You don't have any hostels yet. Create a hostel first to manage workers.</p>
            </div>
          </Card>
        ) : workers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No workers found</p>
              <p className="text-sm text-gray-400">
                {selectedHostel 
                  ? "No workers are attached to the selected hostel."
                  : "No workers are attached to any of your hostels."
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {workers.map((worker) => {
              const workerId = worker.id || worker.uid;
              return (
              <Card key={workerId}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {worker.firstName} {worker.lastName}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${worker.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {worker.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Email: <span className="font-medium text-gray-800">{worker.email}</span></div>
                      {worker.skills && worker.skills.length > 0 && (
                        <div>
                          Skills: <span className="font-medium text-gray-800">{worker.skills.join(", ")}</span>
                        </div>
                      )}
                      {(worker.hostels || worker.hostelIds) && (worker.hostels?.length > 0 || worker.hostelIds?.length > 0) && (
                        <div>
                          Assigned Hostels: 
                          <span className="font-medium text-gray-800 ml-2">
                            {(worker.hostels || worker.hostelIds || [])
                              .map(hId => {
                                const hostel = adminHostels.find(h => h.id === hId);
                                return hostel ? hostel.name : hId;
                              })
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    {selectedHostel && (
                      <>
                        {((worker.hostels && worker.hostels.includes(selectedHostel)) || 
                          (worker.hostelIds && worker.hostelIds.includes(selectedHostel))) ? (
                          <button
                            onClick={() => handleRemoveFromHostel(workerId)}
                            disabled={managing === workerId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {managing === workerId ? "Removing..." : "Remove from Hostel"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToHostel(workerId)}
                            disabled={managing === workerId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {managing === workerId ? "Adding..." : "Add to Hostel"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { ManageWorkers };
export default ManageWorkers;

