// ══════════════════════════════════════════════════════════════
// Settings Module — v3.0
// Handles: theme switching, editor preferences, settings panel UI
// All preferences saved to localStorage (NO data content stored)
// ══════════════════════════════════════════════════════════════

const SETTINGS_KEY = 'xjf_settings_v3';

// ── Theme Definitions ─────────────────────────────────────────
const THEMES = [
  {
    id: 'default',
    name: 'Default',
    ace: 'ace/theme/chrome',
    swatches: ['#1a1d2e', '#ffffff', '#5865f2', '#f0f2f6']
  },
  {
    id: 'dark',
    name: 'Dark',
    ace: 'ace/theme/monokai',
    swatches: ['#1e1e2e', '#24273a', '#8aadf4', '#a6da95']
  },
  {
    id: 'midnight',
    name: 'Midnight',
    ace: 'ace/theme/twilight',
    swatches: ['#000000', '#0d0d0d', '#00ff88', '#0088ff']
  },
  {
    id: 'solarized',
    name: 'Solarized',
    ace: 'ace/theme/solarized_light',
    swatches: ['#073642', '#fdf6e3', '#268bd2', '#859900']
  },
  {
    id: 'nord',
    name: 'Nord',
    ace: 'ace/theme/tomorrow_night_blue',
    swatches: ['#242933', '#3b4252', '#88c0d0', '#a3be8c']
  },
  {
    id: 'dracula',
    name: 'Dracula',
    ace: 'ace/theme/dracula',
    swatches: ['#21222c', '#343746', '#bd93f9', '#50fa7b']
  },
  {
    id: 'hc',
    name: 'High Contrast',
    ace: 'ace/theme/tomorrow_night_eighties',
    swatches: ['#000000', '#0a0a0a', '#ffff00', '#00ff00']
  }
];

// ── Default Settings ──────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme: 'default',
  fontSize: 13,
  fontFamily: 'Consolas, monospace',
  tabSize: 4,
  wordWrap: true,
  lineNumbers: true,
  jarvisEnabled: true,
  jarvisPersonality: 'friendly',
  compareLayout: 'horizontal'
};

// ── State ─────────────────────────────────────────────────────
let currentSettings = { ...DEFAULT_SETTINGS };
let isPanelOpen = false;

// ── Load / Save ───────────────────────────────────────────────
function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
  } catch (e) {}
}

// ── Apply Theme ───────────────────────────────────────────────
function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  currentSettings.theme = theme.id;

  // Update Ace editor theme
  if (typeof editor !== 'undefined' && editor) {
    editor.setTheme(theme.ace);
  }

  // Update compare editors if they exist
  if (typeof leftEditor !== 'undefined' && leftEditor) leftEditor.setTheme(theme.ace);
  if (typeof rightEditor !== 'undefined' && rightEditor) rightEditor.setTheme(theme.ace);

  // Update theme grid selection
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.themeId === themeId);
  });

  saveSettings();
}

// ── Apply Editor Settings ─────────────────────────────────────
function applyEditorSettings() {
  if (typeof editor === 'undefined' || !editor) return;

  editor.setFontSize(parseInt(currentSettings.fontSize));
  editor.container.style.fontFamily = currentSettings.fontFamily;
  editor.session.setTabSize(parseInt(currentSettings.tabSize));
  editor.session.setUseWrapMode(currentSettings.wordWrap);
  editor.renderer.setShowGutter(currentSettings.lineNumbers);

  // Apply to compare editors too
  [typeof leftEditor !== 'undefined' ? leftEditor : null,
   typeof rightEditor !== 'undefined' ? rightEditor : null].forEach(ed => {
    if (!ed) return;
    ed.setFontSize(parseInt(currentSettings.fontSize));
    ed.session.setTabSize(parseInt(currentSettings.tabSize));
    ed.session.setUseWrapMode(currentSettings.wordWrap);
    ed.renderer.setShowGutter(currentSettings.lineNumbers);
  });
}

// ── Apply Jarvis Settings ─────────────────────────────────────
function applyJarvisSettings() {
  const fab = document.getElementById('chatButton');
  const jarvisWindow = document.getElementById('chatWindow');
  if (fab) fab.style.display = currentSettings.jarvisEnabled ? 'flex' : 'none';
  if (jarvisWindow && !currentSettings.jarvisEnabled) {
    jarvisWindow.classList.remove('open');
  }
  // Expose personality for ai-bot.js
  window.jarvisPersonality = currentSettings.jarvisPersonality;
}

// ── Build Theme Grid ──────────────────────────────────────────
function buildThemeGrid() {
  const grid = document.getElementById('themeGrid');
  if (!grid) return;

  grid.innerHTML = '';
  THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (theme.id === currentSettings.theme ? ' active' : '');
    card.dataset.themeId = theme.id;
    card.title = theme.name;

    const swatchesHtml = theme.swatches.map(c =>
      `<div class="theme-swatch" style="background:${c}"></div>`
    ).join('');

    card.innerHTML = `
      <div class="theme-swatches">${swatchesHtml}</div>
      <span class="theme-card-name">${theme.name}</span>
    `;

    card.addEventListener('click', () => applyTheme(theme.id));
    grid.appendChild(card);
  });
}

// ── Sync UI Controls to currentSettings ──────────────────────
function syncUIToSettings() {
  const el = id => document.getElementById(id);

  // Font Size
  const fsEl = el('fontSizeSetting');
  if (fsEl) fsEl.value = currentSettings.fontSize;

  // Font Family
  const ffEl = el('fontFamilySetting');
  if (ffEl) ffEl.value = currentSettings.fontFamily;

  // Tab Size
  const tsEl = el('tabSizeSetting');
  if (tsEl) tsEl.value = currentSettings.tabSize;

  // Word Wrap
  const wwEl = el('wordWrapSetting');
  if (wwEl) wwEl.checked = currentSettings.wordWrap;

  // Line Numbers
  const lnEl = el('lineNumbersSetting');
  if (lnEl) lnEl.checked = currentSettings.lineNumbers;

  // Jarvis Enabled
  const jeEl = el('jarvisEnabledSetting');
  if (jeEl) jeEl.checked = currentSettings.jarvisEnabled;

  // Jarvis Personality
  const jpEl = el('jarvisPersonalitySetting');
  if (jpEl) jpEl.value = currentSettings.jarvisPersonality;

  // Compare Layout
  const clEl = el('compareLayoutSetting');
  if (clEl) clEl.value = currentSettings.compareLayout;
}

// ── Open / Close Panel ────────────────────────────────────────
function openSettings() {
  isPanelOpen = true;
  buildThemeGrid();
  syncUIToSettings();
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsBackdrop').classList.add('open');
}

function closeSettings() {
  isPanelOpen = false;
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsBackdrop').classList.remove('open');
}

// ── Reset to Defaults ─────────────────────────────────────────
function resetSettings() {
  currentSettings = { ...DEFAULT_SETTINGS };
  saveSettings();
  applyTheme(currentSettings.theme);
  applyEditorSettings();
  applyJarvisSettings();
  syncUIToSettings();
  buildThemeGrid();
}

// ── Initialize ────────────────────────────────────────────────
function initSettings() {
  loadSettings();

  // Wire up settings panel button
  const settingsBtn = document.getElementById('settingsBtn');
  const closeBtn    = document.getElementById('closeSettingsBtn');
  const backdrop    = document.getElementById('settingsBackdrop');

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (closeBtn)    closeBtn.addEventListener('click', closeSettings);
  if (backdrop)    backdrop.addEventListener('click', closeSettings);

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isPanelOpen) closeSettings();
  });

  // Font Size
  const fsEl = document.getElementById('fontSizeSetting');
  if (fsEl) fsEl.addEventListener('change', function() {
    currentSettings.fontSize = parseInt(this.value);
    applyEditorSettings();
    saveSettings();
  });

  // Font Family
  const ffEl = document.getElementById('fontFamilySetting');
  if (ffEl) ffEl.addEventListener('change', function() {
    currentSettings.fontFamily = this.value;
    applyEditorSettings();
    saveSettings();
  });

  // Tab Size
  const tsEl = document.getElementById('tabSizeSetting');
  if (tsEl) tsEl.addEventListener('change', function() {
    currentSettings.tabSize = parseInt(this.value);
    applyEditorSettings();
    saveSettings();
  });

  // Word Wrap
  const wwEl = document.getElementById('wordWrapSetting');
  if (wwEl) wwEl.addEventListener('change', function() {
    currentSettings.wordWrap = this.checked;
    applyEditorSettings();
    saveSettings();
  });

  // Line Numbers
  const lnEl = document.getElementById('lineNumbersSetting');
  if (lnEl) lnEl.addEventListener('change', function() {
    currentSettings.lineNumbers = this.checked;
    applyEditorSettings();
    saveSettings();
  });

  // Jarvis Enabled
  const jeEl = document.getElementById('jarvisEnabledSetting');
  if (jeEl) jeEl.addEventListener('change', function() {
    currentSettings.jarvisEnabled = this.checked;
    applyJarvisSettings();
    saveSettings();
  });

  // Jarvis Personality
  const jpEl = document.getElementById('jarvisPersonalitySetting');
  if (jpEl) jpEl.addEventListener('change', function() {
    currentSettings.jarvisPersonality = this.value;
    window.jarvisPersonality = this.value;
    saveSettings();
  });

  // Compare Layout
  const clEl = document.getElementById('compareLayoutSetting');
  if (clEl) clEl.addEventListener('change', function() {
    currentSettings.compareLayout = this.value;
    if (typeof updateCompareLayout === 'function') updateCompareLayout(this.value);
    saveSettings();
  });

  // Clear chat history
  const clearChatBtn = document.getElementById('clearChatHistoryBtn');
  if (clearChatBtn) clearChatBtn.addEventListener('click', () => {
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.innerHTML = '';
    if (typeof initChatMessages === 'function') initChatMessages();
  });

  // Reset
  const resetBtn = document.getElementById('resetSettingsBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings to defaults?')) resetSettings();
  });

  // Apply initial settings (after a tick so editor is ready)
  setTimeout(() => {
    applyTheme(currentSettings.theme);
    applyEditorSettings();
    applyJarvisSettings();
  }, 50);
}

// Export
window.appSettings = {
  open: openSettings,
  close: closeSettings,
  get: () => ({ ...currentSettings }),
  getThemes: () => THEMES,
  applyTheme,
  applyEditorSettings
};

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}
