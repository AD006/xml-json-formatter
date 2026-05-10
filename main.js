// ══════════════════════════════════════════════════════════════
// Main Application — v3.0
// Smart XML/JSON Formatter by Ashish Dhiman
// ══════════════════════════════════════════════════════════════

// ── Initialize Ace Editor ─────────────────────────────────────
const editor = ace.edit('editor');
editor.setTheme('ace/theme/chrome');
editor.session.setMode('ace/mode/xml');
editor.setShowPrintMargin(false);
editor.setOption('scrollPastEnd', 0.4);
editor.session.setUseWrapMode(true);
editor.setOption('showLineNumbers', true);
editor.session.setFoldStyle('markbegin');
editor.setFontSize(13);

// Welcome screen
const WELCOME = `Smart XML / JSON Formatter v3.0

📋 Beautify XML & JSON instantly
📊 Compare: Side-by-side diff view
💾 Ctrl+S save · Ctrl+Z undo · Ctrl+F find

💬 Jarvis: Ask about your data
⚙ Settings: Themes, fonts & more

Ready? Paste your code and click Beautify.`;

editor.setValue(WELCOME);
editor.clearSelection();
editor.gotoLine(1);

// ── DOM references ────────────────────────────────────────────
const formatBtn   = document.getElementById('formatBtn');
const clearBtn    = document.getElementById('clearBtn');
const copyBtn     = document.getElementById('copyBtn');
const uploadBtn   = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const expandBtn   = document.getElementById('expandBtn');
const collapseBtn = document.getElementById('collapseBtn');
const fileInput   = document.getElementById('fileInput');
const xmlTab      = document.getElementById('xmlTab');
const jsonTab     = document.getElementById('jsonTab');
const statusEl    = document.getElementById('status');
const statusDot   = document.getElementById('statusDot');
const statusMode  = document.getElementById('statusMode');

// ── State ─────────────────────────────────────────────────────
let currentMode = 'xml';
let undoStack   = [];
let redoStack   = [];
let isUndoRedo  = false;

// ── Status Bar ────────────────────────────────────────────────
function setStatus(msg, isError = false) {
  if (statusEl)  statusEl.textContent = msg;
  if (statusDot) statusDot.className = 'status-dot' + (isError ? ' error' : '');
  setTimeout(() => {
    if (statusEl && statusEl.textContent === msg) {
      statusEl.textContent = 'Version 3.0 Ready · Ctrl+Z Undo · Ctrl+Y Redo · Ctrl+S Download · Ctrl+F Find';
      if (statusDot) statusDot.className = 'status-dot';
    }
  }, 3000);
}

// ── Mode Switching ────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;
  editor.session.setMode(mode === 'json' ? 'ace/mode/json' : 'ace/mode/xml');

  xmlTab.classList.toggle('active', mode === 'xml');
  jsonTab.classList.toggle('active', mode === 'json');

  if (statusMode) {
    statusMode.textContent = mode.toUpperCase();
  }
  setStatus(`${mode.toUpperCase()} mode`);
}

xmlTab.addEventListener('click',  () => setMode('xml'));
jsonTab.addEventListener('click', () => setMode('json'));

// ── Auto detect mode from content ────────────────────────────
function autoDetect(content) {
  if (!content || isWelcome(content)) return;
  const t = content.trim();
  if (t.startsWith('<?xml') || (t.startsWith('<') && !t.startsWith('{') && !t.startsWith('['))) {
    if (currentMode !== 'xml') setMode('xml');
  } else if ((t.startsWith('{') || t.startsWith('[')) && !t.startsWith('<')) {
    if (currentMode !== 'json') setMode('json');
  }
}

function isWelcome(content) {
  return content.includes('HOW TO USE') || content.includes('Ashish Dhiman') || content.trim() === '';
}

// ── Undo / Redo ───────────────────────────────────────────────
function saveUndo() {
  if (isUndoRedo) return;
  const v = editor.getValue();
  if (!undoStack.length || undoStack[undoStack.length - 1] !== v) {
    undoStack.push(v);
    redoStack = [];
    if (undoStack.length > 100) undoStack.shift();
  }
}

function undo() {
  if (undoStack.length <= 1) { setStatus('Nothing to undo', true); return; }
  isUndoRedo = true;
  redoStack.push(editor.getValue());
  undoStack.pop();
  editor.setValue(undoStack[undoStack.length - 1]);
  editor.clearSelection();
  isUndoRedo = false;
  setStatus('Undo');
}

function redo() {
  if (!redoStack.length) { setStatus('Nothing to redo', true); return; }
  isUndoRedo = true;
  const next = redoStack.pop();
  undoStack.push(next);
  editor.setValue(next);
  editor.clearSelection();
  isUndoRedo = false;
  setStatus('Redo');
}

saveUndo();

editor.session.on('change', () => {
  saveUndo();
  autoDetect(editor.getValue());
});

// ── Format ────────────────────────────────────────────────────
function formatContent() {
  const raw = editor.getValue();
  if (!raw || isWelcome(raw)) { setStatus('No content to format', true); return; }

  saveUndo();
  setStatus('Formatting…');

  try {
    if (currentMode === 'json') {
      const pretty = formatJSON(raw);
      editor.setValue(pretty);
      editor.clearSelection();
      saveUndo();
      setStatus('JSON formatted ✓');
    } else {
      const pretty = formatXML(raw);
      editor.setValue(pretty);
      editor.clearSelection();
      saveUndo();
      setStatus('XML formatted ✓');
    }
  } catch (e) {
    setStatus('Format error: ' + e.message, true);
  }
}

function formatJSON(str) {
  const trimmed = str.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.stringify(JSON.parse(trimmed), null, 4);
  }
  // try to find JSON inside
  const m = trimmed.match(/[{\[]([\s\S]*)[}\]]/);
  if (m) return JSON.stringify(JSON.parse(m[0]), null, 4);
  throw new Error('No valid JSON found');
}

// ── Clear ─────────────────────────────────────────────────────
function clearContent() {
  saveUndo();
  editor.setValue('');
  editor.clearSelection();
  editor.focus();
  saveUndo();
  setStatus('Cleared');
}

// ── Copy ──────────────────────────────────────────────────────
async function copyContent() {
  const content = editor.getValue();
  if (!content || isWelcome(content)) { setStatus('Nothing to copy', true); return; }
  try {
    await navigator.clipboard.writeText(content);
    setStatus('Copied to clipboard ✓');
  } catch (e) {
    setStatus('Copy failed', true);
  }
}

// ── Download ──────────────────────────────────────────────────
function downloadContent() {
  const content = editor.getValue();
  if (!content || isWelcome(content)) { setStatus('Nothing to download', true); return; }

  const ext  = currentMode === 'json' ? '.json' : '.xml';
  const mime = currentMode === 'json' ? 'application/json' : 'application/xml';
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `formatted${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setStatus(`Downloaded as ${ext} ✓`);
}

// ── Upload ────────────────────────────────────────────────────
function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    saveUndo();
    editor.setValue(evt.target.result);
    editor.clearSelection();
    autoDetect(evt.target.result);
    saveUndo();
    setStatus(`Loaded: ${file.name}`);
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ── Expand / Collapse ─────────────────────────────────────────
function expandAll()  { editor.session.unfold(); setStatus('Expanded all'); }
function collapseAll(){ editor.session.foldAll(); setStatus('Collapsed all'); }

// ── Event Listeners ───────────────────────────────────────────
formatBtn.addEventListener('click',   formatContent);
clearBtn.addEventListener('click',    clearContent);
copyBtn.addEventListener('click',     copyContent);
uploadBtn.addEventListener('click',   () => fileInput.click());
downloadBtn.addEventListener('click', downloadContent);
expandBtn.addEventListener('click',   expandAll);
collapseBtn.addEventListener('click', collapseAll);
fileInput.addEventListener('change',  handleUpload);

// ── Keyboard shortcuts ────────────────────────────────────────
window.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'z') { e.preventDefault(); undo(); }
  if (mod && e.key === 'y') { e.preventDefault(); redo(); }
  if (mod && e.key === 's') { e.preventDefault(); downloadContent(); }
});

// ── Ready ─────────────────────────────────────────────────────
setStatus('Version 3.0 Ready');
