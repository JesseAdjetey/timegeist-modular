
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

// Extract action intent from user message
function extractActionIntent(text: string) {
  const text_lower = text.toLowerCase();
  
  if (text_lower.includes('delete') || text_lower.includes('remove') || text_lower.includes('cancel')) {
    return 'delete';
  } else if (text_lower.includes('edit') || text_lower.includes('update') || text_lower.includes('change') || text_lower.includes('reschedule')) {
    return 'edit';
  } else if (text_lower.includes('schedule') || text_lower.includes('add') || text_lower.includes('create') || text_lower.includes('new')) {
    return 'create';
  }
  
  return null;
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

// Extract event details from text
function extractEventDetails(text: string) {
  const timePattern = /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i;
  const datePattern = /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|[\d]{1,2}\/[\d]{1,2}(?:\/[\d]{2,4})?)/i;
  
  const timeMatch = text.match(timePattern);
  const dateMatch = text.match(datePattern);
  
  // Try to extract a title - this is basic and should be enhanced
  let title = '';
  
  // Look for keywords followed by possible title
  const titlePatterns = [
    /(?:schedule|add|create|new event|event for|meeting for|call with|appointment with|appointment for)\s+(?:a|an)?\s*"?([^"]*?)"?(?:\s+on|\s+at|\s+from|\s+with|\s+for|$)/i,
    /(?:schedule|add|create|new)\s+(?:a|an)?\s*"?([^"]*?)"?(?:\s+on|\s+at|\s+from|\s+with|\s+for|$)/i,
    /(?:about|regarding|titled|called|named)\s+(?:a|an)?\s*"?([^"]*?)"?(?:\s+on|\s+at|\s+from|\s+with|\s+for|$)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      title = match[1].trim();
      break;
    }
  }
  
  // If no title found via patterns, use a generic one
  if (!title) {
    title = 'New Event';
  }
  
  // Normalize time format
  let startTime = timeMatch ? timeMatch[1].trim() : '9:00';
  let endTime = timeMatch ? timeMatch[2].trim() : '10:00';

  if (timeMatch) {
    const rawStart = timeMatch[1];
    const rawEnd = timeMatch[2];

    startTime = formatTime(rawStart);

    if (rawEnd) {
      endTime = formatTime(rawEnd);
    } else {
      // If no end time is specified, add 1 hour to startTime
      const [h, m] = startTime.split(":").map(Number);
      const endHour = (h + 1) % 24;
      endTime = `${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  
  // Ensure HH:MM format for times

    
    // Handle AM/PM
    if (timeStr.toLowerCase().includes('pm') && hours < 12) {
      hours += 12;
    }
    if (timeStr.toLowerCase().includes('am') && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = formatTime(endTime);
  
  // Get the date in YYYY-MM-DD format
  const eventDate = dateMatch ? getNormalizedDate(dateMatch[0]) : getNormalizedDate('today');
  
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

// Identify event by title/description for edit/delete operations
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

    // Format conversation with system message for Claude
    const systemPrompt = `You are Mally AI, an intelligent calendar assistant in the Malleabite time management app.
Your job is to help users manage their calendar by scheduling, rescheduling, or canceling events.

IMPORTANT CAPABILITIES AND CONSTRAINTS:
- You can create, edit, and delete events in the user's calendar
- Today's date is ${new Date().toLocaleDateString()}
- The user has ${events.length} events in their calendar
- Be conversational but efficient - users want to complete tasks quickly
- NEVER claim there are scheduling conflicts unless specifically indicated
- When a user asks to schedule something, respond with confirmation with specific date/time details
- Don't ask for information they've already provided (like time, date, or event title)
- If time information is not provided, suggest a time but don't require it
- If date information is not provided, assume today or suggest a good time

Be helpful, accommodating, and make the scheduling process as simple as possible.`;

    // Add context about the operation result
    let aiPrompt = prompt;
    if (operationResult) {
      if (operationResult.action === 'create' && conflicts.length === 0) {
        aiPrompt += "\n\n[SYSTEM: No scheduling conflicts found. You can proceed with creating this event.]";
      } else if (operationResult.action === 'create' && conflicts.length > 0) {
        aiPrompt += `\n\n[SYSTEM: Found ${conflicts.length} scheduling conflicts. Suggest an alternative time or ask the user how to proceed.]`;
      } else if (operationResult.action === 'edit' && targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Event found and ready to be edited.]";
      } else if (operationResult.action === 'delete' && targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Event found and ready to be deleted.]";
      } else if ((operationResult.action === 'edit' || operationResult.action === 'delete') && !targetEvent) {
        aiPrompt += "\n\n[SYSTEM: Could not find the specified event. Ask the user for clarification.]";
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
