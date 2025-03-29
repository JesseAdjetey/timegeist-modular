
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const initialMessages: Message[] = [
  {
    id: '1',
    text: "Hi, I'm Mally AI! I can help you schedule and manage events. How can I assist you today?",
    sender: 'ai',
    timestamp: new Date()
  }
];
