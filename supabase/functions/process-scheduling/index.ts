
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

// Extract event details from text - enhanced for more natural language
function extractEventDetails(text: string) {
  try {
    console.log(`Processing text for event extraction: "${text}"`);
    
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
    const event = {
      title,
      description: `${formattedStartTime} - ${formattedEndTime} | ${title}`,
      startsAt,
      endsAt,
      date: eventDate,
      color: `bg-${['blue', 'green', 'purple', 'orange', 'teal', 'pink'][Math.floor(Math.random() * 6)]}-500/70`,
    };
    
    console.log('Extracted event details:', event);
    return event;
  } catch (error) {
    console.error('Error in extractEventDetails:', error);
    // Return a default event if extraction fails
    return {
      title: "New Event",
      description: "09:00 - 10:00 | New Event",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
      date: dayjs().format('YYYY-MM-DD'),
      color: "bg-purple-500/70"
    };
  }
}

// Process the AI text to create a calendar event
const processMallyAIText = (text: string) => {
  try {
    console.log(`Processing Mally AI text: "${text}"`);
    
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
  } catch (error) {
    console.error('Error in processMallyAIText:', error);
    return {
      action: 'error',
      message: `Sorry, I encountered an error processing your request: ${error.message}. Please try again.`,
      error: error.message
    };
  }
};

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
    
    const { text, userId } = body;

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

    console.log(`Processing text: "${text}"`);
    
    // Process the text with AI
    const result = processMallyAIText(text);
    console.log("Processing result:", result);

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
        error: `Server error: ${error.message}`,
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
