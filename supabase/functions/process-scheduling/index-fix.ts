import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
// Use node-fetch for Node.js environments (needed for Node.js < 18)
import fetch from 'node-fetch';

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

// Explicitly type requestData to match the expected structure
interface RequestData {
  text?: string;
  prompt?: string;
  messages?: any[];
  events?: any[];
  userId?: string;
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
      console.log("Found JSON match format in Claude response:", jsonMatch[1]);
      try {
        const data = JSON.parse(jsonMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing JSON from matched block:", parseError);
        console.error("Raw matched JSON block:", jsonMatch[1]);
        // Continue to try other formats
      }
    }
    
    // Alternative format: look for <calendar_operation>...</calendar_operation> tags
    const xmlMatch = response.match(/<calendar_operation>([\s\S]*?)<\/calendar_operation>/);
    if (xmlMatch && xmlMatch[1]) {
      console.log("Found XML-style format in Claude response:", xmlMatch[1]);
      try {
        const data = JSON.parse(xmlMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing JSON from XML-style block:", parseError);
        console.error("Raw matched XML-style block:", xmlMatch[1]);
        // Continue to try other formats
      }
    }
    
    // Look for direct JSON patterns without code block markers
    const directJsonMatch = response.match(/(\{[\s\S]*?"action"\s*:\s*"(create|edit|delete|query)"[\s\S]*?\})/);
    if (directJsonMatch && directJsonMatch[1]) {
      console.log("Found direct JSON format in Claude response:", directJsonMatch[1]);
      try {
        const data = JSON.parse(directJsonMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing direct JSON:", parseError);
        console.error("Raw matched direct JSON:", directJsonMatch[1]);
        // Continue to try other formats
      }
    }
    
    // Enhanced pattern that's more permissive with JSON formatting
    const enhancedJsonPattern = /(?:\`\`\`(?:json)?\s*)?(\{[\s\S]*?"action"\s*:\s*"(?:create|edit|delete|query)"[\s\S]*?\})(?:\s*\`\`\`)?/;
    if (enhancedJsonPattern.test(response)) {
      const match = response.match(enhancedJsonPattern);
      if (match && match[1]) {
        console.log("Found enhanced JSON pattern in Claude response:", match[1]);
        try {
          // Try to clean the JSON string before parsing
          const cleanedJson = match[1]
            .replace(/\n/g, ' ')  // Replace newlines with spaces
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/\s+/g, ' ');  // Normalize whitespace
          
          const data = JSON.parse(cleanedJson);
          return data as CalendarOperation;
        } catch (parseError) {
          console.error("Error parsing enhanced JSON pattern:", parseError);
          console.error("Raw matched enhanced JSON:", match[1]);
        }
      }
    }
    
    console.warn("No structured data format found in Claude response");
    
    // Last resort - check for a scheduling intent and extract minimal event details
    if (response.toLowerCase().includes('schedule') && response.toLowerCase().includes('event')) {
      console.log("Scheduling intent detected, creating fallback calendar operation");
      
      // Extract potential title from response
      const titleMatch = response.match(/(?:scheduled|added|created|event titled|for)\s+["']?([^"'\n.!?]+)["']?/i);
      if (titleMatch && titleMatch[1]) {
        return {
          action: 'create',
          eventDetails: {
            title: titleMatch[1].trim(),
            date: new Date().toISOString().split('T')[0],
            startTime: "09:00",
            endTime: "10:00",
            description: "Event created via Mally AI"
          }
        };
      }
    }
    
    // Log the full response to help with debugging
    console.warn("Full response for debugging:", response);
    return null;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return null;
  }
}

// Create a clean response without structured data blocks
function cleanResponse(response: string): string {
  // Remove JSON code blocks
  let cleaned = response.replace(/```json\s*(\{[\s\S]*?\})\s*```/g, '');
  
  // Remove XML-style calendar operation tags
  cleaned = cleaned.replace(/<calendar_operation>[\s\S]*?<\/calendar_operation>/g, '');
  
  // Remove any "I've scheduled this event" type messages (Claude will sometimes add these)
  cleaned = cleaned.replace(/I've (scheduled|created|added|updated|deleted|removed) (this|the|your) (event|meeting|appointment).*?\./g, '');
  
  // Remove JSON that might appear without code block markers (matching the enhanced pattern)
  cleaned = cleaned.replace(/\{[\s\S]*?"action"\s*:\s*"(create|edit|delete|query)"[\s\S]*?\}/g, '');
  
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

// Alternative format for events table (as a fallback)
function formatEventForEventsTable(eventDetails: any, userId: string): Record<string, any> {
  const date = eventDetails.date || new Date().toISOString().split('T')[0];
  const startTime = eventDetails.startTime || '09:00';
  const endTime = eventDetails.endTime || '10:00';
  
  // Create ISO timestamps
  const startsAt = new Date(`${date}T${startTime}`).toISOString();
  const endsAt = new Date(`${date}T${endTime}`).toISOString();
  
  return {
    title: eventDetails.title,
    description: eventDetails.description || eventDetails.title,
    user_id: userId,
    start_time: startsAt,  // Different field name
    end_time: endsAt,      // Different field name
    all_day: false
  };
}

// Test function to directly check database connectivity
async function testDatabaseConnection(supabase, userId) {
  console.log("RUNNING DATABASE CONNECTION TEST");
  
  // Create a simple test event
  const testEvent = {
    title: "TEST EVENT - Please Delete",
    description: "This is a test event to verify database connectivity",
    color: "bg-red-500/70",
    user_id: userId,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    has_reminder: false,
    has_alarm: false,
    is_locked: false,
    is_todo: false
  };
  
  console.log("Attempting to insert test event:", JSON.stringify(testEvent, null, 2));
  
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(testEvent)
      .select();
    
    if (error) {
      console.error("TEST DB CONNECTION ERROR:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }
    
    console.log("TEST DB CONNECTION SUCCESS:", JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (e) {
    console.error("TEST DB CONNECTION EXCEPTION:", e);
    return { success: false, error: e };
  }
}

// Diagnostic function to check database tables
async function checkDatabaseSchema(supabase) {
  console.log("CHECKING DATABASE SCHEMA");
  
  try {
    // Try to query information schema to list tables
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error("Failed to query tables:", tableError);
      
      // Alternative approach - try to access known tables
      const results: Record<string, { exists: boolean; error: string | null }> = {};
      
      // Try calendar_events
      const { data: calEventsData, error: calEventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .limit(1);
      
      results['calendar_events'] = {
        exists: !calEventsError,
        error: calEventsError ? calEventsError.message : null
      };
      
      // Try events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(1);
      
      results['events'] = {
        exists: !eventsError,
        error: eventsError ? eventsError.message : null
      };
      
      return { success: false, tables: [], directChecks: results };
    }
    
    console.log("Available tables:", tables);
    return { success: true, tables };
  } catch (e) {
    console.error("Error checking database schema:", e);
    return { success: false, error: e.message };
  }
}

// Function to check RLS policies
async function checkRLSPolicies(supabase) {
  console.log("CHECKING RLS POLICIES");
  
  try {
    console.log("Attempting to query RLS policies directly");
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .ilike('tablename', '%event%');
    
    if (policiesError) {
      console.error("Failed to query policies:", policiesError);
      return { success: false, error: policiesError.message };
    }
    
    return { success: true, policies };
  } catch (e) {
    console.error("Error checking RLS policies:", e);
    return { success: false, error: e.message };
  }
}

const server = createServer(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }
  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Debug environment variables (without revealing full secrets)
    console.log("Environment checks:", {
      hasAnthropicKey: !!ANTHROPIC_API_KEY,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseServiceKey: !!SUPABASE_SERVICE_KEY,
    });
    
    if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Required environment variables are not set");
      res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'API key or database credentials not configured properly.'
      }));
      return;
    }
    
    // Create a Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Run database schema check first
    const schemaCheckResult = await checkDatabaseSchema(supabase);
    console.log("Database schema check result:", schemaCheckResult);
    
    // Also check RLS policies
    const rlsCheckResult = await checkRLSPolicies(supabase);
    console.log("RLS policies check result:", rlsCheckResult);

    // Replace req.json() with manual JSON parsing for Node.js
    const requestData = await new Promise<RequestData>((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    
    const { text, prompt, messages = [], events = [], userId } = requestData;
    
    // Run direct database connection test if userId is available
    if (userId) {
      const testResult = await testDatabaseConnection(supabase, userId);
      console.log("Database connection test result:", testResult.success ? "SUCCESS" : "FAILED");
    } else {
      console.log("Skipping database connection test - no userId provided");
    }
    
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
4. For database operations, output a JSON object with this EXACT structure:

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

CRITICAL: The JSON block above MUST be included in your response for any calendar operation.
Make sure the JSON is properly formatted and enclosed in the code block with \`\`\`json at the start and \`\`\` at the end.
Do not modify the format - follow the exact structure shown. This is required for the system to process your response correctly.

This structured JSON will ONLY be used for database operations and won't be shown to the user.
You must still provide a natural conversational response separately from this structured data.

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
    
    // Prepare the request body
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: formattedMessages,
      system: systemPrompt,
      temperature: 0.7,
    };
    
    console.log("Anthropic API request details:", {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        hasApiKey: !!ANTHROPIC_API_KEY,
        anthropicVersion: '2023-06-01',
        contentType: 'application/json'
      },
      bodyLength: JSON.stringify(requestBody).length
    });
    
    // Call Claude API with the proper format
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    console.log("FULL RAW AI RESPONSE:", JSON.stringify(aiResponse));
    
    // Extract structured data about the calendar operation from Claude's response
    let calendarOperation = extractStructuredData(aiResponse);
    console.log("Extracted calendar operation:", JSON.stringify(calendarOperation, null, 2));
    
    // Create a clean version of the response for the user (without JSON data)
    const cleanedResponse = cleanResponse(aiResponse);
    
    // Initialize variables for operation results
    let operationResult: { success: boolean; action: string; event?: any; conflicts?: any[]; error?: string } | null = null;
    let processedEvent: { id: string; title: string; description: string; startsAt: string; endsAt: string; date: string; color: string } | null = null;
    
    // Process the calendar operation from Claude
    if (calendarOperation) {
      const { action, eventDetails, targetEventId } = calendarOperation;
      
      console.log("Processing calendar operation. Action:", action, "Has event details:", !!eventDetails, "Has userId:", !!userId);
      
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
            console.log("Attempting to insert event into database:", JSON.stringify(dbEvent, null, 2));
            console.log("Supabase client config:", {
              url: SUPABASE_URL,
              hasServiceKey: !!SUPABASE_SERVICE_KEY,
              hasUserId: !!userId
            });
            
            // Add more detailed debugging for the insert operation
            try {
              const { data, error } = await supabase
                .from('calendar_events')
                .insert(dbEvent)
                .select();
              
              console.log("Insert operation completed");
              console.log("Response data:", data);
              
              if (error) {
                console.error("Database insert error details:", JSON.stringify(error, null, 2));
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
                console.error("Error details:", error.details);
                
                // If the first attempt failed, try the fallback table
                console.log("Trying fallback insertion into events table");
                const fallbackEvent = formatEventForEventsTable(eventDetails, userId);
                
                const fallbackResult = await supabase
                  .from('events')
                  .insert(fallbackEvent)
                  .select();
                
                if (fallbackResult.error) {
                  console.error("Fallback insert also failed:", fallbackResult.error);
                  throw error; // Throw the original error
                }
                
                // Fallback succeeded
                console.log("Fallback insert succeeded:", fallbackResult.data);
                
                if (fallbackResult.data && fallbackResult.data[0]) {
                  processedEvent = {
                    id: fallbackResult.data[0].id,
                    title: fallbackResult.data[0].title,
                    description: fallbackResult.data[0].description || '',
                    startsAt: fallbackResult.data[0].start_time,
                    endsAt: fallbackResult.data[0].end_time,
                    date: new Date(fallbackResult.data[0].start_time).toISOString().split('T')[0],
                    color: 'bg-blue-500/70'
                  };
                  
                  operationResult = {
                    success: true,
                    action: 'create',
                    event: processedEvent
                  };
                }
              } else {
                // Original insert succeeded
                if (data && data[0]) {
                  console.log("Successfully created event in database with ID:", data[0].id);
                  
                  processedEvent = {
                    id: data[0].id,
                    title: data[0].title,
                    description: data[0].description,
                    startsAt: data[0].starts_at,
                    endsAt: data[0].ends_at,
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
            } catch (insertError) {
              console.error("Exception during insert operation:", insertError);
              console.error("Stack trace:", insertError.stack);
              throw insertError;
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
              startsAt: data[0].starts_at,
              endsAt: data[0].ends_at,
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
              event: { id: targetEventId }
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
    } else {
      // No calendar operation was found in Claude's response
      console.warn("No calendar operation found in Claude response. This might indicate a parsing issue or that Claude didn't output the expected JSON structure.");
      
      // Check if the message indicates a scheduling intent
      if (aiResponse.toLowerCase().includes('schedule') && aiResponse.toLowerCase().includes('event')) {
        console.log("Creating fallback calendar operation from scheduling intent");
        
        // Try to extract a title from the response
        const titleMatch = aiResponse.match(/(?:scheduled|added|created|event titled|for)\s+["']?([^"'\n.!?]+)["']?/i);
        const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "New Event";
        
        // Create a minimal event
        const eventDetails = {
          title: title,
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00", 
          endTime: "10:00",
          description: "Event created via Mally AI"
        };
        
        // Try to create this event if we have a user ID
        if (userId) {
          try {
            console.log("Creating fallback event:", eventDetails);
            
            // Format for database and insert
            const dbEvent = formatEventForDatabase(eventDetails, userId);
            const { data, error } = await supabase
              .from('calendar_events')
              .insert(dbEvent)
              .select();
            
            if (error) {
              console.error("Error creating fallback event:", error);
            } else if (data && data[0]) {
              console.log("Successfully created fallback event:", data[0]);
              
              processedEvent = {
                id: data[0].id,
                title: data[0].title,
                description: data[0].description,
                startsAt: data[0].starts_at,
                endsAt: data[0].ends_at,
                date: new Date(data[0].starts_at).toISOString().split('T')[0],
                color: data[0].color || 'bg-purple-500/70'
              };
              
              operationResult = {
                success: true,
                action: 'create',
                event: processedEvent
              };
            }
          } catch (error) {
            console.error("Error creating fallback event:", error);
          }
        }
      }
      
      // If we still don't have an operationResult, create a default one
      if (!operationResult) {
        operationResult = {
          success: true,
          action: 'query',
          error: 'Could not determine calendar operation from AI response'
        };
      }
    }
    
    // Ensure we always have an operation result even if processing failed
    if (!operationResult) {
      console.warn("No operation result was created. Using fallback operation result.");
      operationResult = {
        success: true,
        action: 'query'
      };
    }
    
    // Return the final response to the frontend
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    
    const responsePayload = { 
      response: cleanedResponse, 
      action: calendarOperation?.action || operationResult?.action,
      event: processedEvent,
      operationResult
    };
    
    console.log("Sending final response to frontend:", JSON.stringify(responsePayload, null, 2));
    
    res.end(JSON.stringify(responsePayload));
  } catch (error) {
    console.error('Error processing scheduling request:', error);
    // Log the full error object for debugging
    console.error('Detailed error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: error.message,
      details: "See function logs for more information" 
    }));
  }
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
