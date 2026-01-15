import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MessageBubble = ({ message, receiverOnline = false, receiverInChat = false }) => {
  const { userData } = useAuth();
  const isOwnMessage = message.senderID === (userData?.id || userData?.uid);
  
  // Determine receipt status:
  // - Single tick: receiver logged out
  // - Double tick (gray): receiver logged in but message not read
  // - Double tick (blue): message read
  const getReceiptStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.read && message.readAt) {
      return 'read'; // Blue double tick
    } else if (receiverOnline) {
      return 'delivered'; // Gray double tick (online but not read)
    } else {
      return 'sent'; // Single tick (offline)
    }
  };
  
  const receiptStatus = getReceiptStatus();

  // Format timestamp
  const formatTime = (timestamp) => {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
            isOwnMessage ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {message.senderRole === 'student' ? 'S' : 'W'}
        </div>

        {/* Message bubble */}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm ${
              isOwnMessage
                ? 'bg-blue-500 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          </div>
          <div className={`flex items-center gap-1 mt-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {/* Read receipts for own messages */}
            {isOwnMessage && (
              <div className="flex items-center">
                {receiptStatus === 'read' ? (
                  <CheckCheck size={14} className="text-blue-500" />
                ) : receiptStatus === 'delivered' ? (
                  <CheckCheck size={14} className="text-gray-400" />
                ) : receiptStatus === 'sent' ? (
                  <Check size={14} className="text-gray-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;

