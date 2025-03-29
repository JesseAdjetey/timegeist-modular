
import { Message } from '../types/message';

export const generateAIResponse = (userInput: string): Promise<Message> => {
  return new Promise((resolve) => {
    // Simulate AI response
    setTimeout(() => {
      let responseText: string;
      
      if (userInput.toLowerCase().includes('schedule') || 
          userInput.toLowerCase().includes('add') || 
          userInput.toLowerCase().includes('create')) {
        responseText = "I'd be happy to help you schedule that! Would you like me to add this event to your calendar now?";
      } else if (userInput.toLowerCase().includes('reschedule') || 
                userInput.toLowerCase().includes('move')) {
        responseText = "I can help you reschedule. Some events are locked, so I'll need your permission to modify them. Would you like to proceed?";
      } else {
        responseText = "I'm here to help with your scheduling needs. You can ask me to add events, reschedule appointments, or manage your time more effectively.";
      }
      
      const aiResponse: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      resolve(aiResponse);
    }, 1000);
  });
};
