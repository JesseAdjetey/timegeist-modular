
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, X, ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useEventStore } from '@/lib/store';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hi, I'm Mally AI! I can help you schedule and manage events. How can I assist you today?",
    sender: 'ai',
    timestamp: new Date()
  }
];

interface MallyAIProps {
  onScheduleEvent?: (event: any) => void;
}

const MallyAI: React.FC<MallyAIProps> = ({ onScheduleEvent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarView, setIsSidebarView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { events } = useEventStore();

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAI = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      let aiResponse: Message;
      
      if (input.toLowerCase().includes('schedule') || input.toLowerCase().includes('add') || input.toLowerCase().includes('create')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'd be happy to help you schedule that! Would you like me to add this event to your calendar now?",
          sender: 'ai',
          timestamp: new Date()
        };
      } else if (input.toLowerCase().includes('reschedule') || input.toLowerCase().includes('move')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "I can help you reschedule. Some events are locked, so I'll need your permission to modify them. Would you like to proceed?",
          sender: 'ai',
          timestamp: new Date()
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'm here to help with your scheduling needs. You can ask me to add events, reschedule appointments, or manage your time more effectively.",
          sender: 'ai',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Bot size={20} className="text-primary mr-2" />
            <h3 className="font-semibold">Mally AI</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={toggleSidebarView}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {isSidebarView ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            </button>
            <button 
              onClick={toggleExpand}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {isExpanded ? <ArrowUpRight size={14} /> : <Plus size={14} />}
            </button>
            <button 
              onClick={toggleAI}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-3 pr-1">
          {messages.map(message => (
            <div
              key={message.id}
              className={`mb-3 ${
                message.sender === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`p-2 rounded-lg max-w-[85%] ${
                  message.sender === 'user'
                    ? 'bg-primary/30 ml-auto'
                    : 'bg-secondary mr-auto'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <div
                className={`text-xs opacity-70 mt-1 ${
                  message.sender === 'user' ? 'text-right' : ''
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mally AI..."
            className="glass-input w-full resize-none"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="ml-2 p-2 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
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
