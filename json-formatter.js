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
  // Try valid JSON first, then use pretty-print without modifying data
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const jsonStr = result.substring(match.start, match.end);
    try {
      // Try parsing as valid JSON first
      let formatted = JSON.stringify(JSON.parse(jsonStr), null, 4);
      result = result.substring(0, match.start) + formatted + result.substring(match.end);
    } catch (e) {
      // If valid JSON parse fails, use simple pretty-print that preserves original data
      let formatted = prettyPrintJSON(jsonStr);
      result = result.substring(0, match.start) + formatted + result.substring(match.end);
    }
  }

// Simple pretty-print that preserves original values (no JSON validation/fixing)
function prettyPrintJSON(str) {
  let result = '';
  let indent = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      result += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escape = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      result += char;
      continue;
    }

    if (char === '{' || char === '[') {
      result += char + '\n' + '  '.repeat(++indent);
    } else if (char === '}' || char === ']') {
      result = result.trimEnd() + char + '\n' + '  '.repeat(--indent);
    } else if (char === ',') {
      result += char + '\n' + '  '.repeat(indent);
    } else if (char === ':') {
      result += ': ';
    } else if (char !== '\n' && char !== '\r') {
      result += char;
    }
  }

  return result.trim();
}

  if (matches.length === 0) {
    throw new Error('No valid JSON found');
  }

  return result;
}