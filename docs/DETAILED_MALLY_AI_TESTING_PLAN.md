# Detailed Testing Plan for Mally AI Calendar Event Creation Issue

## Problem Statement
Calendar events are not being created properly when requested through the Mally AI assistant, but they work correctly when created through the regular UI.

## Testing Approach
Our testing will be systematic and identify exactly where the issue is occurring in the pipeline.

### 1. Test Direct Database Access Using Test Script

```powershell
cd C:\Users\jesse\Desktop\timegeist-modular\tools
$env:SUPABASE_URL="<your-supabase-url>"
$env:SUPABASE_SERVICE_KEY="<your-service-key>"
$env:TEST_USER_ID="<valid-user-id>"

python test_calendar_event.py --user-id $env:TEST_USER_ID --title "Direct Test Event" --url "$env:SUPABASE_URL/functions/v1/process-scheduling" --key $env:SUPABASE_SERVICE_KEY
```

Expected outcome: Event is created successfully. If not, the issue is with database permissions.

### 2. Test JSON Extraction in Edge Function

Modify the `extractStructuredData` function to log the entire AI response:

```typescript
function extractStructuredData(response: string): CalendarOperation | null {
  try {
    console.log("FULL AI RESPONSE FOR DEBUGGING:");
    console.log("=".repeat(80));
    console.log(response);
    console.log("=".repeat(80));
    
    // Rest of the function...
```

Then create an event using Mally AI and check the Edge Function logs.

### 3. Compare UI vs. AI Assistant Routes

#### Through UI:
1. Create an event using the regular UI
2. Monitor network requests in browser developer tools
3. Note the structure of the request and response

#### Through AI Assistant:
1. Ask Mally to create an event
2. Monitor network requests in browser developer tools
3. Compare the AI assistant network flow with the UI flow

### 4. Test Claude's Response Formatting

Use browser developer tools to see Claude's raw response when asking it to create an event.

Expected structure:
```json
{
  "action": "create",
  "eventDetails": {
    "title": "Meeting with Team",
    "date": "2025-05-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "description": "Weekly team sync"
  }
}
```

Check that the JSON is properly formatted and enclosed in code block markers (````json` and ````).

### 5. Test Enhanced JSON Extraction Patterns

The enhanced extraction function should catch different JSON formats:

1. Standard code block format:
```json
{
  "action": "create",
  ...
}
```

2. XML-style tags:
```
<calendar_operation>
{
  "action": "create",
  ...
}
</calendar_operation>
```

3. Direct JSON without markers:
```
{
  "action": "create",
  ...
}
```

4. Enhanced pattern matching with possible whitespace issues.

Create test cases for each format type and verify the function extracts them correctly.

### 6. Test System Prompt Effectiveness

Update the system prompt to Claude with enhanced instructions about JSON formatting:

```
CRITICAL: The JSON block above MUST be included in your response for any calendar operation.
Make sure the JSON is properly formatted and enclosed in the code block with ```json at the start and ``` at the end.
Do not modify the format - follow the exact structure shown. This is required for the system to process your response correctly.
```

Then ask Mally to create various events and see if the JSON formatting improves.

## Potential Solutions

Based on test results, implement one or more of these solutions:

1. Fix JSON extraction to handle more formats
2. Update system prompt to Claude
3. Add fallback extraction methods
4. Fix database connectivity issues
5. Verify proper field mapping between backend and frontend

## Test Record Template

For each test run, record:

```
Test ID: 
Test Type: [Database/JSON Extraction/UI Flow/Claude Response]
Date/Time: 
Input: 
Expected Output:
Actual Output:
Result: [PASS/FAIL]
Notes:
```
