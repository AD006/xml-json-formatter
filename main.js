// ============================================
// Main Application Logic
// ============================================

// Initialize Ace Editor
const editor = ace.edit("editor");
editor.setTheme("ace/theme/chrome");
editor.session.setMode("ace/mode/xml");
editor.setShowPrintMargin(false);
editor.setOption("scrollPastEnd", 3);
editor.session.setUseWrapMode(true);
editor.setOption("showLineNumbers", true);
editor.session.setFoldStyle("markbegin");
editor.focus();

// DOM Elements
const statusSpan = document.getElementById('status');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const uploadBtn = document.getElementById('uploadBtn');
const expandBtn = document.getElementById('expandBtn');
const collapseBtn = document.getElementById('collapseBtn');
const modeToggle = document.getElementById('modeToggle');
const xmlLabel = document.getElementById('xmlLabel');
const jsonLabel = document.getElementById('jsonLabel');
const fileInput = document.getElementById('fileInput');

// Current mode (xml or json)
let currentMode = 'xml'; // 'xml' or 'json'

// Undo/Redo Stack
let undoStack = [];
let redoStack = [];
let isUndoRedoOperation = false;

function saveToUndoStack() {
    if (isUndoRedoOperation) return;
    const currentValue = editor.getValue();
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentValue) {
        undoStack.push(currentValue);
        redoStack = [];
        if (undoStack.length > 100) undoStack.shift();
    }
}

function undo() {
    if (undoStack.length <= 1) {
        setStatus('Nothing to undo', true);
        return;
    }
    isUndoRedoOperation = true;
    redoStack.push(editor.getValue());
    undoStack.pop();
    editor.setValue(undoStack[undoStack.length - 1]);
    editor.gotoLine(0);
    isUndoRedoOperation = false;
    setStatus('Undo');
}

function redo() {
    if (redoStack.length === 0) {
        setStatus('Nothing to redo', true);
        return;
    }
    isUndoRedoOperation = true;
    const nextValue = redoStack.pop();
    undoStack.push(nextValue);
    editor.setValue(nextValue);
    editor.gotoLine(0);
    isUndoRedoOperation = false;
    setStatus('Redo');
}

saveToUndoStack();

// Auto-detect mode based on content
function autoDetectMode() {
    const content = editor.getValue();
    if (!content.trim() || content === "Paste your XML/JSON here...") return;
    
    if (content.trim().startsWith('<?xml') || (content.includes('<') && content.includes('>'))) {
        currentMode = 'xml';
        editor.session.setMode("ace/mode/xml");
        xmlLabel.classList.add('active');
        jsonLabel.classList.remove('active');
        modeToggle.checked = false;
    } else if ((content.trim().startsWith('{') && content.includes(':')) || content.trim().startsWith('[')) {
        currentMode = 'json';
        editor.session.setMode("ace/mode/json");
        xmlLabel.classList.remove('active');
        jsonLabel.classList.add('active');
        modeToggle.checked = true;
    }
}

editor.session.on('change', () => {
    saveToUndoStack();
    autoDetectMode();
});

function setStatus(msg, isError = false) {
    statusSpan.innerHTML = (isError ? '❌ ' : '✅ ') + msg;
    setTimeout(() => {
        if (statusSpan.innerHTML === (isError ? '❌ ' : '✅ ') + msg) {
            statusSpan.innerHTML = '✅ Ready (Ctrl+Z = Undo, Ctrl+Y = Redo, Ctrl+S = Download, Ctrl+F = Find/Replace)';
        }
    }, 3000);
}

// Main Format Function - Uses current mode
function formatContent() {
    let text = editor.getValue();
    if (!text.trim() || text === "Paste your XML/JSON here...") {
        setStatus('No content to format', true);
        return;
    }
    
    saveToUndoStack();
    setStatus('Formatting...');
    
    let result = text;
    
    // Format based on current mode (XML or JSON)
    if (currentMode === 'json') {
        // Try to format as JSON
        try {
            // First check if it's pure JSON
            let trimmed = text.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                result = formatJSONPreservingEscapes(text);
            } else {
                // Mixed content - extract JSON
                result = extractAndFormatJSON(text);
            }
            editor.setValue(result);
            editor.gotoLine(0);
            saveToUndoStack();
            setStatus('JSON formatted');
            return;
        } catch(e) {
            setStatus('JSON format error: ' + e.message, true);
            return;
        }
    } 
    else if (currentMode === 'xml') {
        // Format as XML
        try {
            let trimmed = text.trim();
            if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && !trimmed.startsWith('{') && !trimmed.startsWith('['))) {
                result = formatXML(text);
            } else {
                // Mixed content - extract XML
                let xmlMatch = text.match(/<[\s\S]*>/);
                if (xmlMatch) {
                    let formattedXML = formatXML(xmlMatch[0]);
                    result = text.replace(xmlMatch[0], '\n' + formattedXML + '\n');
                } else {
                    throw new Error('No XML found');
                }
            }
            editor.setValue(result);
            editor.gotoLine(0);
            saveToUndoStack();
            setStatus('XML formatted');
            return;
        } catch(e) {
            setStatus('XML format error: ' + e.message, true);
            return;
        }
    }
}

function clearContent() {
    saveToUndoStack();
    editor.setValue('');
    saveToUndoStack();
    setStatus('Cleared');
}

async function copyContent() {
    const content = editor.getValue();
    await navigator.clipboard.writeText(content);
    setStatus('Copied!');
}

function downloadContent() {
    const content = editor.getValue();
    if (!content.trim() || content === "Paste your XML/JSON here...") {
        setStatus('No content to download', true);
        return;
    }
    
    let fileExtension = '.txt';
    let mimeType = 'text/plain';
    
    if (currentMode === 'xml') {
        fileExtension = '.xml';
        mimeType = 'application/xml';
    } else if (currentMode === 'json') {
        fileExtension = '.json';
        mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_content${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(`Downloaded as ${fileExtension}`);
}

function expandAll() {
    editor.session.unfold();
    setStatus('Expanded all');
}

function collapseAll() {
    editor.session.foldAll();
    setStatus('Collapsed all');
}

function handleFileUpload(e) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (evt) => {
        saveToUndoStack();
        editor.setValue(evt.target.result);
        editor.gotoLine(0);
        autoDetectMode(); // Auto-detect after loading
        saveToUndoStack();
        setStatus(`Loaded: ${file.name}`);
    };
    reader.readAsText(file);
}

// Event Listeners
formatBtn.addEventListener('click', formatContent);
clearBtn.addEventListener('click', clearContent);
copyBtn.addEventListener('click', copyContent);
uploadBtn.addEventListener('click', () => fileInput.click());
expandBtn.addEventListener('click', expandAll);
collapseBtn.addEventListener('click', collapseAll);
fileInput.addEventListener('change', handleFileUpload);

// Slider toggle - changes the mode and formats accordingly
modeToggle.addEventListener('change', function() {
    if (modeToggle.checked) {
        currentMode = 'json';
        xmlLabel.classList.remove('active');
        jsonLabel.classList.add('active');
        editor.session.setMode("ace/mode/json");
        setStatus('JSON mode selected - Click Format to beautify JSON');
    } else {
        currentMode = 'xml';
        xmlLabel.classList.add('active');
        jsonLabel.classList.remove('active');
        editor.session.setMode("ace/mode/xml");
        setStatus('XML mode selected - Click Format to beautify XML');
    }
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadContent();
    }
});

// Initialize chat and status
initChat();
setStatus('Ready');
autoDetectMode();