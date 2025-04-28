'use client';

import { useState, useRef, useEffect } from 'react';
import useRealTime from '@/hooks/useRealTime';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import useAudioRecorder from '@/hooks/useAudioRecorder';
import useAudioPlayer from '@/hooks/useAudioPlayer';

const RealtimeInterface: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(isActive);
  
  // Update ref when state changes
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();
  
  const handleAudioDelta = async (delta: string) => {
    if (isActiveRef.current) {
      try {
       
        await playAudio(delta);
      } catch (error) {
        console.error("[VoiceChat] Error playing audio delta:", error);
      }
    } else {
      console.log("[VoiceChat] Not active, skipping audio playback");
    }
  };

  const { 
    isConnected,
    startSession,
    addUserAudio,
    inputAudioBufferClear
  } = useRealTime({
    onWebSocketOpen: () => {
      console.log("WebSocket connection opened");
      console.log("[VoiceChat] Current isActive state:", isActiveRef.current);
    },
    onWebSocketClose: () => {
      console.log("WebSocket connection closed");
      console.log("[VoiceChat] Current isActive state:", isActiveRef.current);
    },
    onWebSocketError: event => console.error("WebSocket error:", event),
    onReceivedError: message => console.error("error", message),
    onReceivedResponseAudioDelta: (message) => handleAudioDelta(message.delta),
    onReceivedInputAudioBufferSpeechStarted: () => {
      if (isActiveRef.current) {
        console.log("[VoiceChat] Speech started, stopping previous audio");
        stopAudioPlayer();
      }
    }
  });

  const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({ onAudioRecorded: addUserAudio });

  const handleToggleVoiceChat = async () => {
    console.log("[VoiceChat] Toggling voice chat, current state:", isActiveRef.current);
    if (!isActiveRef.current) {
      startSession();
      await startAudioRecording();
      await resetAudioPlayer();
      setIsActive(true);
    } else {
      await stopAudioRecording();
      stopAudioPlayer();
      inputAudioBufferClear();
      setIsActive(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleVoiceChat}
            className={`relative w-32 h-32 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/50'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {isActive ? (
                <MicOff className="w-12 h-12 text-white animate-pulse" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </div>
            {isActive && (
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
            )}
          </motion.button>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600"
          >
            {isActive ? 'Click to end voice chat' : 'Click to start voice chat'}
          </motion.p>

          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-sm text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RealtimeInterface; 