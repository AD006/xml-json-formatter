// ══════════════════════════════════════════════════════════════
// JSON Formatter Module — v3.0
// ══════════════════════════════════════════════════════════════

function formatJSON(str) {
  const trimmed = str.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return JSON.stringify(JSON.parse(trimmed), null, 4);
  }
  // Extract and format all JSON objects found in text
  return extractAndFormatJSON(str);
}

// Find all JSON objects in text and format each one
function extractAndFormatJSON(text) {
  let result = text;
  let matches = [];
  let braceCount = 0;
  let bracketCount = 0;
  let start = -1;
  let inString = false;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];

    // Check if we're entering/leaving a string (handle escaped quotes)
    if (char === '"') {
      let escapeCount = 0;
      let j = i - 1;
      while (j >= 0 && result[j] === '\\') {
        escapeCount++;
        j--;
      }
      if (escapeCount % 2 === 0) { // even count = not escaped
        inString = !inString;
      }
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0 && bracketCount === 0) start = i;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && bracketCount === 0 && start !== -1) {
          matches.push({ start: start, end: i + 1 });
          start = -1;
        }
      } else if (char === '[') {
        if (braceCount === 0 && bracketCount === 0) start = i;
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0 && braceCount === 0 && start !== -1) {
          matches.push({ start: start, end: i + 1 });
          start = -1;
        }
      }
    }
  }

  // Format each JSON match from end to start to preserve positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const jsonStr = result.substring(match.start, match.end);
    try {
      let formatted = JSON.stringify(JSON.parse(jsonStr), null, 4);
      result = result.substring(0, match.start) + formatted + result.substring(match.end);
    } catch (e) {
      // Try to fix common JSON issues and retry
      try {
        let fixed = jsonStr
          .replace(/,\s*([}\]])/g, '$1')  // remove trailing commas
          .replace(/(\w+):/g, '"$1":')    // add quotes to keys
          .replace(/:\s*([A-Za-z][A-Za-z0-9_]*)\s*([,}\]])/g, ': "$1"$2'); // quote unquoted values
        let formatted = JSON.stringify(JSON.parse(fixed), null, 4);
        result = result.substring(0, match.start) + formatted + result.substring(match.end);
      } catch (e2) { }
    }
  }

  if (matches.length === 0) {
    throw new Error('No valid JSON found');
  }

  return result;
}