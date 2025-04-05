
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
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set in Supabase secrets");
      return new Response(
        JSON.stringify({ 
          error: 'Anthropic API key is not configured. Please set the ANTHROPIC_API_KEY in Supabase secrets.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData = await req.json();
    const { prompt, messages, events = [], userId } = requestData;
    
    console.log("Request received:", { prompt, messageCount: messages.length, eventsCount: events.length, userId });

    // Format messages for Claude API - fixing the format to use system parameter correctly
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Add the current prompt as the last user message
    formattedMessages.push({
      role: 'user',
      content: prompt
    });

    console.log("Calling Anthropic API with model: claude-3-haiku-20240307");
    
    // Call Claude API with corrected format - system message is provided separately
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: formattedMessages,
        system: `You are Mally AI, an intelligent calendar assistant. 
        You help users schedule and reschedule events. 
        Be conversational but concise. 
        Always ask for clarification if a request is ambiguous.
        When scheduling, check for conflicts with existing events.
        Current date: ${new Date().toLocaleDateString()}`,
        temperature: 0.5,
      }),
    });

    const responseText = await response.text();
    console.log("API Response Status:", response.status);
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse API response as JSON:", responseText);
      throw new Error(`Invalid response from Anthropic API: ${responseText.substring(0, 200)}...`);
    }
    
    if (!response.ok) {
      console.error("API Error:", data.error || "Unknown API error");
      throw new Error(data.error?.message || `Failed to get response from Anthropic (Status: ${response.status})`);
    }

    const aiResponse = data.content?.[0]?.text || '';
    console.log("AI Response received:", aiResponse.substring(0, 100) + "...");

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
          id: crypto.randomUUID(),
          title: eventTitle,
          date: new Date().toISOString().split('T')[0], // Today's date as fallback
          description: `${startTime} - ${endTime} | ${eventTitle}`,
          color: 'bg-purple-500/70',
        });
      }
    }

    console.log("New events extracted:", newEvents.length > 0 ? newEvents : "None");

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
      JSON.stringify({ 
        error: error.message,
        details: "See function logs for more information" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
