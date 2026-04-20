// ============================================
// Dark Mode - Version 2.0
// Handles theme switching with localStorage
// ============================================

let isDarkMode = false;
const darkModeToggle = document.getElementById('darkModeToggle');
const lightLabel = document.getElementById('lightLabel');
const darkLabel = document.getElementById('darkLabel');

// Load saved preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        disableDarkMode();
        if (darkModeToggle) darkModeToggle.checked = false;
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
    
    // Update labels
    if (lightLabel) lightLabel.classList.remove('active');
    if (darkLabel) darkLabel.classList.add('active');
    
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
    
    // Update labels
    if (lightLabel) lightLabel.classList.add('active');
    if (darkLabel) darkLabel.classList.remove('active');
    
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
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', toggleDarkMode);
}

// Initialize
loadThemePreference();