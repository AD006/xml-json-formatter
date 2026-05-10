// ══════════════════════════════════════════════════════════════
// Jarvis Assistant — v3.0
// 100% local · Zero data sent externally · In-browser XML/JSON analysis
// ══════════════════════════════════════════════════════════════

let chatMessages = null;
let chatInput    = null;
let isChatOpen   = false;
let unreadCount  = 0;
let userName     = null;
let conversationHistory = [];

// ── Initialize ────────────────────────────────────────────────
function initChat() {
  chatMessages = document.getElementById('chatMessages');
  chatInput    = document.getElementById('chatInput');

  const fab       = document.getElementById('chatButton');
  const closeBtn  = document.getElementById('closeChat');
  const sendBtn   = document.getElementById('sendChat');
  const win       = document.getElementById('chatWindow');

  if (fab) {
    fab.addEventListener('click', e => {
      e.stopPropagation();
      win.classList.toggle('open');
      isChatOpen = win.classList.contains('open');
      if (isChatOpen) {
        unreadCount = 0;
        updateBadge();
        if (chatInput) chatInput.focus();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      win.classList.remove('open');
      isChatOpen = false;
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage());

  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Close on outside click
  document.addEventListener('click', e => {
    if (isChatOpen && win && fab) {
      if (!win.contains(e.target) && !fab.contains(e.target)) {
        win.classList.remove('open');
        isChatOpen = false;
      }
    }
  });

  initChatMessages();
}

function initChatMessages() {
  if (!chatMessages) return;
  chatMessages.innerHTML = '';
  conversationHistory = [];
  addBotMessage("Hey! I'm <strong>Jarvis</strong> 👋 — your local assistant.<br><br>Paste any XML or JSON in the editor and ask me about it. I analyze everything right here in your browser — nothing leaves your device.");
}

// ── Badge ─────────────────────────────────────────────────────
function updateBadge() {
  const badge = document.getElementById('jarvisBadge');
  if (!badge) return;
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Add Messages ──────────────────────────────────────────────
function addBotMessage(html) {
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.className = 'j-msg bot';
  div.innerHTML = `<div class="j-bubble">${html}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (!isChatOpen) {
    unreadCount++;
    updateBadge();
  }
}

function addUserMessage(text) {
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.className = 'j-msg user';
  div.innerHTML = `<div class="j-bubble">${escHtml(text)}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showThinking() {
  const div = document.createElement('div');
  div.className = 'j-msg bot thinking-msg';
  div.innerHTML = `<div class="j-bubble j-thinking"><div class="j-dot"></div><div class="j-dot"></div><div class="j-dot"></div></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ── Send ──────────────────────────────────────────────────────
function sendMessage() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;

  addUserMessage(text);
  chatInput.value = '';

  const thinkingEl = showThinking();

  setTimeout(() => {
    if (thinkingEl && thinkingEl.parentNode) thinkingEl.parentNode.removeChild(thinkingEl);
    const response = getJarvisResponse(text);
    addBotMessage(response);
    conversationHistory.push({ user: text, bot: response });
  }, 280);
}

// ══════════════════════════════════════════════════════════════
// LOCAL XML/JSON ANALYSIS ENGINE
// ══════════════════════════════════════════════════════════════

function getEditorContent() {
  if (typeof editor !== 'undefined' && editor) return editor.getValue() || '';
  return '';
}

function isWelcomeScreen(content) {
  return content.includes('SMART XML/JSON FORMATTER') || content.includes('HOW TO USE') || content.trim() === '';
}

function detectContentType(content) {
  const t = content.trim();
  if (t.startsWith('<?xml') || (t.startsWith('<') && !t.startsWith('{') && !t.startsWith('['))) return 'xml';
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) return 'json';
  return 'unknown';
}

// ── XML Analysis ──────────────────────────────────────────────
function analyzeXML(content) {
  const tags       = [...content.matchAll(/<([a-zA-Z][a-zA-Z0-9_:.-]*)[\s>\/]/g)].map(m => m[1]);
  const unique     = [...new Set(tags)];
  const attrs      = [...content.matchAll(/([a-zA-Z][a-zA-Z0-9_:]*)=["']([^"']*)["']/g)].map(m => ({ name: m[1], value: m[2] }));
  const textNodes  = [...content.matchAll(/>([^<\n]{1,80})</g)].map(m => m[1].trim()).filter(Boolean);
  const rootMatch  = content.match(/<([a-zA-Z][a-zA-Z0-9_:.-]*)[\s>]/);
  const lineCount  = content.split('\n').length;
  const xmlDecl    = content.includes('<?xml');

  return { tags, unique, attrs, textNodes, root: rootMatch ? rootMatch[1] : null, lineCount, xmlDecl };
}

// ── JSON Analysis ─────────────────────────────────────────────
function analyzeJSON(content) {
  try {
    const parsed = JSON.parse(content);
    const keys = [], strings = [], numbers = [], booleans = [], arrays = [], nulls = [];

    function traverse(obj, path) {
      if (obj === null) { nulls.push(path); return; }
      if (Array.isArray(obj)) {
        arrays.push({ path, length: obj.length });
        obj.forEach((item, i) => traverse(item, `${path}[${i}]`));
      } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          const p = path ? `${path}.${k}` : k;
          keys.push({ key: k, path: p });
          traverse(v, p);
        });
      } else if (typeof obj === 'string') { strings.push({ path, value: obj }); }
        else if (typeof obj === 'number') { numbers.push({ path, value: obj }); }
        else if (typeof obj === 'boolean') { booleans.push({ path, value: obj }); }
    }

    traverse(parsed, '');
    const isArray = Array.isArray(parsed);
    return { parsed, keys, strings, numbers, booleans, arrays, nulls, isArray, lineCount: content.split('\n').length };
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// INTENT RECOGNITION - Enhanced for Human Language
// ══════════════════════════════════════════════════════════════

function recognize(text) {
  const t = text.toLowerCase();

  // Creator / about
  if (/who (made|created|built|developed|coded|programmed|designed) you|your (creator|developer|author|maker)|who is ashish|ashish dhiman/i.test(t))
    return 'creator';

  // Name / Identity
  if (/what.*(your name|are you)|who are you|introduce yourself/i.test(t)) return 'name';
  if (/my name is|i am |call me /i.test(t)) return 'set_name';
  if (/who are you|what are you/i.test(t)) return 'who_are_you';

  // Capabilities
  if (/what can you|what do you do|help me|your (features|abilities|capabilities)|what.*help/i.test(t)) return 'capabilities';

  // Find/Search - more natural
  if (/(find|search|look for|where is|get|show|give|list).*(name|email|user|id|key|value|tag|element)/i.test(t)) return 'find';

  // Natural language - analyze/explain (check after find to avoid overlap)
  if (/analyz|tell me about|what is this|explain (this|the)|describe|understanding|what does|what's in|check this/i.test(t)) return 'summary';
  if (/is this valid|check (valid|correct|syntax)|validate|is it correct|is it right/i.test(t)) return 'validate';

  // Bug finding - more natural
  if (/bug|error|wrong|issue|problem|broken|not working|is there.*error|find.*bug|check.*error/i.test(t)) return 'find_bug';

  // Count questions - more natural
  if (/how many|count|number of|total|how much/i.test(t)) return 'count';

  // Structure questions
  if (/(root|main|top) (tag|element|node|first)/i.test(t)) return 'root';
  if (/list.*(tag|element|node)|all.*tag|what.*tag/i.test(t)) return 'tags';
  if (/(attribute|attr)s?/i.test(t)) return 'attributes';
  if (/key|field|property/i.test(t)) return 'keys';
  if (/array|list|collection/i.test(t)) return 'arrays';
  if (/value/i.test(t)) return 'values';
  if (/string|text/i.test(t)) return 'strings';
  if (/number|numeric|integer/i.test(t)) return 'numbers';
  if (/boolean|bool/i.test(t)) return 'booleans';
  if (/null|empty/i.test(t)) return 'nulls';

  // Size/length
  if (/size|length|how (big|long|large)|how much/i.test(t)) return 'meta';

  // Simple greetings
  if (/^(hi|hey|hello|howdy|sup|yo|good morning|good afternoon|greetings)/i.test(t)) return 'greeting';
  if (/how are you|how.*(doing|going)|how do you do/i.test(t)) return 'how_are_you';

  // Social
  if (/thank|thanks|appreciate/i.test(t)) return 'thanks';
  if (/bye|goodbye|cya|see you|farewell|good night/i.test(t)) return 'farewell';
  if (/joke|funny|make me laugh/i.test(t)) return 'joke';
  if (/fact|did you know|interesting/i.test(t)) return 'fact';

  // Utility
  if (/time|clock/i.test(t)) return 'time';
  if (/date|today/i.test(t)) return 'date';
  if (/(\d+)\s*[+\-*/x]\s*(\d+)/.test(t)) return 'math';
  if (/format|beautify|pretty|prettify/i.test(t)) return 'format_hint';
  if (/compare|diff|vs|versus/i.test(t)) return 'compare_hint';

  return 'unknown';
}

// ══════════════════════════════════════════════════════════════
// RESPONSE GENERATOR
// ══════════════════════════════════════════════════════════════

function getJarvisResponse(input) {
  const intent  = recognize(input);
  const content = getEditorContent();
  const hasData = !isWelcomeScreen(content);
  const type    = hasData ? detectContentType(content) : 'none';
  const p       = window.jarvisPersonality || 'friendly';

  // ── Creator ───────────────────────────────────────────────
  if (intent === 'creator') {
    return "I was created by <strong>Ashish Dhiman</strong> 🙏 — a data scientist building adaptive tools for XML/JSON parsing, validation, and intelligent data interaction.";
  }

  // ── Name ──────────────────────────────────────────────────
  if (intent === 'name') {
    return `I'm <strong>Jarvis</strong>! Your local XML/JSON assistant${userName ? ', and you\'re ' + userName : ''}. 🎩`;
  }

  if (intent === 'set_name') {
    const m = input.match(/(?:my name is|i am|call me) ([a-zA-Z]+)/i);
    if (m) {
      userName = m[1];
      return `Nice to meet you, <strong>${userName}</strong>! 👋 I'll remember that. What would you like to know about your data?`;
    }
  }

  // ── Capabilities ──────────────────────────────────────────
  if (intent === 'capabilities') {
    return `Here's what I can do:<br><br>
      📄 <strong>Analyze XML</strong> — tags, attributes, text, root element<br>
      📋 <strong>Analyze JSON</strong> — keys, values, arrays, types<br>
      ✅ <strong>Validate</strong> — check if your data is well-formed<br>
      🔍 <strong>Search</strong> — find specific fields or values<br>
      📊 <strong>Summarize</strong> — give you a quick overview<br>
      🐛 <strong>Find Bugs</strong> — detect errors in your code<br>
      🧮 <strong>Math</strong> — quick calculations<br><br>
      Just paste your XML/JSON in the editor and ask away!`;
  }

  // ── Who are you ───────────────────────────────────────────
  if (intent === 'who_are_you') {
    return "I'm <strong>Jarvis</strong> — your smart assistant for XML and JSON. I analyze code, find bugs, validate syntax, and help you understand your data. Everything stays in your browser — nothing is sent anywhere!";
  }

  // ── Find Bug ───────────────────────────────────────────────
  if (intent === 'find_bug') {
    if (!hasData) return "Paste some code first and I'll check for bugs!";
    if (type === 'json') {
      const j = analyzeJSON(content);
      if (!j) return `❌ <strong>JSON Error</strong><br><br>${analyzeJSON(content).error}`;
      const issues = [];
      if (j.nulls.length > j.keys.length * 0.5) issues.push("⚠️ Many null values");
      if (j.strings.length > 100 && j.keys.length < 10) issues.push("⚠️ Consider flattening structure");
      return issues.length ? `Found these issues:<br><br>${issues.join('<br>')}` : "✅ No bugs found! Your JSON looks good.";
    }
    if (type === 'xml') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');
        const err = doc.querySelector('parsererror');
        if (err) return `❌ <strong>XML Error</strong><br><br>${err.textContent.substring(0, 200)}`;
        return "✅ No bugs found! Your XML is valid.";
      } catch (e) { return "Could not check for bugs."; }
    }
    return "Paste valid XML or JSON to check for bugs.";
  }

  // ── Data-dependent intents ────────────────────────────────
  if (['summary','count','root','tags','attributes','keys','values','arrays','strings','numbers','booleans','nulls','validate','meta','find'].includes(intent)) {
    if (!hasData) {
      return "I don't see any data in the editor yet. Paste your XML or JSON in there and I'll analyze it for you! 📋";
    }
    if (type === 'unknown') {
      return "The content doesn't look like valid XML or JSON. Try pasting a proper XML or JSON document.";
    }
    return handleDataIntent(intent, type, content, input);
  }

  // ── Format hint ───────────────────────────────────────────
  if (intent === 'format_hint') {
    return "Click the <strong>Beautify</strong> button in the toolbar to auto-format your XML or JSON. 🎨";
  }

  if (intent === 'compare_hint') {
    return "Click <strong>Compare</strong> in the toolbar to open side-by-side compare mode. Paste original on the left, modified on the right, then click <strong>Run Comparison</strong>. 📊";
  }

  // ── Greeting ──────────────────────────────────────────────
  if (intent === 'greeting') {
    const greets = [
      `Hey${userName ? ' ' + userName : ' there'}! 👋 What can I help you with?`,
      `Hello${userName ? ' ' + userName : ''}! Ready to dig into some data? 😊`,
      `Hi${userName ? ' ' + userName : ''}! Got some XML or JSON you'd like me to look at?`
    ];
    return greets[Math.floor(Math.random() * greets.length)];
  }

  if (intent === 'how_are_you') return `Running great! 🚀 All analysis stays right here in your browser. ${userName ? 'How about you, ' + userName + '?' : 'How about you?'}`;
  if (intent === 'thanks')      return `You're welcome! ${userName ? userName + ', a' : 'A'}nything else I can help with? 😊`;
  if (intent === 'farewell')    return `Goodbye${userName ? ' ' + userName : ''}! 👋 Come back whenever you need data help!`;

  if (intent === 'joke') {
    const jokes = [
      "Why do programmers hate nature? It has too many bugs! 🐛",
      "What do you call a well-formatted JSON? Pretty-printed! 😂",
      "Why did the XML file see a therapist? Too many <em>nested issues</em>! 😆",
      "What's a JSON's favorite band? The Parsing Stones! 🎵"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (intent === 'fact') {
    const facts = [
      "XML was designed to be both human-readable and machine-readable — introduced in 1996! 📜",
      "JSON stands for JavaScript Object Notation but works with virtually every programming language. 🌐",
      "A valid JSON file is also valid JavaScript. Mind blown? 🤯",
      "XML attributes must be quoted — unlike HTML which sometimes lets you skip them. 🔍"
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  if (intent === 'time') {
    const n = new Date();
    return `🕐 It's ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  }

  if (intent === 'date') {
    return `📅 Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`;
  }

  if (intent === 'math') {
    const m = input.match(/(\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(\d+(?:\.\d+)?)/);
    if (m) {
      const a = parseFloat(m[1]), op = m[2], b = parseFloat(m[3]);
      const ops = { '+': a+b, '-': a-b, '*': a*b, 'x': a*b, '×': a*b, '/': b!==0 ? a/b : 'undefined', '÷': b!==0 ? a/b : 'undefined' };
      return `🧮 ${a} ${op} ${b} = <strong>${ops[op]}</strong>`;
    }
  }

  // Unknown
  if (hasData) {
    return `I'm not sure what you mean, but I can see data in the editor. Try asking:<br><br>
      • "Summarize this data"<br>
      • "What tags are in this XML?"<br>
      • "List all keys in this JSON"<br>
      • "Is this valid?"`;
  }

  return `I'm not sure about that one. 🤔 Try asking me about your XML/JSON data — paste something in the editor and ask me to summarize or analyze it!`;
}

// ══════════════════════════════════════════════════════════════
// DATA INTENT HANDLER
// ══════════════════════════════════════════════════════════════

function handleDataIntent(intent, type, content, input) {
  if (type === 'xml') {
    const x = analyzeXML(content);
    switch (intent) {
      case 'summary':
        return `<strong>XML Summary</strong><br><br>
          📌 Root element: <code>${x.root || 'unknown'}</code><br>
          🏷️ Unique tags: <strong>${x.unique.length}</strong> (${x.unique.slice(0,8).join(', ')}${x.unique.length > 8 ? '...' : ''})<br>
          📐 Attributes: <strong>${x.attrs.length}</strong><br>
          📝 Text nodes: <strong>${x.textNodes.length}</strong><br>
          📄 Lines: <strong>${x.lineCount}</strong><br>
          ${x.xmlDecl ? '✅ Has XML declaration' : '⚠️ No XML declaration'}`;

      case 'root':
        return x.root
          ? `📁 The root element is <code>&lt;${x.root}&gt;</code>.`
          : "Couldn't detect a root element — make sure your XML is well-formed.";

      case 'tags':
      case 'count':
        return `Found <strong>${x.unique.length}</strong> unique element(s):<br><br>
          ${x.unique.map(t => `<code>&lt;${t}&gt;</code>`).join('  ')}`;

      case 'attributes':
        if (!x.attrs.length) return "No attributes found in this XML.";
        return `Found <strong>${x.attrs.length}</strong> attribute(s):<br><br>
          ${x.attrs.slice(0,15).map(a => `<code>${a.name}="${a.value}"</code>`).join('<br>')}
          ${x.attrs.length > 15 ? `<br>... and ${x.attrs.length - 15} more` : ''}`;

      case 'values':
        if (!x.textNodes.length) return "No text content found in this XML.";
        return `Found <strong>${x.textNodes.length}</strong> text node(s):<br><br>
          ${x.textNodes.slice(0,10).map(t => `• ${escHtml(t)}`).join('<br>')}
          ${x.textNodes.length > 10 ? `<br>... and ${x.textNodes.length - 10} more` : ''}`;

      case 'meta':
        return `📄 <strong>${x.lineCount}</strong> lines · <strong>${content.length}</strong> characters · <strong>${x.unique.length}</strong> unique tags`;

      case 'validate':
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'application/xml');
          const err = doc.querySelector('parsererror');
          if (err) return `❌ <strong>Invalid XML</strong><br><br>${escHtml(err.textContent.substring(0, 200))}`;
          return `✅ <strong>Valid XML!</strong> The document is well-formed.`;
        } catch (e) {
          return "⚠️ Couldn't validate XML in this browser environment.";
        }

      case 'find':
        const search = input.replace(/find|search|look for|where is|show me|get|give me|show|list/gi, '').trim();
        if (!search) return "What would you like to find? E.g. 'find the id attribute'";
        const matches = x.attrs.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.value.toLowerCase().includes(search.toLowerCase()));
        const tagMatches = x.unique.filter(t => t.toLowerCase().includes(search.toLowerCase()));
        let out = '';
        if (tagMatches.length) out += `🏷️ Tags matching "${search}": ${tagMatches.map(t => `<code>&lt;${t}&gt;</code>`).join(', ')}<br>`;
        if (matches.length) out += `📐 Attributes matching "${search}": ${matches.slice(0,5).map(a => `<code>${a.name}="${a.value}"</code>`).join(', ')}`;
        return out || `No matches found for "<strong>${escHtml(search)}</strong>" in this XML.`;

      default:
        return `I see XML with root <code>&lt;${x.root}&gt;</code> and ${x.unique.length} element type(s). What would you like to know?`;
    }
  }

  if (type === 'json') {
    const j = analyzeJSON(content);
    if (!j) return `❌ <strong>Invalid JSON</strong> — the content couldn't be parsed. Check for missing commas, brackets, or quotes.`;

    switch (intent) {
      case 'summary':
        return `<strong>JSON Summary</strong><br><br>
          📌 Type: <strong>${j.isArray ? 'Array' : 'Object'}</strong><br>
          🔑 Total keys: <strong>${j.keys.length}</strong><br>
          🔤 String values: <strong>${j.strings.length}</strong><br>
          🔢 Number values: <strong>${j.numbers.length}</strong><br>
          ☑️ Booleans: <strong>${j.booleans.length}</strong><br>
          📚 Arrays: <strong>${j.arrays.length}</strong><br>
          ∅ Null values: <strong>${j.nulls.length}</strong><br>
          📄 Lines: <strong>${j.lineCount}</strong>`;

      case 'keys':
      case 'tags':
        if (!j.keys.length) return "No keys found in this JSON.";
        const topLevel = j.keys.filter(k => !k.path.includes('.') && !k.path.includes('['));
        return `Found <strong>${j.keys.length}</strong> key(s) total. Top-level keys:<br><br>
          ${topLevel.slice(0,20).map(k => `<code>${k.key}</code>`).join('  ')}
          ${topLevel.length > 20 ? `<br>... and more` : ''}`;

      case 'values':
        let out = `<strong>Values overview:</strong><br><br>`;
        if (j.strings.length) out += `🔤 Strings (${j.strings.length}): ${j.strings.slice(0,4).map(s => `"${escHtml(s.value.substring(0,30))}"`).join(', ')}<br>`;
        if (j.numbers.length) out += `🔢 Numbers (${j.numbers.length}): ${j.numbers.slice(0,5).map(n => n.value).join(', ')}<br>`;
        if (j.booleans.length) out += `☑️ Booleans (${j.booleans.length}): ${j.booleans.map(b => b.value).join(', ')}<br>`;
        if (j.nulls.length) out += `∅ Nulls: ${j.nulls.length}`;
        return out;

      case 'arrays':
        if (!j.arrays.length) return "No arrays found in this JSON.";
        return `Found <strong>${j.arrays.length}</strong> array(s):<br><br>
          ${j.arrays.slice(0,10).map(a => `<code>${a.path || 'root'}</code> — ${a.length} item(s)`).join('<br>')}`;

      case 'strings':
        if (!j.strings.length) return "No string values found.";
        return `Found <strong>${j.strings.length}</strong> string value(s):<br><br>
          ${j.strings.slice(0,8).map(s => `<code>${s.path}</code>: "${escHtml(s.value.substring(0,40))}"`).join('<br>')}`;

      case 'numbers':
        if (!j.numbers.length) return "No numeric values found.";
        return `Found <strong>${j.numbers.length}</strong> number(s):<br><br>
          ${j.numbers.slice(0,8).map(n => `<code>${n.path}</code>: <strong>${n.value}</strong>`).join('<br>')}`;

      case 'booleans':
        if (!j.booleans.length) return "No boolean values found.";
        return `Found <strong>${j.booleans.length}</strong> boolean(s):<br><br>
          ${j.booleans.map(b => `<code>${b.path}</code>: <strong>${b.value}</strong>`).join('<br>')}`;

      case 'nulls':
        if (!j.nulls.length) return "No null values found! 🎉";
        return `Found <strong>${j.nulls.length}</strong> null(s) at:<br><br>
          ${j.nulls.slice(0,10).map(p => `<code>${p}</code>`).join('<br>')}`;

      case 'validate':
        return `✅ <strong>Valid JSON!</strong> Parsed successfully.<br><br>Type: <strong>${j.isArray ? 'Array' : 'Object'}</strong> · ${j.keys.length} keys · ${j.lineCount} lines`;

      case 'meta':
        return `📄 <strong>${j.lineCount}</strong> lines · <strong>${content.length}</strong> characters · <strong>${j.keys.length}</strong> keys`;

      case 'count':
        return `This JSON has <strong>${j.keys.length}</strong> total key(s), <strong>${j.arrays.length}</strong> array(s), and <strong>${j.strings.length + j.numbers.length + j.booleans.length + j.nulls.length}</strong> leaf value(s).`;

      case 'find':
        const term = input.replace(/find|search|look for|where is|show me|get|give me|show|list/gi, '').trim().toLowerCase();
        if (!term) return "What would you like to find? E.g. 'find the email field'";
        const found = j.keys.filter(k => k.key.toLowerCase().includes(term));
        const valFound = [...j.strings, ...j.numbers].filter(v => String(v.value).toLowerCase().includes(term));
        let res = '';
        if (found.length) res += `🔑 Keys matching "${term}":<br>${found.slice(0,8).map(k => `<code>${k.path}</code>`).join('<br>')}<br>`;
        if (valFound.length) res += `🔍 Values matching "${term}":<br>${valFound.slice(0,5).map(v => `<code>${v.path}</code>: ${escHtml(String(v.value).substring(0,50))}`).join('<br>')}`;
        return res || `No matches found for "<strong>${escHtml(term)}</strong>" in this JSON.`;

      default:
        return `I see JSON with ${j.keys.length} key(s). Ask me to summarize, list keys, find values, or validate it!`;
    }
  }

  return "Hmm, couldn't analyze the content. Make sure it's valid XML or JSON.";
}

// ── Utility ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Bootstrap ─────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}

window.initChatMessages = initChatMessages;
