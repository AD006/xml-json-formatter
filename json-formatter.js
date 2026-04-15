// ============================================
// JSON Formatting Only - Preserves escape sequences
// ============================================

// JSON formatter that preserves escape sequences (like \u003c)
function formatJSONPreservingEscapes(jsonStr) {
    try {
        const obj = JSON.parse(jsonStr);
        let pretty = JSON.stringify(obj, null, 4);
        // Replace < and > back to \u003c and \u003e
        pretty = pretty.replace(/</g, '\\u003c');
        pretty = pretty.replace(/>/g, '\\u003e');
        return pretty;
    } catch(e) {
        try {
            let fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1');
            const obj = JSON.parse(fixed);
            let pretty = JSON.stringify(obj, null, 4);
            pretty = pretty.replace(/</g, '\\u003c');
            pretty = pretty.replace(/>/g, '\\u003e');
            return pretty;
        } catch(e2) {
            throw new Error('Invalid JSON');
        }
    }
}

// Extract and format JSON from mixed content
function extractAndFormatJSON(text) {
    let result = text;
    let matches = [];
    let braceCount = 0;
    let bracketCount = 0;
    let start = -1;
    let inString = false;
    
    for (let i = 0; i < result.length; i++) {
        const char = result[i];
        
        if (char === '"' && (i === 0 || result[i-1] !== '\\')) {
            inString = !inString;
        }
        
        if (!inString) {
            if (char === '{') {
                if (braceCount === 0 && bracketCount === 0) start = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && bracketCount === 0 && start !== -1) {
                    matches.push({start: start, end: i + 1});
                    start = -1;
                }
            } else if (char === '[') {
                if (braceCount === 0 && bracketCount === 0) start = i;
                bracketCount++;
            } else if (char === ']') {
                bracketCount--;
                if (bracketCount === 0 && braceCount === 0 && start !== -1) {
                    matches.push({start: start, end: i + 1});
                    start = -1;
                }
            }
        }
    }
    
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const jsonStr = result.substring(match.start, match.end);
        try {
            const formatted = formatJSONPreservingEscapes(jsonStr);
            result = result.substring(0, match.start) + formatted + result.substring(match.end);
        } catch(e) {}
    }
    
    return result;
}