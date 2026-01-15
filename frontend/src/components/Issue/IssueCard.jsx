// src/components/Issue/IssueCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import DateDisplay from "../UI/DateDisplay";

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

const IssueCard = ({ issue, onClick }) => {
  const { userData } = useAuth();
  const unreadCount = useUnreadMessages(issue.id);
  
  // Check if user can access chat - only show when worker is assigned
  // For students: can chat only if they own the issue AND a worker is assigned
  // For workers: can chat only if they are the assigned worker
  const canChat = 
    (userData?.role === 'student' && 
     issue.studentId === (userData?.id || userData?.uid) && 
     issue.assignedWorkerId) ||
    (userData?.role === 'worker' && 
     issue.assignedWorkerId === (userData?.id || userData?.uid));

  const handleCardClick = (e) => {
    // Don't navigate if clicking on chat link
    if (e.target.closest('a')) {
      return;
    }
    if (onClick) {
      onClick(issue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={handleCardClick}
      className={`p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800 text-lg">{issue.title || "Untitled Issue"}</h4>
            <span className={`text-xs font-medium px-2 py-1 rounded ${statusColor(issue.status)}`}>
              {issue.status ? issue.status.replace(/_/g, " ") : "Unknown"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 mb-3 line-clamp-2">
            {issue.description || "No description provided"}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div>
              Type: <span className="font-medium text-gray-700 ml-1">{formatType(issue.type)}</span>
            </div>
            <div>
              Room: <span className="font-medium text-gray-700 ml-1">{issue.roomNumber || "N/A"}</span>
            </div>
            <div>
              Reported: <DateDisplay timestamp={issue.createdAt} variant="datetime" showIcon={false} className="inline font-medium text-gray-700 ml-1" />
            </div>
            {canChat && (
              <Link
                to={`/chat/issue/${issue.id}`}
                className="relative flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <MessageCircle size={16} />
                <span>Chat</span>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </Link>
            )}
          </div>
        </div>

        <div className="w-32 flex-shrink-0 text-right">
          {issue.trackingNumber ? (
            <>
              <div className="text-xs text-gray-500 mb-1">Tracking</div>
              <div className="font-semibold text-sm">{issue.trackingNumber}</div>
            </>
          ) : issue.id ? (
            <>
              <div className="text-xs text-gray-500 mb-1">ID</div>
              <div className="font-semibold text-xs text-gray-600 truncate">{issue.id}</div>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export { IssueCard };
export default IssueCard;


