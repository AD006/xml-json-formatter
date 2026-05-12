// ══════════════════════════════════════════════════════════════
// JSON Formatter Module — v3.0
// Simple pretty-print without JSON validation
// ══════════════════════════════════════════════════════════════

function formatJSON(str) {
  const trimmed = str.trim();

  // Check if this is standard JSON (clean JSON with no issues)
  // If it has -- or embedded text, use pretty-print
  const hasSpecialChars = trimmed.includes('--') || trimmed.includes('://') || trimmed.includes('<');

  if (!hasSpecialChars && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      JSON.parse(trimmed);
      return JSON.stringify(JSON.parse(trimmed), null, 4);
    } catch (e) {
      // Fall through to pretty-print
    }
  }

  // For any JSON with special chars, embedded text, or XML - just add indentation
  return prettyPrintJSON(str);
}

// Simple pretty-print that preserves original and just adds indentation
function prettyPrintJSON(str) {
  let result = '';
  let indent = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // Handle escape sequences
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

    // Track string state
    if (char === '"' && !escape) {
      result += char;
      inString = !inString;
      continue;
    }

    // Inside strings, preserve everything
    if (inString) {
      result += char;
      continue;
    }

    // Handle opening braces - ALWAYS add newline after
    if (char === '{' || char === '[') {
      result += char;
      result += '\n' + '  '.repeat(++indent);
      continue;
    }

    // Handle closing braces - add newline before
    if (char === '}' || char === ']') {
      result = result.trimEnd();
      result += '\n' + '  '.repeat(--indent) + char;
      continue;
    }

    // Handle colon - ALWAYS add space after
    if (char === ':') {
      result += ': ';
      continue;
    }

    // Handle comma - add newline after
    if (char === ',') {
      result += ',\n' + '  '.repeat(indent);
      continue;
    }

    // Preserve all other characters as-is (skip existing whitespace)
    if (char !== ' ' && char !== '\n' && char !== '\t' && char !== '\r') {
      result += char;
    }
  }

  return result.trim();
}