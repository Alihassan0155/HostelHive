// src/components/Issue/IssueCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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

const IssueCard = ({ issue }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
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


