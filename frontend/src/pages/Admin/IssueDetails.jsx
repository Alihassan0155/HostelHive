// src/pages/Admin/IssueDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Building2,
  Tag,
  TrendingUp,
  UserCheck,
  CalendarClock
} from "lucide-react";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import DateDisplay from "../../components/UI/DateDisplay";
import issueService from "../../services/issueService";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatRelativeTime } from "../../utils/dateUtils";

const statusConfig = (status) => {
  switch (status) {
    case "pending":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        label: "Pending",
        dot: "bg-yellow-500"
      };
    case "assigned":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: UserCheck,
        label: "Assigned",
        dot: "bg-blue-500"
      };
    case "in_progress":
      return {
        color: "bg-indigo-100 text-indigo-800 border-indigo-300",
        icon: Loader2,
        label: "In Progress",
        dot: "bg-indigo-500"
      };
    case "completed":
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
        label: "Completed",
        dot: "bg-green-500"
      };
    case "closed":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: CheckCircle2,
        label: "Closed",
        dot: "bg-gray-500"
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: AlertCircle,
        label: "Unknown",
        dot: "bg-gray-500"
      };
  }
};



const formatType = (type) => {
  if (!type) return "N/A";
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [task, setTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [createdByUser, setCreatedByUser] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    setLoading(true);
    
    // Load issue and admin's hostels in parallel
    Promise.all([
      issueService.getIssueById(id),
      adminService.getAllHostels()
    ])
      .then(([taskData, allHostels]) => {
        // Filter to get only admin's hostels
        const adminHostels = allHostels.filter(hostel => 
          hostel.adminId === userData?.uid || hostel.adminId === userData?.id
        );
        const adminHostelIds = adminHostels.map(h => h.id);
        setHostels(adminHostels);
        
        setTask(taskData);
        
        // Fetch the user who created the issue
        const createdBy = taskData.createdBy || taskData.studentId;
        if (createdBy) {
          adminService.getUserById(createdBy)
            .then(user => {
              setCreatedByUser(user);
            })
            .catch(err => {
              console.error("Error loading creator user:", err);
            });
        }
        
        // Get issue's hostel ID
        const issueHostelId = taskData.hostelId;
        
        // Load workers and filter by:
        // 1. Workers attached to admin's hostels
        // 2. Workers attached to the same hostel as the issue
        adminService.getAllUsers({ role: 'worker', limit: 100 })
          .then(allWorkers => {
            // First filter: workers attached to any of admin's hostels
            // Backend uses 'hostels' field (not 'hostelIds')
            let adminWorkers = allWorkers.filter(worker => {
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
            
            // Second filter: workers attached to the issue's hostel
            let eligibleWorkers = adminWorkers.filter(worker => {
              if (worker.hostels && Array.isArray(worker.hostels)) {
                return worker.hostels.includes(issueHostelId);
              }
              // Fallback
              if (worker.hostelIds && Array.isArray(worker.hostelIds)) {
                return worker.hostelIds.includes(issueHostelId);
              }
              if (worker.hostelId) {
                return worker.hostelId === issueHostelId;
              }
              return false;
            });
            
            // Third filter: by skill if issue has a type
            if (taskData.type && eligibleWorkers.length > 0) {
              const matchingWorkers = eligibleWorkers.filter(w => 
                w.skills && w.skills.includes(taskData.type)
              );
              if (matchingWorkers.length > 0) {
                eligibleWorkers = matchingWorkers;
              }
            }
            
            setWorkers(eligibleWorkers);
            
            if (taskData.assignedWorkerId) {
              setSelectedWorker(taskData.assignedWorkerId);
            }
            
            setLoading(false);
          })
          .catch(err => {
            console.error("Error loading workers:", err);
            setWorkers([]);
            setLoading(false);
          });
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setLoading(false);
      });
  };

  const handleAssignWorker = () => {
    if (!selectedWorker) {
      alert("Please select a worker");
      return;
    }

    setAssigning(true);
    
    // First assign the worker
    issueService.assignWorker(id, selectedWorker)
      .then(() => {
        // Then automatically update status to "assigned" if it's currently "pending"
        if (task.status === "pending") {
          return issueService.updateStatus(id, "assigned");
        }
        return Promise.resolve();
      })
      .then(() => {
        loadData(); // Reload to get updated data
        alert("Worker assigned successfully! Status updated to 'Assigned'.");
      })
      .catch(err => {
        console.error("Error assigning worker:", err);
        alert("Failed to assign worker. Please try again.");
      })
      .finally(() => {
        setAssigning(false);
      });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader size={48} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <Header title="Issue Not Found" />
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Issue not found</p>
            <Link
              to="/admin/manage-issues"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Issues
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const canAssignWorker = task.status === "pending" || task.status === "assigned";

  const statusInfo = statusConfig(task.status);
  const StatusIcon = statusInfo.icon;
  const issueHostel = hostels.find(h => h.id === task.hostelId);
  const assignedWorker = workers.find(w => (w.id || w.uid) === task.assignedWorkerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/manage-issues"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Issues</span>
          </Link>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusInfo.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-semibold text-sm">{statusInfo.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header Card */}
            <Card>
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{task.title || "Untitled Issue"}</h1>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {task.description || "No description provided"}
                  </p>
                </div>

                {/* Quick Info Pills */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{formatType(task.type)}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Room {task.roomNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Details Card */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Issue Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reported</div>
                    <DateDisplay timestamp={task.createdAt} variant="datetime" showIcon={false} />
                    <div className="text-xs text-gray-400 mt-1">
                      <DateDisplay timestamp={task.createdAt} variant="relative" showIcon={false} className="text-xs" />
                    </div>
                  </div>
                </div>

                {task.trackingNumber && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Tag className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tracking Number</div>
                      <div className="font-medium text-gray-900 font-mono">{task.trackingNumber}</div>
                    </div>
                  </div>
                )}

                {issueHostel && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Hostel</div>
                      <div className="font-medium text-gray-900">{issueHostel.name}</div>
                      {issueHostel.address && (
                        <div className="text-xs text-gray-500 mt-1">{issueHostel.address}</div>
                      )}
                    </div>
                  </div>
                )}

                {(task.createdBy || task.studentId) && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Reported By</div>
                      {createdByUser ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {createdByUser.firstName} {createdByUser.lastName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{createdByUser.email}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900">Loading...</div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">{(task.createdBy || task.studentId).substring(0, 8)}...</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {assignedWorker && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-blue-600 mb-1">Assigned Worker</div>
                      <div className="font-medium text-blue-900">
                        {assignedWorker.firstName} {assignedWorker.lastName}
                      </div>
                      {assignedWorker.skills?.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Skills: {assignedWorker.skills.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </Card>

            {/* Worker Updates Timeline */}
            {task.workerUpdates && task.workerUpdates.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Activity Timeline
                </h2>
                <div className="space-y-4">
                  {task.workerUpdates.map((update, idx) => (
                    <div key={idx} className="relative pl-8 pb-4 border-l-2 border-blue-200">
                      <div className="absolute left-0 top-0 w-3 h-3 bg-blue-500 rounded-full -translate-x-[7px]"></div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-900">Worker Update</div>
                          <DateDisplay timestamp={update.timestamp} variant="relative" showIcon={false} className="text-xs text-blue-600" />
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{update.notes}</p>
                        <DateDisplay timestamp={update.timestamp} variant="datetime" showIcon={false} className="text-xs text-blue-600 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Assign Worker Card */}
            {canAssignWorker && (
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Assign Worker
                </h3>
                {workers.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        No workers available for this hostel. Workers can only be assigned to issues in the same hostel they're attached to.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        Only workers attached to <strong>{issueHostel?.name || task.hostelId || "this hostel"}</strong> are shown.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      disabled={workers.length === 0}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                    >
                      <option value="">Select a worker...</option>
                      {workers.map((worker) => {
                        const workerId = worker.id || worker.uid;
                        return (
                          <option key={workerId} value={workerId}>
                            {worker.firstName} {worker.lastName}
                            {worker.skills?.length > 0 ? ` - ${worker.skills.join(", ")}` : ""}
                            {worker.isAvailable ? " ✓ Available" : " ✗ Unavailable"}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <button
                    onClick={handleAssignWorker}
                    disabled={assigning || !selectedWorker || workers.length === 0}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Assign Worker
                      </>
                    )}
                  </button>
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
