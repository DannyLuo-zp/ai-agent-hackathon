import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string;
  sendMessage: (message: string) => void;
  messages: Message[];
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

  useEffect(() => {
    // Generate a unique session ID
    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    // Connect to the WebSocket server
    const socketInstance = io('http://localhost:8000', {
      transports: ['websocket'],
      auth: { session_id: newSessionId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 