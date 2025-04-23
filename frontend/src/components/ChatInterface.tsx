import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import Message from './Message';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ChatInterface: React.FC = () => {
  const { sendMessage, messages, isConnected, clearChat } = useWebSocket();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      setIsTyping(true);
      sendMessage(input);
      setInput('');
      // Simulate AI typing delay
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      clearChat();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/cat.png" alt="Cat" width={32} height={32} className="w-8 h-8" />
            <h1 className="text-xl font-semibold text-center bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
              Your AI Pet
            </h1>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearChat}
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Clear chat history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </motion.header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4"
            >
              <Image src="/cat.png" alt="Welcome" width={128} height={128} className="w-32 h-32 opacity-50" />
              <p className="text-lg">Hi! I&apos;m your AI pet. Let&apos;s chat! 😺</p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Message
                  content={message.content}
                  sender={message.sender}
                  timestamp={message.timestamp}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <Image src="/cat.png" alt="Typing" width={24} height={24} className="w-6 h-6" />
            <span className="text-sm">typing...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <motion.form 
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-full border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!isConnected || !input.trim()}
            className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};

export default ChatInterface; 