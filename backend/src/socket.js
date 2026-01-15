import { Server } from 'socket.io';
import { db } from './config/firebase.js';
import { COLLECTIONS } from './config/constants.js';

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store active rooms: { issueID: Set of socket IDs }
  const activeRooms = new Map();
  
  // Store user online status: { userId: { isOnline: boolean, lastActive: timestamp, currentChat: issueID | null } }
  const userPresence = new Map();
  
  // Store socket to user mapping: { socketId: userId }
  const socketToUser = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    
    // Register user when they connect (we'll get userId from join_issue)
    socket.on('register_user', (data) => {
      const { userId } = data;
      if (userId) {
        socketToUser.set(socket.id, userId);
        userPresence.set(userId, {
          isOnline: true,
          lastActive: new Date().toISOString(),
          currentChat: null,
        });
        
        // Broadcast user online status
        io.emit('user_online', { userId, isOnline: true });
      }
    });

    // Join issue room
    socket.on('join_issue', async (data) => {
      try {
        const issueID = typeof data === 'string' ? data : data?.issueID;
        const userId = typeof data === 'object' ? data?.userId : null;
        
        if (!issueID) {
          socket.emit('error', { message: 'Issue ID is required' });
          return;
        }

        // Register user if provided
        if (userId) {
          socketToUser.set(socket.id, userId);
          const presence = userPresence.get(userId) || {
            isOnline: true,
            lastActive: new Date().toISOString(),
            currentChat: null,
          };
          presence.isOnline = true;
          presence.lastActive = new Date().toISOString();
          presence.currentChat = issueID;
          userPresence.set(userId, presence);
          
          // Broadcast user online status
          io.emit('user_online', { userId, isOnline: true, currentChat: issueID });
        }

        // Leave previous rooms
        const previousRooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id && room.startsWith('issue_')
        );
        previousRooms.forEach((room) => {
          socket.leave(room);
          const roomKey = room.replace('issue_', '');
          if (activeRooms.has(roomKey)) {
            activeRooms.get(roomKey).delete(socket.id);
            if (activeRooms.get(roomKey).size === 0) {
              activeRooms.delete(roomKey);
            }
          }
        });

        // Join new room
        const roomName = `issue_${issueID}`;
        socket.join(roomName);

        // Track active users in room
        if (!activeRooms.has(issueID)) {
          activeRooms.set(issueID, new Set());
        }
        activeRooms.get(issueID).add(socket.id);

        // Get other users in this chat (after adding current user)
        const otherUsersInChat = new Set();
        activeRooms.get(issueID).forEach((socketId) => {
          const otherUserId = socketToUser.get(socketId);
          if (otherUserId && otherUserId !== userId) {
            otherUsersInChat.add(otherUserId);
            // Update their presence to reflect they're in this chat
            const otherPresence = userPresence.get(otherUserId);
            if (otherPresence && otherPresence.currentChat !== issueID) {
              otherPresence.currentChat = issueID;
              userPresence.set(otherUserId, otherPresence);
            }
          }
        });

        console.log(`📥 Socket ${socket.id} joined room: ${roomName}`);
        socket.emit('joined_issue', { 
          issueID, 
          roomName,
          otherUsersInChat: Array.from(otherUsersInChat),
        });
        
        // Notify others in the room that this user joined
        socket.to(roomName).emit('user_joined_chat', { 
          userId,
          issueID,
        });
        
        // Also notify the joining user about who's already in the chat
        // This helps when a user opens chat and partner is already there
        otherUsersInChat.forEach((otherUserId) => {
          const otherPresence = userPresence.get(otherUserId);
          if (otherPresence && otherPresence.currentChat === issueID) {
            socket.emit('user_joined_chat', {
              userId: otherUserId,
              issueID,
            });
          }
        });
      } catch (error) {
        console.error('❌ Error joining issue room:', error);
        socket.emit('error', { message: 'Failed to join issue room' });
      }
    });
    
    // Leave issue room
    socket.on('leave_issue', (data) => {
      const { issueID } = data;
      const userId = socketToUser.get(socket.id);
      
      if (issueID && userId) {
        const roomName = `issue_${issueID}`;
        socket.leave(roomName);
        
        // Update user presence
        if (userPresence.has(userId)) {
          const presence = userPresence.get(userId);
          if (presence.currentChat === issueID) {
            presence.currentChat = null;
            userPresence.set(userId, presence);
          }
        }
        
        // Remove from active rooms
        if (activeRooms.has(issueID)) {
          activeRooms.get(issueID).delete(socket.id);
          if (activeRooms.get(issueID).size === 0) {
            activeRooms.delete(issueID);
          }
        }
        
        // Notify others that user left chat
        socket.to(roomName).emit('user_left_chat', { userId, issueID });
      }
    });
    
    // Get user presence status
    socket.on('get_user_presence', (data) => {
      const { userId, issueID } = data;
      if (userId && userPresence.has(userId)) {
        const presence = userPresence.get(userId);
        // Also check if user is actually in the room for this issue
        let isInChat = presence.currentChat === issueID;
        if (issueID && isInChat) {
          // Double-check by looking at active rooms
          if (activeRooms.has(issueID)) {
            const roomSockets = activeRooms.get(issueID);
            let foundInRoom = false;
            for (const [socketId, mappedUserId] of socketToUser.entries()) {
              if (mappedUserId === userId && roomSockets.has(socketId)) {
                foundInRoom = true;
                break;
              }
            }
            isInChat = foundInRoom;
          } else {
            isInChat = false;
          }
        }
        
        socket.emit('user_presence', {
          userId,
          isOnline: presence.isOnline,
          lastActive: presence.lastActive,
          currentChat: isInChat ? issueID : presence.currentChat,
        });
      } else {
        socket.emit('user_presence', {
          userId,
          isOnline: false,
          lastActive: null,
          currentChat: null,
        });
      }
    });

    // Send message
    socket.on('send_message', async (messageData) => {
      try {
        const { issueID, senderID, senderRole, text } = messageData;

        // Validate message data
        if (!issueID || !senderID || !senderRole || !text || text.trim() === '') {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Validate sender role
        if (senderRole !== 'student' && senderRole !== 'worker') {
          socket.emit('error', { message: 'Invalid sender role' });
          return;
        }

        // Create message object
        const message = {
          issueID,
          senderID,
          senderRole,
          text: text.trim(),
          timestamp: new Date().toISOString(),
          sent: true,
          read: false,
          readAt: null,
        };

        // Save message to Firestore
        const messagesRef = db
          .collection(COLLECTIONS.ISSUES)
          .doc(issueID)
          .collection('messages');

        const docRef = await messagesRef.add(message);
        const savedMessage = {
          id: docRef.id,
          ...message,
        };

        console.log(`💬 Message saved: ${docRef.id} for issue ${issueID}`);

        // Broadcast message to all clients in the issue room
        const roomName = `issue_${issueID}`;
        io.to(roomName).emit('new_message', savedMessage);

        // Emit confirmation to sender
        socket.emit('message_sent', { 
          messageId: docRef.id,
          text: message.text,
        });
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator (optional)
    socket.on('typing_start', (data) => {
      const { issueID, senderID, senderRole } = data;
      if (issueID && senderID) {
        const roomName = `issue_${issueID}`;
        socket.to(roomName).emit('user_typing', {
          issueID,
          senderID,
          senderRole,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { issueID, senderID } = data;
      if (issueID && senderID) {
        const roomName = `issue_${issueID}`;
        socket.to(roomName).emit('user_typing', {
          issueID,
          senderID,
          isTyping: false,
        });
      }
    });

    // Mark message as read
    socket.on('mark_message_read', async (data) => {
      try {
        const { issueID, messageID, readerID } = data;

        if (!issueID || !messageID || !readerID) {
          socket.emit('error', { message: 'Invalid read receipt data' });
          return;
        }

        // Get message to check sender
        const messageRef = db
          .collection(COLLECTIONS.ISSUES)
          .doc(issueID)
          .collection('messages')
          .doc(messageID);

        const messageDoc = await messageRef.get();
        if (!messageDoc.exists) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const messageData = messageDoc.data();

        // Only mark as read if reader is not the sender
        if (messageData.senderID !== readerID) {
          const readAt = new Date().toISOString();
          await messageRef.update({
            read: true,
            readAt,
          });

          // Update reader's last active time
          if (userPresence.has(readerID)) {
            const presence = userPresence.get(readerID);
            presence.lastActive = readAt;
            userPresence.set(readerID, presence);
          }

          // Notify sender that message was read
          const roomName = `issue_${issueID}`;
          io.to(roomName).emit('message_read', {
            issueID,
            messageID,
            readAt,
            readerID,
          });
        }
      } catch (error) {
        console.error('❌ Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      const userId = socketToUser.get(socket.id);
      
      // Update user presence
      if (userId) {
        const presence = userPresence.get(userId);
        if (presence) {
          presence.isOnline = false;
          presence.lastActive = new Date().toISOString();
          presence.currentChat = null;
          userPresence.set(userId, presence);
          
          // Broadcast user offline status
          io.emit('user_offline', { userId, lastActive: presence.lastActive });
        }
        socketToUser.delete(socket.id);
      }

      // Remove from all active rooms
      activeRooms.forEach((socketSet, issueID) => {
        if (socketSet.has(socket.id)) {
          socketSet.delete(socket.id);
          
          // Notify others that user left chat
          if (userId) {
            const roomName = `issue_${issueID}`;
            socket.to(roomName).emit('user_left_chat', { userId, issueID });
          }
          
          if (socketSet.size === 0) {
            activeRooms.delete(issueID);
          }
        }
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
};

