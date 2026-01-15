import { useState, useEffect } from 'react';
import adminService from '../services/adminService';

// Cache for names to avoid repeated API calls
const nameCache = {
  users: new Map(),
  hostels: new Map(),
};

/**
 * Hook to resolve user names by ID
 */
export const useUserName = (userId) => {
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUserName(null);
      setLoading(false);
      return;
    }

    // Check cache first
    if (nameCache.users.has(userId)) {
      const cached = nameCache.users.get(userId);
      setUserName(cached);
      setLoading(false);
      return;
    }

    // Fetch from API
    setLoading(true);
    adminService
      .getUserById(userId)
      .then((user) => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
        nameCache.users.set(userId, name);
        setUserName(name);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user name:', error);
        setUserName('Unknown User');
        setLoading(false);
      });
  }, [userId]);

  return { userName, loading };
};

/**
 * Hook to resolve hostel names by ID
 */
export const useHostelName = (hostelId) => {
  const [hostelName, setHostelName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hostelId) {
      setHostelName(null);
      setLoading(false);
      return;
    }

    // Check cache first
    if (nameCache.hostels.has(hostelId)) {
      const cached = nameCache.hostels.get(hostelId);
      setHostelName(cached);
      setLoading(false);
      return;
    }

    // Fetch from API
    setLoading(true);
    adminService
      .getHostelById(hostelId)
      .then((hostel) => {
        const name = hostel.name || 'Unknown Hostel';
        nameCache.hostels.set(hostelId, name);
        setHostelName(name);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching hostel name:', error);
        setHostelName('Unknown Hostel');
        setLoading(false);
      });
  }, [hostelId]);

  return { hostelName, loading };
};

/**
 * Hook to resolve multiple user names at once
 */
export const useUserNames = (userIds) => {
  const [userNames, setUserNames] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setUserNames(new Map());
      setLoading(false);
      return;
    }

    const namesMap = new Map();
    const uncachedIds = [];

    // Check cache first
    userIds.forEach((id) => {
      if (nameCache.users.has(id)) {
        namesMap.set(id, nameCache.users.get(id));
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached users
    if (uncachedIds.length > 0) {
      Promise.all(
        uncachedIds.map((id) =>
          adminService
            .getUserById(id)
            .then((user) => {
              const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
              nameCache.users.set(id, name);
              namesMap.set(id, name);
            })
            .catch(() => {
              namesMap.set(id, 'Unknown User');
            })
        )
      ).then(() => {
        setUserNames(namesMap);
        setLoading(false);
      });
    } else {
      setUserNames(namesMap);
      setLoading(false);
    }
  }, [userIds?.join(',')]);

  return { userNames, loading };
};

export default useUserName;

