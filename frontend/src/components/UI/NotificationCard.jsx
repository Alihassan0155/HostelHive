import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, AlertCircle, Info, Check } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useHostelName } from '../../hooks/useNameResolver';
import issueService from '../../services/issueService';

const NotificationCard = ({ notification, onClose }) => {
  const [resolvedMessage, setResolvedMessage] = useState(notification.message);
  const [issue, setIssue] = useState(null);
  const { hostelName, loading: loadingHostel } = useHostelName(issue?.hostelId);

  // Fetch issue details if relatedIssueId exists
  useEffect(() => {
    if (notification.relatedIssueId && !issue) {
      issueService.getIssueById(notification.relatedIssueId)
        .then(setIssue)
        .catch(err => console.error('Error fetching issue for notification:', err));
    }
  }, [notification.relatedIssueId, issue]);

  // Resolve message with names
  useEffect(() => {
    if (!notification.message) {
      setResolvedMessage(notification.message);
      return;
    }

    let message = notification.message;
    
    // If we have issue data and hostel name, replace hostel ID in message
    if (issue?.hostelId && hostelName && !loadingHostel) {
      // Replace hostel ID with hostel name in the message
      // Pattern: "at [hostelId]" -> "at [hostelName]"
      const hostelIdPattern = new RegExp(issue.hostelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      message = message.replace(hostelIdPattern, hostelName);
    }
    
    // Also handle case where message might have issue ID at the end
    // Pattern: "at [ID]" where ID could be issue ID or hostel ID
    if (notification.relatedIssueId && issue) {
      // If the message ends with the issue ID, we might want to replace it
      // But typically the issue ID shouldn't be in the message, only hostel ID
      // So we'll focus on hostel ID replacement above
    }

    setResolvedMessage(message);
  }, [notification.message, notification.relatedIssueId, issue, hostelName, loadingHostel]);

  const getIcon = (type) => {
    switch (type) {
      case 'issue_assigned':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'work_started':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'work_completed':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const getLink = (notification) => {
    if (notification.relatedIssueId) {
      // Determine route based on user role (we'll need to get this from context or pass it)
      // For now, use a generic route
      return `/chat/issue/${notification.relatedIssueId}`;
    }
    return null;
  };

  const handleMarkAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (notification.read) return;

    try {
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const link = getLink(notification);
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{resolvedMessage}</p>
          {notification.createdAt && (
            <p className="text-xs text-gray-500 mt-1">
              {formatTimestamp(notification.createdAt)}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {!notification.read ? (
            <button
              onClick={handleMarkAsRead}
              className="p-1 hover:bg-gray-200 rounded-full transition"
              title="Mark as read"
            >
              <Circle size={16} className="text-blue-500" />
            </button>
          ) : (
            <CheckCircle size={16} className="text-gray-400" />
          )}
        </div>
      </div>
    </motion.div>
  );

  if (link) {
    return (
      <Link to={link} onClick={onClose}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  let date;
  if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default NotificationCard;

