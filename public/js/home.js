const uname = localStorage.getItem('username');
if (uname == null || uname === '' || uname === undefined) {
    alert('Please login to get started');
    localStorage.clear();
    window.location.href = '/login.html';
    throw new Error('No username found');
}

// One-time ad blocker warning
console.warn("Ad blocker may cause player issues; ensure you're not using Brave or any ad blocker");

const defaultHomdata = {
    user: {
        name: uname,
        streak: 0,
        currentMood: 'Not set',
        goal: 'Overcome procrastination and build discipline',
        streakHistory: [],
        avatar: '',
        playlist: [
            { tag: 'rain', url: 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw' },
            { tag: 'thunderrain', url: 'https://www.youtube.com/watch?v=qlLkTmoKjOY' },
            { tag: 'forest', url: 'https://www.youtube.com/watch?v=IvjMgVS6kng' },
            { tag: 'salvatore', url: 'https://www.youtube.com/watch?v=GVQON-muEFc' },
            { tag: 'cry', url: 'https://www.youtube.com/watch?v=BfU1iB7UBH0' },
            { tag: 'rest_time', url: 'https://www.youtube.com/watch?v=EyyfRW3WC5c' },
            { tag: 'interseteller', url: 'https://www.youtube.com/watch?v=p2zMXSXhZ9M' },
            { tag: 'ambient_calming', url: 'https://www.youtube.com/watch?v=xDih5SwFs_c' },
            { tag: 'calm_anxiety', url: 'https://www.youtube.com/watch?v=zPyg4N7bcHM' },
            { tag: 'motivation_speech', url: 'https://www.youtube.com/watch?v=VfNCUm7_FMU' },
            { tag: 'madra_uchiha_speech', url: 'https://www.youtube.com/watch?v=ZR377rPci64' },
            { tag: 'hope', url: 'https://www.youtube.com/watch?v=xfzhezl_jts' },
            { tag: 'world_best_speech', url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc' },
            { tag: 'elon_musk', url: 'https://www.youtube.com/watch?v=k9zTr2MAFRg' },
            { tag: 'calmdown', url: 'https://www.youtube.com/watch?v=0L38Z9hIi5s' },
            { tag: 'study', url: 'https://www.youtube.com/watch?v=idRi7ob_cQw' },
            { tag: 'coding', url: 'https://www.youtube.com/watch?v=Yd7vDterctQ' },
            { tag: 'chill_beats', url: 'https://www.youtube.com/watch?v=sF80I-TQiW0' },
            { tag: 'lucid_dreams', url: 'https://www.youtube.com/watch?v=ff90ZV3OEsg' }
        ]
    },
    tasks: [],
    pomodoro: {
        tasks: [],
        history: [],
        settings: { workDuration: 25, breakDuration: 5 }
    },
    moods: [],
    distractions: [],
    actions: [],
    habits: [],
    gratitude: [],
    reflections: [],
    milestones: [],
    tips: [],
    settings: { darkMode: false, notifications: 'off', music: 'none', musicTime: 0 }
};

let homdata = { ...defaultHomdata };
const MAX_ENTRIES = 10;
const pendingUpdates = [];

function limitArrayEntries(array, max = MAX_ENTRIES) {
    if (array.length > max) {
        array.splice(0, array.length - max);
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function sendToApi(data) {
    try {
        const response = await fetch('/home/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uname, data })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed: ${response.status} - ${errorData.msg || 'Unknown error'}`);
        }
        console.log('Data sent to /home/data:', data);
        pendingUpdates.length = 0;
    } catch (error) {
        console.error('Error sending data to API:', error.message);
        showError('Failed to save data. Please try again.');
    }
}

const debouncedSendToApi = debounce(sendToApi, 500);

async function GetHomeUser() {
    try {
        const response = await fetch('/home/data/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: uname })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch user data: ${response.status} - ${errorData.msg || 'Unknown error'}`);
        }
        const data = await response.json();
        console.log('Fetched user data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        showError('Failed to load user data. Please try again.');
        return null;
    }
}

async function fetchAndMergeData() {
    try {
        const fetchedData = await GetHomeUser();
        if (fetchedData) {
            homdata = {
                ...defaultHomdata,
                ...fetchedData,
                user: { ...defaultHomdata.user, ...fetchedData.user },
                pomodoro: fetchedData.pomodoro || defaultHomdata.pomodoro
            };
            limitArrayEntries(homdata.moods);
            limitArrayEntries(homdata.distractions);
            limitArrayEntries(homdata.actions);
            limitArrayEntries(homdata.gratitude);
            limitArrayEntries(homdata.reflections);
            limitArrayEntries(homdata.milestones);
            if (homdata.pomodoro && homdata.pomodoro.history) {
                limitArrayEntries(homdata.pomodoro.history);
            }
            updateSpecificUI(['pomodoro', 'habits', 'gratitude', 'reflections', 'milestones', 'distractions', 'mood', 'profile', 'progress']);
        }
    } catch (error) {
        console.error('Error fetching data:', error.message);
        showError('Failed to sync data. Please check your connection.');
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #e53e3e; color: white; padding: 10px 20px;
        border-radius: 8px; z-index: 2000; font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

const clickSound = new Audio('/sounds/click');
const completeSound = new Audio('/sounds/fun');

function playClickSound() {
    clickSound.play().catch(() => console.log('Click sound failed'));
}

function playCompleteSound() {
    completeSound.play().catch(() => console.log('Complete sound failed'));
}

function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
        return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
        console.error('Failed to load YouTube IFrame API');
        showError('Failed to load YouTube player. Please disable ad blockers or try another browser.');
    };
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

let player;
window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('music-player', {
        height: '0',
        width: '0',
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
};

function onPlayerReady(event) {
    console.log('YouTube player ready');
    if (homdata.settings.music !== 'none') {
        resumeMusic();
    }
    setupMusicProgressBar();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        updateMusicProgress();
    } else if (event.data === YT.PlayerState.ENDED) {
        player.seekTo(0);
        player.playVideo();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        clearInterval(musicInterval);
        homdata.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        queueUpdate('setting', { musicTime: homdata.settings.musicTime });
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    showError('Failed to load ambient music. Please disable ad blockers or try a different browser.');
    const musicPlayer = document.getElementById('music-player');
    if (musicPlayer) musicPlayer.innerHTML = '';
    const musicProgress = document.getElementById('music-progress');
    if (musicProgress) musicProgress.value = 0;
}

function updatePlaylistUI() {
    const selects = [document.getElementById('ambientSound'), document.getElementById('ambientSound-popup')];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="none">None</option>' +
                (homdata.user.playlist || []).map(item => `<option value="${item.tag}">${item.tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('');
            select.value = homdata.settings.music || 'none';
            select.setAttribute('aria-label', 'Select ambient sound');
        }
    });
}

let musicInterval = null;
function updateMusicProgress() {
    const progressBars = [document.getElementById('music-progress'), document.getElementById('music-progress-popup')];
    if (!progressBars.some(bar => bar) || !player || !player.getCurrentTime) return;
    clearInterval(musicInterval);
    musicInterval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration ? player.getDuration() : 3600;
        const progress = (currentTime / duration) * 100;
        progressBars.forEach(bar => {
            if (bar) {
                bar.value = progress;
                bar.max = 100;
                bar.setAttribute('aria-valuenow', progress.toFixed(1));
            }
        });
        homdata.settings.musicTime = currentTime;
        queueUpdate('setting', { musicTime: currentTime });
        if (homdata.settings.music === 'none') clearInterval(musicInterval);
    }, 2000);
}

function setupMusicProgressBar() {
    const progressBars = [document.getElementById('music-progress'), document.getElementById('music-progress-popup')];
    progressBars.forEach(bar => {
        if (bar) {
            bar.setAttribute('role', 'slider');
            bar.setAttribute('aria-valuemin', '0');
            bar.setAttribute('aria-valuemax', '100');
            bar.removeEventListener('input', handleMusicProgressInput);
            bar.addEventListener('input', handleMusicProgressInput);
            bar.removeEventListener('keydown', handleMusicProgressKeydown);
            bar.addEventListener('keydown', handleMusicProgressKeydown);
        }
    });
}

function handleMusicProgressInput(e) {
    if (player && player.seekTo) {
        const duration = player.getDuration ? player.getDuration() : 3600;
        const seekTime = (e.target.value / 100) * duration;
        player.seekTo(seekTime, true);
        homdata.settings.musicTime = seekTime;
        queueUpdate('setting', { musicTime: seekTime });
    }
}

function handleMusicProgressKeydown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.key === 'ArrowLeft' ? -5 : 5;
        const duration = player.getDuration ? player.getDuration() : 3600;
        const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        const newTime = Math.max(0, Math.min(duration, currentTime + step));
        player.seekTo(newTime, true);
        const progressBars = [document.getElementById('music-progress'), document.getElementById('music-progress-popup')];
        progressBars.forEach(bar => {
            if (bar) bar.value = (newTime / duration) * 100;
        });
        homdata.settings.musicTime = newTime;
        queueUpdate('setting', { musicTime: newTime });
    }
}

function playMusic() {
    const select = document.getElementById('ambientSound')?.value ? document.getElementById('ambientSound') : document.getElementById('ambientSound-popup');
    const sound = select?.value;
    if (sound === 'none') return;
    homdata.settings.music = sound;
    const track = homdata.user.playlist.find(p => p.tag === sound);
    if (track && player && typeof player.loadVideoById === 'function') {
        const videoId = getYouTubeVideoId(track.url);
        if (videoId) {
            player.loadVideoById({ videoId: videoId, startSeconds: homdata.settings.musicTime || 0, suggestedQuality: 'small' });
            player.playVideo();
            updateMusicProgress();
            queueUpdate('setting', { music: sound });
            const trackTitles = [document.getElementById('track-title'), document.getElementById('track-title-popup')];
            trackTitles.forEach(title => {
                if (title) title.textContent = select.options[select.selectedIndex].text;
            });
        }
    }
}

function pauseMusic() {
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
        clearInterval(musicInterval);
        homdata.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        queueUpdate('setting', { musicTime: homdata.settings.musicTime });
    }
}

function stopMusic() {
    if (player && typeof player.stopVideo === 'function') {
        player.stopVideo();
        clearInterval(musicInterval);
        homdata.settings.music = 'none';
        homdata.settings.musicTime = 0;
        queueUpdate('setting', { music: 'none', musicTime: 0 });
        const progressBars = [document.getElementById('music-progress'), document.getElementById('music-progress-popup')];
        progressBars.forEach(bar => {
            if (bar) bar.value = 0;
        });
        const trackTitles = [document.getElementById('track-title'), document.getElementById('track-title-popup')];
        trackTitles.forEach(title => {
            if (title) title.textContent = 'None';
        });
    }
}

function resumeMusic() {
    const sound = homdata.settings.music;
    if (sound === 'none') return;
    const track = homdata.user.playlist.find(p => p.tag === sound);
    if (track && player && typeof player.loadVideoById === 'function') {
        const videoId = getYouTubeVideoId(track.url);
        if (videoId) {
            player.loadVideoById({ videoId: videoId, startSeconds: homdata.settings.musicTime || 0, suggestedQuality: 'small' });
            player.playVideo();
            updateMusicProgress();
            queueUpdate('setting', { music: sound });
        }
    }
}

function queueUpdate(type, value) {
    pendingUpdates.push({ type, value });
    debouncedSendToApi(homdata);
}

function updateTriggerLog() {
    const triggerLogs = [document.getElementById('trigger-log'), document.getElementById('trigger-log-popup')];
    triggerLogs.forEach(log => {
        if (log) {
            const recentTriggers = homdata.distractions.slice(-3).map(d => d.trigger).join(', ') || 'None';
            log.innerHTML = `<p class="list-item"><i class="fas fa-exclamation-circle"></i> Recent triggers: ${recentTriggers}</p>`;
            const progressBar = log.parentElement.querySelector('.progress-bar div');
            if (progressBar) {
                const distractionCount = homdata.distractions.length;
                const maxDisplay = 10;
                const progress = Math.min((distractionCount / maxDisplay) * 100, 100);
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress.toFixed(1));
                progressBar.setAttribute('aria-label', `Distraction progress: ${progress.toFixed(1)}%`);
            }
        }
    });
}

function updateHomdata(type, value) {
    try {
        if (type === 'mood') {
            homdata.moods.push({ mood: value, timestamp: new Date().toISOString(), id: `mood-${Date.now()}` });
            limitArrayEntries(homdata.moods);
            homdata.user.currentMood = value;
            updateSpecificUI(['mood']);
            queueUpdate(type, value);
        } else if (type === 'pomodoro_task') {
            if (!homdata.pomodoro) homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
            homdata.pomodoro.tasks.push({ ...value, timestamp: new Date().toISOString(), timeSpent: 0, isActive: false });
            animateAddElement('pomodoro-list', () => updateSpecificUI(['pomodoro']));
            queueUpdate(type, value);
        } else if (type === 'pomodoro_complete') {
            const task = homdata.pomodoro?.tasks.find(t => t.name === value.name);
            if (task) {
                task.completed = value.completed;
                if (value.completed) {
                    homdata.pomodoro.history.push({
                        name: task.name,
                        duration: task.duration,
                        completedAt: new Date().toISOString()
                    });
                    limitArrayEntries(homdata.pomodoro.history);
                    task.isActive = false;
                    animateRemoveElement(`pomodoro-task-${task.name.replace(/\s+/g, '-')}`, () => {
                        homdata.pomodoro.tasks = homdata.pomodoro.tasks.filter(t => t.name !== value.name);
                        updateSpecificUI(['pomodoro', 'history', 'streak']);
                    });
                    queueUpdate(type, value);
                    updateStreak();
                    triggerCelebration();
                } else {
                    updateSpecificUI(['pomodoro']);
                    queueUpdate(type, value);
                }
            }
        } else if (type === 'pomodoro_remove') {
            const taskName = value;
            const safeTaskName = taskName.replace(/\s+/g, '-');
            const taskElement = document.querySelector(`#pomodoro-list li[data-task-name="${taskName}"], #pomodoro-list-popup li[data-task-name="${taskName}"]`);
            if (taskElement) {
                animateRemoveElement(`pomodoro-task-${safeTaskName}`, () => {
                    homdata.pomodoro.tasks = homdata.pomodoro.tasks.filter(t => t.name !== taskName);
                    updateSpecificUI(['pomodoro']);
                });
            } else {
                homdata.pomodoro.tasks = homdata.pomodoro.tasks.filter(t => t.name !== taskName);
                updateSpecificUI(['pomodoro']);
            }
            queueUpdate(type, value);
        } else if (type === 'pomodoro_time') {
            const task = homdata.pomodoro?.tasks.find(t => t.name === value.name);
            if (task) {
                task.timeSpent = value.timeSpent;
                task.isActive = value.isActive;
                updateSpecificUI(['pomodoro']);
                queueUpdate(type, value);
            }
        } else if (type === 'pomodoro_settings') {
            if (!homdata.pomodoro) homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
            homdata.pomodoro.settings = { ...homdata.pomodoro.settings, ...value };
            queueUpdate(type, value);
        } else if (type === 'distraction') {
            homdata.distractions.push({ trigger: value, timestamp: new Date().toISOString(), id: `distraction-${Date.now()}` });
            limitArrayEntries(homdata.distractions);
            animateAddElement('trigger-log', () => updateSpecificUI(['distractions']));
            queueUpdate(type, value);
        } else if (type === 'gratitude') {
            const gratitudeId = `gratitude-${Date.now()}`;
            homdata.gratitude.push({ text: value, timestamp: new Date().toISOString(), id: gratitudeId });
            limitArrayEntries(homdata.gratitude);
            animateAddElement('gratitude-list', () => updateSpecificUI(['gratitude']));
            queueUpdate(type, value);
        } else if (type === 'reflection') {
            const reflectionId = `reflection-${Date.now()}`;
            homdata.reflections.push({ text: value, timestamp: new Date().toISOString(), id: reflectionId });
            limitArrayEntries(homdata.reflections);
            animateAddElement('reflection-list', () => updateSpecificUI(['reflections']));
            queueUpdate(type, value);
        } else if (type === 'setting') {
            homdata.settings = { ...homdata.settings, ...value };
            updateSpecificUI(['settings']);
            queueUpdate(type, value);
        } else if (type === 'action') {
            homdata.actions.push({ action: value, timestamp: new Date().toISOString(), id: `action-${Date.now()}` });
            limitArrayEntries(homdata.actions);
            queueUpdate(type, value);
        } else if (type === 'habit') {
            homdata.habits.push({ name: value.name, progress: '0/' + value.goal, goal: value.goal });
            animateAddElement('habit-list', () => updateSpecificUI(['habits']));
            queueUpdate(type, value);
        } else if (type === 'habit_complete') {
            const habit = homdata.habits.find(h => h.name === value);
            if (habit) {
                const [current, total] = habit.progress.split('/').map(Number);
                if (current < total) {
                    habit.progress = `${current + 1}/${total}`;
                    animateAddElement('habit-list', () => updateSpecificUI(['habits']));
                    checkMilestones();
                    triggerCelebration();
                    queueUpdate(type, value);
                }
            }
        } else if (type === 'goal') {
            homdata.user.goal = value;
            updateSpecificUI(['goal']);
            queueUpdate(type, value);
        } else if (type === 'milestone') {
            const milestoneId = `milestone-${Date.now()}`;
            homdata.milestones.push({ text: value, timestamp: new Date().toISOString(), id: milestoneId });
            limitArrayEntries(homdata.milestones);
            animateAddElement('milestone-list', () => updateSpecificUI(['milestones']));
            queueUpdate(type, value);
        } else if (type === 'tip') {
            homdata.tips.push({ text: value, timestamp: new Date().toISOString(), id: `tip-${Date.now()}` });
            limitArrayEntries(homdata.tips);
            updateSpecificUI(['tips']);
            queueUpdate(type, value);
        } else if (type === 'music') {
            if (!homdata.user.playlist) homdata.user.playlist = [];
            homdata.user.playlist.push(value);
            updateSpecificUI(['playlist']);
            queueUpdate(type, value);
        }
    } catch (error) {
        console.error('Error updating homdata:', error);
        showError('Failed to update data. Please try again.');
    }
}

function animateAddElement(listId, callback) {
    const lists = [document.getElementById(listId), document.getElementById(`${listId}-popup`)];
    lists.forEach(list => {
        if (list) {
            const newItem = list.lastElementChild;
            if (newItem) {
                newItem.classList.add('slide-in');
                newItem.addEventListener('animationend', () => {
                    newItem.classList.remove('slide-in');
                    if (callback) callback();
                }, { once: true });
            } else if (callback) {
                callback();
            }
        }
    });
}

function animateRemoveElement(elementOrId, callback) {
    const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (element) {
        element.classList.add('fade-out');
        element.addEventListener('animationend', () => {
            if (element.parentNode) element.parentNode.removeChild(element);
            if (callback) callback();
        }, { once: true });
    } else if (callback) {
        callback();
    }
}

function clearList(listType) {
    playClickSound();
    const listTypes = {
        'pomodoro': { data: 'pomodoro.tasks', message: 'Are you sure you want to clear all Pomodoro tasks?' },
        'habits': { data: 'habits', message: 'Are you sure you want to clear all habits?' },
        'distractions': { data: 'distractions', message: 'Are you sure you want to clear all distractions?' },
        'gratitude': { data: 'gratitude', message: 'Are you sure you want to clear all gratitude entries?' },
        'reflections': { data: 'reflections', message: 'Are you sure you want to clear all reflections?' },
        'milestones': { data: 'milestones', message: 'Are you sure you want to clear all milestones?' }
    };
    const config = listTypes[listType];
    if (!config) {
        showError('Invalid list type.');
        return;
    }
    showConfirmModal(config.message, () => {
        const path = config.data.split('.');
        let target = homdata;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]];
        }
        target[path[path.length - 1]] = [];
        updateSpecificUI([listType]);
        queueUpdate('action', `clear_${listType}`);
    });
}

function redirectTo(feature) {
    if (feature === 'leaderboard') {
        window.location.href = `/home/leaderboard/lead/prams?username=default&page=1&limit=10&users=true`;
    } else {
        updateHomdata('action', `navigate_${feature}`);
        const name = encodeURIComponent(homdata.user.name);
        window.location.href = `/home/${feature}/${name}`;
    }
}

function generateAvatar() {
    const canvases = [document.getElementById('avatar'), document.getElementById('avatar-popup')];
    canvases.forEach(canvas => {
        if (canvas && homdata?.user?.name) {
            const ctx = canvas.getContext('2d');
            const colors = ['#5a7ff5', '#c4a1ff', '#28a745', '#ff6b6b'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(32, 32, 32, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '24px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(homdata.user.name[0].toUpperCase(), 32, 32);
            if (canvas.id === 'avatar') {
                homdata.user.avatar = canvas.toDataURL();
                queueUpdate('action', 'generate_avatar');
            }
        }
    });
}

function triggerCelebration() {
    const canvas = document.getElementById('celebration');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: Math.random() * 5 + 2,
            color: ['#5a7ff5', '#c4a1ff', '#28a745'][Math.floor(Math.random() * 3)],
            speed: Math.random() * 5 + 2,
            angle: Math.random() * Math.PI * 2,
            opacity: 1
        });
    }
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let hasVisibleParticles = false;
        particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.speed *= 0.98;
            p.opacity *= 0.98;
            p.radius *= 0.98;
            if (p.opacity > 0.1 && p.radius > 0.1) {
                hasVisibleParticles = true;
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
        frame++;
        if (frame < 120 && hasVisibleParticles) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }
    requestAnimationFrame(animate);
    playCompleteSound();
}

const affirmations = {
    happy: ["Your positivity is a gift! Keep shining.", "You're spreading joy today!"],
    neutral: ["You're on the right path. Let's make today count.", "Every moment is a new opportunity."],
    sad: ["It's okay to feel this way. We're here to support you.", "You're not alone; take it one step at a time."],
    stressed: ["Take a deep breath. You've got this.", "You're stronger than you know."],
    angry: ["Channel that energy into something positive!", "Take a moment to breathe and refocus."],
    excited: ["Your enthusiasm is contagious! Keep it up!", "You're on fire today!"]
};

let currentAffirmationIndex = 0;
function updateAffirmation(mood) {
    const affirmationList = affirmations[mood.toLowerCase()] || affirmations.neutral;
    const affirmationElements = [document.getElementById('affirmation'), document.getElementById('affirmation-popup')];
    affirmationElements.forEach(el => {
        if (el) el.textContent = affirmationList[currentAffirmationIndex] || "You're on a journey to growth!";
    });
}

function generateAffirmation() {
    const mood = homdata.user.currentMood.toLowerCase();
    const affirmationList = affirmations[mood] || affirmations.neutral;
    currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmationList.length;
    updateAffirmation(mood);
    queueUpdate('action', 'generate_affirmation');
}

const tips = [
    "Take 5 deep breaths to reset.",
    "Write down one thing you’re grateful for.",
    "Step away for a 2-minute stretch."
];

function generateTip() {
    const tip = homdata.tips.length > 0 ? homdata.tips[homdata.tips.length - 1].text : tips[Math.floor(Math.random() * tips.length)];
    const tipElements = [document.getElementById('quick-tip'), document.getElementById('quick-tip-popup')];
    tipElements.forEach(el => {
        if (el) el.textContent = tip;
    });
    queueUpdate('tip', tip);
}

function doBreathingExercise() {
    toggleModal('breathingModal', true);
    const text = document.getElementById('breathing-text');
    if (!text) return;
    let count = 0;
    const interval = setInterval(() => {
        if (count % 2 === 0) {
            text.textContent = 'Breathe in...';
        } else {
            text.textContent = 'Breathe out...';
        }
        count++;
        if (count === 10) {
            clearInterval(interval);
            text.textContent = 'Great job!';
            setTimeout(() => toggleModal('breathingModal', false), 1000);
        }
    }, 4000);
    queueUpdate('action', 'breathing_exercise');
}

function startMindfulness() {
    toggleModal('mindfulnessModal', true);
    const text = document.getElementById('meditation-text');
    if (!text) return;
    text.textContent = 'Close your eyes, focus on your breath. Let thoughts pass like clouds...';
    setTimeout(() => {
        text.textContent = 'Well done! You completed a 1-minute meditation.';
        updateSpecificUI(['reflections']);
        queueUpdate('reflection', 'Completed 1-minute mindfulness session');
        setTimeout(() => toggleModal('mindfulnessModal', false), 2000);
    }, 60000);
}

function exportData() {
    const dataStr = JSON.stringify(homdata, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `therapist_data_${homdata.user.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    queueUpdate('action', 'export_data');
}

function editGoal() {
    const newGoal = prompt('Enter your new goal:', homdata.user.goal);
    if (newGoal && newGoal.trim().length > 0) {
        updateHomdata('goal', newGoal.trim());
    } else {
        showError('Please enter a valid goal.');
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    const completedToday = homdata.pomodoro?.tasks.some(t => t.completed && new Date(t.timestamp).toDateString() === today);
    if (completedToday) {
        homdata.user.streak++;
        homdata.user.streakHistory.push(homdata.user.streak);
        if (homdata.user.streakHistory.length > 3) homdata.user.streakHistory.shift();
        updateSpecificUI(['streak']);
        checkMilestones();
        queueUpdate('action', 'update_streak');
    }
}

function checkMilestones() {
    const streak = homdata.user.streak;
    const completedTasks = homdata.pomodoro?.tasks.filter(t => t.completed).length || 0;
    if (streak >= 5 && !homdata.milestones.some(m => m.text.includes('5-day streak'))) {
        updateHomdata('milestone', 'Reached 5-day streak! 🎉');
    } else if (completedTasks >= 10 && !homdata.milestones.some(m => m.text.includes('10 tasks'))) {
        updateHomdata('milestone', 'Completed 10 Pomodoro tasks! 🚀');
    }
}

function updateMilestoneList() {
    const milestoneLists = [document.getElementById('milestone-list'), document.getElementById('milestone-list-popup')];
    milestoneLists.forEach(list => {
        if (list) {
            list.innerHTML = homdata.milestones.length > 0
                ? homdata.milestones.map(m => `
                    <p id="milestone-${m.id || m.timestamp}" class="list-item"><i class="fas fa-star"></i> ${m.text} (${new Date(m.timestamp).toLocaleDateString()})</p>
                `).join('')
                : '<p class="list-item">No milestones yet.</p>';
        }
    });
}

function updateDailyReminder() {
    const hour = new Date().getHours();
    const messages = {
        morning: 'Start your day strong!',
        afternoon: 'Keep pushing forward!',
        evening: 'Reflect and unwind.'
    };
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const dailyReminders = [document.getElementById('daily-reminder'), document.getElementById('daily-reminder-popup')];
    dailyReminders.forEach(el => {
        if (el) el.textContent = messages[timeOfDay];
    });
    queueUpdate('action', `daily_reminder_${timeOfDay}`);
}
function updateProgress() {
    const progressContainer = document.querySelector('.progress-container');
    if (!progressContainer) return; // Exit if no progress container exists

    // Calculate progress for Pomodoro tasks
    const totalTasks = homdata.pomodoro?.tasks?.length || 0;
    const completedTasks = homdata.pomodoro?.tasks?.filter(t => t.completed).length || 0;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate progress for Habits
    const totalHabits = homdata.habits?.length || 0;
    const completedHabits = homdata.habits?.reduce((sum, h) => {
        const [current, total] = h.progress.split('/').map(Number);
        return sum + (current >= total ? 1 : 0);
    }, 0) || 0;
    const habitProgress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

    // Average progress (customize weights as needed)
    const overallProgress = (taskProgress + habitProgress) / 2;

    // Update progress bar (assuming a progress bar exists in home.ejs)
    const progressBar = progressContainer.querySelector('.progress-bar div');
    if (progressBar) {
        progressBar.style.width = `${overallProgress}%`;
        progressBar.setAttribute('aria-valuenow', overallProgress.toFixed(1));
        progressBar.setAttribute('aria-label', `Overall progress: ${overallProgress.toFixed(1)}%`);
    }

    // Update streak display (if applicable)
    const streakDisplay = document.querySelector('#streak-display');
    if (streakDisplay && homdata.user?.streak) {
        streakDisplay.textContent = `Streak: ${homdata.user.streak} days`;
    }
}
let moodChart;
const moodChartCanvas = document.getElementById('moodChart');
if (moodChartCanvas) {
    moodChart = new Chart(moodChartCanvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Mood',
                data: [3, 3, 3, 3, 3, 3, 3],
                borderColor: '#5a7ff5',
                backgroundColor: 'rgba(90, 127, 245, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    title: { display: true, text: 'Mood' },
                    ticks: {
                        callback: value => ({ 1: 'Sad', 2: 'Stressed', 3: 'Neutral', 4: 'Happy', 5: 'Happy', 2.5: 'Angry' }[value] || value)
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateMoodChart() {
    if (moodChart) {
        const moodScores = { happy: 4, neutral: 3, sad: 1, stressed: 2, angry: 2.5, excited: 5 };
        const recentMoods = homdata.moods.slice(-7).map(m => moodScores[m.mood.toLowerCase()] || 3);
        moodChart.data.datasets[0].data = recentMoods.length >= 7 ? recentMoods : [...recentMoods, ...Array(7 - recentMoods.length).fill(3)];
        moodChart.data.labels = homdata.moods.slice(-7).map((_, i) => {
            const date = new Date(homdata.moods[homdata.moods.length - 7 + i]?.timestamp || new Date());
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        moodChart.update();
    }
}
function updateGratitudeList() {
    const gratitudeLists = [document.getElementById('gratitude-list'), document.getElementById('gratitude-list-popup')];
    gratitudeLists.forEach(list => {
        if (list) {
            list.classList.add('scrollable'); // Add scrollable class
            list.innerHTML = homdata.gratitude.length > 0
                ? homdata.gratitude.map(g => `
                    <li id="gratitude-${g.id || g.timestamp}" class="list-item"><i class="fas fa-heart"></i> ${g.text} (${new Date(g.timestamp).toLocaleDateString()})</li>
                `).join('')
                : '<li class="list-item">No gratitude entries yet.</li>';
        }
    });
}

function updateReflectionList() {
    const reflectionLists = [document.getElementById('reflection-list'), document.getElementById('reflection-list-popup')];
    reflectionLists.forEach(list => {
        if (list) {
            list.innerHTML = homdata.reflections.length > 0
                ? homdata.reflections.map(r => `
                    <p id="reflection-${r.id || r.timestamp}" class="list-item"><i class="fas fa-comment"></i> ${r.text} (${new Date(r.timestamp).toLocaleDateString()})</p>
                `).join('')
                : '<p class="list-item">No reflections yet.</p>';
        }
    });
}
function updateReflectionList() {
    const reflectionLists = [document.getElementById('reflection-list'), document.getElementById('reflection-list-popup')];
    reflectionLists.forEach(list => {
        if (list) {
            list.classList.add('scrollable'); // Add scrollable class
            list.innerHTML = homdata.reflections.length > 0
                ? homdata.reflections.map(r => `
                    <li id="reflection-${r.id || r.timestamp}" class="list-item"><i class="fas fa-comment"></i> ${r.text} (${new Date(r.timestamp).toLocaleDateString()})</li>
                `).join('')
                : '<li class="list-item">No reflections yet.</li>';
        }
    });
}
let pomodoroInterval = null;
function updatePomodoroList(filter = '') {
    const pomodoroLists = [document.getElementById('pomodoro-list'), document.getElementById('pomodoro-list-popup')];
    pomodoroLists.forEach(list => {
        if (list) {
            list.classList.add('scrollable'); // Add scrollable class
            if (!homdata.pomodoro || !homdata.pomodoro.tasks) {
                list.innerHTML = '<li class="list-item">No Pomodoro tasks added yet.</li>';
                return;
            }
            const filteredTasks = homdata.pomodoro.tasks.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));
            list.innerHTML = filteredTasks.length > 0
                ? filteredTasks.map((t, i) => {
                    const safeTaskName = t.name.replace(/\s+/g, '-');
                    return `
                        <li class="pomodoro-task ${t.isActive ? 'active' : ''} ${t.completed ? 'completed' : ''} ${t.priority || 'low'}" id="pomodoro-task-${safeTaskName}" data-task-name="${t.name}">
                            <input type="checkbox" id="pomodoro${i}-${list.id}" data-task="${t.name}" ${t.completed ? 'checked disabled' : ''} aria-label="Complete ${t.name}">
                            <label for="pomodoro${i}-${list.id}">${t.name} (${t.duration} min, Priority: ${t.priority || 'low'})</label>
                            <span class="pomodoro-time">${t.isActive ? formatTime(t.duration * 60 - t.timeSpent) : formatTime(t.timeSpent)} / ${t.duration}:00</span>
                            ${!t.completed ? `<button class="action-btn small-btn pomodoro-btn" onclick="startPomodoro('${t.name}')">${t.isActive ? 'Pause' : 'Start'}</button>` : ''}
                            ${!t.isActive && !t.completed ? `<button class="action-btn small-btn remove-btn" onclick="removePomodoroTask('${t.name}')">Remove</button>` : ''}
                        </li>
                    `;
                }).join('')
                : '<li class="list-item">No matching tasks found.</li>';
            list.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.removeEventListener('change', handleCheckboxChange);
                input.addEventListener('change', handleCheckboxChange);
            });
        }
    });
    updateProgress();
}
function handleCheckboxChange() {
    playCompleteSound();
    updateHomdata('pomodoro_complete', { name: this.dataset.task, completed: this.checked });
}

function updatePomodoroHistory() {
    const historyLists = [document.getElementById('pomodoro-history'), document.getElementById('pomodoro-history-popup')];
    historyLists.forEach(list => {
        if (list) {
            list.innerHTML = homdata.pomodoro && homdata.pomodoro.history && homdata.pomodoro.history.length > 0
                ? homdata.pomodoro.history.slice(-5).map(h => `
                    <p class="list-item"><i class="fas fa-clock"></i> ${h.name} (${h.duration} min) completed on ${new Date(h.completedAt).toLocaleDateString()}</p>
                `).join('')
                : '<p class="list-item">No completed Pomodoro sessions yet.</p>';
        }
    });
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startPomodoro(taskName) {
    if (!homdata.pomodoro || !homdata.pomodoro.tasks) return;
    const task = homdata.pomodoro.tasks.find(t => t.name === taskName);
    if (!task) return;
    playClickSound();
    if (task.isActive) {
        task.isActive = false;
        clearInterval(pomodoroInterval);
    } else {
        homdata.pomodoro.tasks.forEach(t => t.isActive = t.name === taskName);
        task.isActive = true;
        let seconds = task.duration * 60 - task.timeSpent;
        pomodoroInterval = setInterval(() => {
            seconds--;
            task.timeSpent = task.duration * 60 - seconds;
            updateHomdata('pomodoro_time', { name: taskName, timeSpent: task.timeSpent, isActive: true });
            if (seconds <= 0) {
                clearInterval(pomodoroInterval);
                task.isActive = false;
                task.completed = true;
                updateHomdata('pomodoro_complete', { name: taskName, completed: true });
                playCompleteSound();
                triggerCelebration();
                showError('Pomodoro session completed! Take a break.');
            }
        }, 1000);
    }
    queueUpdate('action', `pomodoro_${task.isActive ? 'pause' : 'start'}`);
}

function removePomodoroTask(taskName) {
    playClickSound();
    showConfirmModal('Are you sure you want to delete this task?', () => {
        updateHomdata('pomodoro_remove', taskName);
    });
}

function searchPomodoro() {
    const searchInputs = [document.getElementById('pomodoro-search'), document.getElementById('pomodoro-search-popup')];
    const searchValue = searchInputs.find(input => input && input.value)?.value || '';
    searchInputs.forEach(input => {
        if (input) input.value = searchValue;
    });
    updatePomodoroList(searchValue);
}

function addPomodoroTask() {
    const taskName = document.getElementById('newPomodoroTask')?.value?.trim();
    const workDuration = parseInt(document.getElementById('pomodoroWorkDuration')?.value) || 25;
    const breakDuration = parseInt(document.getElementById('pomodoroBreakDuration')?.value) || 5;
    const priority = document.getElementById('priority')?.value || 'low';
    if (taskName && workDuration >= 1 && breakDuration >= 1) {
        playClickSound();
        if (!homdata.pomodoro) {
            homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
        }
        updateHomdata('pomodoro_task', { name: taskName, duration: workDuration, break: breakDuration, priority });
        document.getElementById('newPomodoroTask').value = '';
        document.getElementById('pomodoroWorkDuration').value = homdata.pomodoro.settings.workDuration;
        document.getElementById('pomodoroBreakDuration').value = homdata.pomodoro.settings.breakDuration;
        toggleModal('pomodoroModal', false);
    } else {
        showError('Please enter a valid task name and durations.');
    }
}

function updateHabitList(filter = '') {
    const habitLists = [document.getElementById('habit-list'), document.getElementById('habit-list-popup')];
    habitLists.forEach(list => {
        if (list) {
            list.classList.add('scrollable'); // Add scrollable class
            const filteredHabits = homdata.habits.filter(h => h.name.toLowerCase().includes(filter.toLowerCase()));
            list.innerHTML = filteredHabits.length > 0
                ? filteredHabits.map(h => {
                    const progressPercentage = (parseInt(h.progress.split('/')[0]) / parseInt(h.progress.split('/')[1])) * 100;
                    return `
                        <li class="list-item" data-habit="${h.name}">
                            <i class="fas fa-check-circle"></i> ${h.name}: ${h.progress} (Goal: ${h.goal})
                            <div class="progress-bar"><div style="width: ${progressPercentage}%"></div></div>
                            <button class="action-btn small-btn" onclick="playCompleteSound(); completeHabit('${h.name}')">Complete Today</button>
                            <button class="action-btn small-btn remove-btn" onclick="removeHabit('${h.name}')">Remove</button>
                        </li>
                    `;
                }).join('')
                : '<li class="list-item">No matching habits found.</li>';
        }
    });
    updateProgress();
}
function searchHabits() {
    const searchInputs = [document.getElementById('habit-search'), document.getElementById('habit-search-popup')];
    const searchValue = searchInputs.find(input => input && input.value)?.value || '';
    searchInputs.forEach(input => {
        if (input) input.value = searchValue;
    });
    updateHabitList(searchValue);
}

function completeHabit(name) {
    updateHomdata('habit_complete', name);
    updateHabitList()
}

function removeHabit(name) {
    playClickSound();
    showConfirmModal('Are you sure you want to delete this habit?', () => {
        homdata.habits = homdata.habits.filter(h => h.name !== name);
        updateSpecificUI(['habits']);
        queueUpdate('action', 'remove_habit');
    });
}

function addHabit() {
    const habitName = document.getElementById('newHabit')?.value?.trim();
    const habitGoal = parseInt(document.getElementById('habitGoal')?.value) || 7;
    if (habitName && habitGoal >= 7) {
        playClickSound();
        updateHomdata('habit', { name: habitName, goal: habitGoal });
        document.getElementById('newHabit').value = '';
        document.getElementById('habitGoal').value = '';
        toggleModal('habitModal', false);
    } else {
        showError('Please enter a valid habit name and goal (minimum 7 days).');
    }
}

function addCustomMusic() {
    const linkInput = document.getElementById('newMusicLink')?.value?.trim();
    if (linkInput) {
        const videoId = getYouTubeVideoId(linkInput);
        if (videoId) {
            playClickSound();
            const tag = prompt('Enter a name for this track:', 'Custom Track');
            if (tag && tag.trim()) {
                const cleanTag = tag.trim().replace(/\s+/g, '_').toLowerCase();
                updateHomdata('music', { tag: cleanTag, url: `https://www.youtube.com/watch?v=${videoId}` });
                document.getElementById('newMusicLink').value = '';
                toggleModal('addMusicModal', false);
            } else {
                showError('Please enter a valid track name.');
            }
        } else {
            showError('Invalid YouTube link. Please use a valid format (e.g., youtube.com/watch?v=ID, youtu.be/ID, music.youtube.com/watch?v=ID).');
        }
    } else {
        showError('Please enter a YouTube link.');
    }
}

function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
        if (show) {
            modal.querySelectorAll('input, select, textarea').forEach(input => {
                const sourceInput = document.querySelector(`.card [id="${input.id.replace('-popup', '')}"]`);
                if (sourceInput && input !== sourceInput) {
                    input.value = sourceInput.value;
                }
            });
            if (modalId === 'pomodoroModal') {
                updatePomodoroList();
            } else if (modalId === 'habitModal') {
                updateHabitList();
            } else if (modalId === 'gratitudeModal') {
                updateGratitudeList();
            } else if (modalId === 'moodReflectionModal') {
                updateReflectionList();
            } else if (modalId === 'milestoneModal') {
                updateMilestoneList();
            } else if (modalId === 'distractionModal') {
                updateTriggerLog();
            } else if (modalId === 'ambientModal') {
                updatePlaylistUI();
            }
        }
    }
}

function showConfirmModal(message, callback) {
    const confirmMessage = document.getElementById('confirm-message');
    if (confirmMessage) confirmMessage.textContent = message;
    toggleModal('confirmModal', true);
    const okButton = document.getElementById('confirm-ok');
    const newOkButton = okButton.cloneNode(true);
    okButton.parentNode.replaceChild(newOkButton, okButton);
    newOkButton.addEventListener('click', () => {
        playClickSound();
        callback();
        toggleModal('confirmModal', false);
    });
    const cancelButton = document.getElementById('confirm-cancel');
    const newCancelButton = cancelButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    newCancelButton.addEventListener('click', () => {
        playClickSound();
        toggleModal('confirmModal', false);
    });
}

function updateSpecificUI(components) {
    if (components.includes('profile')) {
        const profileNames = [document.getElementById('profile-name'), document.getElementById('profile-name-popup')];
        profileNames.forEach(el => {
            if (el) el.textContent = homdata.user.name;
        });
        const greeting = document.getElementById('greeting');
        if (greeting) greeting.textContent = `Welcome back, ${localStorage.getItem('username')}!`;
        const profileGoal = document.getElementById('profile-goal');
        if (profileGoal) profileGoal.textContent = homdata.user.goal;
        const profileStreak = document.getElementById('profile-streak');
        if (profileStreak) profileStreak.textContent = `Current Streak: ${homdata.user.streak} days`;
        const avatarImg = document.getElementById('avatar');
        if (avatarImg) avatarImg.src = homdata.user.avatar || '';
        const avatarPopupImg = document.getElementById('avatar-popup');
        if (avatarPopupImg) avatarPopupImg.src = homdata.user.avatar || '';
        if (!homdata.user.avatar) generateAvatar();
    }
    if (components.includes('pomodoro')) updatePomodoroList();
    if (components.includes('history')) updatePomodoroHistory();
    if (components.includes('habits')) updateHabitList();
    if (components.includes('gratitude')) updateGratitudeList();
    if (components.includes('reflections')) updateReflectionList();
    if (components.includes('milestones')) updateMilestoneList();
    if (components.includes('distractions')) updateTriggerLog();
    if (components.includes('progress')) updateProgress();
    if (components.includes('playlist')) updatePlaylistUI();
    if (components.includes('reminder')) updateDailyReminder();
    if (components.includes('mood')) {
        updateMoodChart();
        updateAffirmation(homdata.user.currentMood);
        const moodElements = [document.getElementById('current-mood'), document.getElementById('current-mood-popup')];
        moodElements.forEach(el => {
            if (el) el.textContent = homdata.user.currentMood.charAt(0).toUpperCase() + homdata.user.currentMood.slice(1) || 'Not set';
        });
        const emojiButtons = document.querySelectorAll('.emoji-button');
        emojiButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood.toLowerCase() === homdata.user.currentMood.toLowerCase()) {
                btn.classList.add('selected');
            }
        });
    }
    if (components.includes('tips')) generateTip();
    if (components.includes('settings')) {
        const darkMode = document.getElementById('darkMode');
        if (darkMode) {
            darkMode.checked = homdata.settings.darkMode;
            document.documentElement.setAttribute('data-theme', homdata.settings.darkMode ? 'dark' : 'light');
        }
        const notifications = document.getElementById('notifications');
        if (notifications) notifications.value = homdata.settings.notifications;
    }
    if (components.includes('goal')) {
        const goalElements = [document.getElementById('profile-goal'), document.getElementById('profile-goal-popup')];
        goalElements.forEach(el => {
            if (el) el.textContent = homdata.user.goal;
        });
    }
    if (components.includes('streak')) {
        const streakElements = [document.getElementById('profile-streak'), document.getElementById('profile-streak-popup')];
        streakElements.forEach(el => {
            if (el) el.textContent = `Current Streak: ${homdata.user.streak} days`;
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7); color: white; padding: 15px 30px;
            border-radius: 8px; z-index: 2000; font-size: 1rem;
        `;
        loadingDiv.textContent = 'Loading...';
        document.body.appendChild(loadingDiv);

        await fetchAndMergeData();
        if (!homdata.user.name) await sendToApi(homdata);

        updateSpecificUI(['profile', 'pomodoro', 'history', 'habits', 'gratitude', 'reflections', 'milestones', 'distractions', 'progress', 'playlist', 'reminder', 'mood', 'tips', 'settings', 'goal', 'streak']);
        loadYouTubeAPI();

        document.querySelectorAll('.emoji-buttons button').forEach(btn => {
            btn.removeEventListener('click', handleEmojiClick);
            btn.addEventListener('click', handleEmojiClick);
        });

        function handleEmojiClick() {
            playClickSound();
            const mood = this.dataset.mood;
            document.querySelectorAll('.emoji-buttons button').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            updateHomdata('mood', mood);
        }

        const triggers = [document.getElementById('trigger'), document.getElementById('trigger-popup')];
        triggers.forEach(trigger => {
            if (trigger) {
                trigger.removeEventListener('change', handleTriggerChange);
                trigger.addEventListener('change', handleTriggerChange);
            }
        });

        function handleTriggerChange() {
            playClickSound();
            const triggerValue = this.value.trim();
            if (triggerValue) {
                updateHomdata('distraction', triggerValue);
                triggers.forEach(t => {
                    if (t) t.value = '';
                });
            }
        }

        const gratitudes = [document.getElementById('gratitude'), document.getElementById('gratitude-popup')];
        gratitudes.forEach(input => {
            if (input) {
                input.removeEventListener('change', handleGratitudeChange);
                input.addEventListener('change', handleGratitudeChange);
            }
        });

        function handleGratitudeChange() {
            const text = this.value.trim();
            if (text) {
                playClickSound();
                updateHomdata('gratitude', text);
                gratitudes.forEach(i => {
                    if (i) i.value = '';
                });
            }
        }

        const reflections = [document.getElementById('mood-reflection'), document.getElementById('mood-reflection-popup')];
        reflections.forEach(input => {
            if (input) {
                input.removeEventListener('change', handleReflectionChange);
                input.addEventListener('change', handleReflectionChange);
            }
        });

        function handleReflectionChange() {
            const text = this.value.trim();
            if (text) {
                playClickSound();
                updateHomdata('reflection', text);
                reflections.forEach(i => {
                    if (i) i.value = '';
                });
            }
        }

        document.querySelectorAll('.action-btn[data-feature], .nav-icon[data-feature]').forEach(btn => {
            btn.removeEventListener('click', handleFeatureClick);
            btn.addEventListener('click', handleFeatureClick);
        });

        function handleFeatureClick() {
            playClickSound();
            redirectTo(this.dataset.feature);
        }

        document.querySelectorAll('.card.clickable').forEach(card => {
            card.removeEventListener('click', handleCardClick);
            card.addEventListener('click', handleCardClick);
        });

        function handleCardClick(e) {
            if (e.target.closest('button, input, select, textarea')) return;
            playClickSound();
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                toggleModal(modalId, true);
            }
        }

        document.querySelectorAll('.modal .close-btn').forEach(btn => {
            btn.removeEventListener('click', handleCloseClick);
            btn.addEventListener('click', handleCloseClick);
        });

        function handleCloseClick() {
            playClickSound();
            toggleModal(this.closest('.modal').id, false);
        }

        const addPomodoroBtn = document.getElementById('addPomodoroBtn');
        if (addPomodoroBtn) {
            addPomodoroBtn.removeEventListener('click', addPomodoroTask);
            addPomodoroBtn.addEventListener('click', addPomodoroTask);
        }

        const addHabitBtn = document.getElementById('addHabitBtn');
        if (addHabitBtn) {
            addHabitBtn.removeEventListener('click', addHabit);
            addHabitBtn.addEventListener('click', addHabit);
        }

        const addMusicBtn = document.getElementById('addMusicBtn');
        if (addMusicBtn) {
            addMusicBtn.removeEventListener('click', addCustomMusic);
            addMusicBtn.addEventListener('click', addCustomMusic);
        }

        const darkMode = document.getElementById('darkMode');
        if (darkMode) {
            darkMode.checked = homdata.settings.darkMode;
            document.documentElement.setAttribute('data-theme', homdata.settings.darkMode ? 'dark' : 'light');
            darkMode.removeEventListener('change', handleDarkModeChange);
            darkMode.addEventListener('change', handleDarkModeChange);
        }

        function handleDarkModeChange() {
            playClickSound();
            const isDark = this.checked;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            homdata.settings.darkMode = isDark;
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            queueUpdate('setting', { darkMode: isDark });
        }

        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.value = homdata.settings.notifications;
            notifications.removeEventListener('change', handleNotificationsChange);
            notifications.addEventListener('change', handleNotificationsChange);
        }

        function handleNotificationsChange() {
            playClickSound();
            queueUpdate('setting', { notifications: this.value });
        }

        const ambientSounds = [document.getElementById('ambientSound'), document.getElementById('ambientSound-popup')];
        ambientSounds.forEach(sound => {
            if (sound) {
                sound.removeEventListener('change', handleAmbientSoundChange);
                sound.addEventListener('change', handleAmbientSoundChange);
            }
        });

        function handleAmbientSoundChange() {
            playClickSound();
            homdata.settings.musicTime = 0;
            playMusic();
        }

        document.querySelectorAll('.action-btn:not([data-feature])').forEach(btn => {
            btn.addEventListener('animationend', () => {
                btn.classList.remove('animate');
            });
            btn.addEventListener('click', () => {
                btn.classList.add('animate');
            });
        });

        const pomodoroWorkDuration = document.getElementById('pomodoroWorkDuration');
        const pomodoroBreakDuration = document.getElementById('pomodoroBreakDuration');
        if (pomodoroWorkDuration && pomodoroBreakDuration) {
            pomodoroWorkDuration.value = homdata.pomodoro?.settings?.workDuration || 25;
            pomodoroBreakDuration.value = homdata.pomodoro?.settings?.breakDuration || 5;
        }

        document.body.removeChild(loadingDiv);
    } catch (error) {
        console.error('Initialization error:', error);
        showError('An error occurred during initialization. Please try again.');
    }


    let gratitudeLoad = async () => {
        let basic = homdata.gratitude
        basic.forEach(el => {
            document.getElementById('graDiv').innerHTML +=`<li  class= 'gradC'>${el.text}</li>
             
            
            `
             document.getElementById('graDivPop').innerHTML +=`<li  class= 'gradC'>${el.text}</li>
             
            
            `

        });


    }
    gratitudeLoad()

});

