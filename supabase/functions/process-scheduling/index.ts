// supabase/functions/process-scheduling/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for structured calendar operation data from Claude
interface CalendarOperation {
  action: 'create' | 'edit' | 'delete' | 'query';
  eventDetails?: {
    title: string;
    date?: string;          // YYYY-MM-DD format
    startTime?: string;     // HH:MM format
    endTime?: string;       // HH:MM format
    description?: string;
  };
  targetEventId?: string;   // For edit/delete operations
}

// Check for conflicts between events (kept for backward compatibility)
function detectConflicts(proposedEvent: any, existingEvents: any[]) {
  if (!proposedEvent || !proposedEvent.starts_at || !proposedEvent.ends_at) {
    return [];
  }
  
  // Filter to only check events on the same day
  const eventDate = new Date(proposedEvent.starts_at).toISOString().split('T')[0];
  const sameDay = existingEvents.filter(event => {
    if (!event || !event.starts_at) return false;
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
    if (!event.starts_at || !event.ends_at) return false;
    
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

// Find an event by ID in the events array
function findEventById(eventId: string, events: any[]) {
  return events.find(event => event.id === eventId);
}

// Extract structured data that might be embedded in Claude's response
function extractStructuredData(response: string): CalendarOperation | null {
  try {
    // Look for JSON block in the response
    const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const data = JSON.parse(jsonMatch[1]);
      return data as CalendarOperation;
    }
    
    // Alternative format: look for <calendar_operation>...</calendar_operation> tags
    const xmlMatch = response.match(/<calendar_operation>([\s\S]*?)<\/calendar_operation>/);
    if (xmlMatch && xmlMatch[1]) {
      const data = JSON.parse(xmlMatch[1]);
      return data as CalendarOperation;
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return null;
  }
}

// Create a clean response without structured data blocks
function cleanResponse(response: string): string {
  // Remove JSON blocks
  let cleaned = response.replace(/```json\s*(\{[\s\S]*?\})\s*```/g, '');
  
  // Remove XML-style calendar operation tags
  cleaned = cleaned.replace(/<calendar_operation>[\s\S]*?<\/calendar_operation>/g, '');
  
  // Remove any "I've scheduled this event" type messages (Claude will sometimes add these)
  cleaned = cleaned.replace(/I've (scheduled|created|added|updated|deleted|removed) (this|the|your) (event|meeting|appointment).*?\./g, '');
  
  // Clean up double spacing that might result from removals
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned.trim();
}

// Convert calendar operation to database format
function formatEventForDatabase(eventDetails: any, userId: string): Record<string, any> {
  const date = eventDetails.date || new Date().toISOString().split('T')[0];
  const startTime = eventDetails.startTime || '09:00';
  const endTime = eventDetails.endTime || '10:00';
  
  // Create ISO timestamps
  const startsAt = new Date(`${date}T${startTime}`).toISOString();
  const endsAt = new Date(`${date}T${endTime}`).toISOString();
  
  return {
    title: eventDetails.title,
    description: eventDetails.description || eventDetails.title,
    color: eventDetails.color || 'bg-purple-500/70',
    user_id: userId,
    starts_at: startsAt,
    ends_at: endsAt,
    has_reminder: false,
    has_alarm: false,
    is_locked: false,
    is_todo: false
  };
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
    const { text, prompt, messages = [], events = [], userId } = requestData;
    
    // Use text or prompt as the user input (for flexibility)
    const userInput = text || prompt;
    
    console.log("Request received:", { 
      userInput: userInput?.substring(0, 100), 
      messageCount: messages?.length, 
      eventsCount: events?.length, 
      userId 
    });

    // Get today's date in readable format
    const todayDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Format events for Claude context
    const formattedEvents = events.map(event => {
      const startDate = new Date(event.starts_at);
      const endDate = new Date(event.ends_at);
      
      return {
        id: event.id,
        title: event.title,
        date: startDate.toISOString().split('T')[0],
        day: startDate.toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        endTime: endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        description: event.description
      };
    });

    // Format conversation with system message for Claude
    const systemPrompt = `You are Mally AI, an intelligent calendar assistant in the Malleabite time management app.
Your job is to help users manage their calendar by scheduling, rescheduling, or canceling events.

IMPORTANT CAPABILITIES AND CONSTRAINTS:
- You can create, edit, and delete events in the user's calendar
- Today's date is ${todayDate}
- The user has ${events.length} events in their calendar
- Be conversational but efficient - users want to complete tasks quickly
- When a user asks to schedule something, respond with confirmation with specific date/time details
- If time information is not provided, suggest a time but don't require it
- If date information is not provided, assume today or suggest a good time

When processing calendar operations, you MUST:
1. Identify the appropriate action (create/edit/delete/query)
2. Extract all relevant details (title, date, time, etc.)
3. Respond in a helpful, conversational way
4. For database operations, output a JSON object with this structure:

\`\`\`json
{
  "action": "create|edit|delete|query",
  "eventDetails": {
    "title": "Event title",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "description": "Optional description"
  },
  "targetEventId": "ID of existing event for edit/delete operations"
}
\`\`\`

This structured JSON will ONLY be used for database operations and won't be shown to the user.
The JSON block must be included in your response for any calendar operation, but you must still
provide a natural conversational response separately from this structured data.

USER'S CURRENT EVENTS:
${formattedEvents.length > 0 ? JSON.stringify(formattedEvents, null, 2) : "No events currently scheduled"}

Be helpful, accommodating, and make the scheduling process as simple as possible.`;

    // Format messages for Claude API (previous messages and current prompt)
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current prompt as the last user message
    formattedMessages.push({
      role: 'user',
      content: userInput
    });

    console.log("Calling Anthropic API with model: claude-3-haiku-20240307");
    
    // Call Claude API with the proper format
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
    
    // Extract structured data about the calendar operation from Claude's response
    const calendarOperation = extractStructuredData(aiResponse);
    
    console.log("Extracted calendar operation:", calendarOperation);
    
    // Create a clean version of the response for the user (without JSON data)
    const cleanedResponse = cleanResponse(aiResponse);
    
    // Initialize variables for operation results
    let operationResult = null;
    let processedEvent = null;
    
    // Process the calendar operation from Claude
    if (calendarOperation) {
      const { action, eventDetails, targetEventId } = calendarOperation;
      
      if (action === 'create' && eventDetails && userId) {
        try {
          console.log("Creating new event:", eventDetails);
          
          // Format event for database
          const dbEvent = formatEventForDatabase(eventDetails, userId);
          
          // Check for conflicts first
          const conflicts = detectConflicts(dbEvent, events);
          if (conflicts.length > 0) {
            console.log("Conflicts detected:", conflicts.map(e => e.title));
            operationResult = {
              success: false,
              action: 'create',
              conflicts: conflicts.map(e => ({
                title: e.title,
                startTime: new Date(e.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                endTime: new Date(e.ends_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              }))
            };
          } else {
            // Insert into calendar_events table
            const { data, error } = await supabase
              .from('calendar_events')
              .insert(dbEvent)
              .select();
            
            if (error) {
              console.error("Database insert error details:", error);
              throw error;
            }
            
            // Return the newly created event
            if (data && data[0]) {
              console.log("Successfully created event in database with ID:", data[0].id);
              
              processedEvent = {
                id: data[0].id,
                title: data[0].title,
                description: data[0].description,
                startsAt: data[0].starts_at,  // Frontend compatibility
                endsAt: data[0].ends_at,      // Frontend compatibility
                date: new Date(data[0].starts_at).toISOString().split('T')[0],
                color: data[0].color || 'bg-purple-500/70'
              };
              
              operationResult = {
                success: true,
                action: 'create',
                event: processedEvent
              };
            }
          }
        } catch (error) {
          console.error("Error creating event:", error);
          operationResult = {
            success: false,
            action: 'create',
            error: error.message
          };
        }
      } else if (action === 'edit' && targetEventId && eventDetails && userId) {
        try {
          console.log("Editing event:", targetEventId, eventDetails);
          
          // Find the target event
          const targetEvent = findEventById(targetEventId, events);
          if (!targetEvent) {
            throw new Error(`Event with ID ${targetEventId} not found`);
          }
          
          // Format update data
          const updatedFields: Record<string, any> = {};
          
          if (eventDetails.title) updatedFields.title = eventDetails.title;
          if (eventDetails.description) updatedFields.description = eventDetails.description;
          
          // Update time fields if provided
          if (eventDetails.date || eventDetails.startTime || eventDetails.endTime) {
            const currentStartDate = new Date(targetEvent.starts_at);
            const currentEndDate = new Date(targetEvent.ends_at);
            
            const newDate = eventDetails.date || currentStartDate.toISOString().split('T')[0];
            
            let newStartTime = eventDetails.startTime;
            let newEndTime = eventDetails.endTime;
            
            if (!newStartTime) {
              // Keep current start time if not provided
              newStartTime = currentStartDate.getHours().toString().padStart(2, '0') + ':' +
                             currentStartDate.getMinutes().toString().padStart(2, '0');
            }
            
            if (!newEndTime) {
              // Keep current end time if not provided
              newEndTime = currentEndDate.getHours().toString().padStart(2, '0') + ':' +
                           currentEndDate.getMinutes().toString().padStart(2, '0');
            }
            
            // Create ISO timestamps
            updatedFields.starts_at = new Date(`${newDate}T${newStartTime}`).toISOString();
            updatedFields.ends_at = new Date(`${newDate}T${newEndTime}`).toISOString();
          }
          
          // Update in database
          const { data, error } = await supabase
            .from('calendar_events')
            .update(updatedFields)
            .eq('id', targetEventId)
            .eq('user_id', userId)
            .select();
          
          if (error) {
            console.error("Database update error details:", error);
            throw error;
          }
          
          if (data && data[0]) {
            console.log("Successfully updated event in database:", data[0]);
            
            processedEvent = {
              id: data[0].id,
              title: data[0].title,
              description: data[0].description,
              startsAt: data[0].starts_at,  // Frontend compatibility
              endsAt: data[0].ends_at,      // Frontend compatibility
              date: new Date(data[0].starts_at).toISOString().split('T')[0],
              color: data[0].color || 'bg-purple-500/70'
            };
            
            operationResult = {
              success: true,
              action: 'edit',
              event: processedEvent
            };
          }
        } catch (error) {
          console.error("Error updating event:", error);
          operationResult = {
            success: false,
            action: 'edit',
            error: error.message
          };
        }
      } else if (action === 'delete' && targetEventId && userId) {
        try {
          console.log("Deleting event:", targetEventId);
          
          // Find the target event first for return data
          const targetEvent = findEventById(targetEventId, events);
          
          // Delete from database
          const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', targetEventId)
            .eq('user_id', userId);
          
          if (error) {
            console.error("Database delete error details:", error);
            throw error;
          }
          
          console.log("Successfully deleted event from database");
          
          if (targetEvent) {
            processedEvent = { 
              ...targetEvent, 
              _action: 'delete' 
            };
            
            operationResult = {
              success: true,
              action: 'delete',
              event: processedEvent
            };
          } else {
            operationResult = {
              success: true,
              action: 'delete',
              eventId: targetEventId
            };
          }
        } catch (error) {
          console.error("Error deleting event:", error);
          operationResult = {
            success: false,
            action: 'delete',
            error: error.message
          };
        }
      } else if (action === 'query') {
        // For query actions, we just provide the response with no database operations
        operationResult = {
          success: true,
          action: 'query'
        };
      }
    }
    
    // Return the final response to the frontend
    return new Response(
      JSON.stringify({ 
        response: cleanedResponse, 
        action: calendarOperation?.action,
        event: processedEvent,
        operationResult
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