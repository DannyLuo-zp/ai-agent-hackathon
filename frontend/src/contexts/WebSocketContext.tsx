import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINT } from '../config/endpoints';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string;
  sendMessage: (message: string) => void;
  messages: Message[];
  clearChat: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const clearChat = () => {
    // Clear messages
    setMessages([]);
    // Clear session ID from localStorage
    localStorage.removeItem('chat_session_id');
    // Generate new session ID
    const newSessionId = uuidv4();
    localStorage.setItem('chat_session_id', newSessionId);
    setSessionId(newSessionId);
    // Reconnect with new session ID
    if (socket) {
      socket.disconnect();
      socket.auth = { session_id: newSessionId };
      socket.connect();
    }
  };

  useEffect(() => {
    // Try to load session ID from localStorage first
    const storedSessionId = localStorage.getItem('chat_session_id');
    const newSessionId = storedSessionId || uuidv4();
    
    // If no stored session ID, save the new one
    if (!storedSessionId) {
      localStorage.setItem('chat_session_id', newSessionId);
    }
    
    setSessionId(newSessionId);

    // Connect to the WebSocket server
    const socketInstance = io(API_ENDPOINT, { 
      transports: ['websocket'],
      auth: { session_id: newSessionId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server with session:', newSessionId);
      
      // Fetch chat history after connection
      socketInstance.emit('fetch_history', { session_id: newSessionId });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socketInstance.on('message', (data) => {
      console.log('Received message:', data);
      try {
        const response = typeof data === 'string' ? JSON.parse(data) : data;
        if (response.status === 'success') {
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              content: response.content,
              sender: 'assistant',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    socketInstance.on('history', (data) => {
      console.log('Received history:', data);
      try {
        const response = typeof data === 'string' ? JSON.parse(data) : data;
        if (response.status === 'success' && Array.isArray(response.messages)) {
          const formattedMessages = response.messages.map((msg: any) => ({
            id: uuidv4(),
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(),
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error parsing history:', error);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = (content: string) => {
    if (socket && isConnected) {
      const messageData = {
        content,
        type: 'chat',
        session_id: sessionId
      };
      
      // Add user message to the UI immediately
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          content,
          sender: 'user',
          timestamp: new Date(),
        },
      ]);
      
      // Send message to the server
      socket.emit('message', JSON.stringify(messageData));
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        sessionId,
        sendMessage,
        messages,
        clearChat,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 