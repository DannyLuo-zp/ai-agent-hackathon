import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Switch } from '@headlessui/react';

type NavigationProps = {
  mode: 'chat' | 'voice';
  onModeChange: (mode: 'chat' | 'voice') => void;
};

const Navigation: React.FC<NavigationProps> = ({ mode, onModeChange }) => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-10"
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-2">
          <Image src="/cat.png" alt="Cat" width={32} height={32} className="w-8 h-8" />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${mode === 'chat' ? 'text-gray-600' : 'text-gray-400'}`}>Chat</span>
            <Switch
              checked={mode === 'voice'}
              onChange={() => onModeChange(mode === 'chat' ? 'voice' : 'chat')}
              className={`${
                mode === 'voice' ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  mode === 'voice' ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
            <span className={`text-sm ${mode === 'voice' ? 'text-gray-600' : 'text-gray-400'}`}>Voice</span>
          </div>
        </div>

        <div className="w-8" />
      </div>
    </motion.header>
  );
};

export default Navigation; 