
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for parsing natural language and generating events
function parseDateTime(text: string) {
  // Simple parsing for demonstration - in production, use a proper NLP library
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const dateRegex = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)/i;
  
  let time = text.match(timeRegex);
  let date = text.match(dateRegex);
  
  // Return parsed information or null
  return {
    time: time ? time[0] : null,
    date: date ? date[0] : null,
  };
}

function detectConflicts(proposedEvent: any, existingEvents: any[]) {
  // Basic conflict detection - in production, implement more sophisticated logic
  return existingEvents.filter(event => 
    event.date === proposedEvent.date && 
    ((proposedEvent.startTime >= event.startTime && proposedEvent.startTime < event.endTime) ||
     (proposedEvent.endTime > event.startTime && proposedEvent.endTime <= event.endTime))
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY in Supabase secrets.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData = await req.json();
    const { prompt, messages, events = [], userId } = requestData;

    // Format messages for OpenAI API
    const formattedMessages = [
      {
        role: 'system',
        content: `You are Mally AI, an intelligent calendar assistant. 
        You help users schedule and reschedule events. 
        Be conversational but concise. 
        Always ask for clarification if a request is ambiguous.
        When scheduling, check for conflicts with existing events.
        Current date: ${new Date().toLocaleDateString()}`
      },
      ...messages,
      {
        role: 'user',
        content: prompt
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from OpenAI');
    }

    const aiResponse = data.choices[0].message.content;

    // Simple logic to extract event data - in production, use more sophisticated NLP
    const newEvents = [];
    
    // For demonstration: If the message mentions "adding" or "scheduling" and includes time indicators,
    // create a basic event
    if ((prompt.toLowerCase().includes('schedule') || aiResponse.toLowerCase().includes('schedul')) && 
        (prompt.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i) || aiResponse.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i))) {
      
      // Very basic event extraction - in production, implement more sophisticated extraction
      const parsedInfo = parseDateTime(prompt);
      
      if (parsedInfo.time && parsedInfo.date) {
        const eventTitle = prompt.match(/(?:schedule|add|create|plan)\s+(?:a|an)?\s*(.+?)(?:\s+at|\s+on|$)/i)?.[1] || 'New Event';
        
        // Simple logic to determine event time
        const startTime = parsedInfo.time;
        // Default duration: 1 hour
        const endTime = startTime ? startTime.replace(/(\d{1,2})/, (match) => {
          return String(Number(match) + 1);
        }) : null;
        
        newEvents.push({
          title: eventTitle,
          date: new Date().toISOString().split('T')[0], // Today's date as fallback
          description: `${startTime} - ${endTime} | ${eventTitle}`,
          color: 'bg-purple-500/70',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        events: newEvents
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing scheduling request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
