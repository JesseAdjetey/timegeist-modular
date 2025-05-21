// Improved version of extractStructuredData function for the process-scheduling Edge Function
// This version includes a more flexible regex pattern that can capture JSON data from Claude's responses
// even when the formatting might be inconsistent.

function extractStructuredData(response: string): CalendarOperation | null {
  try {
    // 1. Look for JSON block with proper code block markers
    const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      console.log("Found JSON match format in Claude response:", jsonMatch[1]);
      try {
        const data = JSON.parse(jsonMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing JSON from matched block:", parseError);
        console.error("Raw matched JSON block:", jsonMatch[1]);
        // Continue to try other formats even if this one fails
      }
    }
    
    // 2. Look for XML-style tags
    const xmlMatch = response.match(/<calendar_operation>([\s\S]*?)<\/calendar_operation>/);
    if (xmlMatch && xmlMatch[1]) {
      console.log("Found XML-style format in Claude response:", xmlMatch[1]);
      try {
        const data = JSON.parse(xmlMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing JSON from XML-style block:", parseError);
        console.error("Raw matched XML-style block:", xmlMatch[1]);
        // Continue to try other formats
      }
    }
    
    // 3. Look for direct JSON patterns without code block markers
    const directJsonMatch = response.match(/(\{[\s\S]*?"action"\s*:\s*"(create|edit|delete|query)"[\s\S]*?\})/);
    if (directJsonMatch && directJsonMatch[1]) {
      console.log("Found direct JSON format in Claude response:", directJsonMatch[1]);
      try {
        const data = JSON.parse(directJsonMatch[1]);
        return data as CalendarOperation;
      } catch (parseError) {
        console.error("Error parsing direct JSON:", parseError);
        console.error("Raw matched direct JSON:", directJsonMatch[1]);
        // Continue to try more flexible formats
      }
    }
    
    // 4. NEW: Enhanced pattern that's more permissive with JSON formatting
    // This can find JSON even with some whitespace issues or when mixed with text
    const enhancedJsonPattern = /(?:\`\`\`(?:json)?\s*)?(\{[\s\S]*?"action"\s*:\s*"(?:create|edit|delete|query)"[\s\S]*?\})(?:\s*\`\`\`)?/;
    if (enhancedJsonPattern.test(response)) {
      const match = response.match(enhancedJsonPattern);
      if (match && match[1]) {
        console.log("Found enhanced JSON pattern in Claude response:", match[1]);
        try {
          // Try to clean the JSON string before parsing
          const cleanedJson = match[1]
            .replace(/\n/g, ' ')  // Replace newlines with spaces
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/\s+/g, ' ');  // Normalize whitespace
          
          const data = JSON.parse(cleanedJson);
          return data as CalendarOperation;
        } catch (parseError) {
          console.error("Error parsing enhanced JSON pattern:", parseError);
          console.error("Raw matched enhanced JSON:", match[1]);
        }
      }
    }
    
    // 5. LAST RESORT: Try to find any JSON-like structure with action field
    // This is a very permissive pattern that might catch malformed JSON
    const fallbackJsonPattern = /\{([^{}]*"action"[^{}]*)\}/g;
    let fallbackMatch;
    while ((fallbackMatch = fallbackJsonPattern.exec(response)) !== null) {
      const potentialJson = `{${fallbackMatch[1]}}`;
      console.log("Attempting to parse potential JSON structure:", potentialJson);
      try {
        // Try to fix common JSON formatting issues
        const fixedJson = potentialJson
          .replace(/(\w+):/g, '"$1":')  // Add quotes to keys without them
          .replace(/:\s*'([^']*)'/g, ':"$1"')  // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}');  // Remove trailing commas
          
        const data = JSON.parse(fixedJson);
        if (data.action && ['create', 'edit', 'delete', 'query'].includes(data.action)) {
          console.log("Successfully parsed fallback JSON pattern");
          return data as CalendarOperation;
        }
      } catch (parseError) {
        console.error("Failed to parse fallback JSON pattern");
      }
    }
    
    console.warn("No structured data format found in Claude response");
    // Log the full response to help with debugging
    console.warn("Full response for debugging:", response);
    return null;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return null;
  }
}
