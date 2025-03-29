
import React, { useState, useEffect } from 'react';
import { Plus, Bot } from 'lucide-react';
import { useEventStore } from '@/lib/store';
import { Message, initialMessages } from './types/message';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import { generateAIResponse } from './services/aiService';
import { useSettingsStore } from '@/lib/stores/settings-store';

interface MallyAIProps {
  onScheduleEvent?: (event: any) => void;
}

const MallyAI: React.FC<MallyAIProps> = ({ onScheduleEvent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarView, setIsSidebarView] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const { backgroundColor } = useSettingsStore();
  const { events } = useEventStore();

  // Apply custom styles based on size
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'w-72 h-[350px]';
      case 'large':
        return 'w-96 h-[500px]';
      case 'medium':
      default:
        return 'w-80 h-[400px]';
    }
  };

  useEffect(() => {
    // Apply custom accent color to the chat UI
    document.documentElement.style.setProperty('--primary', backgroundColor);
  }, [backgroundColor]);

  const toggleAI = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Get AI response
    const aiResponse = await generateAIResponse(text);
    setMessages(prev => [...prev, aiResponse]);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSidebarView = () => {
    setIsSidebarView(!isSidebarView);
  };

  const handleSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    setSize(newSize);
  };

  const resetPosition = () => {
    setPosition({ x: 20, y: 20 });
  };

  if (!isOpen) {
    return (
      <div className="ai-button animate-pulse-border" onClick={toggleAI}>
        <Bot size={24} />
      </div>
    );
  }

  return (
    <>
      <div 
        className={`ai-chat-container ${getSizeStyles()} 
                  ${isSidebarView ? 'fixed left-[400px] bottom-0 rounded-none h-[calc(100vh-64px)] w-96' : ''}
                  flex flex-col transition-all duration-300`}
        style={{ 
          // Add a subtle accent color influence to the chat background
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.8)), 
                      linear-gradient(to right, ${backgroundColor}33, transparent)`
        }}
      >
        <ChatHeader 
          isExpanded={isExpanded}
          isSidebarView={isSidebarView}
          onToggleExpand={toggleExpand}
          onToggleSidebarView={toggleSidebarView}
          onClose={toggleAI}
          size={size}
          onSizeChange={handleSizeChange}
          position={position}
          onPositionReset={resetPosition}
        />
        
        <MessageList messages={messages} />
        
        <MessageInput onSendMessage={sendMessage} />
      </div>
      
      {/* Add Event Button */}
      <div 
        className="ai-button"
        style={{ bottom: isOpen ? '24rem' : '6rem' }}
        onClick={() => onScheduleEvent && onScheduleEvent({})}
      >
        <Plus size={24} />
      </div>
    </>
  );
};

export default MallyAI;
