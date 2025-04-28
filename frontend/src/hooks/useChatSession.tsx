import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINT } from '../config/endpoints';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface HistoryResponse {
  status: string;
  messages: HistoryMessage[];
  session_id: string;
}

export default function useChatSession() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const clearChat = useCallback(() => {
    // Clear session ID from localStorage
    localStorage.removeItem('chat_session_id');
    // Refresh the page to trigger a new session
    window.location.reload();
  }, []);

  useEffect(() => {
    // Try to load session ID from localStorage first
    const storedSessionId = localStorage.getItem('chat_session_id');
    const newSessionId = storedSessionId || uuidv4();
    
    // If no stored session ID, save the new one
    if (!storedSessionId) {
      localStorage.setItem('chat_session_id', newSessionId);
    }
    
    setSessionId(newSessionId);

    // Connect to the WebSocket server with /chat namespace
    const socketInstance = io(`${API_ENDPOINT}/chat`, { 
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

    // Listen for messages on the chat namespace
    socketInstance.on('message', (data) => {
      console.log('Received message on chat namespace:', data);
      try {
        const response = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Parsed response:', response);
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
        } else if (response.status === 'error') {
          console.error('Error response from server:', response.content);
        }
      } catch (error) {
        console.error('Error parsing message:', error, 'Raw data:', data);
      }
    });

    socketInstance.on('history', (data) => {
      console.log('Received history on chat namespace:', data);
      try {
        const response = typeof data === 'string' ? JSON.parse(data) : data as HistoryResponse;
        if (response.status === 'success' && Array.isArray(response.messages)) {
          const formattedMessages = response.messages.map((msg: HistoryMessage) => ({
            id: uuidv4(),
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(),
          }));
          setMessages(formattedMessages);
        } else if (response.status === 'error') {
          console.error('Error fetching history:', response.content);
        }
      } catch (error) {
        console.error('Error parsing history:', error, 'Raw data:', data);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (socket && isConnected) {
      const messageData = {
        content,
        type: 'chat',
        session_id: sessionId
      };
      
      console.log('Sending message:', messageData);
      
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
    } else {
      console.error('Cannot send message: socket not connected');
    }
  }, [socket, isConnected, sessionId]);

  return {
    socket,
    isConnected,
    sessionId,
    sendMessage,
    messages,
    clearChat,
  };
} 