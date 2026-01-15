// src/pages/Worker/TaskDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import DateDisplay from "../../components/UI/DateDisplay";
import issueService from "../../services/issueService";
import { useUserName } from "../../hooks/useNameResolver";

const statusColor = (status) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "assigned": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-indigo-100 text-indigo-800";
    case "completed": return "bg-green-100 text-green-800";
    case "closed": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};


const formatType = (type) => {
  if (!type) return "N/A";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [task, setTask] = useState(null);
  const [updateNotes, setUpdateNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { userName: studentName, loading: loadingStudentName } = useUserName(task?.studentId);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await issueService.getIssueById(id);
      setTask(taskData);
      setNewStatus(taskData.status);
    } catch (err) {
      console.error("Error loading task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === task.status) return;

    try {
      setUpdating(true);
      await issueService.updateStatus(id, newStatus);
      await loadTask(); // Reload to get updated data
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    if (!updateNotes.trim()) return;

    try {
      setUpdating(true);
      await issueService.addWorkerUpdate(id, updateNotes);
      setUpdateNotes("");
      await loadTask(); // Reload to get updated data
    } catch (err) {
      console.error("Error adding notes:", err);
      alert("Failed to add notes. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
        <Header title="Task Not Found" />
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Task not found</p>
            <Link
              to="/worker/my-tasks"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Back to My Tasks
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const canUpdateStatus = task.status === "assigned" || task.status === "in_progress";
  const statusOptions = [
    { value: "assigned", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <Header title="Task Details" />

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/worker/my-tasks"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Tasks
            </Link>
            <span className={`text-sm font-medium px-3 py-1 rounded ${statusColor(task.status)}`}>
              {task.status ? task.status.replace(/_/g, " ") : "Unknown"}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.title || "Untitled Task"}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  Type: <span className="font-medium text-gray-700 ml-1">{formatType(task.type)}</span>
                </div>
                <div>
                  Room: <span className="font-medium text-gray-700 ml-1">{task.roomNumber || "N/A"}</span>
                </div>
                {task.urgency && (
                  <div>
                    Urgency: <span className="font-medium text-gray-700 ml-1 capitalize">{task.urgency}</span>
                  </div>
                )}
                {task.scheduledTime && (
                  <div>
                    Scheduled: <DateDisplay timestamp={task.scheduledTime} variant="datetime" showIcon={false} className="inline font-medium text-gray-700 ml-1" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description || "No description provided"}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Task Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Reported:</span>
                  <DateDisplay timestamp={task.createdAt} variant="datetime" showIcon={false} className="font-medium text-gray-800" />
                </div>
                {task.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking Number:</span>
                    <span className="font-medium text-gray-800">{task.trackingNumber}</span>
                  </div>
                )}
                {task.studentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reported by:</span>
                    <span className="font-medium text-gray-800">
                      {loadingStudentName ? 'Loading...' : (studentName || `Student ${task.studentId.substring(0, 8)}`)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {task.workerUpdates && task.workerUpdates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Worker Updates</h3>
                <div className="space-y-3">
                  {task.workerUpdates.map((update, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <DateDisplay timestamp={update.timestamp} variant="datetime" showIcon={false} className="text-sm text-gray-600 mb-1" />
                      <p className="text-gray-800 whitespace-pre-wrap">{update.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {canUpdateStatus && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === task.status}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Update Notes</h3>
          <div className="space-y-4">
            <textarea
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="Add notes about your progress on this task..."
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleAddNotes}
              disabled={updating || !updateNotes.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {updating ? "Adding..." : "Add Notes"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TaskDetails;

