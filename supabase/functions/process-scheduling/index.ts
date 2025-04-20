// src/supabase/functions/process-scheduling/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc'
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone'
import weekday from 'https://esm.sh/dayjs@1.11.10/plugin/weekday'
import isBetween from 'https://esm.sh/dayjs@1.11.10/plugin/isBetween'
import duration from 'https://esm.sh/dayjs@1.11.10/plugin/duration'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekday)
dayjs.extend(isBetween)
dayjs.extend(duration)

// Initialize environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Type definitions for calendar events
interface CalendarEvent {
  id: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  color?: string
  is_locked?: boolean
  is_todo?: boolean
  has_alarm?: boolean
  has_reminder?: boolean
  todo_id?: string
  user_id: string
}

interface EventRequest {
  title: string
  startsAt: string
  endsAt: string
  description?: string
  color?: string
  isLocked?: boolean
  isTodo?: boolean
  hasAlarm?: boolean
  hasReminder?: boolean
  todoId?: string
}

interface Message {
  role: string
  content: string
}

// LLM prompt for Mally AI
const SYSTEM_PROMPT = `
You are MallyAI, an intelligent and helpful calendar assistant embedded within a time management application. Your purpose is to help users schedule, modify, and manage their calendar events efficiently through natural language. You should aim to understand complex scheduling requirements, detect conflicts, and suggest optimal scheduling options.

## Core Capabilities

1. **Event Creation**: Schedule new events based on user requests.
2. **Event Modification**: Edit existing events' details like time, date, or title.
3. **Event Deletion**: Remove events from the calendar.
4. **Conflict Detection**: Identify and alert users about scheduling conflicts.
5. **Recurring Events**: Set up repeating events based on patterns.
6. **Natural Conversation**: Engage in fluid dialog to clarify event details.
7. **Intelligent Suggestions**: Offer optimized scheduling based on calendar analysis.

## Input Context

You have access to the following information:
- The user's current calendar events (provided in the request)
- The conversation history with the user
- The current request text

## Response Format

Your responses should be concise, helpful, and actionable. For event operations, output a JSON structure with:

- **action**: The operation to perform (create, update, delete, suggest, etc.)
- **event**: Event details (when creating or updating)
- **response**: Your natural language response to the user
- **conflicts**: Any detected scheduling conflicts (when relevant)

## Guidelines for Processing

1. **Extract Event Details**: Parse the user's request for event title, date, time, duration, and frequency.

2. **Resolve Ambiguities**: If the request lacks essential details (time, date, title):
   - For missing times: Suggest reasonable default times based on event type.
   - For missing dates: Default to today or the next appropriate day.
   - For missing titles: Generate a descriptive title based on the context.

3. **Handle Time Formats**:
   - Convert 12-hour format (3pm) to 24-hour format (15:00)
   - Handle time ranges ("from 2 to 3pm")
   - Default duration to 1 hour if only start time is provided

4. **Default Event Duration**:
   - Meetings/calls: 30-60 minutes
   - Appointments: 1 hour
   - Workouts/gym: 1-2 hours
   - Use event context to determine appropriate duration

5. **Detect Conflicts**:
   - Check if the proposed time overlaps with existing events
   - Suggest alternative times when conflicts are found
   - Consider event priority when suggesting resolutions

6. **Handle Recurring Events**:
   - Parse frequency terms ("daily", "weekly", "monthly")
   - Handle specific days ("every Monday and Wednesday")
   - Set appropriate end dates for recurring series

7. **Natural Response Generation**:
   - Confirm the added event with specific details
   - Highlight any assumptions made about missing information
   - Offer options for modification when appropriate

8. **Process Modifications**:
   - Match event references to existing calendar events
   - Allow partial updates (just time or just date)
   - Confirm changes clearly in responses

## Function Reference

Your responses will be processed by the application to perform various calendar operations. Reference these operations in your 'action' field:

- 'create': Add a new event to the calendar
- 'update': Modify an existing event
- 'delete': Remove an event from the calendar
- 'suggest': Offer scheduling options without immediate action
- 'list': Show events within a timeframe
- 'clarify': Request more information from the user
- 'conflict': Alert the user about scheduling conflicts

## Important Considerations

1. **Privacy & Security**: Never refer to specific dates and times outside the user's request or their calendar data.

2. **Default Assumptions**: When information is missing, make reasonable assumptions but clearly communicate them to the user.

3. **Clarity**: Always confirm the specific date and time in your responses to avoid misunderstandings.

4. **Helpfulness**: Provide suggestions and alternatives when appropriate to save the user time.

5. **Efficiency**: Keep responses concise while ensuring all necessary information is conveyed.

Remember, your goal is to make calendar management effortless through natural conversation while maintaining accuracy and reliability.

Today's date is ${dayjs().format('YYYY-MM-DD')}, and the current time is ${dayjs().format('HH:mm')}.
`

// Generic error handler with logging
function handleError(error: unknown): string {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  return error instanceof Error ? error.message : String(error)
}

// Check for event conflicts
function detectConflicts(
  event: { startsAt: string, endsAt: string },
  existingEvents: CalendarEvent[]
): CalendarEvent[] {
  const startTime = dayjs(event.startsAt)
  const endTime = dayjs(event.endsAt)
  
  return existingEvents.filter(existingEvent => {
    const eventStart = dayjs(existingEvent.starts_at)
    const eventEnd = dayjs(existingEvent.ends_at)
    
    // Check if the new event overlaps with existing event
    return (
      (startTime.isBetween(eventStart, eventEnd, null, '[)') || 
       endTime.isBetween(eventStart, eventEnd, null, '(]') ||
       (startTime.isSameOrBefore(eventStart) && endTime.isSameOrAfter(eventEnd)))
    )
  })
}

// Find available time slots for suggestions
function findAvailableTimeSlots(
  date: string,
  existingEvents: CalendarEvent[],
  duration: number = 60, // minutes
  startHour: number = 9,
  endHour: number = 17
): { start: string, end: string }[] {
  const slots: { start: string, end: string }[] = []
  const dayStart = dayjs(`${date}T${startHour.toString().padStart(2, '0')}:00`)
  const dayEnd = dayjs(`${date}T${endHour.toString().padStart(2, '0')}:00`)
  
  // Sort events by start time
  const sortedEvents = existingEvents.filter(event => {
    const eventDate = dayjs(event.starts_at).format('YYYY-MM-DD')
    return eventDate === date
  }).sort((a, b) => {
    return dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf()
  })
  
  let currentTime = dayStart
  
  // Check each potential slot
  for (let i = 0; i <= sortedEvents.length; i++) {
    const nextEventStart = i < sortedEvents.length 
      ? dayjs(sortedEvents[i].starts_at) 
      : dayEnd
    
    const availableDuration = nextEventStart.diff(currentTime, 'minute')
    
    if (availableDuration >= duration) {
      slots.push({
        start: currentTime.toISOString(),
        end: currentTime.add(duration, 'minute').toISOString()
      })
    }
    
    if (i < sortedEvents.length) {
      currentTime = dayjs(sortedEvents[i].ends_at)
    }
  }
  
  return slots
}

// Process recurring events by creating multiple events
async function processRecurringEvent(
  baseEvent: Omit<CalendarEvent, 'id'>,
  pattern: {
    frequency: 'daily' | 'weekly' | 'monthly'
    daysOfWeek?: number[]
    interval?: number
    until: string
  },
  userId: string
): Promise<{ success: boolean, eventIds?: string[], error?: string }> {
  try {
    const eventIds: string[] = []
    const startDate = dayjs(baseEvent.starts_at)
    const endDate = dayjs(pattern.until)
    const duration = dayjs(baseEvent.ends_at).diff(startDate, 'minute')
    
    let currentDate = startDate
    const interval = pattern.interval || 1
    
    while (currentDate.isSameOrBefore(endDate)) {
      // For weekly recurrence, check if current day is in daysOfWeek
      if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
        const dayOfWeek = currentDate.day() // 0 is Sunday, 6 is Saturday
        if (!pattern.daysOfWeek.includes(dayOfWeek)) {
          // If current day is not in daysOfWeek, skip to next day
          currentDate = currentDate.add(1, 'day')
          continue
        }
      }
      
      // Create event at current date
      const eventStart = currentDate
      const eventEnd = currentDate.add(duration, 'minute')
      
      // Check for conflicts
      const dailyEvents = await getEventsForDay(
        userId,
        currentDate.format('YYYY-MM-DD')
      )
      
      const conflicts = detectConflicts(
        { startsAt: eventStart.toISOString(), endsAt: eventEnd.toISOString() },
        dailyEvents
      )
      
      // Skip if conflicts exist
      if (conflicts.length === 0) {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            ...baseEvent,
            starts_at: eventStart.toISOString(),
            ends_at: eventEnd.toISOString(),
            user_id: userId
          })
          .select()
          
        if (error) {
          console.error(`Error creating recurring event: ${error.message}`)
        } else if (data && data[0]) {
          eventIds.push(data[0].id)
        }
      }
      
      // Advance to next occurrence based on frequency
      switch (pattern.frequency) {
        case 'daily':
          currentDate = currentDate.add(interval, 'day')
          break
        case 'weekly':
          if (pattern.daysOfWeek) {
            // If using daysOfWeek, just advance to next day
            currentDate = currentDate.add(1, 'day')
          } else {
            // Otherwise advance by weeks
            currentDate = currentDate.add(interval, 'week')
          }
          break
        case 'monthly':
          currentDate = currentDate.add(interval, 'month')
          break
      }
    }
    
    return { success: true, eventIds }
  } catch (error) {
    return { success: false, error: handleError(error) }
  }
}

// Get events for a specific day
async function getEventsForDay(
  userId: string,
  date: string
): Promise<CalendarEvent[]> {
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('starts_at', startOfDay)
    .lte('starts_at', endOfDay)
    
  if (error) {
    console.error(`Error fetching events: ${error.message}`)
    return []
  }
  
  return data || []
}

// Get events for a date range
async function getEventsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('starts_at', `${startDate}T00:00:00`)
    .lte('starts_at', `${endDate}T23:59:59`)
    
  if (error) {
    console.error(`Error fetching events: ${error.message}`)
    return []
  }
  
  return data || []
}

// Find events by title or description (fuzzy search)
async function findEventsByTitle(
  userId: string,
  searchTerm: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .ilike('title', `%${searchTerm}%`)
    
  if (error) {
    console.error(`Error searching events: ${error.message}`)
    return []
  }
  
  return data || []
}

// Create a calendar event
async function createCalendarEvent(
  userId: string,
  event: EventRequest
): Promise<{ success: boolean, data?: any, error?: string }> {
  try {
    // Format for database
    const eventData = {
      title: event.title,
      description: event.description || '',
      starts_at: event.startsAt,
      ends_at: event.endsAt,
      color: event.color || 'bg-purple-500/70',
      is_locked: event.isLocked || false,
      is_todo: event.isTodo || false,
      has_alarm: event.hasAlarm || false,
      has_reminder: event.hasReminder || false,
      todo_id: event.todoId || null,
      user_id: userId
    }
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(eventData)
      .select()
      
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: handleError(error) }
  }
}

// Update a calendar event
async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: Partial<EventRequest>
): Promise<{ success: boolean, data?: any, error?: string }> {
  try {
    // Convert from client format to database format
    const eventUpdates: Partial<CalendarEvent> = {}
    
    if (updates.title) eventUpdates.title = updates.title
    if (updates.description) eventUpdates.description = updates.description
    if (updates.startsAt) eventUpdates.starts_at = updates.startsAt
    if (updates.endsAt) eventUpdates.ends_at = updates.endsAt
    if (updates.color) eventUpdates.color = updates.color
    if (updates.isLocked !== undefined) eventUpdates.is_locked = updates.isLocked
    if (updates.isTodo !== undefined) eventUpdates.is_todo = updates.isTodo
    if (updates.hasAlarm !== undefined) eventUpdates.has_alarm = updates.hasAlarm
    if (updates.hasReminder !== undefined) eventUpdates.has_reminder = updates.hasReminder
    if (updates.todoId !== undefined) eventUpdates.todo_id = updates.todoId
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventUpdates)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: handleError(error) }
  }
}

// Delete a calendar event
async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<{ success: boolean, error?: string }> {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId)
      
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: handleError(error) }
  }
}

// Process user request with the LLM
async function processWithLLM(
  userId: string,
  userMessage: string,
  previousMessages: Message[],
  events: CalendarEvent[]
): Promise<{ response: string, action?: string, event?: any, events?: any[], processedEvent?: any, error?: string }> {
  try {
    // Format events for the LLM in a more readable way
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      description: event.description
    }))
    
    // Format message context
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...previousMessages,
      { 
        role: 'user', 
        content: userMessage + '\n\nMy current calendar:\n' +
          JSON.stringify(formattedEvents.slice(0, 20), null, 2)
      }
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const result = await response.json()
    const aiResponse = result.choices[0].message.content
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse)
      
      // Extract components based on action type
      const action = parsedResponse.action
      const responseText = parsedResponse.response || "I've processed your request."

      // Process different action types
      let processedData: any = { response: responseText, action }
      
      if (action === 'create' && parsedResponse.event) {
        // Create a new event
        processedData.event = parsedResponse.event
      } 
      else if (action === 'update' && parsedResponse.eventId && parsedResponse.updates) {
        // Update an existing event
        processedData.processedEvent = {
          id: parsedResponse.eventId,
          ...parsedResponse.updates,
          _action: 'update'
        }
      }
      else if (action === 'delete' && parsedResponse.eventId) {
        // Delete an event
        processedData.processedEvent = {
          id: parsedResponse.eventId,
          _action: 'delete'
        }
      }
      else if (action === 'suggest' && parsedResponse.events) {
        // Suggest multiple events (e.g., recurring patterns)
        processedData.events = Array.isArray(parsedResponse.events) 
          ? parsedResponse.events 
          : [parsedResponse.events]
      }
      else if (action === 'conflict' && parsedResponse.conflicts) {
        // Handle conflict detection
        processedData.conflicts = parsedResponse.conflicts
        processedData.suggestions = parsedResponse.suggestions
      }
      
      return processedData
    } catch (error) {
      console.error(`Error parsing LLM response: ${error}`)
      return { 
        response: "I encountered an issue processing your request. Could you please try rephrasing it?",
        error: `Failed to parse response: ${error}`
      }
    }
  } catch (error) {
    console.error(`Error calling LLM: ${error}`)
    return { 
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      error: handleError(error)
    }
  }
}

// Main serve function
serve(async (req) => {
  console.log("Edge function called with method:", req.method);
  
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the request body
    const body = await req.json();
    console.log("Received request body:", JSON.stringify(body).substring(0, 200) + "...");
    
    const { text, userId, messages: previousMessages = [], events: providedEvents = [] } = body;

    if (!text) {
      console.log("Missing text field in request");
      return new Response(
        JSON.stringify({
          error: 'Missing required field: text',
          response: "I need some text to process. Could you try asking me something?"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!userId) {
      console.log("Missing userId field in request");
      return new Response(
        JSON.stringify({
          error: 'Missing required field: userId',
          response: "I need to know which user's calendar to manage."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Format previous messages
    const formattedMessages = previousMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Get user's calendar events if not provided
    let events: CalendarEvent[] = [];
    
    if (providedEvents && providedEvents.length > 0) {
      events = providedEvents;
    } else {
      // Get the next 7 days of events for context
      const startDate = dayjs().format('YYYY-MM-DD');
      const endDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
      events = await getEventsInRange(userId, startDate, endDate);
    }

    console.log(`Processing text: "${text}" for user ${userId} with ${events.length} calendar events`);
    
    // Process the request
    const result = await processSchedulingRequest(userId, text, formattedMessages, events);
    console.log("Processing result:", JSON.stringify(result).substring(0, 200) + "...");

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing scheduling request:', error);
    
    return new Response(
      JSON.stringify({
        error: `Server error: ${handleError(error)}`,
        response: "I encountered an error processing your request. Please try again."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

// Process the scheduling request
async function processSchedulingRequest(
  userId: string,
  text: string,
  messages: Message[],
  events: CalendarEvent[]
): Promise<any> {
  try {
    // Use LLM to understand the request and generate a response
    const processedRequest = await processWithLLM(userId, text, messages, events)
    
    // Handle different actions based on the LLM response
    if (processedRequest.action === 'create' && processedRequest.event) {
      // Create a new event
      const event = processedRequest.event
      const result = await createCalendarEvent(userId, event)
      
      if (!result.success) {
        return {
          response: `I had trouble creating your event: ${result.error}`,
          error: result.error
        }
      }
      
      // Return the created event along with the response
      return {
        response: processedRequest.response,
        event: event,
        data: result.data
      }
    }
    
    if (processedRequest.action === 'update' && processedRequest.processedEvent) {
      // Update an existing event
      const eventData = processedRequest.processedEvent
      const result = await updateCalendarEvent(userId, eventData.id, eventData)
      
      if (!result.success) {
        return {
          response: `I had trouble updating the event: ${result.error}`,
          error: result.error
        }
      }
      
      return {
        response: processedRequest.response,
        processedEvent: eventData
      }
    }
    
    if (processedRequest.action === 'delete' && processedRequest.processedEvent) {
      // Delete an event
      const eventData = processedRequest.processedEvent
      const result = await deleteCalendarEvent(userId, eventData.id)
      
      if (!result.success) {
        return {
          response: `I had trouble deleting the event: ${result.error}`,
          error: result.error
        }
      }
      
      return {
        response: processedRequest.response,
        processedEvent: eventData
      }
    }
    
    if (processedRequest.action === 'suggest' && processedRequest.events) {
      // For suggestions, just return the suggested events without creating them yet
      return {
        response: processedRequest.response,
        events: processedRequest.events
      }
    }
    
    // Default: just return the response for clarification, conflict, etc.
    return {
      response: processedRequest.response,
      action: processedRequest.action
    }
  } catch (error) {
    console.error(`Error processing scheduling request: ${error}`)
    return {
      response: "I encountered an unexpected error. Please try again with a simpler request.",
      error: handleError(error)
    }
  }
}