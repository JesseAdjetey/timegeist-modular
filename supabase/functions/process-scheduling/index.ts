
// supabase/functions/process-scheduling/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract date and time from text
function parseDateTime(text: string) {
  // More sophisticated datetime parsing
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const dateRegex = /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/i;
  
  let timeMatch = text.match(timeRegex);
  let dateMatch = text.match(dateRegex);
  
  return {
    time: timeMatch ? timeMatch[0] : null,
    date: dateMatch ? dateMatch[0] : null,
  };
}

// Helper function to convert natural language date to YYYY-MM-DD
function getNormalizedDate(dateText: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Handle common date expressions
  if (!dateText || dateText.toLowerCase() === 'today') {
    return today.toISOString().split('T')[0];
  } else if (dateText.toLowerCase() === 'tomorrow') {
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Try to parse date values
  const date = new Date(dateText);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Fallback to today
  return today.toISOString().split('T')[0];
}

// Helper to check for event conflicts
function detectConflicts(proposedEvent: any, existingEvents: any[]) {
  // Filter to only check events on the same day
  const eventDate = new Date(proposedEvent.starts_at).toISOString().split('T')[0];
  const sameDay = existingEvents.filter(event => {
    const eventStartDate = new Date(event.starts_at).toISOString().split('T')[0];
    return eventStartDate === eventDate;
  });
  
  // Convert ISO timestamps to minutes for comparison
  const getMinutes = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.getHours() * 60 + date.getMinutes();
  };
  
  const proposedStart = getMinutes(proposedEvent.starts_at);
  const proposedEnd = getMinutes(proposedEvent.ends_at);
  
  return sameDay.filter(event => {
    const eventStart = getMinutes(event.starts_at);
    const eventEnd = getMinutes(event.ends_at);
    
    // Check for overlap
    return (
      (proposedStart >= eventStart && proposedStart < eventEnd) ||
      (proposedEnd > eventStart && proposedEnd <= eventEnd) ||
      (proposedStart <= eventStart && proposedEnd >= eventEnd)
    );
  });
}

// Extract action intent from user message - enhanced for more natural language understanding
function extractActionIntent(text: string) {
  const text_lower = text.toLowerCase();
  
  // Look for deletion patterns
  if (/(delete|remove|cancel|get rid of|eliminate|trash|erase|take off|clear|drop)/i.test(text_lower)) {
    return 'delete';
  } 
  
  // Look for editing patterns
  if (/(edit|update|change|modify|reschedule|move|postpone|shift|adjust|amend|revise|alter)/i.test(text_lower)) {
    return 'edit';
  }
  
  // Default to create if there's any time or date reference
  const hasTimeReference = /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?|\d{1,2}\s*o'clock|noon|midnight|morning|afternoon|evening)/i.test(text_lower);
  const hasDateReference = /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|weekend|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/i.test(text_lower);
  
  // Look for creation patterns (more flexible now)
  if (hasTimeReference || hasDateReference || 
      /(schedule|add|create|new|put|set up|arrange|book|plan|make|organize|remind me|appointment|call|meeting)/i.test(text_lower)) {
    return 'create';
  }
  
  // If no strong intent is detected but there's a mention of an event, assume query/lookup
  if (/(meeting|appointment|event|schedule|calendar|reminder|what|when|where|who|how|tell me about)/i.test(text_lower)) {
    return 'query';
  }
  
  // Fallback to create as most messages are likely to be about creating events
  return 'create';
}

const formatTime = (timeStr: string) => {
  let [hours, minutes] = [12, 0]; // Default

  // Handle different input formats
  if (timeStr.includes(':')) {
    [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
  } else {
    hours = parseInt(timeStr);
    minutes = 0;
  }

  // Handle AM/PM
  if (timeStr.toLowerCase().includes('pm') && hours < 12) {
    hours += 12;
  }
  if (timeStr.toLowerCase().includes('am') && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Extract event details from text - enhanced for more natural language
function extractEventDetails(text: string) {
  // More flexible time pattern matching
  const timePatterns = [
    /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i,  // 3pm to 4pm
    /from\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:to|till|until|-)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i,  // from 3pm to 4pm
    /at\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i  // at 3pm (single time)
  ];
  
  let timeMatch = null;
  let startTime = null;
  let endTime = null;
  
  // Try each pattern
  for (const pattern of timePatterns) {
    timeMatch = text.match(pattern);
    if (timeMatch) {
      startTime = timeMatch[1];
      endTime = timeMatch[2] || null;
      break;
    }
  }
  
  // If only start time is found, set end time to start time + 1 hour
  if (startTime && !endTime) {
    const parsedHour = parseInt(startTime.match(/\d+/)[0]);
    const isPM = /pm/i.test(startTime);
    const hour = isPM && parsedHour < 12 ? parsedHour + 12 : parsedHour;
    endTime = `${(hour + 1) % 24}:00${isPM ? 'pm' : 'am'}`;
  }
  
  // Default times if none found
  if (!startTime) {
    const now = new Date();
    const hour = now.getHours();
    const roundedHour = Math.ceil(hour / 1) * 1; // Round to nearest hour
    startTime = `${roundedHour}:00`;
    endTime = `${(roundedHour + 1) % 24}:00`;
  }
  
  // More flexible date pattern matching
  const datePatterns = [
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/i,
    /on\s*([\w]+day|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/i,
    /this\s*([\w]+day|weekend)/i,
    /next\s*([\w]+day|weekend|month|week)/i
  ];
  
  let dateMatch = null;
  
  // Try each pattern
  for (const pattern of datePatterns) {
    dateMatch = text.match(pattern);
    if (dateMatch) {
      break;
    }
  }
  
  // Extract the date (or default to today)
  const dateText = dateMatch ? dateMatch[1] || dateMatch[0] : 'today';
  
  // Extract title using more sophisticated patterns
  const titlePatterns = [
    // Looking for phrases that indicate a title
    /(?:schedule|add|create|new event|event for|meeting for|call with|appointment with|appointment for)\s+(?:a|an)?\s*"?([^"]*?)"?(?:\s+on|\s+at|\s+from|\s+with|\s+for|$)/i,
    /(?:about|regarding|titled|called|named)\s+(?:a|an)?\s*"?([^"]*?)"?(?:\s+on|\s+at|\s+from|\s+with|\s+for|$)/i,
    // Generic catch-all pattern as fallback
    /(?:meeting|call|event|appointment)\s+(?:with|about|for)?\s+([^,\.]+)/i
  ];
  
  // Try to extract a title
  let title = '';
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      title = match[1].trim();
      break;
    }
  }
  
  // If no title found, try to extract a meaningful noun phrase
  if (!title) {
    // Remove time and date references
    let cleanedText = text.replace(/(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/g, '');
    cleanedText = cleanedText.replace(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/g, '');
    
    // Look for possible noun phrases - naive approach
    const words = cleanedText.split(/\s+/);
    if (words.length >= 2) {
      title = words.slice(0, Math.min(5, words.length)).join(' ');
    } else {
      title = 'New Event';
    }
  }
  
  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = endTime ? formatTime(endTime) : formatTime(`${parseInt(formattedStartTime.split(':')[0]) + 1}:00`);
  
  // Get the date in YYYY-MM-DD format
  const eventDate = dateText ? getNormalizedDate(dateText) : getNormalizedDate('today');
  
  // Create ISO timestamps for start and end times
  const startsAt = new Date(`${eventDate}T${formattedStartTime}`).toISOString();
  const endsAt = new Date(`${eventDate}T${formattedEndTime}`).toISOString();
  
  return {
    title,
    date: eventDate, // Keep date field for compatibility
    description: title, // Use title as the description base
    starts_at: startsAt,
    ends_at: endsAt,
    startsAt: startsAt, // Add this for frontend compatibility 
    endsAt: endsAt // Add this for frontend compatibility
  };
}

// Identify event by title/description for edit/delete operations - enhanced to be more flexible
function findEventByTitle(title: string, events: any[]) {
  if (!title || events.length === 0) return null;
  
  const titleLower = title.toLowerCase();
  
  // First try exact title match
  let matchedEvent = events.find(event => 
    event.title.toLowerCase() === titleLower
  );
  
  // If no exact match, try substring match
  if (!matchedEvent) {
    matchedEvent = events.find(event => 
      event.title.toLowerCase().includes(titleLower) || 
      titleLower.includes(event.title.toLowerCase())
    );
  }
  
  // If still no match, try fuzzy match using Levenshtein distance
  if (!matchedEvent) {
    const getLevenshteinDistance = (a: string, b: string) => {
      const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
      
      for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + indicator
          );
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    // Find closest match
    let bestMatch = null;
    let bestScore = Infinity;
    
    for (const event of events) {
      const distance = getLevenshteinDistance(event.title.toLowerCase(), titleLower);
      const normalizedDistance = distance / Math.max(event.title.length, titleLower.length);
      
      // Consider it a match if normalized distance is less than 0.4 (threshold)
      if (normalizedDistance < 0.4 && normalizedDistance < bestScore) {
        bestMatch = event;
        bestScore = normalizedDistance;
      }
    }
    
    matchedEvent = bestMatch;
  }
  
  return matchedEvent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Required environment variables are not set");
      return new Response(
        JSON.stringify({ 
          error: 'API key or database credentials not configured properly.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const requestData = await req.json();
    const { prompt, messages, events = [], userId } = requestData;
    
    console.log("Request received:", { 
      prompt, 
      messageCount: messages?.length, 
      eventsCount: events?.length, 
      userId 
    });

    // Determine user intent
    const actionIntent = extractActionIntent(prompt);
    console.log("Detected action intent:", actionIntent);
    
    // Handle event operations based on intent
    let operationResult = null;
    let targetEvent = null;
    let eventDetails = null;
    let conflicts = [];
    
    if (actionIntent) {
      eventDetails = extractEventDetails(prompt);
      console.log("Extracted event details:", eventDetails);
      
      if (actionIntent === 'create') {
        // Check for conflicts
        conflicts = detectConflicts(eventDetails, events);
        console.log("Detected conflicts:", conflicts.length > 0 ? conflicts.map(e => e.title) : "None");
        
        if (conflicts.length === 0) {
          // We'll create the event after the AI response
          operationResult = {
            success: true,
            action: 'create',
            details: eventDetails
          };
        }
      } else if (actionIntent === 'edit' || actionIntent === 'delete') {
        // Find the event to edit/delete
        targetEvent = findEventByTitle(eventDetails.title, events);
        console.log("Target event for edit/delete:", targetEvent ? targetEvent.title : "Not found");
        
        if (targetEvent) {
          operationResult = {
            success: true,
            action: actionIntent,
            eventId: targetEvent.id,
            details: actionIntent === 'edit' ? eventDetails : null
          };
        }
      }
    }

    // Format conversation with system message for Claude - Enhanced prompt
    const systemPrompt = `You are Mally AI, an intelligent calendar assistant in the Malleabite time management app.
You specialize in natural language calendar management through conversational interface.

CAPABILITIES:
- Create, modify, delete events in the user's calendar
- Understand natural language date/time references (today, tomorrow, next week, etc)
- Extract meeting details from unstructured text
- Resolve scheduling conflicts
- Answer questions about the user's calendar

APPROACH:
- Be conversational and efficient - users want quick responses
- Don't require specific keywords - understand intent from context
- Extract event details even from vague requests
- When time/date information is ambiguous, make reasonable assumptions
- Match user's conversational style (formal/casual)
- Today's date is ${new Date().toLocaleDateString()}
- The user has ${events.length} events in their calendar

RESPONSE GUIDELINES:
- Always confirm actions with specific details
- For event creation, acknowledge the event details you've understood
- For modifications, show old vs. new details when possible
- For deletions, confirm which event is being removed
- For conflicts, suggest alternatives or ask for guidance
- Keep responses helpful but concise

Your goal is to be the most natural and intuitive calendar assistant possible, requiring minimal effort from users to manage their schedule efficiently.`;

    // Add context about the operation result
    let aiPrompt = prompt;
    if (operationResult) {
      if (operationResult.action === 'create' && conflicts.length === 0) {
        aiPrompt += "\n\n[SYSTEM: Event details extracted successfully. No scheduling conflicts found. You can proceed with creating this event with the details I've extracted.]";
      } else if (operationResult.action === 'create' && conflicts.length > 0) {
        aiPrompt += `\n\n[SYSTEM: Found ${conflicts.length} scheduling conflicts. Suggest an alternative time or ask the user how to proceed.]`;
      } else if (operationResult.action === 'edit' && targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Event found and ready to be edited with the new details I've extracted.]";
      } else if (operationResult.action === 'delete' && targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Event found and ready to be deleted. Please confirm the action.]";
      } else if ((operationResult.action === 'edit' || operationResult.action === 'delete') && !targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Could not find the specified event. Ask the user for clarification about which event they're referring to.]";
      } else if (operationResult.action === 'query') {
        aiPrompt += "\n\n[SYSTEM: This appears to be a query about the calendar. Provide relevant information from the user's events.]";
      }
    }

    // Format messages for Claude API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current prompt as the last user message
    formattedMessages.push({
      role: 'user',
      content: prompt
    });

    console.log("Calling Anthropic API with model: claude-3-haiku-20240307");
    
    // Call Claude API with the proper format (system as a separate parameter)
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
        system: systemPrompt,
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();
    console.log("Raw API response:", responseText.substring(0, 200) + "...");
    
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

    // Process actual event operations based on the AI response and our detected intent
    const newEvents = [];
    let processedEvent = null;
    
    if (operationResult && operationResult.success) {
      if (operationResult.action === 'create' && conflicts.length === 0) {
        // Create a new event with the extracted details
        const newEvent = {
          id: crypto.randomUUID(),
          title: eventDetails.title,
          description: eventDetails.description,
          color: 'bg-purple-500/70',
          starts_at: eventDetails.starts_at,
          ends_at: eventDetails.ends_at,
          // Add these fields for frontend compatibility
          startsAt: eventDetails.starts_at,
          endsAt: eventDetails.ends_at,
          date: new Date(eventDetails.starts_at).toISOString().split('T')[0]
        };
        
        // Insert into database if possible
        if (userId) {
          try {
            console.log("Attempting to insert event into database:", newEvent);
            
            // Insert into calendar_events table
            const { data, error } = await supabase
              .from('calendar_events')
              .insert({
                title: newEvent.title,
                description: newEvent.description || newEvent.title,
                color: newEvent.color,
                user_id: userId,
                starts_at: newEvent.starts_at,
                ends_at: newEvent.ends_at,
                has_reminder: false,
                has_alarm: false,
                is_locked: false,
                is_todo: false
              })
              .select();
            
            if (error) {
              console.error("Database insert error details:", error);
              throw error;
            }
            
            // Use the newly created event with DB ID
            if (data && data[0]) {
              console.log("Successfully created event in database with ID:", data[0].id);
              processedEvent = {
                ...newEvent,
                id: data[0].id
              };
              newEvents.push(processedEvent);
            } else {
              console.log("No data returned from insert operation, using generated event");
              newEvents.push(newEvent);
            }
          } catch (error) {
            console.error("Failed to insert event into database:", error);
            // Fall back to client-side handling
            newEvents.push(newEvent);
          }
        } else {
          console.log("No user ID provided, skipping database insertion");
          newEvents.push(newEvent);
        }
      } else if (operationResult.action === 'edit' && targetEvent) {
        // Update the event
        const updatedEvent = {
          ...targetEvent,
          title: eventDetails.title,
          description: eventDetails.description,
          starts_at: eventDetails.starts_at,
          ends_at: eventDetails.ends_at,
          // Add these fields for frontend compatibility
          startsAt: eventDetails.starts_at,
          endsAt: eventDetails.ends_at,
          date: new Date(eventDetails.starts_at).toISOString().split('T')[0]
        };
        
        // Update in database if possible
        if (userId && targetEvent.id) {
          try {
            const { data, error } = await supabase
              .from('calendar_events')
              .update({
                title: updatedEvent.title,
                description: updatedEvent.description,
                starts_at: updatedEvent.starts_at,
                ends_at: updatedEvent.ends_at
              })
              .eq('id', targetEvent.id)
              .select();
            
            if (error) throw error;
            
            console.log("Successfully updated event in database");
            processedEvent = updatedEvent;
          } catch (error) {
            console.error("Failed to update event in database:", error);
          }
        } else {
          processedEvent = updatedEvent;
        }
      } else if (operationResult.action === 'delete' && targetEvent) {
        // Delete the event
        if (userId && targetEvent.id) {
          try {
            const { error } = await supabase
              .from('calendar_events')
              .delete()
              .eq('id', targetEvent.id);
            
            if (error) throw error;
            
            console.log("Successfully deleted event from database");
            processedEvent = { ...targetEvent, _action: 'delete' };
          } catch (error) {
            console.error("Failed to delete event from database:", error);
          }
        } else {
          processedEvent = { ...targetEvent, _action: 'delete' };
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        events: newEvents,
        processedEvent
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
