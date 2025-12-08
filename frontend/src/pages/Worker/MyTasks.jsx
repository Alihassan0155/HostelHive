// src/pages/Worker/MyTasks.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import IssueCard from "../../components/Issue/IssueCard";
import issueService from "../../services/issueService";

const MyTasks = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    urgency: "",
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = () => {
    setLoading(true);
    issueService.getMyIssues(filters)
      .then(res => {
        const sorted = res.sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.createdAt || 0;
          const bTime = b.createdAt?.seconds || b.createdAt || 0;
          return bTime - aTime;
        });
        setIssues(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading tasks:", err);
        setIssues([]);
        setLoading(false);
      });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <Header title="My Assigned Tasks" />

      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">All Tasks</h2>
            <Link
              to="/dashboard/worker"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="cleaning">Cleaning</option>
                <option value="furniture">Furniture</option>
                <option value="internet">Internet</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                name="urgency"
                value={filters.urgency}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Urgency Levels</option>
                <option value="urgent">Urgent</option>
                <option value="schedule">Scheduled</option>
              </select>
            </div>
          </div>
        </Card>

        {issues.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No tasks found</p>
              <p className="text-sm text-gray-400">You don't have any assigned tasks matching these filters.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <Link key={issue.id} to={`/worker/task/${issue.id}`}>
                <IssueCard issue={issue} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { MyTasks };
export default MyTasks;

