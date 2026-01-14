// Voynich Audiobook Converter - Application Logic

// Application State
const state = {
    selectedFile: null,
    selectedVoiceId: null,
    conversionId: null,
    pollingInterval: null,
    voices: [],
    theme: 'light',
    tasks: [],
    taskPollingInterval: null
};

// API Configuration
const API_BASE = '/api';
const POLLING_INTERVAL = 2000;

// DOM Elements
const elements = {
    // Theme
    themeToggle: null,

    // Upload
    dropZone: null,
    fileInput: null,
    browseBtn: null,
    selectedFile: null,
    fileName: null,
    removeFile: null,

    // Voice
    voiceSelect: null,
    toggleCustomVoice: null,
    customVoiceForm: null,
    voiceName: null,
    voiceFile: null,
    uploadVoiceBtn: null,

    // Conversion
    convertBtn: null,

    // Progress
    progressSection: null,
    progressFill: null,
    progressStatus: null,
    progressPercent: null,
    statusMessage: null,
    cancelBtn: null,

    // Result
    resultSection: null,
    audioPlayer: null,
    downloadBtn: null,
    newConversionBtn: null,

    // Error
    errorSection: null,
    errorMessage: null,
    retryBtn: null,

    // Task Manager
    taskManager: null,
    taskList: null,
    taskEmpty: null,
    taskTableHeader: null,
    cancelAllBtn: null,
    clearCompletedBtn: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeEventListeners();
    initializeTheme();
    loadVoices();
    loadTasks();
});

function initializeElements() {
    elements.themeToggle = document.getElementById('themeToggle');

    elements.dropZone = document.getElementById('dropZone');
    elements.fileInput = document.getElementById('fileInput');
    elements.browseBtn = document.getElementById('browseBtn');
    elements.selectedFile = document.getElementById('selectedFile');
    elements.fileName = document.getElementById('fileName');
    elements.removeFile = document.getElementById('removeFile');

    elements.voiceSelect = document.getElementById('voiceSelect');
    elements.toggleCustomVoice = document.getElementById('toggleCustomVoice');
    elements.customVoiceForm = document.getElementById('customVoiceForm');
    elements.voiceName = document.getElementById('voiceName');
    elements.voiceFile = document.getElementById('voiceFile');
    elements.uploadVoiceBtn = document.getElementById('uploadVoiceBtn');

    elements.convertBtn = document.getElementById('convertBtn');

    elements.progressSection = document.getElementById('progressSection');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressStatus = document.getElementById('progressStatus');
    elements.progressPercent = document.getElementById('progressPercent');
    elements.statusMessage = document.getElementById('statusMessage');
    elements.cancelBtn = document.getElementById('cancelBtn');

    elements.resultSection = document.getElementById('resultSection');
    elements.audioPlayer = document.getElementById('audioPlayer');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.newConversionBtn = document.getElementById('newConversionBtn');

    elements.errorSection = document.getElementById('errorSection');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.retryBtn = document.getElementById('retryBtn');

    elements.taskManager = document.getElementById('taskManager');
    elements.taskList = document.getElementById('taskList');
    elements.taskEmpty = document.getElementById('taskEmpty');
    elements.taskTableHeader = document.getElementById('taskTableHeader');
    elements.cancelAllBtn = document.getElementById('cancelAllBtn');
    elements.clearCompletedBtn = document.getElementById('clearCompletedBtn');
}

function initializeEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // File upload events
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.removeFile.addEventListener('click', clearSelectedFile);

    // Voice events
    elements.voiceSelect.addEventListener('change', handleVoiceChange);
    elements.toggleCustomVoice.addEventListener('click', toggleCustomVoiceForm);
    elements.uploadVoiceBtn.addEventListener('click', uploadCustomVoice);

    // Conversion events
    elements.convertBtn.addEventListener('click', startConversion);
    elements.cancelBtn.addEventListener('click', cancelConversion);
    elements.newConversionBtn.addEventListener('click', resetToInitialState);
    elements.retryBtn.addEventListener('click', resetToInitialState);

    // Task Manager events
    elements.cancelAllBtn.addEventListener('click', cancelAllTasks);
    elements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);
}

// File Upload Handling
function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        validateAndSetFile(e.target.files[0]);
    }
}

function validateAndSetFile(file) {
    const supportedFormats = ['.pdf', '.doc', '.docx', '.epub', '.fb2', '.mobi'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!supportedFormats.includes(ext)) {
        alert(`Unsupported format: ${ext}\n\nSupported formats: ${supportedFormats.join(', ')}`);
        return;
    }

    state.selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.selectedFile.hidden = false;
    elements.dropZone.style.display = 'none';
    updateConvertButton();
}

function clearSelectedFile() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.selectedFile.hidden = true;
    elements.dropZone.style.display = 'block';
    updateConvertButton();
}

function updateConvertButton() {
    elements.convertBtn.disabled = !state.selectedFile;
}

// Voice Management
async function loadVoices() {
    try {
        const response = await fetch(`${API_BASE}/voices/voices`);
        if (!response.ok) throw new Error('Failed to load voices');

        state.voices = await response.json();
        populateVoiceDropdown();
    } catch (error) {
        console.error('Error loading voices:', error);
    }
}

function populateVoiceDropdown() {
    while (elements.voiceSelect.options.length > 1) {
        elements.voiceSelect.remove(1);
    }

    state.voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.id;
        option.textContent = `${voice.name} (${voice.voice_type})`;
        elements.voiceSelect.appendChild(option);
    });
}

function handleVoiceChange(e) {
    state.selectedVoiceId = e.target.value || null;
}

function toggleCustomVoiceForm() {
    const isHidden = elements.customVoiceForm.hidden;
    elements.customVoiceForm.hidden = !isHidden;
    elements.toggleCustomVoice.textContent = isHidden
        ? '- Hide Custom Voice'
        : '+ Add Custom Voice';
}

async function uploadCustomVoice() {
    const name = elements.voiceName.value.trim();
    const file = elements.voiceFile.files[0];

    if (!name || !file) {
        alert('Please provide both a name and a voice file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        elements.uploadVoiceBtn.disabled = true;
        elements.uploadVoiceBtn.textContent = 'Uploading...';

        const response = await fetch(`${API_BASE}/voices/upload-voice?name=${encodeURIComponent(name)}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const newVoice = await response.json();
        state.voices.push(newVoice);
        populateVoiceDropdown();

        elements.voiceSelect.value = newVoice.id;
        state.selectedVoiceId = newVoice.id;

        elements.voiceName.value = '';
        elements.voiceFile.value = '';
        elements.customVoiceForm.hidden = true;
        elements.toggleCustomVoice.textContent = '+ Add Custom Voice';

        alert('Voice uploaded successfully!');

    } catch (error) {
        alert(`Voice upload failed: ${error.message}`);
    } finally {
        elements.uploadVoiceBtn.disabled = false;
        elements.uploadVoiceBtn.textContent = 'Upload Voice';
    }
}

// Conversion Process
async function startConversion() {
    if (!state.selectedFile) return;

    const formData = new FormData();
    formData.append('file', state.selectedFile);
    if (state.selectedVoiceId) {
        formData.append('voice_id', state.selectedVoiceId);
    }

    try {
        elements.convertBtn.disabled = true;
        elements.convertBtn.textContent = 'Uploading...';

        const response = await fetch(`${API_BASE}/conversion/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const conversion = await response.json();

        // Clear selected file and refresh task list
        clearSelectedFile();
        elements.convertBtn.textContent = 'Convert to Audiobook';

        // Load and show task manager
        await loadTasks();

    } catch (error) {
        alert(`Upload failed: ${error.message}`);
        elements.convertBtn.disabled = false;
        elements.convertBtn.textContent = 'Convert to Audiobook';
    }
}

async function cancelConversion() {
    if (!state.conversionId) return;

    try {
        elements.cancelBtn.disabled = true;
        elements.cancelBtn.textContent = 'Cancelling...';

        const response = await fetch(`${API_BASE}/conversion/cancel/${state.conversionId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Cancel failed');
        }

        stopPolling();
        resetToInitialState();

    } catch (error) {
        alert(`Failed to cancel: ${error.message}`);
        elements.cancelBtn.disabled = false;
        elements.cancelBtn.textContent = 'Cancel Conversion';
    }
}

function startPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
    }

    state.pollingInterval = setInterval(checkConversionStatus, POLLING_INTERVAL);
    checkConversionStatus();
}

async function checkConversionStatus() {
    if (!state.conversionId) return;

    try {
        const response = await fetch(`${API_BASE}/conversion/status/${state.conversionId}`);

        if (!response.ok) {
            throw new Error('Failed to get status');
        }

        const conversion = await response.json();
        handleStatusUpdate(conversion);

    } catch (error) {
        console.error('Status check error:', error);
    }
}

function handleStatusUpdate(conversion) {
    const { status, progress, output_path, error_message } = conversion;

    switch (status) {
        case 'pending':
            updateProgress(progress, 'pending', 'Waiting in queue...');
            break;

        case 'processing':
            updateProgress(progress, 'processing', 'Converting to audiobook...');
            break;

        case 'completed':
            stopPolling();
            showResult(output_path);
            break;

        case 'failed':
            stopPolling();
            showError(error_message || 'Conversion failed. Please try again.');
            break;

        case 'cancelled':
            stopPolling();
            resetToInitialState();
            break;
    }
}

function updateProgress(percent, status, message) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${Math.round(percent)}%`;
    elements.progressStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${status}`;
}

function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}

// Result Display
function showResult(outputPath) {
    const audioUrl = `/outputs/${outputPath}`;

    elements.audioPlayer.src = audioUrl;
    elements.downloadBtn.href = audioUrl;
    elements.downloadBtn.download = outputPath;

    showSection('result');
}

// Error Handling
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
    stopPolling();
}

// UI State Management
function showSection(section) {
    elements.progressSection.hidden = true;
    elements.resultSection.hidden = true;
    elements.errorSection.hidden = true;

    switch (section) {
        case 'progress':
            elements.progressSection.hidden = false;
            break;
        case 'result':
            elements.resultSection.hidden = false;
            break;
        case 'error':
            elements.errorSection.hidden = false;
            break;
    }
}

function resetToInitialState() {
    stopPolling();

    state.selectedFile = null;
    state.conversionId = null;

    clearSelectedFile();
    elements.voiceSelect.value = '';
    state.selectedVoiceId = null;
    elements.convertBtn.disabled = true;

    elements.cancelBtn.disabled = false;
    elements.cancelBtn.textContent = 'Cancel Conversion';

    elements.progressSection.hidden = true;
    elements.resultSection.hidden = true;
    elements.errorSection.hidden = true;

    updateProgress(0, 'pending', '');
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('voynich-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    state.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(state.theme);
    localStorage.setItem('voynich-theme', state.theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Task Manager
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/conversion/list?active_only=false`);
        if (!response.ok) throw new Error('Failed to load tasks');

        state.tasks = await response.json();
        renderTaskList();

        // Only poll if there are active tasks
        const hasActiveTasks = state.tasks.some(t => ['pending', 'processing'].includes(t.status));
        if (hasActiveTasks) {
            startTaskPolling();
        } else {
            stopTaskPolling();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function startTaskPolling() {
    if (state.taskPollingInterval) {
        clearInterval(state.taskPollingInterval);
    }

    state.taskPollingInterval = setInterval(loadTasks, POLLING_INTERVAL);
}

function stopTaskPolling() {
    if (state.taskPollingInterval) {
        clearInterval(state.taskPollingInterval);
        state.taskPollingInterval = null;
    }
}

function renderTaskList() {
    const hasTasks = state.tasks.length > 0;

    // Always show task manager, but toggle inner elements
    elements.taskTableHeader.hidden = !hasTasks;
    elements.taskEmpty.hidden = hasTasks;
    elements.cancelAllBtn.hidden = !hasTasks;

    if (!hasTasks) {
        elements.taskList.innerHTML = '';
        stopTaskPolling();
        return;
    }

    elements.taskList.innerHTML = state.tasks.map(task => createTaskRowHTML(task)).join('');

    // Attach cancel button listeners
    elements.taskList.querySelectorAll('.task-cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('.task-row').dataset.id;
            cancelTask(taskId);
        });
    });

    // Attach download button listeners
    elements.taskList.querySelectorAll('.task-download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Attach remove button listeners
    elements.taskList.querySelectorAll('.task-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('.task-row').dataset.id;
            removeTaskFromDB(taskId);
        });
    });

    // Setup context menu
    setupContextMenu();
}

function createTaskRowHTML(task) {
    const eta = formatETA(task);
    const canCancel = ['pending', 'processing'].includes(task.status);
    const isCompleted = task.status === 'completed';
    const isFinished = ['completed', 'failed', 'cancelled'].includes(task.status);
    const percent = Math.round(task.progress);
    const isLowProgress = percent < 30;

    let actionsHTML = '';
    if (canCancel) {
        actionsHTML = `
            <button class="task-cancel-btn" aria-label="Cancel conversion" title="Cancel">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
    } else if (isCompleted && task.output_path) {
        actionsHTML = `
            <a class="task-download-btn" href="/outputs/${task.output_path}" download title="Download">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
            <button class="task-remove-btn" aria-label="Remove from list" title="Remove">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
    } else if (isFinished) {
        actionsHTML = `
            <button class="task-remove-btn" aria-label="Remove from list" title="Remove">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
    }

    return `
        <div class="task-row ${task.status}" data-id="${task.id}" data-output="${task.output_path || ''}">
            <div class="task-name">
                <span class="task-filename" title="${escapeHTML(task.filename)}">${escapeHTML(task.filename)}</span>
            </div>
            <div class="task-progress-cell">
                <div class="task-progress-bar${isLowProgress ? ' low' : ''}">
                    <div class="task-progress-fill" style="width: ${task.progress}%" data-percent="${percent}%"></div>
                </div>
            </div>
            <div class="task-status-cell">
                <span class="task-status-badge ${task.status}">${task.status}</span>
            </div>
            <div class="task-eta-cell">${eta}</div>
            <div class="task-actions-cell">
                ${actionsHTML}
            </div>
        </div>
    `;
}

function formatETA(task) {
    if (task.status === 'pending') {
        return 'Waiting...';
    }

    if (task.status === 'completed') {
        return 'Done';
    }

    if (task.status === 'failed' || task.status === 'cancelled') {
        return task.status.charAt(0).toUpperCase() + task.status.slice(1);
    }

    if (!task.estimated_seconds_remaining || task.estimated_seconds_remaining <= 0) {
        return 'Calculating...';
    }

    const seconds = Math.round(task.estimated_seconds_remaining);

    if (seconds < 60) {
        return '< 1m';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

async function cancelTask(taskId) {
    try {
        const response = await fetch(`${API_BASE}/conversion/cancel/${taskId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Cancel failed');
        }

        // Refresh task list
        await loadTasks();

    } catch (error) {
        alert(`Failed to cancel: ${error.message}`);
    }
}

async function cancelAllTasks() {
    if (!confirm('Cancel all active conversions?')) return;

    try {
        const response = await fetch(`${API_BASE}/conversion/cancel-all`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Cancel all failed');
        }

        await loadTasks();
    } catch (error) {
        alert(`Failed to cancel all: ${error.message}`);
    }
}

async function clearCompletedTasks() {
    try {
        const response = await fetch(`${API_BASE}/conversion/clear-completed`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Clear failed');
        }

        await loadTasks();
    } catch (error) {
        alert(`Failed to clear: ${error.message}`);
    }
}

function removeTask(taskId) {
    const taskElement = elements.taskList.querySelector(`.task-row[data-id="${taskId}"]`);
    if (taskElement) {
        taskElement.classList.add('removing');
        setTimeout(() => {
            state.tasks = state.tasks.filter(t => t.id !== parseInt(taskId));
            renderTaskList();
        }, 300);
    }
}

async function removeTaskFromDB(taskId) {
    try {
        const response = await fetch(`${API_BASE}/conversion/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Delete failed');
        }

        await loadTasks();
    } catch (error) {
        alert(`Failed to remove: ${error.message}`);
    }
}

// Context menu
let contextMenu = null;
let contextTaskId = null;
let contextOutputPath = null;

function setupContextMenu() {
    // Create context menu if it doesn't exist
    if (!contextMenu) {
        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="download">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
            </div>
            <div class="context-menu-item" data-action="play">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" data-action="remove">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg>
                Remove
            </div>
        `;
        document.body.appendChild(contextMenu);

        // Context menu item clicks
        contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                handleContextAction(action);
                hideContextMenu();
            });
        });

        // Hide on click outside
        document.addEventListener('click', hideContextMenu);
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.task-row')) {
                hideContextMenu();
            }
        });
    }

    // Add right-click handlers to task rows
    elements.taskList.querySelectorAll('.task-row.completed').forEach(row => {
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            contextTaskId = row.dataset.id;
            contextOutputPath = row.dataset.output;
            showContextMenu(e.pageX, e.pageY);
        });
    });
}

function showContextMenu(x, y) {
    if (!contextMenu) return;

    // Position menu
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.add('visible');

    // Adjust if off-screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${y - rect.height}px`;
    }
}

function hideContextMenu() {
    if (contextMenu) {
        contextMenu.classList.remove('visible');
    }
    contextTaskId = null;
    contextOutputPath = null;
}

function handleContextAction(action) {
    if (!contextTaskId) return;

    switch (action) {
        case 'download':
            if (contextOutputPath) {
                const link = document.createElement('a');
                link.href = `/outputs/${contextOutputPath}`;
                link.download = contextOutputPath;
                link.click();
            }
            break;
        case 'play':
            if (contextOutputPath) {
                const audioUrl = `/outputs/${contextOutputPath}`;
                // Open in audio player or new tab
                window.open(audioUrl, '_blank');
            }
            break;
        case 'remove':
            removeTaskFromDB(contextTaskId);
            break;
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
