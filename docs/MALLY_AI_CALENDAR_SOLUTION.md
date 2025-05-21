# Mally AI Calendar Event Extraction - Solution Documentation

This document provides a detailed explanation of the solution implemented to fix the JSON extraction issues in the Mally AI calendar event scheduling feature.

## Problem Description

The system was failing to properly extract event data from the LLM (Claude) responses, which prevented events from being created in the calendar. The main issues were:

1. The LLM's responses contained JSON with newlines and formatting that wasn't being properly parsed
2. The system prompt had conflicting instructions about JSON format (asking for both code blocks and direct JSON)
3. The existing extraction logic had limited patterns it could recognize
4. The fallback mechanism wasn't robust enough to handle various LLM output formats

## Solution Approach

The solution involved several improvements to handle the various ways that Claude might format its JSON output:

### 1. Enhanced `extractStructuredData()` Function

The function was completely redesigned with multiple approaches to extract JSON data:

- **Approach 1**: Look for JSON inside markdown code blocks (````json {...} ````)
- **Approach 2**: Look for XML-style tags (`<calendar_operation>{...}</calendar_operation>`)
- **Approach 3**: Look for direct JSON patterns with "action" field
- **Approach 4**: More permissive pattern matching with JSON cleaning
- **Approach 5**: Last resort pattern matching for any JSON-like structure with event data

Each approach includes thorough JSON string normalization:
- Removing newlines and excess whitespace
- Fixing trailing commas
- Adding quotes around unquoted keys
- Converting single quotes to double quotes
- Other typical LLM JSON formatting fixes

### 2. Improved Fallback Extraction Mechanism

The fallback system was enhanced to:
- Try multiple patterns to extract potential JSON data
- Apply more aggressive cleaning and normalization
- Handle various event data formats and field names
- Extract relevant fields even from incomplete data
- Provide sensible defaults for missing values

### 3. Improved System Prompt

A revised system prompt was proposed to give clearer instructions about JSON formatting:
- Provided more explicit instructions about where to place the JSON
- Clarified that JSON should be properly formatted with double quotes
- Removed conflicting instructions about both code blocks and direct JSON

## Implementation Details

### JSON Pattern Matching

The solution uses a variety of regular expressions to match different JSON formats:

```javascript
// Code block pattern
/```json\s*(\{[\s\S]*?\})\s*```/

// XML-style tags pattern
/<calendar_operation>([\s\S]*?)<\/calendar_operation>/

// Direct JSON pattern
/(\{[\s\S]*?"action"\s*:\s*"(create|edit|delete|query)"[\s\S]*?\})/

// Enhanced pattern
/(?:\`\`\`(?:json)?\s*)?(\{[\s\S]*?"action"\s*:\s*"(?:create|edit|delete|query)"[\s\S]*?\})(?:\s*\`\`\`)?/

// Last resort pattern
/\{[\s\S]*?(?:"event"|"title"|"date"|"startsAt"|"endsAt"|"start"|"end")[\s\S]*?\}/
```

### JSON Cleaning and Normalization

The solution applies multiple cleaning steps to normalize JSON strings:

```javascript
// Basic cleaning
jsonString = jsonString
  .replace(/\n/g, ' ')      // Replace newlines with spaces
  .replace(/\r/g, '')       // Remove carriage returns
  .replace(/\t/g, ' ')      // Replace tabs with spaces
  .replace(/\s+/g, ' ');    // Normalize whitespace

// Advanced cleaning
jsonString = jsonString
  .replace(/([{,])\s*(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
  .replace(/:(\s*)'/g, ':$1"')            // Replace single quotes with double quotes (start)
  .replace(/'(\s*[,}])/g, '"$1')          // Replace single quotes with double quotes (end)
  .replace(/,\s*[}\]]/g, function(match) { return match.replace(',', ''); }); // Remove trailing commas
```

### Event Data Extraction and Fallback Logic

The solution provides multiple fallback mechanisms to ensure event data is extracted even from incomplete or malformatted JSON:

```javascript
// Extract event details from various sources
const eventDetails = parsed.eventDetails || parsed.event || parsed;

// Create a calendar event with defaults for missing fields
fallbackEvent = {
  id: `temp-${Date.now()}`,
  title: eventDetails.title || eventDetails.name || "Untitled Event",
  description: eventDetails.description || eventDetails.title || "Event created by Mally AI",
  startsAt: eventDetails.date && eventDetails.startTime 
    ? new Date(`${eventDetails.date}T${eventDetails.startTime}`).toISOString() 
    : new Date().toISOString(),
  endsAt: eventDetails.date && eventDetails.endTime 
    ? new Date(`${eventDetails.date}T${eventDetails.endTime}`).toISOString() 
    : new Date(Date.now() + 3600000).toISOString(), // Default to 1 hour later
  date: eventDetails.date || new Date().toISOString().split('T')[0],
  color: eventDetails.color || 'bg-purple-500/70'
};
```

## Testing and Verification

To test this solution:

1. Interact with Mally AI and ask it to schedule events
2. Check the server logs for JSON extraction attempts
3. Verify that events are correctly created in the calendar
4. Test edge cases with unusual date/time formats
5. Verify handling of missing or incomplete information

## Next Steps

1. **System Prompt Update**: Consider implementing the revised system prompt to provide clearer instructions to Claude
2. **Frontend Validation**: Add additional validation on the frontend to handle edge cases
3. **Error Reporting**: Enhance error reporting to provide more user-friendly error messages
4. **User Feedback Loop**: Collect feedback from users to identify any remaining issues
