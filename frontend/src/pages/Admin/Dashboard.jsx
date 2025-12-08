// src/pages/Admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaUsers, FaBuilding, FaClipboardList, FaExclamationTriangle, FaCheckCircle, FaClock } from "react-icons/fa";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import MiniStatsChart from "../../components/charts/MiniStatsChart";
import IssueCard from "../../components/Issue/IssueCard";
import issueService from "../../services/issueService";
import adminService from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const statsVariant = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [pendingIssues, setPendingIssues] = useState([]);
  const [stats, setStats] = useState({
    totalIssues: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalStudents: 0,
    totalWorkers: 0,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(false); // Show UI immediately
    
    // Start all API calls in parallel without blocking
    issueService.getMyIssues({ limit: 20 })
      .then(res => {
        if (!mounted) return;
        const sortedIssues = res.sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.createdAt || 0;
          const bTime = b.createdAt?.seconds || b.createdAt || 0;
          return bTime - aTime;
        });
        setIssues(sortedIssues.slice(0, 6));
        
        const totalIssues = res.length;
        const pending = res.filter((i) => i.status === "pending" || i.status === "assigned").length;
        const inProgress = res.filter((i) => i.status === "in_progress").length;
        const completed = res.filter((i) => i.status === "completed" || i.status === "closed").length;
        setStats(prev => ({ ...prev, totalIssues, pending, inProgress, completed }));
      })
      .catch(err => {
        console.error("Error loading issues:", err);
        if (mounted) setIssues([]);
      });

    // Load pending issues in background (replaced urgent issues)
    issueService.getMyIssues({ status: 'pending', limit: 3 })
      .then(pending => {
        if (mounted) setPendingIssues(pending);
      })
      .catch(err => console.error("Error loading pending issues:", err));

    // Load user stats in background (non-blocking)
    if (userData?.hostelId) {
      Promise.all([
        adminService.getAllUsers({ role: 'student', hostelId: userData.hostelId, limit: 100 }).catch(() => []),
        adminService.getAllUsers({ role: 'worker', limit: 100 })
          .then(workers => workers.filter(w => {
            // Backend uses 'hostels' field (not 'hostelIds')
            if (w.hostels && Array.isArray(w.hostels)) {
              return w.hostels.includes(userData.hostelId);
            }
            // Fallback
            if (w.hostelIds && Array.isArray(w.hostelIds)) {
              return w.hostelIds.includes(userData.hostelId);
            }
            return w.hostelId === userData.hostelId;
          }))
          .catch(() => [])
      ]).then(([students, workers]) => {
        if (mounted) {
          setStats(prev => ({
            ...prev,
            totalStudents: students.length || 0,
            totalWorkers: workers.length || 0,
          }));
        }
      }).catch(err => console.error("Error loading user stats:", err));
    }

    return () => { mounted = false; };
  }, [userData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader size={48} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Header title="Admin Dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={1}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <FaClipboardList size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Issues</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalIssues}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#3b82f6" data={[stats.totalIssues || 0, stats.pending, stats.inProgress, stats.completed]} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={2}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500 text-white">
              <FaClock size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-2xl font-bold text-gray-800">{stats.pending}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#f59e0b" data={[stats.pending, stats.inProgress, stats.completed]} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={3}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-600 text-white">
              <FaCheckCircle size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-gray-800">{stats.completed}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#10b981" data={[stats.completed, stats.inProgress]} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={4}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-600 text-white">
              <FaUsers size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalStudents}</div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={5}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-teal-600 text-white">
              <FaBuilding size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Workers</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalWorkers}</div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Issues</h2>
              <Link
                to="/admin/manage-issues"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>
            {issues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No issues found.</div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <Link key={issue.id} to={`/admin/issue/${issue.id}`}>
                    <IssueCard issue={issue} />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {pendingIssues.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-4">
                <FaExclamationTriangle className="text-yellow-600" />
                <h2 className="text-lg font-semibold text-yellow-800">Pending Issues</h2>
              </div>
              <div className="space-y-3">
                {pendingIssues.map((issue) => (
                  <Link key={issue.id} to={`/admin/issue/${issue.id}`}>
                    <IssueCard issue={issue} />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link to="/admin/manage-issues" className="block text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Manage Issues
              </Link>
              <Link to="/admin/manage-users" className="block text-center py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Manage Users
              </Link>
              <Link to="/admin/manage-hostels" className="block text-center py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Manage Hostels
              </Link>
              <Link to="/admin/manage-workers" className="block text-center py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Manage Workers
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Hostel Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Managed Hostel:</span>
                <span className="font-medium text-gray-800 ml-2">{userData?.hostelId || "—"}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800 ml-2">{userData?.email || "—"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
