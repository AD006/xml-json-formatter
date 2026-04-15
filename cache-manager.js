// ============================================
// Cache Manager - Clears all caches on page unload/reload
// ============================================

// Clear all types of caches
function clearAllCaches() {
    console.log('🗑️ Clearing all caches...');
    
    // 1. Clear Session Storage
    try {
        sessionStorage.clear();
        console.log('✓ Session storage cleared');
    } catch(e) { console.log('✗ Session storage error:', e); }
    
    // 2. Clear Local Storage
    try {
        localStorage.clear();
        console.log('✓ Local storage cleared');
    } catch(e) { console.log('✗ Local storage error:', e); }
    
    // 3. Clear Cookies
    try {
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('✓ Cookies cleared');
    } catch(e) { console.log('✗ Cookies error:', e); }
    
    // 4. Clear IndexedDB
    try {
        if (window.indexedDB) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                    console.log('✓ IndexedDB deleted:', db.name);
                });
            }).catch(() => {});
        }
    } catch(e) { console.log('✗ IndexedDB error:', e); }
    
    // 5. Clear Cache Storage (Service Worker)
    try {
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                    console.log('✓ Cache storage deleted:', name);
                }
            });
        }
    } catch(e) { console.log('✗ Cache storage error:', e); }
}

// Clear Ace Editor specific caches
function clearEditorCache() {
    try {
        if (typeof editor !== 'undefined' && editor.session) {
            // Clear undo/redo stacks
            if (editor.session.$undoManager) {
                editor.session.$undoManager.reset();
                console.log('✓ Editor undo/redo cleared');
            }
        }
    } catch(e) { console.log('✗ Editor cache error:', e); }
}

// Clear AI bot conversation history
function clearAICache() {
    try {
        // Clear global chat variables if they exist
        if (typeof conversationContext !== 'undefined') {
            window.conversationContext = [];
        }
        if (typeof userName !== 'undefined') {
            window.userName = null;
        }
        if (typeof unreadCount !== 'undefined') {
            window.unreadCount = 0;
        }
        console.log('✓ AI bot cache cleared');
    } catch(e) { console.log('✗ AI cache error:', e); }
}

// Clear JSON/XML formatter caches
function clearFormatterCache() {
    try {
        // Clear any stored formatting history
        if (typeof undoStack !== 'undefined') {
            window.undoStack = [];
        }
        if (typeof redoStack !== 'undefined') {
            window.redoStack = [];
        }
        console.log('✓ Formatter cache cleared');
    } catch(e) { console.log('✗ Formatter cache error:', e); }
}

// Reset editor to default state
function resetEditorToDefault() {
    try {
        if (typeof editor !== 'undefined') {
            const defaultValue = "Paste your XML/JSON here...";
            editor.setValue(defaultValue);
            editor.gotoLine(0);
            console.log('✓ Editor reset to default');
        }
    } catch(e) { console.log('✗ Editor reset error:', e); }
}

// Clear browser history (optional - only if needed)
function clearBrowserHistory() {
    try {
        // This replaces current state to prevent back/forward navigation issues
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, window.location.href);
            console.log('✓ Browser history state reset');
        }
    } catch(e) { console.log('✗ Browser history error:', e); }
}

// Main function to clear everything
function clearEverything() {
    console.log('🧹 Starting full cache cleanup...\n');
    
    clearAllCaches();
    clearEditorCache();
    clearAICache();
    clearFormatterCache();
    resetEditorToDefault();
    clearBrowserHistory();
    
    console.log('\n✅ Full cache cleanup completed!');
}

// Clear only essential caches (for page reload)
function clearEssentialCaches() {
    console.log('🔄 Clearing essential caches for reload...');
    
    sessionStorage.clear();
    clearAICache();
    clearFormatterCache();
    
    console.log('✅ Essential caches cleared');
}

// Event: Page is being unloaded (user leaves or refreshes)
window.addEventListener('beforeunload', function() {
    console.log('🚪 User leaving page - clearing all caches...');
    clearEverything();
});

// Event: Page is loaded (fresh start)
window.addEventListener('load', function() {
    console.log('📄 Page loaded - performing fresh start...');
    clearEverything();
});

// Event: Page is hidden (user switches tab)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('👁️ Page hidden - clearing temporary caches...');
        clearEssentialCaches();
    }
});

// Optional: Clear cache every 30 minutes (prevents memory buildup)
setInterval(function() {
    console.log('⏰ Periodic cache cleanup...');
    clearEssentialCaches();
}, 30 * 60 * 1000); // 30 minutes

// Expose functions globally for manual trigger if needed
window.CacheManager = {
    clearAll: clearEverything,
    clearEssential: clearEssentialCaches,
    clearEditor: clearEditorCache,
    clearAI: clearAICache,
    clearFormatter: clearFormatterCache,
    resetEditor: resetEditorToDefault
};

console.log('🗑️ Cache Manager initialized - All caches will clear on page leave/reload');