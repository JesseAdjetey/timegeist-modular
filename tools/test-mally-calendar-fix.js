/**
 * Test utility for Mally AI calendar event creation
 * 
 * This script directly invokes the Supabase edge function for processing calendar events
 * to verify that Claude's responses are properly processed and events are created.
 */

// You'll need to install these packages:
// npm install dotenv @supabase/supabase-js --save-dev

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anonymous key (from your .env file)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const userId = process.env.TEST_USER_ID;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test messages to try
const testMessages = [
  "Schedule a team meeting tomorrow at 3pm",
  "Add a coffee break at 10:30am today",
  "Set up a planning session for next Monday at 9am",
  "Create an event called quarterly review for Friday from 1pm to 3pm",
  "I need to schedule a dentist appointment on Thursday at 2pm",
  "Can you add lunch with Sarah to my calendar for tomorrow at noon?"
];

// Run a single test
async function runTest(message) {
  console.log(`\n=== Testing: "${message}" ===\n`);
  
  try {
    // Call the edge function
    console.log("Calling process-scheduling edge function...");
    
    const { data, error } = await supabase.functions.invoke('process-scheduling', {
      body: {
        text: message,
        prompt: message,
        messages: [], // No conversation history for this test
        userId: userId,
        events: [] // No existing events for simplicity
      }
    });
    
    if (error) {
      console.error("Error calling edge function:", error);
      return { success: false, error };
    }
    
    // Log the response
    console.log("\nResponse from edge function:");
    console.log(JSON.stringify(data, null, 2));
    
    // Check if the response contains the required fields
    if (!data.operationResult) {
      console.error("\n❌ Missing operationResult in response");
      return { success: false, error: "Missing operationResult" };
    }
    
    // Check if an event was created
    if (data.operationResult.action === 'create' && data.event) {
      console.log("\n✅ Successfully created event:");
      console.log(`- Title: ${data.event.title}`);
      console.log(`- Start: ${new Date(data.event.startsAt).toLocaleString()}`);
      console.log(`- End: ${new Date(data.event.endsAt).toLocaleString()}`);
      return { success: true, event: data.event };
    } else if (data.operationResult.action === 'create') {
      console.error("\n❌ Create action but no event returned");
      return { success: false, error: "No event in create response" };
    } else {
      console.log(`\n⚠️ No event created (action: ${data.operationResult.action})`);
      return { success: false, error: `Action was ${data.operationResult.action}, not create` };
    }
    
  } catch (err) {
    console.error("Error running test:", err);
    return { success: false, error: err.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log("=== MALLY AI CALENDAR EVENT CREATION TEST ===\n");
  console.log(`Testing with user ID: ${userId}`);
  
  let results = [];
  
  for (const message of testMessages) {
    const result = await runTest(message);
    results.push({
      message,
      result
    });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log("\n=== TEST SUMMARY ===\n");
  let successCount = 0;
  
  for (const test of results) {
    if (test.result.success) {
      successCount++;
      console.log(`✅ "${test.message}" - SUCCESS`);
    } else {
      console.log(`❌ "${test.message}" - FAILED: ${test.result.error}`);
    }
  }
  
  console.log(`\n${successCount}/${results.length} tests passed`);
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .catch(err => {
      console.error("Test execution error:", err);
      process.exit(1);
    });
}

module.exports = {
  runTest,
  runAllTests
};
