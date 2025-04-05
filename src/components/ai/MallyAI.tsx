
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, X, ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useEventStore } from '@/lib/store';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
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
  initialPrompt?: string;
}

const MallyAI: React.FC<MallyAIProps> = ({ onScheduleEvent, initialPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialPrompt || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarView, setIsSidebarView] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { events } = useEventStore();
  const { user } = useAuth();

  // Auto-open if there's an initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setIsOpen(true);
    }
  }, [initialPrompt]);

  // Handle initial prompt if provided
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAI = () => {
    setIsOpen(!isOpen);
  };

  const addUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    return userMessage.id;
  };

  const addAIMessage = (text: string, isLoading = false) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'ai',
      timestamp: new Date(),
      isLoading
    };
    
    setMessages(prev => [...prev, aiMessage]);
    return aiMessage.id;
  };

  const updateAIMessage = (id: string, text: string, isLoading = false) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id 
          ? { ...message, text, isLoading } 
          : message
      )
    );
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    const userMessageId = addUserMessage(messageText);
    setInput('');

    // Add a loading message from AI
    const aiMessageId = addAIMessage('Thinking...', true);
    setIsProcessing(true);

    try {
      // Call OpenAI via our edge function
      const response = await supabase.functions.invoke('process-scheduling', {
        body: { 
          prompt: messageText,
          messages: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          events: events, // Send current events for context
          userId: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const data = response.data;
      
      // Update the AI message with the response
      updateAIMessage(aiMessageId, data.response || 'I couldn\'t process that request. Please try again.', false);

      // If there are events to add/update, handle them
      if (data.events && data.events.length > 0) {
        data.events.forEach(event => {
          if (onScheduleEvent) {
            onScheduleEvent(event);
          } else {
            toast.success(`Event "${event.title}" added to your calendar`);
          }
        });
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      updateAIMessage(aiMessageId, 'Sorry, I encountered an error while processing your request. Please try again later.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = () => {
    if (isProcessing) return;
    handleSendMessage(input);
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
                } ${message.isLoading ? 'animate-pulse' : ''}`}
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
            disabled={isProcessing}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
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
