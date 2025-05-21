// This file contains the implementation of the improved fallback extraction logic
// for the Mally AI calendar event scheduling feature.

/**
 * Improved version of fallback extraction for when the primary extraction mechanism fails
 * 
 * @param aiResponse The raw text response from the LLM
 * @returns An event object that can be used for calendar operations, or null if extraction fails
 */
function improvedFallbackExtraction(aiResponse) {
  console.log("Attempting improved fallback extraction for JSON data");
  
  // Try multiple patterns to find potential JSON data
  const possibleJsonPatterns = [
    // Pattern 1: Look for JSON with action:create
    /\{[\s\S]*?"action"\s*:\s*"create"[\s\S]*?\}/,
    // Pattern 2: Look for any JSON with eventDetails
    /\{[\s\S]*?"eventDetails"[\s\S]*?\}/,
    // Pattern 3: Look for any JSON with title and date/time fields
    /\{[\s\S]*?(?:"title"[\s\S]*?(?:"date"|"startTime"|"endTime"))[\s\S]*?\}/,
    // Pattern 4: Look for any JSON objects with potential event fields
    /\{[\s\S]*?(?:"title"|"subject"|"event"|"meeting"|"appointment")[\s\S]*?\}/
  ];
  
  // Try each pattern until we find a match
  let jsonStr = null;
  for (const pattern of possibleJsonPatterns) {
    const match = aiResponse.match(pattern);
    if (match && match[0]) {
      jsonStr = match[0];
      console.log(`[IMPROVED] Found JSON match with pattern: ${pattern}`);
      break;
    }
  }
  
  if (!jsonStr) {
    console.log("[IMPROVED] No JSON patterns matched in LLM response");
    return null;
  }
  
  try {
    // Apply thorough cleaning to normalize the JSON string
    let cleanedJson = jsonStr
      .replace(/\n/g, ' ')      // Replace newlines with spaces
      .replace(/\r/g, '')       // Remove carriage returns
      .replace(/\t/g, ' ')      // Replace tabs with spaces
      .replace(/\\/g, '\\\\')   // Escape backslashes
      .replace(/\s+/g, ' ');    // Normalize whitespace
    
    // Additional JSON normalization
    cleanedJson = cleanedJson
      .replace(/([{,])\s*(\w+):/g, '$1"$2":')     // Add quotes around unquoted keys
      .replace(/:(\s*)'/g, ':$1"')                // Replace single quotes with double quotes (start)
      .replace(/'(\s*[,}])/g, '"$1')              // Replace single quotes with double quotes (end)
      .replace(/,\s*[}\]]/g, match => match.replace(',', ''));  // Remove trailing commas
    
    console.log("[IMPROVED] Cleaned JSON string:", cleanedJson);
    
    // If the JSON is double-encoded, decode it first
    let processedJson = cleanedJson;
    if (processedJson.includes('\\n') || processedJson.includes('\\"')) {
      processedJson = processedJson
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    
    // If the JSON is still not valid, try to extract the inner JSON string
    if (processedJson.match(/^\s*"/)) {
      try {
        processedJson = JSON.parse(processedJson);
      } catch (err) {
        console.log("[IMPROVED] Failed to parse inner JSON string, using original");
      }
    }
    
    // Parse the processed JSON
    const parsed = JSON.parse(processedJson);
    console.log("[IMPROVED] Successfully parsed JSON:", parsed);
    
    // Extract event details from the parsed JSON, handling various formats
    const eventDetails = parsed.eventDetails || parsed.event || parsed;
    
    // Create a standardized event object
    if (eventDetails && (eventDetails.title || eventDetails.name || eventDetails.summary)) {
      const title = eventDetails.title || eventDetails.name || eventDetails.summary || "Untitled Event";
      const description = eventDetails.description || eventDetails.notes || title;
      
      // Handle date/time info with good defaults
      const currentDate = new Date();
      const date = eventDetails.date || 
                  eventDetails.eventDate || 
                  currentDate.toISOString().split('T')[0];
      
      // Handle various time formats
      let startTime = eventDetails.startTime || 
                     eventDetails.start || 
                     eventDetails.from || 
                     "09:00";
                     
      let endTime = eventDetails.endTime || 
                   eventDetails.end || 
                   eventDetails.to || 
                   (startTime === "09:00" ? "10:00" : null);
      
      // If we still don't have an end time, add 1 hour to start time
      if (!endTime && startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        let endHour = hours + 1;
        if (endHour > 23) endHour = 23;
        endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // Create timestamps for the event
      let startsAt, endsAt;
      try {
        startsAt = date && startTime 
          ? new Date(`${date}T${startTime}`).toISOString() 
          : new Date().toISOString();
          
        endsAt = date && endTime 
          ? new Date(`${date}T${endTime}`).toISOString() 
          : new Date(Date.now() + 3600000).toISOString(); // Default to 1 hour later
      } catch (err) {
        console.error("[IMPROVED] Error creating timestamps:", err);
        // Fallback timestamps if parsing fails
        startsAt = new Date().toISOString();
        endsAt = new Date(Date.now() + 3600000).toISOString();
      }
      
      const fallbackEvent = {
        id: `temp-${Date.now()}`,
        title: title,
        description: description,
        startsAt: startsAt,
        endsAt: endsAt,
        date: date,
        color: eventDetails.color || 'bg-purple-500/70'
      };
      
      console.log("[IMPROVED] Created fallback event:", fallbackEvent);
      return fallbackEvent;
    }
  } catch (err) {
    console.error("[IMPROVED] Failed to parse or process JSON:", err);
    console.error("[IMPROVED] JSON string that failed:", jsonStr);
  }
  
  return null;
}

// Export the function for use in index.ts
module.exports = {
  improvedFallbackExtraction
};
