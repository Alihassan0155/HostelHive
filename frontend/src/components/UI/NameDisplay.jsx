// src/components/UI/NameDisplay.jsx
import React from 'react';
import { useUserName, useHostelName } from '../../hooks/useNameResolver';

/**
 * Component to display user name by ID
 */
export const UserNameDisplay = ({ userId, fallback = 'Unknown User', showLoading = true }) => {
  const { userName, loading } = useUserName(userId);

  if (loading && showLoading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  return <span>{userName || fallback}</span>;
};

/**
 * Component to display hostel name by ID
 */
export const HostelNameDisplay = ({ hostelId, fallback = 'Unknown Hostel', showLoading = true }) => {
  const { hostelName, loading } = useHostelName(hostelId);

  if (loading && showLoading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  return <span>{hostelName || fallback}</span>;
};

export default UserNameDisplay;

