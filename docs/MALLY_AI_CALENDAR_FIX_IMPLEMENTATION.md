# How to Apply and Test the Mally AI Calendar Fix

This document provides step-by-step instructions for implementing and testing the fix for the Mally AI calendar event creation issue.

## Step 1: Replace the Edge Function

1. Open the `index-fix.ts` file in the `supabase/functions/process-scheduling/` directory
2. Copy the entire content of this file
3. Open the original `index.ts` file in the same directory
4. Replace the entire content with the copied code
5. Save the file

## Step 2: Deploy the Updated Edge Function

```bash
# Navigate to your project directory
cd c:\Users\jesse\Desktop\timegeist-modular

# Deploy the updated function
npx supabase functions deploy process-scheduling --no-verify-jwt
```

## Step 3: Test the Fix Using the Test Tool

1. Create a `.env` file in your project root with the following content:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
TEST_USER_ID=your_test_user_id
```

2. Install the required dependencies for the test tool:

```bash
npm install dotenv @supabase/supabase-js --save-dev
```

3. Run the test tool:

```bash
node tools/test-mally-calendar-fix.js
```

4. Review the test results to verify that calendar events are being created properly

## Step 4: Manual Testing in the Application

1. Open your application in the browser
2. Log in with a test account
3. Open the Mally AI assistant
4. Try these test phrases:
   - "Schedule a meeting tomorrow at 3pm"
   - "Add a lunch event for today at noon"
   - "Create a doctor appointment for next Friday"
5. Verify that events are created and appear in the calendar
6. Check the Supabase Edge Function logs for any errors

## Step 5: Troubleshooting

If events still aren't being created:

1. Check the browser console for errors
2. Look at the Edge Function logs in the Supabase dashboard
3. Verify that the user ID is being passed correctly
4. Check the network tab to see the response from the function call
5. Make sure your test user has proper permissions in the database

## Why This Fix Works

The previous implementation had several issues:

1. **JSON Extraction Issue**: Claude would sometimes provide valid JSON without code block markers, which wasn't being detected by our regex patterns.
2. **Response Processing**: The backend didn't properly handle cases where the calendar operation was detected but event creation failed.
3. **Fallback Creation**: There was no fallback system to create events when Claude's response was imperfect.

Our fix addresses these issues by:

1. Adding more comprehensive regex patterns to detect JSON in various formats
2. Creating a fallback system that can extract event information from plain text
3. Ensuring the API always returns consistent data structures, even in error cases
4. Adding detailed logging to help diagnose issues

## Next Steps

After confirming the fix works:

1. Consider adding automated tests for this functionality
2. Update the system prompt for Claude to further improve JSON formatting
3. Add metrics to track the success rate of calendar event creation over time
