'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import RealtimeInterface from '@/components/RealtimeInterface';
import Navigation from '@/components/Navigation';

export default function Home() {
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Navigation 
        mode={mode} 
        onModeChange={setMode}
      />
      {mode === 'chat' ? <ChatInterface /> : <RealtimeInterface />}
    </div>
  );
}
