# Mally AI Calendar Event Step-by-Step Test Plan

This document provides a systematic approach to test, diagnose, and fix the issues with calendar events not being created properly when using the Mally AI assistant.

## Preparation

1. **Ensure environment variables are set correctly:**
   - ANTHROPIC_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

2. **Have test user credentials ready:**
   - A valid user ID for testing

## Step 1: Test Database Connection Directly

Run the Python test script to verify direct database access:

```powershell
cd C:\Users\jesse\Desktop\timegeist-modular\tools
# Set environment variables if needed
$env:SUPABASE_URL="<your-supabase-url>"
$env:SUPABASE_SERVICE_KEY="<your-service-key>"
$env:TEST_USER_ID="<valid-user-id>"

python test_calendar_event.py
```

Expected result: The script should successfully create a test event, verify its existence, and then delete it.

## Step 2: Test Event Creation Through UI

1. Log in to the Timegeist application
2. Navigate to the calendar view
3. Create a new event with these details:
   - Title: "UI Test Event"
   - Date: Today
   - Start Time: Next full hour
   - End Time: One hour after start time
   - Description: "Created through UI for testing"

Expected result: The event should appear on the calendar and be saved in the database.

## Step 3: Analyze Claude's Response Format

1. Open browser developer tools (F12) to view network requests and console logs
2. Open the Mally AI assistant
3. Ask it to create an event with specific details:
   ```
   "Schedule a meeting with John tomorrow at 2pm for 1 hour"
   ```
4. Examine the logs for:
   - The raw response from Claude
   - The extracted structured data
   - Any errors or warnings

Expected result: You should see either:
- JSON formatted with code block markers: ```json {...} ```
- XML-style formatting: `<calendar_operation>{...}</calendar_operation>`
- Direct JSON: `{ "action": "create", ... }`

## Step 4: Test Event Creation Through Mally AI

Use Mally AI to create an event with very explicit parameters:

```
"Create a calendar event titled 'Test Meeting' tomorrow from 3:00 PM to 4:00 PM with a description 'This is a test event created by Mally AI'"
```

Check the application logs for:
1. The extracted JSON data
2. Database operation logs
3. Any error messages

Expected result: The event should be created successfully and appear on the calendar.

## Step 5: Debug Based on Results

Depending on which step fails, follow these diagnostic paths:

### If Step 1 (Database Test) Fails:
- Check Supabase permissions and RLS policies
- Verify the service role key has appropriate access
- Confirm the database schema matches what the code expects

### If Step 2 (UI Test) Works but Step 4 (Mally AI) Fails:
- Compare the network requests between UI creation and AI creation
- Check the field names and formats in both requests
- Look for differences in how the data is structured

### If Step 3 (Claude Response) Shows Invalid Formatting:
- Update the system prompt to be more explicit about JSON format
- Add additional pattern matching in `extractStructuredData` function

## Step 6: Apply Targeted Fixes

Based on diagnostic results, apply one or more of these fixes:

### 1. Fix Duplicate Validation
Remove one of the duplicate Supabase validation blocks in `process-scheduling/index.ts`:

```typescript
// Keep only one of these blocks
// Verify supabase client is valid before proceeding
if (!supabase || typeof supabase.from !== 'function') {
  throw new Error("Invalid Supabase client for database operation");
}
```

### 2. Update System Prompt
Enhance the system prompt to Claude to ensure consistent JSON formatting:

```javascript
// Update the relevant part of the system prompt
const systemPrompt = `...

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

IMPORTANT: The JSON block above MUST be included in your response for any calendar operation.
Make sure the JSON is properly formatted and enclosed in a code block with \`\`\`json and \`\`\` markers.
The JSON should contain all needed fields based on the operation type.
...`;
```

### 3. Add Console Logging for Front-end Processing
Add additional logging in `MallyAI.tsx` to trace how the calendar operation response is processed:

```typescript
// In the handleSendMessage function or equivalent
console.log("Edge function full response:", response);
console.log("Calendar operation data:", data.action, data.event);
console.log("operationResult:", data.operationResult);

if (data.action === 'create' && data.event) {
  console.log("Event data structure:", JSON.stringify(data.event, null, 2));
  // ...
}
```

## Step 7: Verify Fix

After applying fixes:

1. Test again using Mally AI to create a calendar event
2. Verify the event appears in the calendar
3. Check the database to confirm the event was saved correctly

## Expected Outcome

By following this systematic approach, you should be able to:
1. Identify the exact cause of the issue
2. Apply targeted fixes to address the root cause
3. Verify that calendar events can be created through Mally AI

This methodical process will help resolve the issue while minimizing the risk of introducing new errors.
