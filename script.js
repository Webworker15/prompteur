// ==================== VARIABLES GLOBALES ====================
const elements = {
    // Edit Section
    editSection: document.getElementById('editSection'),
    textInput: document.getElementById('textInput'),
    speedControl: document.getElementById('speedControl'),
    speedValue: document.getElementById('speedValue'),
    fontSizeControl: document.getElementById('fontSizeControl'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    bgColorControl: document.getElementById('bgColorControl'),
    textColorControl: document.getElementById('textColorControl'),
    durationEstimate: document.getElementById('durationEstimate'),
    
    // File Actions
    importBtn: document.getElementById('importBtn'),
    fileInput: document.getElementById('fileInput'),
    saveBtn: document.getElementById('saveBtn'),
    clearBtn: document.getElementById('clearBtn'),
    
    // Transform Buttons
    mirrorBtn: document.getElementById('mirrorBtn'),
    flipBtn: document.getElementById('flipBtn'),
    
    // Recording
    recordBtn: document.getElementById('recordBtn'),
    stopRecordBtn: document.getElementById('stopRecordBtn'),
    recordingStatus: document.getElementById('recordingStatus'),
    audioPlayback: document.getElementById('audioPlayback'),
    
    // Start Button
    startPrompterBtn: document.getElementById('startPrompterBtn'),
    
    // Prompter Section
    prompterSection: document.getElementById('prompterSection'),
    prompterDisplay: document.getElementById('prompterDisplay'),
    prompterText: document.getElementById('prompterText'),
    readingGuide: document.getElementById('readingGuide'),
    
    // Floating Controls
    floatingControls: document.getElementById('floatingControls'),
    timerDisplay: document.getElementById('timerDisplay'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    restartBtn: document.getElementById('restartBtn'),
    speedDownBtn: document.getElementById('speedDownBtn'),
    speedUpBtn: document.getElementById('speedUpBtn'),
    currentSpeed: document.getElementById('currentSpeed'),
    sizeDownBtn: document.getElementById('sizeDownBtn'),
    sizeUpBtn: document.getElementById('sizeUpBtn'),
    exitFullscreenBtn: document.getElementById('exitFullscreenBtn')
};

let state = {
    animationId: null,
    currentPosition: 0,
    speed: 5,
    fontSize: 48,
    isPaused: false,
    isPlaying: false,
    startTime: 0,
    elapsedTime: 0,
    pauseTime: 0,
    isMirrored: false,
    isFlipped: false,
    mediaRecorder: null,
    audioChunks: [],
    recordedAudios: []
};

// ==================== INITIALISATION ====================
window.addEventListener('load', () => {
    loadSavedText();
    updateDurationEstimate();
    applyTransforms();
});

// ==================== GESTION DU TEXTE ====================
elements.textInput.addEventListener('input', () => {
    updateDurationEstimate();
    saveTextToLocalStorage();
});

elements.speedControl.addEventListener('input', (e) => {
    state.speed = parseInt(e.target.value);
    elements.speedValue.textContent = state.speed;
    elements.currentSpeed.textContent = state.speed;
    updateDurationEstimate();
});

elements.fontSizeControl.addEventListener('input', (e) => {
    state.fontSize = parseInt(e.target.value);
    elements.fontSizeValue.textContent = state.fontSize + 'px';
    elements.prompterText.style.fontSize = state.fontSize + 'px';
});

elements.bgColorControl.addEventListener('change', (e) => {
    elements.prompterDisplay.style.backgroundColor = e.target.value;
});

elements.textColorControl.addEventListener('change', (e) => {
    elements.prompterText.style.color = e.target.value;
});

// ==================== CALCUL DE DURÉE ====================
function updateDurationEstimate() {
    const text = elements.textInput.value.trim();
    if (!text) {
        elements.durationEstimate.textContent = 'Durée estimée : --:--';
        return;
    }
    
    const wordCount = text.split(/\s+/).length;
    const avgReadingSpeed = 150; // mots par minute
    const speedFactor = state.speed / 10; // normaliser la vitesse
    const minutes = wordCount / (avgReadingSpeed * speedFactor);
    const seconds = Math.round(minutes * 60);
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    elements.durationEstimate.textContent = `Durée estimée : ${timeStr}`;
}

// ==================== GESTION DES FICHIERS ====================
elements.importBtn.addEventListener('click', () => {
    elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        elements.textInput.value = event.target.result;
        updateDurationEstimate();
        saveTextToLocalStorage();
    };
    reader.readAsText(file);
});

elements.saveBtn.addEventListener('click', () => {
    const text = elements.textInput.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompteur_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

elements.clearBtn.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le texte ?')) {
        elements.textInput.value = '';
        updateDurationEstimate();
        localStorage.removeItem('prompterText');
    }
});

function saveTextToLocalStorage() {
    localStorage.setItem('prompterText', elements.textInput.value);
}

function loadSavedText() {
    const savedText = localStorage.getItem('prompterText');
    if (savedText) {
        elements.textInput.value = savedText;
    }
}

// ==================== TRANSFORMATIONS ====================
elements.mirrorBtn.addEventListener('click', () => {
    state.isMirrored = !state.isMirrored;
    elements.mirrorBtn.classList.toggle('active');
    applyTransforms();
});

elements.flipBtn.addEventListener('click', () => {
    state.isFlipped = !state.isFlipped;
    elements.flipBtn.classList.toggle('active');
    applyTransforms();
});

function applyTransforms() {
    let transform = '';
    
    if (state.isMirrored) {
        transform += 'scaleX(-1) ';
    }
    
    if (state.isFlipped) {
        transform += 'scaleY(-1) ';
    }
    
    elements.prompterText.style.transform = transform.trim() || 'none';
}

// ==================== ENREGISTREMENT AUDIO ====================
elements.recordBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];
        
        state.mediaRecorder.ondataavailable = (e) => {
            state.audioChunks.push(e.data);
        };
        
        state.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            addAudioToPlayback(audioUrl, audioBlob);
            
            // Arrêter tous les tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        state.mediaRecorder.start();
        
        elements.recordBtn.disabled = true;
        elements.stopRecordBtn.disabled = false;
        elements.recordingStatus.textContent = '🔴 Enregistrement en cours...';
        elements.recordingStatus.classList.add('active');
        
    } catch (err) {
        alert('Erreur d\'accès au microphone : ' + err.message);
    }
});

elements.stopRecordBtn.addEventListener('click', () => {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
        
        elements.recordBtn.disabled = false;
        elements.stopRecordBtn.disabled = true;
        elements.recordingStatus.classList.remove('active');
        elements.recordingStatus.textContent = '';
    }
});

function addAudioToPlayback(url, blob) {
    const audioItem = document.createElement('div');
    audioItem.className = 'audio-item';
    
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    
    const actions = document.createElement('div');
    actions.className = 'audio-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-outline';
    downloadBtn.innerHTML = '<span class="icon">💾</span> Télécharger';
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `enregistrement_${new Date().getTime()}.webm`;
        a.click();
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = '<span class="icon">🗑️</span> Supprimer';
    deleteBtn.onclick = () => {
        audioItem.remove();
        URL.revokeObjectURL(url);
    };
    
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);
    audioItem.appendChild(audio);
    audioItem.appendChild(actions);
    
    elements.audioPlayback.appendChild(audioItem);
    state.recordedAudios.push({ url, blob });
}

// ==================== DÉMARRAGE DU PROMPTEUR ====================
elements.startPrompterBtn.addEventListener('click', () => {
    const text = elements.textInput.value.trim();
    
    if (!text) {
        alert('Veuillez saisir un texte avant de démarrer le prompteur !');
        return;
    }
    
    // Préparer le prompteur
    elements.prompterText.textContent = text;
    elements.prompterText.style.fontSize = state.fontSize + 'px';
    elements.prompterDisplay.style.backgroundColor = elements.bgColorControl.value;
    elements.prompterText.style.color = elements.textColorControl.value;
    
    // Afficher la section prompteur
    elements.editSection.style.display = 'none';
    elements.prompterSection.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Positionner le texte en bas
    state.currentPosition = window.innerHeight;
    elements.prompterText.style.top = state.currentPosition + 'px';
    
    // Réinitialiser les transformations
    applyTransforms();
    
    // Démarrer automatiquement
    startScrolling();
});

// ==================== CONTRÔLES DU PROMPTEUR ====================
function startScrolling() {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    state.isPaused = false;
    state.startTime = Date.now() - state.elapsedTime;
    
    elements.playPauseBtn.innerHTML = '<span class="icon">⏸️</span>';
    
    if (!state.animationId) {
        state.animationId = requestAnimationFrame(scroll);
    }
}

function pauseScrolling() {
    state.isPaused = !state.isPaused;
    
    if (state.isPaused) {
        state.pauseTime = Date.now();
        elements.playPauseBtn.innerHTML = '<span class="icon">▶️</span>';
    } else {
        state.elapsedTime += Date.now() - state.pauseTime;
        state.startTime = Date.now() - state.elapsedTime;
        elements.playPauseBtn.innerHTML = '<span class="icon">⏸️</span>';
    }
}

function stopScrolling() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    state.isPlaying = false;
    state.isPaused = false;
    state.elapsedTime = 0;
    elements.playPauseBtn.innerHTML = '<span class="icon">▶️</span>';
}

function restartScrolling() {
    stopScrolling();
    state.currentPosition = window.innerHeight;
    elements.prompterText.style.top = state.currentPosition + 'px';
    state.elapsedTime = 0;
    updateTimer();
    startScrolling();
}

function scroll() {
    if (!state.isPaused) {
        state.currentPosition -= state.speed * 0.5;
        elements.prompterText.style.top = state.currentPosition + 'px';
        
        // Mettre à jour le timer
        state.elapsedTime = Date.now() - state.startTime;
        updateTimer();
        
        // Vérifier si le texte a complètement défilé
        const textHeight = elements.prompterText.offsetHeight;
        
        if (state.currentPosition + textHeight < 0) {
            stopScrolling();
            alert('Le défilement est terminé !');
            return;
        }
    }
    
    state.animationId = requestAnimationFrame(scroll);
}

function updateTimer() {
    const totalSeconds = Math.floor(state.elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    elements.timerDisplay.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ==================== ÉVÉNEMENTS DES CONTRÔLES ====================
elements.playPauseBtn.addEventListener('click', () => {
    if (state.isPlaying) {
        pauseScrolling();
    } else {
        startScrolling();
    }
});

elements.stopBtn.addEventListener('click', stopScrolling);
elements.restartBtn.addEventListener('click', restartScrolling);

elements.speedDownBtn.addEventListener('click', () => {
    if (state.speed > 1) {
        state.speed--;
        elements.currentSpeed.textContent = state.speed;
        elements.speedControl.value = state.speed;
        elements.speedValue.textContent = state.speed;
    }
});

elements.speedUpBtn.addEventListener('click', () => {
    if (state.speed < 20) {
        state.speed++;
        elements.currentSpeed.textContent = state.speed;
        elements.speedControl.value = state.speed;
        elements.speedValue.textContent = state.speed;
    }
});

elements.sizeDownBtn.addEventListener('click', () => {
    if (state.fontSize > 20) {
        state.fontSize -= 5;
        elements.prompterText.style.fontSize = state.fontSize + 'px';
        elements.fontSizeControl.value = state.fontSize;
        elements.fontSizeValue.textContent = state.fontSize + 'px';
    }
});

elements.sizeUpBtn.addEventListener('click', () => {
    if (state.fontSize < 100) {
        state.fontSize += 5;
        elements.prompterText.style.fontSize = state.fontSize + 'px';
        elements.fontSizeControl.value = state.fontSize;
        elements.fontSizeValue.textContent = state.fontSize + 'px';
    }
});

elements.exitFullscreenBtn.addEventListener('click', () => {
    stopScrolling();
    elements.prompterSection.classList.add('hidden');
    elements.editSection.style.display = 'block';
    document.body.style.overflow = 'auto';
});

// ==================== RACCOURCIS CLAVIER ====================
document.addEventListener('keydown', (e) => {
    // Seulement si le prompteur est actif
    if (!elements.prompterSection.classList.contains('hidden')) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                elements.playPauseBtn.click();
                break;
            case 'Escape':
                e.preventDefault();
                elements.exitFullscreenBtn.click();
                break;
            case 'KeyR':
                e.preventDefault();
                elements.restartBtn.click();
                break;
            case 'KeyS':
                e.preventDefault();
                elements.stopBtn.click();
                break;
            case 'ArrowUp':
                e.preventDefault();
                elements.speedUpBtn.click();
                break;
            case 'ArrowDown':
                e.preventDefault();
                elements.speedDownBtn.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                elements.sizeUpBtn.click();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                elements.sizeDownBtn.click();
                break;
        }
    }
    
    // Dans la zone d'édition
    if (!elements.textInput.matches(':focus')) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    elements.saveBtn.click();
                    break;
                case 'o':
                    e.preventDefault();
                    elements.importBtn.click();
                    break;
            }
        }
    }
});

// ==================== AUTO-HIDE CONTROLS ====================
let controlsTimeout;

elements.prompterDisplay.addEventListener('mousemove', () => {
    elements.floatingControls.style.opacity = '1';
    
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        if (state.isPlaying && !state.isPaused) {
            elements.floatingControls.style.opacity = '0.3';
        }
    }, 3000);
});

// ==================== RESPONSIVE ====================
window.addEventListener('resize', () => {
    if (!elements.prompterSection.classList.contains('hidden')) {
        // Réajuster si nécessaire
    }
});

// ==================== PRÉVENTION DE LA FERMETURE ACCIDENTELLE ====================
window.addEventListener('beforeunload', (e) => {
    if (state.isPlaying) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
