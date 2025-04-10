// src/components/ai/MallyAI.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, X, ArrowRight, ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEventType } from '@/lib/stores/types';
import { useCalendarEvents } from '@/hooks/use-calendar-events';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
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
  onScheduleEvent?: (event: any) => Promise<any>;
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
  const { addEvent, updateEvent, removeEvent } = useCalendarEvents();
  const { user } = useAuth();

  useEffect(() => {
    if (initialPrompt) {
      setIsOpen(true);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

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

  const addAIMessage = (text: string, isLoading = false, isError = false) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'ai',
      timestamp: new Date(),
      isLoading,
      isError
    };
    
    setMessages(prev => [...prev, aiMessage]);
    return aiMessage.id;
  };

  const updateAIMessage = (id: string, text: string, isLoading = false, isError = false) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id 
          ? { ...message, text, isLoading, isError } 
          : message
      )
    );
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    const userMessageId = addUserMessage(messageText);
    setInput('');
    const aiMessageId = addAIMessage('Thinking...', true);
    setIsProcessing(true);

    try {
      console.log("Calling Supabase edge function: process-scheduling");
      
      const currentEvents = await fetchEvents();
      
      const response = await supabase.functions.invoke('process-scheduling', {
        body: { 
          prompt: messageText,
          messages: messages
            .filter(m => !m.isLoading)
            .map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
          events: currentEvents,
          userId: user?.id
        }
      });

      console.log("Edge function response:", response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const data = response.data;
      
      if (!data || (!data.response && !data.error)) {
        console.error('Invalid response from edge function:', data);
        throw new Error('Received an invalid response from the AI service');
      }
      
      if (data.error) {
        console.error('AI processing error:', data.error);
        throw new Error(data.error);
      }
      
      updateAIMessage(aiMessageId, data.response || 'I couldn\'t process that request. Please try again.', false);

      if (data.events && data.events.length > 0) {
        console.log("New events received from edge function:", data.events);
        
        for (const eventData of data.events) {
          try {
            const startsAt = eventData.starts_at || eventData.startsAt || new Date().toISOString();
            const endsAt = eventData.ends_at || eventData.endsAt || new Date(new Date(startsAt).getTime() + 60*60*1000).toISOString();
            const eventDate = new Date(startsAt).toISOString().split('T')[0];
            
            const startTime = new Date(startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const endTime = new Date(endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const description = `${startTime} - ${endTime} | ${eventData.description || ''}`;
            
            const formattedEvent: CalendarEventType = {
              id: eventData.id || crypto.randomUUID(),
              title: eventData.title,
              description: description,
              startsAt: startsAt,
              endsAt: endsAt,
              date: eventDate,
              color: eventData.color || 'bg-purple-500/70',
              isLocked: eventData.is_locked || eventData.isLocked || false,
              isTodo: eventData.is_todo || eventData.isTodo || false,
              hasAlarm: eventData.has_alarm || eventData.hasAlarm || false,
              hasReminder: eventData.has_reminder || eventData.hasReminder || false,
              todoId: eventData.todo_id || eventData.todoId
            };
            
            if (onScheduleEvent) {
              console.log("Using onScheduleEvent callback for event:", formattedEvent);
              const result = await onScheduleEvent(formattedEvent);
              console.log("Result from onScheduleEvent:", result);
              
              if (result && result.success) {
                toast.success(`Event "${formattedEvent.title}" scheduled`);
              } else {
                console.error("Failed to schedule event:", result?.error || "unknown error");
                toast.error(`Failed to schedule event: ${result?.error || 'Unknown error'}`);
              }
            } else {
              const result = await addEvent(formattedEvent);
              console.log("Result from addEvent hook:", result);
              
              if (result.success) {
                toast.success(`Event "${formattedEvent.title}" added to your calendar`);
              } else {
                console.error("Failed to add event:", result.error);
                toast.error(`Failed to add event: ${result.error || 'Unknown error'}`);
              }
            }
          } catch (err) {
            console.error("Error processing AI-created event:", err);
            toast.error(`Error adding event: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }
      
      if (data.processedEvent) {
        const processedEvent = data.processedEvent;
        
        if (processedEvent._action === 'delete') {
          const response = await removeEvent(processedEvent.id);
          if (response.success) {
            toast.success(`Event "${processedEvent.title}" has been deleted`);
          } else {
            toast.error(`Failed to delete event: ${response.error || 'Unknown error'}`);
          }
        } else if (processedEvent.id) {
          const eventToUpdate: CalendarEventType = {
            id: processedEvent.id,
            title: processedEvent.title,
            description: formatEventDescription(
              processedEvent.starts_at, 
              processedEvent.ends_at, 
              processedEvent.description || ''
            ),
            startsAt: processedEvent.starts_at,
            endsAt: processedEvent.ends_at,
            date: new Date(processedEvent.starts_at).toISOString().split('T')[0],
            color: processedEvent.color || 'bg-purple-500/70',
            isLocked: processedEvent.is_locked || false,
            isTodo: processedEvent.is_todo || false,
            hasAlarm: processedEvent.has_alarm || false,
            hasReminder: processedEvent.has_reminder || false
          };
          
          const response = await updateEvent(eventToUpdate);
          if (response.success) {
            toast.success(`Event "${processedEvent.title}" has been updated`);
          } else {
            toast.error(`Failed to update event: ${response.error || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      updateAIMessage(
        aiMessageId, 
        `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 
        false,
        true
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatEventDescription = (startsAt: string, endsAt: string, description: string): string => {
    const startTime = new Date(startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = new Date(endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${startTime} - ${endTime} | ${description}`;
  };

  const fetchEvents = async () => {
    try {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching events for AI context:", error);
      return [];
    }
  };

  const sendMessage = () => {
    if (isProcessing) return;
    
    const messageToSend = input.trim();
    
    if (messageToSend) {
      handleSendMessage(messageToSend);
    }
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

  const aiButtonStyle = {
    position: 'fixed' as const,
    bottom: '6rem',
    right: '2rem',
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    transition: 'all 0.3s ease',
    animation: 'pulse 2s infinite',
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed z-50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all" 
        style={aiButtonStyle}
        onClick={toggleAI}
      >
        <Bot size={24} className="text-white" />
      </div>
    );
  }

  return (
    <>
      <div 
        className={`ai-chat-container ${isExpanded ? 'w-96 h-[500px]' : 'w-80 h-[400px]'} 
                  ${isSidebarView ? 'fixed left-[400px] bottom-0 rounded-none h-[calc(100vh-64px)] w-96' : 'fixed bottom-20 right-8 z-50 rounded-lg shadow-xl'} 
                  flex flex-col transition-all duration-300 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 text-white border border-purple-500/20`}
      >
        <div className="flex justify-between items-center p-3 border-b border-white/10">
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
        
        <div className="flex-1 overflow-y-auto mb-3 p-3">
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
                    : message.isError 
                      ? 'bg-red-500/30 mr-auto'
                      : 'bg-secondary mr-auto'
                } ${message.isLoading ? 'animate-pulse' : ''}`}
              >
                <p className="text-sm">{message.text}</p>
                {message.isLoading && (
                  <div className="flex justify-center mt-1">
                    <Loader2 size={16} className="animate-spin text-white/70" />
                  </div>
                )}
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
        
        <div className="flex items-center p-3 border-t border-white/10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mally AI..."
            className="glass-input w-full resize-none bg-white/10"
            rows={1}
            disabled={isProcessing}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
            className="ml-2 p-2 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MallyAI;
