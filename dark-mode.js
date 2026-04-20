// ============================================
// Dark Mode - Version 2.0
// Handles theme switching with localStorage
// ============================================

let isDarkMode = false;
const darkModeBtn = document.getElementById('darkModeBtn');

// Load saved preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    
    // Update Ace Editor theme
    if (typeof editor !== 'undefined' && editor) {
        editor.setTheme("ace/theme/monokai");
    }
    
    // Update Compare Mode editors if active
    if (window.compareMode && typeof window.compareMode.updateTheme === 'function') {
        window.compareMode.updateTheme('dark');
    }
    
    if (darkModeBtn) darkModeBtn.innerHTML = '☀️ Light Mode';
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    
    // Update Ace Editor theme
    if (typeof editor !== 'undefined' && editor) {
        editor.setTheme("ace/theme/chrome");
    }
    
    // Update Compare Mode editors if active
    if (window.compareMode && typeof window.compareMode.updateTheme === 'function') {
        window.compareMode.updateTheme('light');
    }
    
    if (darkModeBtn) darkModeBtn.innerHTML = '🌙 Dark Mode';
    localStorage.setItem('theme', 'light');
}

function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Event listener
if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
}

// Initialize
loadThemePreference();