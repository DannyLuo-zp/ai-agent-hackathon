import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface MessageProps {
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

const Message: React.FC<MessageProps> = ({ content, sender, timestamp }) => {
  const isUser = sender === 'user';
  
  return (
    <motion.div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start space-x-2 max-w-[80%]">
        {!isUser && (
          <Image 
            src="/cat.png" 
            alt="Avatar" 
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div 
          className={`rounded-2xl p-4 ${
            isUser 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-none' 
              : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-none shadow-sm'
          }`}
        >
          <div className="text-sm mb-1 whitespace-pre-wrap">{content}</div>
          <div className={`text-xs ${isUser ? 'text-pink-100' : 'text-gray-500'}`}>
            {format(timestamp, 'h:mm a')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Message; 