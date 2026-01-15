import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, where } from 'firebase/firestore';
import MessageBubble from '../../components/Chat/MessageBubble';
import MessageInput from '../../components/Chat/MessageInput';
import Header from '../../components/UI/Header';
import Card from '../../components/UI/Card';
import Loader from '../../components/UI/Loader';
import issueService from '../../services/issueService';
import adminService from '../../services/adminService';

const IssueChat = () => {
  const { id: issueID } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [chatPartner, setChatPartner] = useState(null);
  const [partnerPresence, setPartnerPresence] = useState({
    isOnline: false,
    isInChat: false,
    lastActive: null,
  });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastReadMessageRef = useRef(null);
  const lastLoadedTimestampRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const messagesLoadedRef = useRef(false);

  // Load issue details and chat partner info
  useEffect(() => {
    if (!issueID || !userData) return;

    issueService
      .getIssueById(issueID)
      .then(async (issueData) => {
        setIssue(issueData);
        
        // Load chat partner info
        try {
          let partnerId = null;
          if (userData.role === 'student') {
            partnerId = issueData.assignedWorkerId;
          } else if (userData.role === 'worker') {
            partnerId = issueData.studentId;
          }

          if (partnerId) {
            try {
              const partner = await adminService.getUserById(partnerId);
              setChatPartner({
                id: partner.id || partnerId,
                name: `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.email || 'User',
                role: partner.role,
                email: partner.email,
              });
            } catch (error) {
              console.error('Error loading chat partner:', error);
              // Set default partner info
              setChatPartner({
                id: partnerId,
                name: userData.role === 'student' ? 'Worker' : 'Student',
                role: userData.role === 'student' ? 'worker' : 'student',
              });
            }
          }
        } catch (error) {
          console.error('Error loading chat partner:', error);
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading issue:', error);
        setLoading(false);
      });
  }, [issueID, userData]);

  // Join socket room when socket is connected and issue is loaded
  useEffect(() => {
    if (!socket || !isConnected || !issueID || !issue) return;

    console.log('Joining issue room:', issueID);
    const userId = userData?.id || userData?.uid;
    socket.emit('join_issue', { issueID, userId });

    socket.on('joined_issue', (data) => {
      console.log('Joined issue room:', data);
      
      // Check if partner is in chat
      if (data.otherUsersInChat && data.otherUsersInChat.length > 0) {
        const partnerId = userData?.role === 'student' 
          ? issue?.assignedWorkerId 
          : issue?.studentId;
        
        if (partnerId && data.otherUsersInChat.includes(partnerId)) {
          console.log('Partner found in otherUsersInChat:', partnerId);
          setPartnerPresence((prev) => ({
            ...prev,
            isInChat: true,
            isOnline: true,
          }));
        }
      }
    });
    
    socket.on('user_joined_chat', (data) => {
      const partnerId = userData?.role === 'student' 
        ? issue?.assignedWorkerId 
        : issue?.studentId;
      
      if (data.userId === partnerId && data.issueID === issueID) {
        console.log('Partner joined chat:', data);
        setPartnerPresence((prev) => ({
          ...prev,
          isInChat: true,
          isOnline: true,
        }));
      }
    });
    
    socket.on('user_left_chat', (data) => {
      const partnerId = userData?.role === 'student' 
        ? issue?.assignedWorkerId 
        : issue?.studentId;
      
      if (data.userId === partnerId && data.issueID === issueID) {
        setPartnerPresence((prev) => ({
          ...prev,
          isInChat: false,
        }));
      }
    });
    
    socket.on('user_online', (data) => {
      const partnerId = userData?.role === 'student' 
        ? issue?.assignedWorkerId 
        : issue?.studentId;
      
      if (data.userId === partnerId) {
        setPartnerPresence((prev) => ({
          ...prev,
          isOnline: true,
          lastActive: new Date().toISOString(),
        }));
      }
    });
    
    socket.on('user_offline', (data) => {
      const partnerId = userData?.role === 'student' 
        ? issue?.assignedWorkerId 
        : issue?.studentId;
      
      if (data.userId === partnerId) {
        setPartnerPresence((prev) => ({
          ...prev,
          isOnline: false,
          isInChat: false,
          lastActive: data.lastActive,
        }));
      }
    });
    
    // Request partner presence status after a short delay to ensure socket is ready
    const partnerId = userData?.role === 'student' 
      ? issue?.assignedWorkerId 
      : issue?.studentId;
    
    if (partnerId) {
      const requestPresence = () => {
        socket.emit('get_user_presence', { userId: partnerId, issueID });
      };
      
      // Request immediately and also after a short delay
      requestPresence();
      const timeoutId = setTimeout(requestPresence, 500);
      
      const presenceHandler = (presenceData) => {
        if (presenceData.userId === partnerId) {
          const isInChat = presenceData.currentChat === issueID;
          console.log('Partner presence received:', {
            partnerId,
            isOnline: presenceData.isOnline,
            isInChat,
            currentChat: presenceData.currentChat,
            issueID,
          });
          setPartnerPresence({
            isOnline: presenceData.isOnline || false,
            isInChat: isInChat,
            lastActive: presenceData.lastActive,
          });
        }
      };
      socket.on('user_presence', presenceHandler);
      
      return () => {
        clearTimeout(timeoutId);
        socket.off('user_presence', presenceHandler);
      };
    }

    socket.on('message_sent', (data) => {
      // Update temp message with real ID and mark as sent
      if (data.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id?.startsWith('temp-') && msg.text === data.text
              ? { ...msg, id: data.messageId, sent: true }
              : msg
          )
        );
      }
    });

    socket.on('new_message', (message) => {
      console.log('New message received:', message);
      setMessages((prev) => {
        // Replace temp message if it exists, or add new message
        const tempIndex = prev.findIndex((m) => m.id?.startsWith('temp-'));
        if (tempIndex !== -1 && prev[tempIndex].text === message.text) {
          // Replace temp message with real one
          const newMessages = [...prev];
          newMessages[tempIndex] = { ...message, sent: true };
          return newMessages;
        }
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, { ...message, sent: true }];
      });
      scrollToBottom();
      
      // Mark as read if message is from other user and user is viewing chat
      const currentUserId = userData?.id || userData?.uid;
      if (message.senderID !== currentUserId && socket && isConnected) {
        markMessageAsRead(message.id);
      }
    });

    socket.on('message_read', (data) => {
      // Update message read status in local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageID
            ? { ...msg, read: true, readAt: data.readAt }
            : msg
        )
      );
    });

    socket.on('user_typing', (data) => {
      if (data.senderID !== (userData?.id || userData?.uid)) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set([...prev, data.senderID]));
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.senderID);
            return newSet;
          });
        }
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      // Leave chat room when component unmounts
      if (socket && issueID) {
        socket.emit('leave_issue', { issueID });
      }
      
      socket.off('joined_issue');
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('message_read');
      socket.off('message_sent');
      socket.off('user_joined_chat');
      socket.off('user_left_chat');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('user_presence');
      socket.off('error');
    };
  }, [socket, isConnected, issueID, userData, issue]);

  // Mark message as read
  const markMessageAsRead = (messageID) => {
    if (!socket || !isConnected || !userData || !issueID) return;

    const readerID = userData.id || userData.uid;
    socket.emit('mark_message_read', {
      issueID,
      messageID,
      readerID,
    });
  };

  // Mark all visible messages as read when chat is opened
  useEffect(() => {
    if (!socket || !isConnected || !userData || !issueID || messages.length === 0) return;

    const currentUserId = userData.id || userData.uid;
    const unreadMessages = messages.filter(
      (msg) => msg.senderID !== currentUserId && (!msg.read || !msg.readAt)
    );

    // Mark unread messages as read
    unreadMessages.forEach((msg) => {
      markMessageAsRead(msg.id);
    });
  }, [socket, isConnected, issueID, userData, messages.length]);

  // Format last active time
  const formatLastActive = (lastActive) => {
    if (!lastActive) return '';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Reset refs when issueID changes (switching chats)
  useEffect(() => {
    isInitialLoadRef.current = true;
    messagesLoadedRef.current = false;
    lastLoadedTimestampRef.current = null;
  }, [issueID]);

  // Load messages from Firestore - preserve existing messages and only add new ones
  useEffect(() => {
    if (!issueID) return;

    const messagesRef = collection(db, 'issues', issueID, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Use docChanges() to detect only new/added documents
        const changes = snapshot.docChanges();
        
        if (isInitialLoadRef.current || !messagesLoadedRef.current) {
          // Initial load: set all messages
          const loadedMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(loadedMessages);
          messagesLoadedRef.current = true;
          isInitialLoadRef.current = false;
          
          // Update last loaded timestamp
          if (loadedMessages.length > 0) {
            const lastMessage = loadedMessages[loadedMessages.length - 1];
            lastLoadedTimestampRef.current = lastMessage.timestamp;
          }
          
          scrollToBottom();
        } else {
          // Reload: only process new/added messages
          const newMessages = [];
          
          changes.forEach((change) => {
            if (change.type === 'added') {
              newMessages.push({
                id: change.doc.id,
                ...change.doc.data(),
              });
            }
          });
          
          if (newMessages.length > 0) {
            // Merge new messages with existing ones
            setMessages((prevMessages) => {
              // Create a set of existing message IDs for quick lookup
              const existingIds = new Set(prevMessages.map((m) => m.id));
              
              // Filter out messages we already have (avoid duplicates)
              const trulyNewMessages = newMessages.filter((msg) => !existingIds.has(msg.id));
              
              if (trulyNewMessages.length === 0) {
                // No new messages, return existing ones
                return prevMessages;
              }
              
              // Merge new messages with existing ones, maintaining chronological order
              const merged = [...prevMessages, ...trulyNewMessages].sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeA - timeB;
              });
              
              // Update last loaded timestamp
              const lastNewMessage = trulyNewMessages[trulyNewMessages.length - 1];
              lastLoadedTimestampRef.current = lastNewMessage.timestamp;
              
              return merged;
            });
            
            // Scroll to bottom only if there are new messages
            scrollToBottom();
          }
          // If no new messages, keep existing ones (no state update needed)
        }
      },
      (error) => {
        console.error('Error loading messages:', error);
      }
    );

    return () => unsubscribe();
  }, [issueID]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = (text) => {
    if (!socket || !isConnected || !userData || !issueID || !text.trim()) {
      return;
    }

    const senderID = userData.id || userData.uid;
    const senderRole = userData.role || 'student';

    if (senderRole !== 'student' && senderRole !== 'worker') {
      console.error('Invalid user role for chat');
      return;
    }

    setSending(true);

    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      issueID,
      senderID,
      senderRole,
      text,
      timestamp: new Date().toISOString(),
      sent: false,
      read: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    socket.emit('send_message', {
      issueID,
      senderID,
      senderRole,
      text,
    });

    setSending(false);
  };

  // Typing handlers
  const handleTypingStart = () => {
    if (!socket || !isConnected || !userData || !issueID) return;
    socket.emit('typing_start', {
      issueID,
      senderID: userData.id || userData.uid,
      senderRole: userData.role,
    });
  };

  const handleTypingStop = () => {
    if (!socket || !isConnected || !userData || !issueID) return;
    socket.emit('typing_stop', {
      issueID,
      senderID: userData.id || userData.uid,
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader size={48} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Issue not found</p>
            <button
              onClick={() => {
                const dashboardRoute = userData?.role === 'student' 
                  ? '/student/dashboard' 
                  : '/dashboard/worker';
                navigate(dashboardRoute);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if user has access to this chat - only when worker is assigned
  const hasAccess =
    userData?.role === 'student'
      ? issue.studentId === (userData.id || userData.uid) && issue.assignedWorkerId
      : issue.assignedWorkerId === (userData.id || userData.uid);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">You don't have access to this chat</p>
            <button
              onClick={() => {
                const dashboardRoute = userData?.role === 'student' 
                  ? '/student/dashboard' 
                  : '/dashboard/worker';
                navigate(dashboardRoute);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const dashboardRoute = userData?.role === 'student' 
                  ? '/student/dashboard' 
                  : '/dashboard/worker';
                navigate(dashboardRoute);
              }}
              className="p-2 hover:bg-blue-500 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold mb-1">{issue.title}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{chatPartner?.name || 'User'}</p>
                    <p className="text-xs text-blue-100 capitalize">
                      {chatPartner?.role || 'User'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {partnerPresence.isInChat && partnerPresence.isOnline ? (
                <div className="flex items-center gap-2 bg-green-500/30 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium">Online</span>
                </div>
              ) : partnerPresence.isOnline ? (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs font-medium">Away</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-xs font-medium">
                    {partnerPresence.lastActive 
                      ? `Last active ${formatLastActive(partnerPresence.lastActive)}`
                      : 'Offline'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-white"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MessageCircle size={64} className="mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </motion.div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                receiverOnline={partnerPresence.isOnline}
                receiverInChat={partnerPresence.isInChat}
              />
            ))}
            {typingUsers.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Typing...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      {issue.status !== 'closed' && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <MessageInput
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={!isConnected || sending}
            />
          </div>
        </div>
      )}

      {issue.status === 'closed' && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4">
          <div className="max-w-4xl mx-auto text-center text-sm text-yellow-800">
            This issue is closed. Chat is read-only.
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueChat;

