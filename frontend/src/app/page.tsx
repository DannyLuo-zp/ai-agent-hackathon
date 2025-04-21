'use client';

import { WebSocketProvider } from '@/contexts/WebSocketContext';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <WebSocketProvider>
      <main className="min-h-screen">
        <ChatInterface />
      </main>
    </WebSocketProvider>
  );
}
