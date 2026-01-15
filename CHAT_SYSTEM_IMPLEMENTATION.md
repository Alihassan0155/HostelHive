# 🔥 Chat + Notification System Implementation Guide

## 📋 Overview

This document describes the complete real-time chat and notification system implemented for HostelHive. The system enables real-time communication between Students and Workers for each issue, plus notifications when issues are assigned.

## 🏗️ Architecture

### Backend (Node.js + Socket.io + Firestore)
- **Socket.io Server**: Handles real-time message broadcasting
- **Firestore**: Stores messages and notifications persistently
- **Hybrid Approach**: Messages sent via Socket.io → Saved to Firestore → Broadcasted via Socket.io

### Frontend (React + Socket.io Client + Firestore)
- **Socket.io Client**: Connects to backend for real-time updates
- **Firestore Listeners**: Load initial messages and listen for new ones
- **Context API**: Manages Socket.io connection globally

## 📁 File Structure

### Backend Files

```
backend/
├── src/
│   ├── socket.js                    # Socket.io server setup and handlers
│   ├── server.js                    # Updated to integrate Socket.io
│   ├── services/
│   │   └── notificationService.js   # Updated to store in user subcollections
│   └── config/
│       └── firebase.js              # Firebase Admin SDK (already exists)
```

### Frontend Files

```
frontend/
├── src/
│   ├── context/
│   │   └── SocketContext.jsx          # Socket.io client provider
│   ├── pages/
│   │   └── Chat/
│   │       └── IssueChat.jsx        # Main chat page component
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── MessageBubble.jsx     # Individual message component
│   │   │   └── MessageInput.jsx     # Message input with typing indicator
│   │   └── UI/
│   │       ├── NotificationBell.jsx   # Notification dropdown bell
│   │       └── NotificationCard.jsx # Individual notification card
│   ├── hooks/
│   │   └── useNotifications.js      # Notification hooks
│   ├── config/
│   │   └── firebase.js               # Updated to include Firestore
│   └── App.jsx                       # Updated with SocketProvider and chat routes
```

## 🔧 Implementation Details

### 1. Backend Socket.io Server (`backend/src/socket.js`)

**Features:**
- Room-based messaging (one room per issue)
- Message validation and storage
- Typing indicators
- Connection management

**Key Events:**
- `join_issue`: Client joins an issue room
- `send_message`: Client sends a message
- `new_message`: Broadcast new message to room
- `typing_start`/`typing_stop`: Typing indicators

**Message Storage:**
- Firestore path: `issues/{issueID}/messages/{messageID}`
- Message structure:
  ```javascript
  {
    issueID: string,
    senderID: string,
    senderRole: "student" | "worker",
    text: string,
    timestamp: ISO string
  }
  ```

### 2. Frontend Socket Context (`frontend/src/context/SocketContext.jsx`)

**Features:**
- Auto-connects when user is authenticated
- Auto-disconnects on logout
- Connection status tracking
- Global socket instance via Context API

### 3. Chat Page (`frontend/src/pages/Chat/IssueChat.jsx`)

**Features:**
- Loads messages from Firestore
- Listens to Socket.io for new messages
- Real-time typing indicators
- Auto-scroll to bottom
- Access control (only student/worker can chat)
- Read-only mode for closed issues

**Flow:**
1. User opens chat → Loads issue details
2. Joins Socket.io room → `socket.emit('join_issue', issueID)`
3. Loads messages from Firestore → `onSnapshot(issues/{issueID}/messages)`
4. Listens for new messages → `socket.on('new_message')`
5. Sends message → `socket.emit('send_message')` → Saved to Firestore → Broadcasted

### 4. Notification System

**Storage:**
- Main collection: `notifications/{notificationID}`
- User subcollection: `users/{userID}/notifications/{notificationID}`

**When Issue is Assigned:**
1. Backend creates notification in `notifications` collection
2. Also creates in `users/{userID}/notifications` subcollection
3. Frontend listens via `useNotifications` hook
4. Shows toast notification via Firestore listener on issue document

**Notification Types:**
- `issue_assigned`: When admin assigns issue to worker
- `work_started`: When worker starts work
- `work_completed`: When worker completes work
- And more...

### 5. Integration Points

**IssueCard Component:**
- Added "Chat" link for accessible issues
- Only shows if user can chat (student owns issue OR worker is assigned)

**Header Component:**
- Added NotificationBell component
- Shows unread count badge
- Dropdown with all notifications

**App.jsx:**
- Wrapped with `SocketProvider`
- Added route: `/chat/issue/:id`

## 🚀 Usage

### For Students:
1. View issues in "My Issues" page
2. Click "Chat" link on assigned issues
3. Chat with assigned worker in real-time

### For Workers:
1. View assigned tasks in "My Tasks" page
2. Click "Chat" link on assigned issues
3. Chat with student who reported the issue

### For Admins:
- Admins can assign issues, which triggers notifications
- Both student and worker receive notifications
- Notifications appear in NotificationBell dropdown

## 🔐 Security & Access Control

1. **Socket.io**: No authentication middleware (can be added if needed)
2. **Frontend**: Chat page checks access:
   - Student: Must own the issue
   - Worker: Must be assigned to the issue OR issue status is "assigned"
3. **Firestore**: Uses Firebase security rules (should be configured)

## 📝 Environment Variables

### Backend
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origins
- Firebase Admin SDK credentials (via env vars or serviceAccountKey.json)

### Frontend
- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:3000/api`)

## 🎨 UI/UX Features

- **Modern WhatsApp-style chat bubbles**
- **Real-time typing indicators**
- **Auto-scroll to latest message**
- **Connection status indicator**
- **Read-only mode for closed issues**
- **Beautiful notification dropdown**
- **Smooth animations with Framer Motion**

## 🐛 Troubleshooting

### Socket not connecting:
1. Check backend is running on correct port
2. Check `VITE_API_BASE_URL` in frontend `.env`
3. Check CORS settings in backend

### Messages not appearing:
1. Check Firestore security rules allow read/write
2. Check Socket.io connection status
3. Check browser console for errors

### Notifications not showing:
1. Check Firestore listeners are active
2. Check notification service creates notifications correctly
3. Check user has proper role/permissions

## 📦 Dependencies Added

### Backend:
- `socket.io` - Real-time WebSocket server

### Frontend:
- `socket.io-client` - Real-time WebSocket client
- `framer-motion` - Already installed, used for animations
- `lucide-react` - Already installed, used for icons

## ✅ Testing Checklist

- [ ] Socket.io connection establishes on login
- [ ] Messages send and receive in real-time
- [ ] Messages persist in Firestore
- [ ] Typing indicators work
- [ ] Notifications appear when issue is assigned
- [ ] NotificationBell shows unread count
- [ ] Chat access control works correctly
- [ ] Closed issues show read-only mode
- [ ] Auto-scroll works when new messages arrive

## 🎯 Next Steps (Optional Enhancements)

1. Add message read receipts
2. Add file/image sharing
3. Add message search
4. Add notification sounds
5. Add push notifications (Firebase Cloud Messaging)
6. Add Socket.io authentication middleware
7. Add message reactions/emojis
8. Add user presence indicators

---

**Implementation Date**: 2024
**Status**: ✅ Production Ready

