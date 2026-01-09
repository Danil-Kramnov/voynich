// Voynich Audiobook Converter - Application Logic

// Application State
const state = {
    selectedFile: null,
    selectedVoiceId: null,
    conversionId: null,
    pollingInterval: null,
    voices: []
};

// API Configuration
const API_BASE = '/api';
const POLLING_INTERVAL = 2000;

// DOM Elements
const elements = {
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

    // Result
    resultSection: null,
    audioPlayer: null,
    downloadBtn: null,
    newConversionBtn: null,

    // Error
    errorSection: null,
    errorMessage: null,
    retryBtn: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeEventListeners();
    loadVoices();
});

function initializeElements() {
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

    elements.resultSection = document.getElementById('resultSection');
    elements.audioPlayer = document.getElementById('audioPlayer');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.newConversionBtn = document.getElementById('newConversionBtn');

    elements.errorSection = document.getElementById('errorSection');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.retryBtn = document.getElementById('retryBtn');
}

function initializeEventListeners() {
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
    elements.newConversionBtn.addEventListener('click', resetToInitialState);
    elements.retryBtn.addEventListener('click', resetToInitialState);
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
        showSection('progress');
        updateProgress(0, 'pending', 'Uploading file...');
        elements.convertBtn.disabled = true;

        const response = await fetch(`${API_BASE}/conversion/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const conversion = await response.json();
        state.conversionId = conversion.id;

        startPolling();

    } catch (error) {
        showError(`Conversion failed: ${error.message}`);
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

    elements.progressSection.hidden = true;
    elements.resultSection.hidden = true;
    elements.errorSection.hidden = true;

    updateProgress(0, 'pending', '');
}
