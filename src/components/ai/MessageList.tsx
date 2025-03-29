
import React, { useRef, useEffect } from 'react';
import { Message } from './types/message';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
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
  );
};

export default MessageList;
