# Mally AI Calendar Fix

This document provides steps to fix the issue with Mally AI calendar event creation.

## Issue Summary

The calendar event creation was failing because:

1. ~~The `calendar_events` table was not properly added to the Supabase realtime publication~~ ✅ The `calendar_events` table was already included in the realtime publication in the most recent migration
2. There might be issues with the Row Level Security (RLS) policies
3. There could be TypeScript code issues that are preventing insert operations from completing successfully
4. The edge function might not have the correct environment variables or permissions

## Solution

### 1. Fix TypeScript Code Issues

Several TypeScript errors were fixed in both the client code and server-side functions:

1. Fixed property access errors in `use-calendar-events.ts`:

   - Removed invalid access to protected `supabaseUrl` property
   - Fixed indentation and syntax in the `addEvent` function
   - Fixed EndsAt/endsAt variable name typo

2. Enhanced error handling in the Edge Function:

   - Added comprehensive logging for database operations
   - Added diagnostic functions to check database schema and RLS policies
   - Implemented direct database connection testing

3. Added a new diagnostic function `testCalendarDatabase()` to perform the following tests:
   - Test read access to the calendar_events table
   - Test write access by creating a test event
   - Test delete access by removing the test event

### 2. Deploy the migration script (if needed)

The `calendar_events` table is already properly configured in the realtime publication. If you need to make additional schema changes, you can run:

```bash
supabase migration up
```

This will apply the `20250509_calendar_events_fix.sql` migration which:

- Creates the calendar_events table if it doesn't exist
- Sets up proper RLS policies
- Adds the table to the realtime publication
- Sets the replica identity for realtime functionality

### 2. Redeploy the Edge Function

Redeploy the `process-scheduling` edge function with:

```bash
supabase functions deploy process-scheduling
```

### 3. Verify Environment Variables

Make sure the following environment variables are set:

- ANTHROPIC_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

You can check the current values with:

```bash
supabase secrets list
```

And set them with:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_key
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 4. Test the Function

After deployment, test the functionality by:

1. Opening the Mally AI assistant
2. Using the new diagnostic test function by calling `testCalendarDatabase()` in your code
3. Requesting to create a calendar event
4. Checking the Supabase logs for any errors
5. Verifying the event appears in the calendar

## Using the Diagnostic Function

To help troubleshoot calendar database connectivity issues, a new diagnostic function has been added to the `useCalendarEvents` hook:

```typescript
const { testCalendarDatabase } = useCalendarEvents();

// Later in your component:
const handleDiagnosticTest = async () => {
  const result = await testCalendarDatabase();
  console.log("Diagnostic test result:", result);
};
```

This function performs the following checks:

1. Tests read access by attempting to fetch events
2. Tests write access by creating a temporary test event
3. Tests delete access by removing the temporary test event

You can add a button to your UI to run this test:

```tsx
<button
  onClick={handleDiagnosticTest}
  className="px-4 py-2 bg-red-500 text-white rounded-md"
>
  Run Database Diagnostic
</button>
```

The function will output detailed logs to the console that can help identify any permission or connection issues.

## Troubleshooting

If issues persist:

1. Check the function logs for detailed error messages:

   ```bash
   supabase functions logs process-scheduling
   ```

2. Verify database RLS policies directly in the Supabase dashboard

   - Go to Table Editor > calendar_events > Policies
   - Ensure the "Users can insert their own calendar events" policy exists

3. Test direct database access by inserting an event through the dashboard
