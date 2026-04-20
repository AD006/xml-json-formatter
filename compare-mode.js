// ============================================
// Compare Mode - Version 2.0
// Handles side-by-side comparison of XML/JSON
// ============================================

let leftEditor = null;
let rightEditor = null;
let isCompareMode = false;
let currentTheme = 'light';

// DOM Elements
const compareBtn = document.getElementById('compareBtn');
const compareContainer = document.getElementById('compareContainer');
const editorContainer = document.getElementById('editorContainer');
const closeCompareBtn = document.getElementById('closeCompareBtn');
const compareNowBtn = document.getElementById('compareNowBtn');
const copyLeftBtn = document.getElementById('copyLeftBtn');
const copyRightBtn = document.getElementById('copyRightBtn');
const diffSummary = document.getElementById('diffSummary');

// Initialize Compare Mode
function initCompareMode() {
    if (!compareBtn) return;
    
    compareBtn.addEventListener('click', enableCompareMode);
    if (closeCompareBtn) closeCompareBtn.addEventListener('click', disableCompareMode);
    if (compareNowBtn) compareNowBtn.addEventListener('click', compareContent);
    if (copyLeftBtn) copyLeftBtn.addEventListener('click', copyLeftToRight);
    if (copyRightBtn) copyRightBtn.addEventListener('click', copyRightToLeft);
}

function enableCompareMode() {
    isCompareMode = true;
    const currentContent = getEditorContent();
    
    // Hide normal editor, show compare container
    if (editorContainer) editorContainer.style.display = 'none';
    if (compareContainer) compareContainer.style.display = 'flex';
    
    // Initialize left and right editors
    if (!leftEditor) {
        leftEditor = ace.edit("leftEditor");
        leftEditor.setTheme(currentTheme === 'dark' ? "ace/theme/monokai" : "ace/theme/chrome");
        leftEditor.session.setMode(getCurrentMode());
        leftEditor.setShowPrintMargin(false);
        leftEditor.session.setUseWrapMode(true);
        leftEditor.setValue(currentContent);
        leftEditor.clearSelection();
        
        // Add placeholder for left editor
        leftEditor.on('focus', function() {
            if (leftEditor.getValue() === "Paste your XML/JSON here...") {
                leftEditor.setValue("");
            }
        });
        leftEditor.on('blur', function() {
            if (leftEditor.getValue() === "") {
                leftEditor.setValue("Paste your XML/JSON here...");
            }
        });
        
        rightEditor = ace.edit("rightEditor");
        rightEditor.setTheme(currentTheme === 'dark' ? "ace/theme/monokai" : "ace/theme/chrome");
        rightEditor.session.setMode(getCurrentMode());
        rightEditor.setShowPrintMargin(false);
        rightEditor.session.setUseWrapMode(true);
        rightEditor.setValue("Paste your XML/JSON here...");
        rightEditor.clearSelection();
        
        // Add placeholder for right editor
        rightEditor.on('focus', function() {
            if (rightEditor.getValue() === "Paste your XML/JSON here...") {
                rightEditor.setValue("");
            }
        });
        rightEditor.on('blur', function() {
            if (rightEditor.getValue() === "") {
                rightEditor.setValue("Paste your XML/JSON here...");
            }
        });
    }
    
    setStatusMessage('Compare Mode enabled - Paste your data in the left and right editors');
}

function disableCompareMode() {
    isCompareMode = false;
    if (compareContainer) compareContainer.style.display = 'none';
    if (editorContainer) editorContainer.style.display = 'block';
    setStatusMessage('Compare Mode disabled');
}

function compareContent() {
    if (!leftEditor || !rightEditor) return;
    
    let leftContent = leftEditor.getValue();
    let rightContent = rightEditor.getValue();
    
    // Check for placeholder text
    if (leftContent === "Paste your XML/JSON here...") leftContent = "";
    if (rightContent === "Paste your XML/JSON here...") rightContent = "";
    
    if (leftContent === "" && rightContent === "") {
        diffSummary.innerHTML = '<strong>⚠️ No data to compare!</strong><br><br>Please paste XML/JSON in both editors.';
        return;
    }
    
    if (leftContent === "") {
        diffSummary.innerHTML = '<strong>⚠️ Left editor is empty!</strong><br><br>Please paste your original XML/JSON in the LEFT editor.';
        return;
    }
    
    if (rightContent === "") {
        diffSummary.innerHTML = '<strong>⚠️ Right editor is empty!</strong><br><br>Please paste your modified XML/JSON in the RIGHT editor.';
        return;
    }
    
    if (leftContent === rightContent) {
        diffSummary.innerHTML = '<strong>✅ No differences found!</strong><br><br>The content in both editors is identical.';
        return;
    }
    
    // Line-by-line comparison
    const leftLines = leftContent.split('\n');
    const rightLines = rightContent.split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const differences = [];
    
    for (let i = 0; i < maxLines; i++) {
        const leftLine = leftLines[i] || '(empty line)';
        const rightLine = rightLines[i] || '(empty line)';
        
        if (leftLine !== rightLine) {
            differences.push({
                line: i + 1,
                left: leftLine.substring(0, 150),
                right: rightLine.substring(0, 150)
            });
        }
    }
    
    let summaryHtml = `<strong>📊 Found ${differences.length} difference(s):</strong>`;
    
    differences.forEach(diff => {
        summaryHtml += `
            <div class="diff-item">
                <div class="diff-line-info">Line ${diff.line}:</div>
                <div class="diff-left"><span class="diff-label">LEFT:</span> ${escapeHtml(diff.left)}</div>
                <div class="diff-right"><span class="diff-label">RIGHT:</span> ${escapeHtml(diff.right)}</div>
            </div>
        `;
    });
    
    diffSummary.innerHTML = summaryHtml;
}

function copyLeftToRight() {
    if (leftEditor && rightEditor) {
        let content = leftEditor.getValue();
        if (content === "Paste your XML/JSON here...") content = "";
        rightEditor.setValue(content);
        compareContent();
        setStatusMessage('Copied from left to right');
    }
}

function copyRightToLeft() {
    if (leftEditor && rightEditor) {
        let content = rightEditor.getValue();
        if (content === "Paste your XML/JSON here...") content = "";
        leftEditor.setValue(content);
        compareContent();
        setStatusMessage('Copied from right to left');
    }
}

function getEditorContent() {
    if (typeof editor !== 'undefined' && editor.getValue) {
        return editor.getValue();
    }
    return '';
}

function getCurrentMode() {
    if (typeof currentMode !== 'undefined') {
        return currentMode === 'xml' ? "ace/mode/xml" : "ace/mode/json";
    }
    return "ace/mode/xml";
}

function setStatusMessage(msg, isError = false) {
    const statusSpan = document.getElementById('status');
    if (statusSpan) {
        statusSpan.innerHTML = (isError ? '❌ ' : '✅ ') + msg;
        setTimeout(() => {
            if (statusSpan.innerHTML === (isError ? '❌ ' : '✅ ') + msg) {
                statusSpan.innerHTML = '✅ Version 2.0 Ready';
            }
        }, 3000);
    }
}

function escapeHtml(text) {
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Update theme for compare editors
function updateCompareTheme(theme) {
    currentTheme = theme;
    if (leftEditor) {
        leftEditor.setTheme(theme === 'dark' ? "ace/theme/monokai" : "ace/theme/chrome");
    }
    if (rightEditor) {
        rightEditor.setTheme(theme === 'dark' ? "ace/theme/monokai" : "ace/theme/chrome");
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompareMode);
} else {
    initCompareMode();
}

// Export for use in other files
window.compareMode = {
    updateTheme: updateCompareTheme,
    isActive: () => isCompareMode
};