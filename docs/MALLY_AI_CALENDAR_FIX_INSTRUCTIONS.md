# Fixing Mally AI Calendar Event Creation Issues

This document provides a comprehensive guide to fix the issues with calendar events not being created properly when using the Mally AI assistant.

## Root Cause Analysis

After reviewing the code, we've identified several potential issues:

1. **JSON Extraction Issues**: The AI assistant's responses may not be properly extracted due to Claude's inconsistent formatting of JSON responses.

2. **System Prompt Clarity**: The system prompt to Claude may need to be more explicit about the required JSON format.

3. **Debugging Limitations**: There isn't enough visibility into what's happening when the calendar event creation fails.

4. **Database Connectivity**: There could be database permission issues or connectivity problems.

## Step-by-Step Fix

### 1. Update the System Prompt

✅ The system prompt in `process-scheduling/index.ts` already includes the updated version that emphasizes proper JSON formatting:

```javascript
CRITICAL: The JSON block above MUST be included in your response for any calendar operation.
Make sure the JSON is properly formatted and enclosed in the code block with ```json at the start and ``` at the end.
Do not modify the format - follow the exact structure shown. This is required for the system to process your response correctly.
```

### 2. Enhance the JSON Extraction Function

✅ The `extractStructuredData` function has been updated with advanced pattern matching including:
- Code block with JSON tag
- XML-style tags
- Direct JSON without markers
- Enhanced flexible pattern matching
- Permissive fallback pattern with cleaning

### 3. Test with the Browser Debugger Tool

1. Open your browser developer tools (F12)
2. Open the Console tab
3. Copy and paste the entire content of `tools/mally-ai-request-debugger.js` into the console
4. Press Enter to execute
5. Ask Mally to create a calendar event
6. Examine the console output for "MALLY-DEBUG" entries
7. Pay special attention to:
   - The raw Claude response
   - Whether JSON was properly extracted
   - The Edge Function response

### 4. Run the Python Test Script

```powershell
cd C:\Users\jesse\Desktop\timegeist-modular\tools
$env:SUPABASE_URL="<your-supabase-url>"
$env:SUPABASE_SERVICE_KEY="<your-service-key>"
$env:TEST_USER_ID="<valid-user-id>"

python test_calendar_event.py --user-id $env:TEST_USER_ID --title "Direct Test Event" --url "$env:SUPABASE_URL/functions/v1/process-scheduling" --key $env:SUPABASE_SERVICE_KEY
```

This will determine if direct event creation works, isolating whether the issue is with Claude's responses or with database access.

## The Fix

Based on our analysis, the most likely issue is with Claude's JSON formatting. The enhanced JSON extraction function should now catch all reasonable JSON formats, but you can diagnose any remaining issues with these tools.

If the issue persists:

1. Check if the browser debugger tool shows any JSON in Claude's response
2. Verify that it matches the expected format
3. If not, observe what format Claude is using and update the extraction patterns as needed

## Verification Steps

After implementing these changes:

1. Ask Mally to create a simple event: "Schedule a meeting tomorrow at 3pm"
2. Check if the event appears in the calendar
3. Check browser console logs with the debugger tool
4. Verify database insertion using direct SQL queries
5. Test various date/time formats to ensure robust parsing

## Conclusion

The combination of the enhanced JSON extraction, better system prompt, and diagnostic tools should resolve the calendar event creation issues with Mally AI. If problems persist, the diagnostic tools will help identify exactly where in the pipeline the issue is occurring.
