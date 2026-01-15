import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to track unread messages for a specific issue
 */
export const useUnreadMessages = (issueID) => {
  const { userData } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!issueID || !userData) {
      setUnreadCount(0);
      return;
    }

    const userId = userData.id || userData.uid;

    // Listen to all messages for this issue
    const messagesRef = collection(db, 'issues', issueID, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Filter to only count unread messages from other users
        const unreadMessages = snapshot.docs.filter((doc) => {
          const message = doc.data();
          // Count as unread if:
          // 1. Message is from someone else (not current user)
          // 2. Message is not read or readAt is null
          return message.senderID !== userId && (!message.read || !message.readAt);
        });
        setUnreadCount(unreadMessages.length);
      },
      (error) => {
        console.error('Error listening to unread messages:', error);
      }
    );

    return () => unsubscribe();
  }, [issueID, userData]);

  return unreadCount;
};

export default useUnreadMessages;

