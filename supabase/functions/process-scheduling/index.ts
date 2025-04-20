
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc'
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// Initialize environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const anthropicApiKey = "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" 

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to format time strings consistently
const formatTime = (timeStr: string): string => {
  // Default pattern for extracting hours and minutes
  const timePattern = /(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?/i;
  const match = timeStr.match(timePattern);
  
  if (!match) return '09:00'; // Default to 9 AM if no match
  
  let hours = parseInt(match[1]);
  let minutes = match[2] ? parseInt(match[2]) : 0;
  
  // Handle hours validation
  if (isNaN(hours) || hours < 0 || hours > 23) {
    hours = 9; // Default to 9 AM
  }
  
  // Handle minutes validation
  if (isNaN(minutes) || minutes < 0 || minutes > 59) {
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

// Process the AI text to create a calendar event using Claude API
const processWithClaudeAI = async (text: string) => {
  if (!anthropicApiKey) {
    console.error("No Anthropic API key found");
    throw new Error("Anthropic API key is not configured");
  }

  try {
    console.log("Calling Claude API for text analysis:", text);
    
    // API call to Anthropic Claude 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        // 'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Analyze this text: "${text}"
            
            If it's asking to create, schedule or add a calendar event, extract the following information in JSON format:
            1. Title of the event
            2. Date (in YYYY-MM-DD format, use today's date if not specified)
            3. Start time (in HH:MM 24hr format)
            4. End time (in HH:MM 24hr format)
            5. Description (if any)
            
            Respond in this exact JSON format if it's for creating an event:
            {
              "action": "create",
              "event": {
                "title": "extracted title",
                "date": "YYYY-MM-DD",
                "startsAt": "Full ISO timestamp",
                "endsAt": "Full ISO timestamp",
                "description": "extracted description",
                "color": "bg-blue-500/70" or similar Tailwind color class
              }
            }
            
            If the text is not about creating a calendar event, respond with:
            {
              "action": "unknown",
              "message": "A helpful message explaining what I can do to help with calendar events"
            }`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error response:", response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Claude API response received:", JSON.stringify(data).slice(0, 500) + "...");

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Invalid response format from Claude API:", data);
      throw new Error("Invalid response format from Claude API");
    }

    // Extract the JSON from Claude's response
    const contentText = data.content[0].text;
    console.log("Claude content text:", contentText.slice(0, 300) + "...");
    
    // Find JSON in the response
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     contentText.match(/\{[\s\S]*\}/);
                     
    let parsedResponse;
    
    if (jsonMatch) {
      const jsonContent = jsonMatch[1] || jsonMatch[0];
      console.log("Extracted JSON content:", jsonContent);
      
      try {
        parsedResponse = JSON.parse(jsonContent);
        console.log("Successfully parsed JSON response:", parsedResponse);
      } catch (e) {
        console.error("Failed to parse JSON from Claude response", e);
        parsedResponse = { action: "unknown", message: "I couldn't understand your request. Please try being more specific about the event details." };
      }
    } else {
      console.error("No JSON found in Claude response");
      try {
        // Try to parse the whole response as JSON
        parsedResponse = JSON.parse(contentText);
      } catch (e) {
        console.error("Failed to parse Claude response as JSON", e);
        parsedResponse = { action: "unknown", message: "I couldn't understand your request. Please try being more specific about the event details." };
      }
    }

    // Process event data if action is create
    if (parsedResponse.action === "create" && parsedResponse.event) {
      const event = parsedResponse.event;
      
      // Ensure dates are in proper ISO format
      if (event.startsAt && !event.startsAt.includes('T')) {
        // If only date is provided, add time
        const startTime = event.startTime || "09:00";
        event.startsAt = new Date(`${event.date || new Date().toISOString().split('T')[0]}T${startTime}`).toISOString();
      }
      
      if (event.endsAt && !event.endsAt.includes('T')) {
        // If only date is provided for end time, add time
        const endTime = event.endTime || "10:00";
        event.endsAt = new Date(`${event.date || new Date().toISOString().split('T')[0]}T${endTime}`).toISOString();
      }
      
      // If we only have a start time but no end time, set end time to 1 hour later
      if (!event.endsAt && event.startsAt) {
        const startDate = new Date(event.startsAt);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
        event.endsAt = endDate.toISOString();
      }
      
      // Ensure color is set
      if (!event.color) {
        const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        event.color = `bg-${randomColor}-500/70`;
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return {
      action: "error",
      message: `Sorry, I encountered an error: ${error.message || "Unknown error"}`
    };
  }
};

// Extract event details from text - basic fallback if AI fails
function extractEventDetails(text: string) {
  // More flexible time pattern matching
  const timePattern = /(?:from|at|@)?\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:to|until|till|-)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i;
  const singleTimePattern = /(?:at|@)\s*(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/i;
  
  // Enhanced date pattern matching
  const datePattern = /(?:on|for)\s+(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*\d{4})?)/i;
  
  // Function to convert string date to normalized format (YYYY-MM-DD)
  const getNormalizedDate = (dateStr: string): string => {
    const today = dayjs();
    dateStr = dateStr.toLowerCase().trim();
    
    if (dateStr === 'today') {
      return today.format('YYYY-MM-DD');
    }
    
    if (dateStr === 'tomorrow') {
      return today.add(1, 'day').format('YYYY-MM-DD');
    }
    
    // Handle day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.findIndex(d => dateStr.includes(d));
    
    if (dayIndex !== -1) {
      let targetDay = dayIndex;
      const currentDay = today.day(); // 0 = Sunday, 6 = Saturday
      
      let daysToAdd;
      if (dateStr.includes('next')) {
        // "Next Monday" means the Monday after this one
        daysToAdd = (7 - currentDay + targetDay) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the target day, we want next week
      } else {
        // "Monday" means the upcoming Monday
        daysToAdd = (7 - currentDay + targetDay) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // If today is the target day, we want next week
      }
      
      return today.add(daysToAdd, 'day').format('YYYY-MM-DD');
    }
    
    // Handle month/day format (e.g., "March 15" or "15th of March")
    const monthMatch = dateStr.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
    
    if (monthMatch) {
      // Extract month and day
      const monthStr = monthMatch[0].toLowerCase();
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      
      let monthIndex = months.findIndex(m => monthStr.includes(m));
      if (monthIndex === -1) {
        monthIndex = shortMonths.findIndex(m => monthStr.includes(m));
      }
      
      const dayMatch = dateStr.match(/\d{1,2}/);
      const day = dayMatch ? parseInt(dayMatch[0]) : 1;
      const year = today.year(); // Assume current year
      
      return dayjs(new Date(year, monthIndex, day)).format('YYYY-MM-DD');
    }
    
    // Default to today if parsing fails
    return today.format('YYYY-MM-DD');
  };
  
  // Extract time range if it exists
  let startTime = null;
  let endTime = null;
  
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    startTime = timeMatch[1];
    endTime = timeMatch[2];
  } else {
    // Check for single time
    const singleTimeMatch = text.match(singleTimePattern);
    if (singleTimeMatch) {
      startTime = singleTimeMatch[1];
    }
  }
  
  // Default to 9 AM if no time specified
  if (!startTime) {
    startTime = '9:00 am';
  }
  
  // Format the start and end times
  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = endTime ? formatTime(endTime) : formatTime(`${parseInt(formattedStartTime.split(':')[0]) + 1}:00`);
  
  // Extract the date if present
  const dateMatch = text.match(datePattern);
  
  // Extract the date (or default to today)
  const dateText = dateMatch ? dateMatch[1] || dateMatch[0] : 'today';
  
  // Extract title using more sophisticated patterns
  const titlePatterns = [
    // "Schedule [title]" pattern
    /(?:schedule|create|add|set up|make)(?:\s+an?\s+event(?:\s+for)?|\s+a\s+meeting(?:\s+for)?|\s+a\s+reminder(?:\s+for)?)?\s+(?:called|titled|named|for|about)?\s+"([^"]+)"/i,
    /(?:schedule|create|add|set up|make)(?:\s+an?\s+event(?:\s+for)?|\s+a\s+meeting(?:\s+for)?|\s+a\s+reminder(?:\s+for)?)?\s+(?:called|titled|named|for|about)?\s+'([^']+)'/i,
    /(?:schedule|create|add|set up|make)(?:\s+an?\s+event(?:\s+for)?|\s+a\s+meeting(?:\s+for)?|\s+a\s+reminder(?:\s+for)?)?\s+(?:called|titled|named|for|about)?\s+(.+?)(?:\s+(?:on|at|from|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
    
    // Event description before time/date
    /(.+?)(?:\s+(?:from|at|@|on|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
  ];
  
  let title = "New Event";
  
  for (const pattern of titlePatterns) {
    const titleMatch = text.match(pattern);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      break;
    }
  }
  
  // If no title was found, use a fallback approach - remove time/date parts and use what's left
  if (title === "New Event") {
    // Create a cleaned version of the text without time/date references
    let cleanedText = text
      .replace(timePattern, '')
      .replace(singleTimePattern, '')
      .replace(datePattern, '')
      .replace(/schedule|create|add|set up|make|event|meeting|reminder/gi, '')
      .trim();
      
    // If there's something left, use it as the title
    if (cleanedText && cleanedText.length > 2) {
      title = cleanedText;
    }
  }
  
  // Get the date in YYYY-MM-DD format
  const eventDate = dateText ? getNormalizedDate(dateText) : getNormalizedDate('today');
  
  // Create ISO timestamps for start and end times
  const startsAt = new Date(`${eventDate}T${formattedStartTime}`).toISOString();
  const endsAt = new Date(`${eventDate}T${formattedEndTime}`).toISOString();
  
  // Create the event object
  return {
    title,
    description: `${formattedStartTime} - ${formattedEndTime} | ${title}`,
    startsAt,
    endsAt,
    date: eventDate,
    color: `bg-${['blue', 'green', 'purple', 'orange', 'teal', 'pink'][Math.floor(Math.random() * 6)]}-500/70`,
  };
}

// Process the AI text to create a calendar event - fallback if Claude fails
const processMallyAIText = (text: string) => {
  // Check if the text is for scheduling an event
  const isScheduling = /schedule|add|create|set up|make|put|new event|new meeting|new appointment|new reminder|book|reserve/i.test(text);
  
  if (isScheduling) {
    const eventDetails = extractEventDetails(text);
    return {
      action: 'create',
      event: eventDetails
    };
  }
  
  // If not scheduling, check if it's for event management
  const isUpdating = /update|modify|change|edit|reschedule|move|shift/i.test(text);
  if (isUpdating) {
    // Would need to extract which event and what to change
    return {
      action: 'update',
      message: "I detected you want to update an event. Please specify which event you'd like to change."
    };
  }
  
  const isDeleting = /delete|remove|cancel|clear/i.test(text);
  if (isDeleting) {
    // Would need to extract which event to delete
    return {
      action: 'delete',
      message: "I detected you want to delete an event. Please specify which event you'd like to remove."
    };
  }
  
  // If no specific action is detected
  return {
    action: 'unknown',
    message: "I'm not sure what you'd like to do with your calendar. Try saying something like 'Schedule a meeting with John tomorrow at 3pm'."
  };
};

// Main serve function
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const reqBody = await req.json();
    const text = reqBody.text || reqBody.prompt || '';
    const userId = reqBody.userId;

    if (!text) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: text or prompt',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    console.log("Processing scheduling request. Text:", text.substring(0, 100) + "...");
    
    try {
      // Try to use Claude API first
      console.log("Attempting to process with Claude AI");
      const aiResult = await processWithClaudeAI(text);
      
      console.log("AI result action:", aiResult.action);
      
      return new Response(
        JSON.stringify({
          response: aiResult.message || "I've analyzed your request.",
          action: aiResult.action,
          event: aiResult.event,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (aiError) {
      console.error("Claude AI processing error:", aiError);
      
      // Fall back to basic processing if AI fails
      console.log("Falling back to basic text processing");
      const result = processMallyAIText(text);
      
      return new Response(
        JSON.stringify({
          response: result.message || "I've processed your request using basic analysis.",
          action: result.action,
          event: result.event,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Error processing scheduling request:', error)
    
    return new Response(
      JSON.stringify({
        error: `Server error: ${error.message || "Unknown error"}`,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
