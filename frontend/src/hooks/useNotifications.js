import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, doc, query, where, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to listen to notifications for the current user
 * Listens to both:
 * 1. Main notifications collection (where userId matches)
 * 2. User's notifications subcollection (users/{userId}/notifications)
 */
export const useNotifications = (options = {}) => {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const { maxNotifications = 50, onlyUnread = false } = options;

  useEffect(() => {
    if (!userData || !userData.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const userId = userData.id || userData.uid;

    // Listen to main notifications collection
    // Note: Firestore requires an index for queries with where + orderBy on different fields
    // We'll fetch all and sort in memory to avoid index requirement
    // Fetch more than needed to account for filtering
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(onlyUnread ? 100 : maxNotifications * 2) // Get more to filter/sort
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        let notificationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter by read status if needed
        if (onlyUnread) {
          notificationList = notificationList.filter((n) => !n.read);
        }

        // Sort by createdAt descending (in memory to avoid index requirement)
        notificationList.sort((a, b) => {
          // Handle Firestore Timestamp objects
          let aTime = 0;
          let bTime = 0;
          
          if (a.createdAt) {
            if (a.createdAt.seconds) {
              aTime = a.createdAt.seconds;
            } else if (a.createdAt.toMillis) {
              aTime = a.createdAt.toMillis() / 1000;
            } else if (typeof a.createdAt === 'string') {
              aTime = new Date(a.createdAt).getTime() / 1000;
            } else if (typeof a.createdAt === 'number') {
              aTime = a.createdAt / 1000;
            }
          }
          
          if (b.createdAt) {
            if (b.createdAt.seconds) {
              bTime = b.createdAt.seconds;
            } else if (b.createdAt.toMillis) {
              bTime = b.createdAt.toMillis() / 1000;
            } else if (typeof b.createdAt === 'string') {
              bTime = new Date(b.createdAt).getTime() / 1000;
            } else if (typeof b.createdAt === 'number') {
              bTime = b.createdAt / 1000;
            }
          }
          
          return bTime - aTime; // Descending order
        });

        // Limit after sorting
        notificationList = notificationList.slice(0, maxNotifications);

        setNotifications(notificationList);
        setUnreadCount(notificationList.filter((n) => !n.read).length);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        // If it's an index error, log a helpful message but don't break the app
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index required. Please create the index at:', error.message);
          // Set empty state so app doesn't break
          setNotifications([]);
          setUnreadCount(0);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData, maxNotifications, onlyUnread]);

  return { notifications, unreadCount, loading };
};

/**
 * Hook to listen to a specific issue for assignment notifications
 */
export const useIssueAssignmentNotification = (issueID) => {
  const { userData } = useAuth();
  const [isAssigned, setIsAssigned] = useState(false);
  const [assignedWorkerId, setAssignedWorkerId] = useState(null);

  useEffect(() => {
    if (!issueID) return;

    const issueDocRef = doc(db, 'issues', issueID);

    // Use onSnapshot to listen to real-time changes
    const unsubscribe = onSnapshot(
      issueDocRef,
      (doc) => {
        if (doc.exists()) {
          const issueData = doc.data();
          if (issueData.status === 'assigned' && issueData.assignedWorkerId) {
            setIsAssigned(true);
            setAssignedWorkerId(issueData.assignedWorkerId);

            // Show toast notification if issue was just assigned
            if (
              (userData?.role === 'student' || userData?.role === 'worker') &&
              (userData?.id === issueData.studentId ||
                userData?.id === issueData.assignedWorkerId)
            ) {
              // Trigger custom event for toast notification
              window.dispatchEvent(
                new CustomEvent('issueAssigned', {
                  detail: {
                    issueID,
                    issueTitle: issueData.title,
                    assignedWorkerId: issueData.assignedWorkerId,
                  },
                })
              );
            }
          } else {
            setIsAssigned(false);
            setAssignedWorkerId(null);
          }
        }
      },
      (error) => {
        console.error('Error listening to issue:', error);
      }
    );

    return () => unsubscribe();
  }, [issueID, userData]);

  return { isAssigned, assignedWorkerId };
};

export default useNotifications;

