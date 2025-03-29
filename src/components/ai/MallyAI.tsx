
import React, { useState } from 'react';
import { Plus, Bot } from 'lucide-react';
import { useEventStore } from '@/lib/store';
import { Message, initialMessages } from './types/message';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import { generateAIResponse } from './services/aiService';

interface MallyAIProps {
  onScheduleEvent?: (event: any) => void;
}

const MallyAI: React.FC<MallyAIProps> = ({ onScheduleEvent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarView, setIsSidebarView] = useState(false);
  const { events } = useEventStore();

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
        className={`ai-chat-container ${isExpanded ? 'w-96 h-[500px]' : 'w-80 h-[400px]'} 
                  ${isSidebarView ? 'fixed left-[400px] bottom-0 rounded-none h-[calc(100vh-64px)] w-96' : ''}
                  flex flex-col transition-all duration-300`}
      >
        <ChatHeader 
          isExpanded={isExpanded}
          isSidebarView={isSidebarView}
          onToggleExpand={toggleExpand}
          onToggleSidebarView={toggleSidebarView}
          onClose={toggleAI}
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
