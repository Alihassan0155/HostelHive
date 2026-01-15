// src/pages/Student/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaRegClipboard, FaClock, FaCheckCircle, FaBell } from "react-icons/fa";
import Header from "../../components/UI/Header";
import Card from "../../components/UI/Card";
import Loader from "../../components/UI/Loader";
import MiniStatsChart from "../../components/charts/MiniStatsChart";
import RecentIssuesList from "./RecentIssuesList";
import issueService from "../../services/issueService";
import { useAuth } from "../../context/AuthContext";
import { HostelNameDisplay } from "../../components/UI/NameDisplay";

const statsVariant = {
  hidden: { opacity: 0, y: 8 },
  show: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

const StudentDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(false); // Show UI immediately
    
    // Load issues in background without blocking
    issueService.getMyIssues({ limit: 10 })
      .then(res => {
        if (!mounted) return;
        const sortedIssues = res.sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.createdAt || 0;
          const bTime = b.createdAt?.seconds || b.createdAt || 0;
          return bTime - aTime;
        });
        setIssues(sortedIssues.slice(0, 6));
        
        const total = res.length;
        const pending = res.filter((i) => i.status === "pending" || i.status === "assigned").length;
        const inProgress = res.filter((i) => i.status === "in_progress").length;
        const resolved = res.filter((i) => i.status === "completed" || i.status === "closed").length;
        setStats({ total, pending, inProgress, resolved });
      })
      .catch(err => {
        console.error("Error loading issues:", err);
        if (mounted) {
          setIssues([]);
          setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
        }
      });

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader size={48} /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
      <Header title="Student Dashboard" showBackButton={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={1}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <FaRegClipboard size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Reports</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#7c3aed" data={[stats.total || 0, stats.pending, stats.inProgress, stats.resolved]} />
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
              <MiniStatsChart color="#f59e0b" data={[stats.pending, stats.inProgress, stats.resolved]} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={statsVariant} initial="hidden" animate="show" custom={3}>
          <Card className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-600 text-white">
              <FaCheckCircle size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Resolved</div>
              <div className="text-2xl font-bold text-gray-800">{stats.resolved}</div>
            </div>
            <div className="w-32">
              <MiniStatsChart color="#10b981" data={[stats.resolved, stats.inProgress]} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <HostelNameDisplay hostelId={userData?.hostelId} />
            </div>
            <RecentIssuesList issues={issues} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-gray-50">
                <div className="p-2 rounded bg-blue-600 text-white"><FaBell /></div>
                <div>
                  <div className="text-sm font-medium">Ahmed is on the way</div>
                  <div className="text-xs text-gray-500">Ahmed (Electrician) will arrive at 10:30 AM</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-gray-50">
                <div className="p-2 rounded bg-yellow-500 text-white"><FaClock /></div>
                <div>
                  <div className="text-sm font-medium">Pending confirmation</div>
                  <div className="text-xs text-gray-500">Please confirm if the AC issue was resolved</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Link to="/student/report-issue" className="block text-center py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Report New Issue</Link>
              <Link to="/student/my-issues" className="block text-center py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">My Reports</Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Contact Admin</h3>
            <p className="text-sm text-gray-600 mb-4">If you have an urgent safety issue, call the hostel admin immediately.</p>
            <a className="inline-block text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" href="tel:+0000000000">Call Admin</a>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
