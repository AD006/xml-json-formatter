// ══════════════════════════════════════════════════════════════
// Compare Mode — v3.0
// Professional side-by-side XML/JSON comparison with diff view
// ══════════════════════════════════════════════════════════════

let leftEditor  = null;
let rightEditor = null;
let isCompareMode = false;

// ── DOM refs ──────────────────────────────────────────────────
const getEl = id => document.getElementById(id);

// ── Initialize ────────────────────────────────────────────────
function initCompareMode() {
  const compareBtn     = getEl('compareBtn');
  const closeCompareBtn = getEl('closeCompareBtn');
  const compareNowBtn  = getEl('compareNowBtn');
  const copyLtoRBtn    = getEl('copyLeftToRightBtn');
  const copyRtoLBtn    = getEl('copyRightToLeftBtn');

  if (compareBtn)     compareBtn.addEventListener('click', enableCompareMode);
  if (closeCompareBtn) closeCompareBtn.addEventListener('click', disableCompareMode);
  if (compareNowBtn)  compareNowBtn.addEventListener('click', runComparison);
  if (copyLtoRBtn)    copyLtoRBtn.addEventListener('click', copyLeftToRight);
  if (copyRtoLBtn)    copyRtoLBtn.addEventListener('click', copyRightToLeft);
}

// ── Enable / Disable ──────────────────────────────────────────
function enableCompareMode() {
  isCompareMode = true;
  const current = getMainEditorContent();

  getEl('editorView').style.display  = 'none';
  getEl('compareView').style.display = 'flex';

  initCompareEditors(current);
  setStatus('Compare mode enabled — paste content in both panels');
}

function disableCompareMode() {
  isCompareMode = false;
  getEl('compareView').style.display = 'none';
  getEl('editorView').style.display  = 'flex';

  if (typeof editor !== 'undefined' && editor) editor.resize();
  setStatus('Compare mode closed');
}

// ── Create Ace editors ────────────────────────────────────────
function initCompareEditors(leftContent) {
  const theme = getAceTheme();
  const mode  = getAceMode();

  if (!leftEditor) {
    leftEditor = ace.edit('leftEditor');
    configureCompareEditor(leftEditor, theme, mode, leftContent || '');
  } else {
    leftEditor.setTheme(theme);
    leftEditor.session.setMode(mode);
    if (leftContent) { leftEditor.setValue(leftContent); leftEditor.clearSelection(); }
  }

  if (!rightEditor) {
    rightEditor = ace.edit('rightEditor');
    configureCompareEditor(rightEditor, theme, mode, '');
  } else {
    rightEditor.setTheme(theme);
    rightEditor.session.setMode(mode);
  }

  // Apply saved font size
  if (window.appSettings) {
    const s = window.appSettings.get();
    leftEditor.setFontSize(s.fontSize);
    rightEditor.setFontSize(s.fontSize);
    leftEditor.session.setTabSize(s.tabSize);
    rightEditor.session.setTabSize(s.tabSize);
    leftEditor.session.setUseWrapMode(s.wordWrap);
    rightEditor.session.setUseWrapMode(s.wordWrap);
  }
}

function configureCompareEditor(ed, theme, mode, value) {
  ed.setTheme(theme);
  ed.session.setMode(mode);
  ed.setShowPrintMargin(false);
  ed.session.setUseWrapMode(true);
  ed.setOption('scrollPastEnd', 0.3);
  ed.setValue(value);
  ed.clearSelection();
  ed.setFontSize(13);
}

// ── Run Comparison ────────────────────────────────────────────
function runComparison() {
  if (!leftEditor || !rightEditor) return;

  const left  = leftEditor.getValue().trim();
  const right = rightEditor.getValue().trim();

  const summary = getEl('diffSummary');

  if (!left && !right) {
    summary.innerHTML = renderWarning('Both panels are empty. Paste XML/JSON in both panels first.');
    return;
  }
  if (!left) {
    summary.innerHTML = renderWarning('Left panel (Original) is empty. Please paste your original content.');
    return;
  }
  if (!right) {
    summary.innerHTML = renderWarning('Right panel (Modified) is empty. Please paste the modified version.');
    return;
  }
  if (left === right) {
    summary.innerHTML = renderIdentical();
    return;
  }

  const diffs = computeDiff(left.split('\n'), right.split('\n'));
  summary.innerHTML = renderDiffResults(diffs, left.split('\n'), right.split('\n'));

  // Highlight lines in editors
  highlightDiffLines(diffs);
  setStatus(`Comparison complete — ${diffs.length} difference(s) found`);
}

// ── Simple LCS-based Diff ─────────────────────────────────────
function computeDiff(leftLines, rightLines) {
  const diffs = [];
  const maxLines = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < maxLines; i++) {
    const l = (leftLines[i]  !== undefined) ? leftLines[i]  : null;
    const r = (rightLines[i] !== undefined) ? rightLines[i] : null;

    if (l === null) {
      diffs.push({ line: i + 1, type: 'added',   left: null, right: r });
    } else if (r === null) {
      diffs.push({ line: i + 1, type: 'removed', left: l, right: null });
    } else if (l !== r) {
      diffs.push({ line: i + 1, type: 'changed', left: l, right: r });
    }
  }
  return diffs;
}

// ── Highlight diff lines in Ace editors ───────────────────────
function highlightDiffLines(diffs) {
  if (!leftEditor || !rightEditor) return;

  // Clear previous markers
  leftEditor.session.clearAnnotations();
  rightEditor.session.clearAnnotations();

  const leftAnnotations  = [];
  const rightAnnotations = [];

  diffs.forEach(diff => {
    const row = diff.line - 1;
    if (diff.type === 'changed' || diff.type === 'removed') {
      leftAnnotations.push({ row, column: 0, text: '◀ Changed', type: 'warning' });
    }
    if (diff.type === 'changed' || diff.type === 'added') {
      rightAnnotations.push({ row, column: 0, text: '▶ Changed', type: 'info' });
    }
  });

  leftEditor.session.setAnnotations(leftAnnotations);
  rightEditor.session.setAnnotations(rightAnnotations);
}

// ── Render Helpers ────────────────────────────────────────────
function renderWarning(msg) {
  return `<div class="diff-empty">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    ${escHtml(msg)}
  </div>`;
}

function renderIdentical() {
  return `<div class="diff-identical">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    No differences — both panels are identical.
  </div>`;
}

function renderDiffResults(diffs, leftLines, rightLines) {
  const total   = diffs.length;
  const changed = diffs.filter(d => d.type === 'changed').length;
  const added   = diffs.filter(d => d.type === 'added').length;
  const removed = diffs.filter(d => d.type === 'removed').length;

  let html = `<div class="diff-stats">
    <span>Found <strong>${total}</strong> difference(s)</span>
    ${changed ? `<span class="diff-stat-badge changed">~ ${changed} changed</span>` : ''}
    ${added   ? `<span class="diff-stat-badge changed">+ ${added} added</span>` : ''}
    ${removed ? `<span class="diff-stat-badge changed">- ${removed} removed</span>` : ''}
  </div>`;

  diffs.slice(0, 50).forEach(diff => {
    html += `<div class="diff-item">
      <span class="diff-line-num">L${diff.line}</span>
      <div class="diff-cell left">${diff.left !== null ? escHtml(diff.left.substring(0, 120)) : '<em>(missing)</em>'}</div>
      <div class="diff-cell right">${diff.right !== null ? escHtml(diff.right.substring(0, 120)) : '<em>(missing)</em>'}</div>
    </div>`;
  });

  if (diffs.length > 50) {
    html += `<div class="diff-empty" style="margin-top:6px;">... and ${diffs.length - 50} more differences</div>`;
  }

  return html;
}

// ── Copy helpers ──────────────────────────────────────────────
function copyLeftToRight() {
  if (!leftEditor || !rightEditor) return;
  rightEditor.setValue(leftEditor.getValue());
  rightEditor.clearSelection();
  runComparison();
  setStatus('Copied left → right');
}

function copyRightToLeft() {
  if (!leftEditor || !rightEditor) return;
  leftEditor.setValue(rightEditor.getValue());
  leftEditor.clearSelection();
  runComparison();
  setStatus('Copied right → left');
}

// ── Update layout (horizontal / vertical) ────────────────────
function updateCompareLayout(layout) {
  const panels = getEl('comparePanels');
  if (!panels) return;
  panels.style.flexDirection = layout === 'vertical' ? 'column' : 'row';

  const gutter = panels.querySelector('.compare-gutter');
  if (gutter) {
    gutter.style.width = layout === 'vertical' ? '100%' : '44px';
    gutter.style.height = layout === 'vertical' ? '30px' : 'auto';
    gutter.style.flexDirection = layout === 'vertical' ? 'row' : 'column';
  }

  // Resize editors
  setTimeout(() => {
    if (leftEditor) leftEditor.resize();
    if (rightEditor) rightEditor.resize();
  }, 100);
}

// ── Helpers ───────────────────────────────────────────────────
function getMainEditorContent() {
  if (typeof editor !== 'undefined' && editor && editor.getValue) {
    return editor.getValue();
  }
  return '';
}

function getAceTheme() {
  if (window.appSettings) {
    const themes = window.appSettings.getThemes();
    const s = window.appSettings.get();
    const t = themes.find(x => x.id === s.theme);
    if (t) return t.ace;
  }
  return 'ace/theme/chrome';
}

function getAceMode() {
  if (typeof currentMode !== 'undefined') {
    return currentMode === 'json' ? 'ace/mode/json' : 'ace/mode/xml';
  }
  return 'ace/mode/xml';
}

function setStatus(msg, isError = false) {
  const el  = document.getElementById('status');
  const dot = document.getElementById('statusDot');
  if (el)  el.textContent = msg;
  if (dot) dot.className = 'status-dot' + (isError ? ' error' : '');
  setTimeout(() => {
    if (el && el.textContent === msg)
      el.textContent = 'Version 3.0 Ready · Ctrl+Z Undo · Ctrl+Y Redo · Ctrl+S Download · Ctrl+F Find';
    if (dot) dot.className = 'status-dot';
  }, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Bootstrap ─────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCompareMode);
} else {
  initCompareMode();
}

// ── Export ────────────────────────────────────────────────────
window.compareMode = {
  isActive: () => isCompareMode,
  updateTheme: (themeId) => {
    const theme = window.appSettings ? window.appSettings.getThemes().find(t => t.id === themeId) : null;
    const aceTheme = theme ? theme.ace : 'ace/theme/chrome';
    if (leftEditor)  leftEditor.setTheme(aceTheme);
    if (rightEditor) rightEditor.setTheme(aceTheme);
  }
};

window.updateCompareLayout = updateCompareLayout;
