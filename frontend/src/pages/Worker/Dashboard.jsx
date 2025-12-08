// src/pages/Worker/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaTasks, FaClock, FaCheckCircle, FaBell, FaExclamationTriangle } from "react-icons/fa";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import MiniStatsChart from "../../components/charts/MiniStatsChart";
import IssueCard from "../../components/Issue/IssueCard";
import issueService from "../../services/issueService";
import { useAuth } from "../../context/AuthContext";

const statsVariant = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

const WorkerDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [pendingIssues, setPendingIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(false); // Show UI immediately
    
    // Load tasks in background
    issueService.getMyIssues({ limit: 20 })
      .then(res => {
        if (!mounted) return;
        const sortedIssues = res.sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.createdAt || 0;
          const bTime = b.createdAt?.seconds || b.createdAt || 0;
          return bTime - aTime;
        });
        setIssues(sortedIssues.slice(0, 6));
        
        const total = res.length;
        const assigned = res.filter((i) => i.status === "assigned").length;
        const inProgress = res.filter((i) => i.status === "in_progress").length;
        const completed = res.filter((i) => i.status === "completed" || i.status === "closed").length;
        setStats({ total, assigned, inProgress, completed });
      })
      .catch(err => {
        console.error("Error loading tasks:", err);
        if (mounted) {
          setIssues([]);
          setStats({ total: 0, assigned: 0, inProgress: 0, completed: 0 });
        }
      });

    // Load pending issues in background (replaced urgent issues)
    issueService.getMyIssues({ status: 'pending', limit: 3 })
      .then(pending => {
        if (mounted) setPendingIssues(pending);
      })
      .catch(err => console.error("Error loading pending issues:", err));

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader size={48} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <Header title="Worker Dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={1}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 text-white">
              <FaTasks size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#10b981" data={[stats.total || 0, stats.assigned, stats.inProgress, stats.completed]} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={2}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500 text-white">
              <FaClock size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">In Progress</div>
              <div className="text-2xl font-bold text-gray-800">{stats.inProgress}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#3b82f6" data={[stats.inProgress, stats.completed]} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
              <Link
                to="/worker/my-tasks"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All →
              </Link>
            </div>
            {issues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No assigned tasks yet.</div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </Card>

          {pendingIssues.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-4">
                <FaExclamationTriangle className="text-yellow-600" />
                <h2 className="text-lg font-semibold text-yellow-800">Pending Tasks</h2>
              </div>
              <div className="space-y-3">
                {pendingIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-gray-50">
                <div className="p-2 rounded bg-blue-600 text-white"><FaBell /></div>
                <div>
                  <div className="text-sm font-medium">New Task Assigned</div>
                  <div className="text-xs text-gray-500">You have been assigned a new task</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-gray-50">
                <div className="p-2 rounded bg-yellow-500 text-white"><FaClock /></div>
                <div>
                  <div className="text-sm font-medium">Task Reminder</div>
                  <div className="text-xs text-gray-500">Remember to update task status</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link to="/worker/my-tasks" className="block text-center py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                My Tasks
              </Link>
              <div className="text-sm text-gray-600 text-center pt-2">
                Availability: <span className="font-medium text-gray-800">{userData?.isAvailable ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">My Skills</h3>
            <div className="flex flex-wrap gap-2">
              {userData?.skills && userData.skills.length > 0 ? (
                userData.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No skills listed</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;

