import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import Message from './Message';

const ChatInterface: React.FC = () => {
  const { sendMessage, messages, isConnected } = useWebSocket();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-semibold text-center">AI Chat Assistant</h1>
        <div className="text-xs text-center text-gray-500">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!isConnected || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 