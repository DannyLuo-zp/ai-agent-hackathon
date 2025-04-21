import React from 'react';
import { format } from 'date-fns';

interface MessageProps {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const Message: React.FC<MessageProps> = ({ content, sender, timestamp }) => {
  const isUser = sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <div className="text-sm mb-1">{content}</div>
        <div className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {format(timestamp, 'h:mm a')}
        </div>
      </div>
    </div>
  );
};

export default Message; 