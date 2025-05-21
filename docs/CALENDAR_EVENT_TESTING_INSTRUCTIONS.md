# Calendar Event Testing Instructions

This document provides steps for testing and verifying the calendar event creation functionality in the Timegeist application, specifically focusing on events created through the Mally AI assistant.

## Prerequisites

- Supabase access credentials (URL and service key)
- A valid user ID in the system
- Python 3.6+ for running the test script
- Access to application logs

## Testing Approach

We'll use a systematic approach to isolate and verify different components of the system:

1. **Direct Database Access Testing** - Verify database permissions and connectivity
2. **Interface Testing** - Test event creation through the UI
3. **AI Assistant Testing** - Test event creation through Mally AI
4. **Integration Verification** - Compare results across different methods

## 1. Direct Database Access Testing

Use the provided Python script to test direct database access without going through the application:

### Setup

1. Set environment variables or edit the script to include your configuration:
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_KEY="your-service-key"
   export TEST_USER_ID="valid-user-id"
   ```

2. Run the test script:
   ```bash
   cd c:\Users\jesse\Desktop\timegeist-modular\tools
   python test_calendar_event.py
   ```

3. Expected output:
   ```
   === Testing Calendar Event Creation ===
   ...
   1. Inserting event into calendar_events table...
      Status: 201
   2. Verifying event was created...
      Status: 200
      Success! Event was found in the database.
   3. Cleaning up by deleting test event...
      Status: 204
      Confirmed: Event was successfully deleted
   === Test result: PASSED ===
   ```

If this test fails, it indicates a problem with database permissions or connectivity.

## 2. Interface Testing

Test creating events through the regular calendar UI:

1. Log in to the Timegeist application
2. Navigate to the calendar view
3. Create a new event using the UI
4. Verify that the event appears on the calendar
5. Check the database to confirm the event was saved

## 3. AI Assistant Testing

Test creating events through the Mally AI assistant:

1. Log in to the Timegeist application
2. Open the Mally AI assistant
3. Ask Mally to create an event with specific details:
   ```
   "Schedule a meeting with John tomorrow at 2pm for 1 hour"
   ```
4. Note Mally's response
5. Check the calendar to see if the event appears
6. Check application logs for JSON extraction and database operations

## 4. Integration Verification

Compare the results from different testing methods:

1. Examine the database records for events created through each method
2. Compare fields and formatting to identify any discrepancies
3. Check application logs for error messages or warnings
4. Verify that events created through all methods have consistent behavior

## Common Issues and Solutions

### Database Permission Issues

**Symptoms:**
- Direct database test fails with permission errors
- Log shows "RLS policy violation" or similar errors

**Solutions:**
- Verify Row Level Security (RLS) policies for the calendar_events table
- Confirm that the service role key has appropriate permissions
- Check that the user ID is correctly passed in requests

### JSON Extraction Issues

**Symptoms:**
- Logs show "No structured data format found in Claude response"
- The AI responds normally but no event is created

**Solutions:**
- Check the system prompt sent to Claude to ensure it requests proper JSON formatting
- Examine the raw Claude response to see what format it's using
- Update the `extractStructuredData` function to handle the specific format

### Field Mapping Issues

**Symptoms:**
- Database insertion succeeds, but events don't appear in the UI
- Events have missing or incorrect data

**Solutions:**
- Verify field naming consistency between frontend and backend
- Check data transformation functions for proper mapping
- Ensure timestamps are properly formatted

## Verification Checklist

Use this checklist to ensure all aspects of the fix have been verified:

- [ ] Direct database access test passes
- [ ] Events can be created through the UI
- [ ] Events can be created through Mally AI
- [ ] Events from all sources appear correctly in the calendar
- [ ] Deleting events works from all sources
- [ ] Editing events works from all sources
- [ ] No errors appear in the application logs during normal operation

## Collecting Diagnostic Information

If issues persist, gather the following diagnostic information:

1. **Database Logs:**
   - Check Supabase dashboard for query logs and errors

2. **Application Logs:**
   - Enable verbose logging in the edge function
   - Check browser console for frontend errors

3. **AI Response Data:**
   - Log the full response from Claude
   - Examine the extracted structured data

4. **Network Traffic:**
   - Use browser network tools to examine API requests and responses
   - Check for differences between UI and AI-initiated requests

## Reporting Issues

When reporting issues, include:

1. Steps to reproduce the problem
2. Expected vs. actual behavior
3. Relevant log entries
4. Screenshots of the calendar before and after
5. The exact prompt given to Mally AI
