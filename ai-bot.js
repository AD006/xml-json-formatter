// ============================================
// AI Chat Bot - Jarvis Assistant (Fixed Intent Recognition)
// Properly answers "who created you", "who developed you", etc.
// ============================================

// Global variables
let chatWindow = null;
let chatMessages = null;
let chatInput = null;
let unreadCount = 0;
let isChatOpen = false;

// Jarvis memory
let conversationContext = [];
let userName = null;

// ============================================
// XML/JSON PARSER MODULE
// ============================================

// Parse XML string and extract useful information
function parseXMLContent(xmlString) {
    if (!xmlString || typeof xmlString !== 'string') return null;
    
    const result = {
        type: 'xml',
        rootElement: null,
        elements: [],
        attributes: [],
        textContent: []
    };
    
    // Extract root element name
    const rootMatch = xmlString.match(/<([a-zA-Z][a-zA-Z0-9_:]*)[\s>]/);
    if (rootMatch) result.rootElement = rootMatch[1];
    
    // Extract all element names
    const elementMatches = xmlString.matchAll(/<([a-zA-Z][a-zA-Z0-9_:]*)/g);
    for (const match of elementMatches) {
        if (!result.elements.includes(match[1])) {
            result.elements.push(match[1]);
        }
    }
    
    // Extract attributes and their values
    const attrMatches = xmlString.matchAll(/([a-zA-Z][a-zA-Z0-9_:]*)\s*=\s*["']([^"']*)["']/g);
    for (const match of attrMatches) {
        result.attributes.push({ name: match[1], value: match[2] });
    }
    
    // Extract text content between tags
    const textMatches = xmlString.matchAll(/>([^<]+)</g);
    for (const match of textMatches) {
        const text = match[1].trim();
        if (text && !result.textContent.includes(text)) {
            result.textContent.push(text);
        }
    }
    
    return result;
}

// Parse JSON string and extract useful information
function parseJSONContent(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') return null;
    
    try {
        const obj = JSON.parse(jsonString);
        
        const result = {
            type: 'json',
            keys: [],
            values: [],
            stringValues: [],
            numberValues: [],
            booleanValues: [],
            arrayLengths: []
        };
        
        function traverse(obj, path = '') {
            if (typeof obj === 'object' && obj !== null) {
                if (Array.isArray(obj)) {
                    result.arrayLengths.push({ path: path || 'root', length: obj.length });
                    obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
                } else {
                    for (let key in obj) {
                        result.keys.push({ key: key, path: path ? `${path}.${key}` : key });
                        traverse(obj[key], path ? `${path}.${key}` : key);
                    }
                }
            } else if (typeof obj === 'string') {
                result.stringValues.push({ value: obj, path: path });
            } else if (typeof obj === 'number') {
                result.numberValues.push({ value: obj, path: path });
            } else if (typeof obj === 'boolean') {
                result.booleanValues.push({ value: obj, path: path });
            }
        }
        
        traverse(obj);
        return result;
    } catch(e) {
        return null;
    }
}

// Main function to analyze editor content
function analyzeEditorContent() {
    if (typeof editor === 'undefined') return null;
    const content = editor.getValue();
    if (!content || content.trim() === '' || content === "Paste your XML/JSON here...") {
        return null;
    }
    
    const trimmed = content.trim();
    
    // Check if it's XML
    if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && !trimmed.startsWith('{') && !trimmed.startsWith('['))) {
        return parseXMLContent(content);
    }
    
    // Check if it's JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return parseJSONContent(content);
    }
    
    return null;
}

// Get summary of the data
function getDataSummary() {
    const parsed = analyzeEditorContent();
    if (!parsed) return null;
    
    if (parsed.type === 'xml') {
        let summary = `📄 **XML Data Summary:**\n\n`;
        if (parsed.rootElement) summary += `• Root element: \`${parsed.rootElement}\`\n`;
        if (parsed.elements.length > 0) summary += `• Elements found: ${parsed.elements.slice(0, 10).join(', ')}${parsed.elements.length > 10 ? '...' : ''}\n`;
        if (parsed.attributes.length > 0) summary += `• Attributes: ${parsed.attributes.slice(0, 5).map(a => `${a.name}="${a.value}"`).join(', ')}${parsed.attributes.length > 5 ? '...' : ''}\n`;
        if (parsed.textContent.length > 0) summary += `• Text content found: ${parsed.textContent.slice(0, 3).join(', ')}${parsed.textContent.length > 3 ? '...' : ''}\n`;
        return summary;
    }
    
    if (parsed.type === 'json') {
        let summary = `📄 **JSON Data Summary:**\n\n`;
        if (parsed.keys.length > 0) summary += `• Keys: ${parsed.keys.slice(0, 10).map(k => k.key).join(', ')}${parsed.keys.length > 10 ? '...' : ''}\n`;
        if (parsed.stringValues.length > 0) summary += `• String values found: ${parsed.stringValues.length}\n`;
        if (parsed.numberValues.length > 0) summary += `• Number values found: ${parsed.numberValues.length}\n`;
        if (parsed.booleanValues.length > 0) summary += `• Boolean values found: ${parsed.booleanValues.length}\n`;
        if (parsed.arrayLengths.length > 0) summary += `• Arrays: ${parsed.arrayLengths.map(a => `${a.path} (${a.length} items)`).join(', ')}\n`;
        return summary;
    }
    
    return null;
}

// Answer specific questions about the data
function answerDataQuestion(question) {
    const parsed = analyzeEditorContent();
    if (!parsed) return null;
    
    const lowerQuestion = question.toLowerCase();
    
    // General questions
    if (lowerQuestion.includes('what is this') || lowerQuestion.includes('tell me about') || lowerQuestion.includes('summary')) {
        return getDataSummary();
    }
    
    // XML specific
    if (parsed.type === 'xml') {
        if (lowerQuestion.includes('root') || lowerQuestion.includes('main tag')) {
            return `📁 The root element is \`${parsed.rootElement}\`.`;
        }
        
        if (lowerQuestion.includes('tag') || lowerQuestion.includes('element')) {
            return `📋 Elements in this XML: ${parsed.elements.join(', ')}`;
        }
        
        if (lowerQuestion.includes('attribute')) {
            if (parsed.attributes.length > 0) {
                return `🏷️ Attributes found:\n${parsed.attributes.map(a => `• ${a.name} = "${a.value}"`).join('\n')}`;
            }
            return "No attributes found in this XML.";
        }
        
        if (lowerQuestion.includes('text') || lowerQuestion.includes('content')) {
            if (parsed.textContent.length > 0) {
                return `📝 Text content:\n${parsed.textContent.map(t => `• ${t}`).join('\n')}`;
            }
            return "No text content found in this XML.";
        }
    }
    
    // JSON specific
    if (parsed.type === 'json') {
        if (lowerQuestion.includes('key') || lowerQuestion.includes('field')) {
            return `🔑 Keys in this JSON:\n${parsed.keys.slice(0, 15).map(k => `• ${k.path}`).join('\n')}`;
        }
        
        if (lowerQuestion.includes('value') || lowerQuestion.includes('data')) {
            let valueInfo = [];
            if (parsed.stringValues.length > 0) valueInfo.push(`• String values: ${parsed.stringValues.slice(0, 5).map(v => `"${v.value}"`).join(', ')}`);
            if (parsed.numberValues.length > 0) valueInfo.push(`• Number values: ${parsed.numberValues.slice(0, 5).map(v => v.value).join(', ')}`);
            if (valueInfo.length > 0) return `📊 Values found:\n${valueInfo.join('\n')}`;
            return "No values found in this JSON.";
        }
        
        if (lowerQuestion.includes('array') || lowerQuestion.includes('list')) {
            if (parsed.arrayLengths.length > 0) {
                return `📚 Arrays in this JSON:\n${parsed.arrayLengths.map(a => `• ${a.path} contains ${a.length} item(s)`).join('\n')}`;
            }
            return "No arrays found in this JSON.";
        }
    }
    
    // Look for specific values
    const valueMatch = lowerQuestion.match(/(?:what is |find |get |show me )?["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?/i);
    if (valueMatch && parsed.type === 'json') {
        const searchKey = valueMatch[1].toLowerCase();
        const foundKey = parsed.keys.find(k => k.key.toLowerCase() === searchKey);
        if (foundKey) {
            const content = editor.getValue();
            const regex = new RegExp(`"${foundKey.key}"\\s*:\\s*"([^"]*)"`, 'i');
            const match = content.match(regex);
            if (match) {
                return `🔍 The value of "${foundKey.key}" is: ${match[1]}`;
            }
            return `🔍 Found key: ${foundKey.key} at path: ${foundKey.path}`;
        }
    }
    
    return null;
}

// ============================================
// INTENT RECOGNITION - FIXED FOR CREATOR QUESTIONS
// ============================================

function recognizeIntent(text) {
    const lowerText = text.toLowerCase();
    
    // FIRST - Check for creator questions (most important)
    const creatorPatterns = [
        'who created you', 'who made you', 'who build you', 'who developed you',
        'who programmed you', 'who coded you', 'who is your creator', 'who is your maker',
        'who designed you', 'who built you', 'your creator', 'your maker',
        'ashish', 'dhiman', 'who is ashish', 'tell me about your creator',
        'who created', 'who made', 'who develop', 'who build'
    ];
    
    for (let pattern of creatorPatterns) {
        if (lowerText.includes(pattern)) {
            return 'question_creator';
        }
    }
    
    // Other intents
    const intents = {
        greeting: ['hello', 'hi', 'hey', 'greet', 'sup', 'hola', 'namaste'],
        farewell: ['bye', 'goodbye', 'cya', 'see you', 'later', 'farewell', 'exit'],
        gratitude: ['thank', 'thanks', 'thx', 'appreciate', 'grateful'],
        how_are_you: ['how are you', 'how you doing', 'how\'s it going', 'what\'s up'],
        feeling_good: ['good', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'doing well'],
        feeling_bad: ['bad', 'sad', 'terrible', 'awful', 'depressed', 'down'],
        compliment: ['love you', 'awesome', 'smart', 'intelligent', 'clever', 'great'],
        question_name: ['what is your name', 'who are you', 'your name', 'what are you'],
        question_capability: ['what can you do', 'help me', 'features', 'what do you do'],
        question_time: ['time', 'clock', 'hour', 'minute'],
        question_date: ['date', 'day', 'today', 'calendar'],
        question_math: ['calculate', 'math', 'plus', 'minus', 'times', 'divide', 'sum'],
        question_joke: ['joke', 'funny', 'laugh', 'humor'],
        question_fact: ['fact', 'interesting', 'did you know', 'tell me something'],
        question_data: ['data', 'xml', 'json', 'what is this', 'tell me about this', 'summary', 'analyze', 'read this'],
        bored: ['bored', 'nothing to do', 'boring']
    };
    
    for (let [intent, keywords] of Object.entries(intents)) {
        for (let keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return intent;
            }
        }
    }
    
    return 'unknown';
}

function extractName(text) {
    const nameMatch = text.match(/(?:my name is |i am |call me |you can call me )(\w+)/i);
    return nameMatch ? nameMatch[1] : null;
}

// ============================================
// SELF-LEARNING MEMORY SYSTEM
// ============================================

function loadLearnedKnowledge() {
    try {
        const saved = localStorage.getItem('jarvis_learned_knowledge');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
}

function saveLearnedKnowledge(knowledge) {
    try {
        localStorage.setItem('jarvis_learned_knowledge', JSON.stringify(knowledge));
    } catch(e) {}
}

let learnedKnowledge = loadLearnedKnowledge();

function teachJarvis(question, answer) {
    const normalizedQuestion = question.toLowerCase().trim();
    if (!learnedKnowledge[normalizedQuestion]) {
        learnedKnowledge[normalizedQuestion] = { answer: answer };
    }
    learnedKnowledge[normalizedQuestion].answer = answer;
    saveLearnedKnowledge(learnedKnowledge);
}

function recallKnowledge(question) {
    const normalizedQuestion = question.toLowerCase().trim();
    if (learnedKnowledge[normalizedQuestion]) {
        return { found: true, answer: learnedKnowledge[normalizedQuestion].answer };
    }
    return { found: false };
}

// Function to minimize chat window
function minimizeChat() {
    if (chatWindow && isChatOpen) {
        chatWindow.classList.remove('open');
        isChatOpen = false;
    }
}

// Initialize chat
function initChat() {
    chatWindow = document.getElementById('chatWindow');
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    
    const chatButton = document.getElementById('chatButton');
    const closeChat = document.getElementById('closeChat');
    const sendChat = document.getElementById('sendChat');
    
    if (chatButton) {
        chatButton.innerHTML = '<span>💬</span>';
        chatButton.style.fontSize = '28px';
    }
    
    const badge = document.createElement('span');
    badge.className = 'chat-badge';
    badge.style.cssText = `position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: bold; display: none;`;
    chatButton.style.position = 'relative';
    chatButton.appendChild(badge);
    
    if (chatButton) {
        chatButton.onclick = (e) => {
            e.stopPropagation();
            chatWindow.classList.toggle('open');
            isChatOpen = chatWindow.classList.contains('open');
            if (isChatOpen) {
                unreadCount = 0;
                badge.style.display = 'none';
            }
        };
    }
    if (closeChat) {
        closeChat.onclick = (e) => {
            e.stopPropagation();
            chatWindow.classList.remove('open');
            isChatOpen = false;
        };
    }
    if (sendChat) sendChat.onclick = (e) => {
        e.stopPropagation();
        sendMessage();
    };
    if (chatInput) {
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                sendMessage();
            }
        };
    }
    
    // Close chat when clicking anywhere outside the chat window
    document.addEventListener('click', function(event) {
        if (isChatOpen && chatWindow && chatButton) {
            if (!chatWindow.contains(event.target) && !chatButton.contains(event.target)) {
                minimizeChat();
            }
        }
    });
    
    if (chatMessages) {
        chatMessages.innerHTML = '';
        addMessage("💬 **Jarvis:** Hey there! I'm Jarvis. I can read and analyze your XML/JSON data. Just paste it in the editor and ask me anything about it! 😊", false);
    }
}

function addMessage(message, isUser = false) {
    if (!chatMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = `<div class="message-bubble">${message.replace(/\n/g, '<br>')}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (!isUser && !isChatOpen) {
        unreadCount++;
        const badge = document.querySelector('.chat-badge');
        if (badge) { badge.textContent = unreadCount; badge.style.display = 'flex'; }
    }
}

let waitingForTeaching = false;
let teachingQuestion = null;
let lastQuestion = '';

// Math calculations
function doMath(text) {
    const mathMatch = text.match(/(\d+)\s*([\+\-\*\/x÷])\s*(\d+)/i);
    if (mathMatch) {
        const num1 = parseFloat(mathMatch[1]);
        const operator = mathMatch[2];
        const num2 = parseFloat(mathMatch[3]);
        let result;
        switch(operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '*': case 'x': case '×': result = num1 * num2; break;
            case '/': case '÷': result = num1 / num2; break;
            default: return null;
        }
        return `🧮 ${num1} ${operator} ${num2} = ${result}`;
    }
    return null;
}

// ============================================
// NATURAL RESPONSES
// ============================================

function getResponse(message, intent) {
    const lower = message.toLowerCase();
    
    // ANSWER CREATOR QUESTION - Direct and clear
    if (intent === 'question_creator') {
        return "I was created by Ashish Dhiman 🙏. He's a future-focused data scientist designing adaptive systems for XML/JSON parsing, validation, and dynamic data interaction — an extension of his digital brain!";
    }
    
    // First, check if user is asking about the data in editor
    if (intent === 'question_data' || lower.includes('xml') || lower.includes('json') || lower.includes('data') || lower.includes('what is this')) {
        const dataAnswer = answerDataQuestion(message);
        if (dataAnswer) return dataAnswer;
        return "I don't see any XML or JSON data in the editor. Please paste your XML or JSON content first, then ask me about it!";
    }
    
    // Check for specific data extraction
    const dataAnswer = answerDataQuestion(message);
    if (dataAnswer) return dataAnswer;
    
    // Greeting
    if (intent === 'greeting') {
        const greetings = [
            `Hey${userName ? ' ' + userName : ' there'}! 👋 What's up?`,
            `Hello${userName ? ' ' + userName : '!'} 😊 How can I help you today?`,
            `Hi${userName ? ' ' + userName : ' there'}! 🚀 What's on your mind?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // How are you
    if (intent === 'how_are_you') {
        return `I'm doing great, thanks for asking! ${userName ? 'How about you, ' + userName + '?' : 'How about you?'} 😊`;
    }
    
    // Feeling good
    if (intent === 'feeling_good') {
        const responses = [
            `That's awesome to hear! 😊 What would you like to talk about?`,
            `Glad to hear that! 🎉 Anything I can help you with?`,
            `Wonderful! 😃 What's next?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Feeling bad
    if (intent === 'feeling_bad') {
        return `I'm sorry to hear that. 😔 Want to talk about it? I'm here to listen. 💙`;
    }
    
    // Compliment
    if (intent === 'compliment') {
        const responses = [
            `Aww, thank you! ${userName ? userName + ', ' : ''}you're pretty awesome yourself! 🥰`,
            `Thanks! You're making me blush! 😊 What can I help you with?`,
            `Right back at you! 🎉 What would you like to do?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Bored
    if (intent === 'bored') {
        return `Let's do something fun! 🎉\n\n• Ask me to tell you a joke\n• Ask for a fun fact\n• Ask me to do math\n• Or ask me about your XML/JSON data!\n\nWhat sounds good? 😊`;
    }
    
    // Name question
    if (intent === 'question_name') {
        return "I'm Jarvis! 🎩 Your friendly assistant. What's your name?";
    }
    
    // What can you do
    if (intent === 'question_capability') {
        return "I can help with:\n📊 **Read your XML/JSON data** - Ask me what's in your data\n🧮 **Math** - Ask me to calculate\n🕐 **Time & Date**\n😂 **Tell jokes**\n💬 **Chat** - Like a friend\n\nJust paste your XML/JSON in the editor and ask me about it!";
    }
    
    // Time
    if (intent === 'question_time') {
        const now = new Date();
        return `🕐 It's ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Date
    if (intent === 'question_date') {
        const now = new Date();
        return `📅 Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    }
    
    // Joke
    if (intent === 'question_joke') {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why did the XML file go to therapy? Too many nested issues!",
            "What's a JSON's favorite music? R&B (Rhythm and Braces)! 🎵"
        ];
        return `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`;
    }
    
    // Fun fact
    if (intent === 'question_fact') {
        const facts = [
            "Did you know? 🐙 Octopuses have three hearts!",
            "Fun fact: 🍌 Bananas are berries, but strawberries aren't!",
            "Interesting: 🦒 Giraffes have the same number of neck vertebrae as humans (7)!",
            "Did you know? 🌍 The Earth's core is as hot as the surface of the Sun!"
        ];
        return `🔍 ${facts[Math.floor(Math.random() * facts.length)]}`;
    }
    
    // Farewell
    if (intent === 'farewell') {
        return `Goodbye${userName ? ' ' + userName : '!'} 👋 Come back anytime! Have a great day! 🌟`;
    }
    
    // Thanks
    if (intent === 'gratitude') {
        return `You're welcome! 🎉 Anything else I can help with?`;
    }
    
    // Math
    const mathResult = doMath(message);
    if (mathResult) return mathResult;
    
    return null;
}

// Main AI response
function getAIResponse(question) {
    lastQuestion = question;
    
    // Check if in teaching mode
    if (waitingForTeaching && teachingQuestion) {
        waitingForTeaching = false;
        teachJarvis(teachingQuestion, question);
        teachingQuestion = null;
        return "📖 **Got it!** Thanks for teaching me! 🧠 What else can I help with?";
    }
    
    // Extract name
    const name = extractName(question);
    if (name) {
        userName = name;
        teachJarvis("what is my name", `Your name is ${name}`);
        return `Nice to meet you, ${name}! 🎉 I'll remember that. What would you like to chat about?`;
    }
    
    // Check recalled knowledge
    const recalled = recallKnowledge(question);
    if (recalled.found) {
        return recalled.answer;
    }
    
    // Recognize intent
    const intent = recognizeIntent(question);
    
    // Get natural response
    const response = getResponse(question, intent);
    if (response) {
        return response;
    }
    
    // Default - ask user to teach
    return `I'm not sure about that yet. 🤔 Could you teach me?\n\nJust tell me what I should say and I'll remember it! 📖\n\nOr ask me about time, date, math, jokes, or your data!`;
}

function sendMessage() {
    if (!chatInput) return;
    const message = chatInput.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    chatInput.value = '';
    
    addMessage("💬 Jarvis is thinking...", false);
    
    setTimeout(() => {
        if (chatMessages.lastChild) chatMessages.removeChild(chatMessages.lastChild);
        const response = getAIResponse(message);
        addMessage(response, false);
    }, 300);
}

window.addEventListener('beforeunload', function() {
    saveLearnedKnowledge(learnedKnowledge);
});

console.log('💬 Jarvis initialized - Creator questions fixed!');