# Enhanced System Prompt for Claude in Mally Calendar Operations

This is an enhanced version of the system prompt to send to Claude for calendar operations. It provides more explicit instructions about the required JSON format to ensure Claude consistently generates structured data that can be correctly extracted and processed.

```javascript
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
4. For database operations, you MUST output a JSON object with this EXACT structure:

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
```

## Additional Regular Expression Pattern to Capture Claude's Response

Add this improved pattern to better extract the structured data from Claude's response:

```javascript
// Enhanced regex pattern that is more permissive with JSON formatting
const enhancedJsonPattern = /(?:\`\`\`(?:json)?\s*)?(\{[\s\S]*?"action"\s*:\s*"(?:create|edit|delete|query)"[\s\S]*?\})(?:\s*\`\`\`)?/;

if (enhancedJsonPattern.test(aiResponse)) {
  const match = aiResponse.match(enhancedJsonPattern);
  if (match && match[1]) {
    try {
      const data = JSON.parse(match[1]);
      return data as CalendarOperation;
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.error("Raw matched JSON:", match[1]);
      return null;
    }
  }
}
```

## How to Implement

1. Replace the existing system prompt in `process-scheduling/index.ts` with the enhanced version above
2. Add the new regex pattern to the `extractStructuredData` function
3. Test by asking Mally AI to create a simple event

## Testing Commands

You can use these commands to test the database connection directly:

```powershell
cd C:\Users\jesse\Desktop\timegeist-modular\tools
$env:SUPABASE_URL="<your-supabase-url>"
$env:SUPABASE_SERVICE_KEY="<your-service-key>"
$env:TEST_USER_ID="<valid-user-id>"

python test_calendar_event.py
```

This will help isolate whether the issue is with Claude's response format or with database permissions/connectivity.
