const uname = localStorage.getItem('username');
if (uname == null || uname === '' || uname === undefined) {
    alert('Please login to get started');
    localStorage.clear();
    window.location.href = '/login.html';
    throw new Error('No username found');
}
setInterval(() => {
    //console.clear();
    console.warn("ad blocker may cause player issues; ensure you're not using Brave or any ad blocker");
}, 3000);


const defaultHomdata = {
    user: {
        name: uname,
        streak: 3,
        currentMood: 'Not set',
        goal: 'Overcome procrastination and build discipline',
        streakHistory: [3, 2, 1],
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
        tasks: [
           
        ],
        history: [],
        settings: { workDuration: 25, breakDuration: 5 }
    },
    moods: [],
    distractions: [],
    actions: [],
    habits: [
        
    ],
    gratitude: [],
    reflections: [],
    milestones: [{ text: 'Reached 3-day streak!', timestamp: new Date().toISOString() }],
    tips: [],
    settings: { darkMode: false, notifications: 'off', music: 'none', musicTime: 0 }
};

let homdata = { ...defaultHomdata };

// Limit arrays to the latest 10 entries
const MAX_ENTRIES = 10;
function limitArrayEntries(array, max = MAX_ENTRIES) {
    if (array.length > max) {
        array.splice(0, array.length - max); // Keep only the latest `max` entries
    }
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
    } catch (error) {
        console.error('Error sending data to API:', error.message, error.stack);
    }
}

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
        console.error('Error fetching user data:', error.message, error.stack);
        return null;
    }
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
    tag.onerror = () => console.error('Failed to load YouTube IFrame API');
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
        updateHomdata('setting', { musicTime: homdata.settings.musicTime });
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    alert('Failed to load ambient music. Please disable ad blockers or try a different browser.');
    const musicPlayer = document.getElementById('music-player');
    if (musicPlayer) musicPlayer.innerHTML = '';
    const musicProgress = document.getElementById('music-progress');
    if (musicProgress) musicProgress.value = 0;
}

function updatePlaylistUI() {
    const select = document.getElementById('ambientSound');
    if (select) {
        select.innerHTML = '<option value="none">None</option>' +
            (homdata.user.playlist || []).map(item => `<option value="${item.tag}">${item.tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('');
        if (homdata.settings.music && homdata.settings.music !== 'none') {
            select.value = homdata.settings.music;
        }
    }
}

let musicInterval = null;
function updateMusicProgress() {
    const progressBar = document.getElementById('music-progress');
    if (!progressBar || !player || !player.getCurrentTime) return;
    clearInterval(musicInterval);
    musicInterval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration ? player.getDuration() : 3600;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        homdata.settings.musicTime = currentTime;
        updateHomdata('setting', { musicTime: currentTime });
        if (homdata.settings.music === 'none') clearInterval(musicInterval);
    }, 1000);
}

function playMusic() {
    const sound = document.getElementById('ambientSound')?.value;
    if (sound === 'none') return;
    homdata.settings.music = sound;
    const track = homdata.user.playlist.find(p => p.tag === sound);
    if (track && player && typeof player.loadVideoById === 'function') {
        const videoId = getYouTubeVideoId(track.url);
        if (videoId) {
            player.loadVideoById({ videoId: videoId, startSeconds: homdata.settings.musicTime || 0, suggestedQuality: 'small' });
            player.playVideo();
            updateMusicProgress();
            updateHomdata('setting', { music: sound });
        }
    }
}

function pauseMusic() {
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
        clearInterval(musicInterval);
        homdata.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        updateHomdata('setting', { musicTime: homdata.settings.musicTime });
    }
}

function stopMusic() {
    if (player && typeof player.stopVideo === 'function') {
        player.stopVideo();
        clearInterval(musicInterval);
        homdata.settings.music = 'none';
        homdata.settings.musicTime = 0;
        updateHomdata('setting', { music: 'none', musicTime: 0 });
        const progressBar = document.getElementById('music-progress');
        if (progressBar) progressBar.value = 0;
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
            updateHomdata('setting', { music: sound });
        }
    }
}

function updateHomdata(type, value) {
    try {
        if (type === 'mood') {
            homdata.moods.push({ mood: value, timestamp: new Date().toISOString(), id: `mood-${Date.now()}` });
            limitArrayEntries(homdata.moods);
            homdata.user.currentMood = value;
            const moodElement = document.getElementById('current-mood');
            if (moodElement) moodElement.textContent = value.charAt(0).toUpperCase() + value.slice(1);
            updateAffirmation(value);
            updateMoodChart();
        } else if (type === 'pomodoro_task') {
            if (!homdata.pomodoro) homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
            homdata.pomodoro.tasks.push({ ...value, timestamp: new Date().toISOString(), timeSpent: 0, isActive: false });
            updatePomodoroList();
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
                        updatePomodoroList();
                    });
                    updatePomodoroHistory();
                    updateStreak();
                    triggerCelebration();
                } else {
                    updatePomodoroList();
                }
            }
        } else if (type === 'pomodoro_remove') {
            const taskName = value;
            const safeTaskName = taskName.replace(/\s+/g, '-');
            const taskElement = document.querySelector(`#pomodoro-list li[data-task-name="${taskName}"]`);
            if (taskElement) {
                animateRemoveElement(`pomodoro-task-${safeTaskName}`, () => {
                    homdata.pomodoro.tasks = homdata.pomodoro.tasks.filter(t => t.name !== taskName);
                    updatePomodoroList();
                });
            } else {
                homdata.pomodoro.tasks = homdata.pomodoro.tasks.filter(t => t.name !== taskName);
                updatePomodoroList();
            }
        } else if (type === 'pomodoro_time') {
            const task = homdata.pomodoro?.tasks.find(t => t.name === value.name);
            if (task) {
                task.timeSpent = value.timeSpent;
                task.isActive = value.isActive;
                updatePomodoroList();
            }
        } else if (type === 'pomodoro_settings') {
            if (!homdata.pomodoro) homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
            homdata.pomodoro.settings = { ...homdata.pomodoro.settings, ...value };
        } else if (type === 'distraction') {
            homdata.distractions.push({ ...value, timestamp: new Date().toISOString(), id: `distraction-${Date.now()}` });
            limitArrayEntries(homdata.distractions);
            updateTriggerLog();
        } else if (type === 'gratitude' && value) {
            const gratitudeId = `gratitude-${Date.now()}`;
            homdata.gratitude.push({ text: value, timestamp: new Date().toISOString(), id: gratitudeId });
            limitArrayEntries(homdata.gratitude);
            updateGratitudeList();
        } else if (type === 'reflection' && value) {
            const reflectionId = `reflection-${Date.now()}`;
            homdata.reflections.push({ text: value, timestamp: new Date().toISOString(), id: reflectionId });
            limitArrayEntries(homdata.reflections);
            updateReflectionList();
        } else if (type === 'setting') {
            homdata.settings = { ...homdata.settings, ...value };
        } else if (type === 'action') {
            homdata.actions.push({ action: value, timestamp: new Date().toISOString(), id: `action-${Date.now()}` });
            limitArrayEntries(homdata.actions);
        } else if (type === 'habit') {
            homdata.habits.push({ name: value.name, progress: '0/' + value.goal, goal: value.goal });
            updateHabitList();
        } else if (type === 'habit_complete') {
            const habit = homdata.habits.find(h => h.name === value);
            if (habit) {
                const [current, total] = habit.progress.split('/').map(Number);
                if (current < total) {
                    habit.progress = `${current + 1}/${total}`;
                    updateHabitList();
                    checkMilestones();
                    triggerCelebration();
                }
            }
        } else if (type === 'goal') {
            homdata.user.goal = value;
            const goalElement = document.getElementById('user-goal');
            if (goalElement) goalElement.textContent = value;
        } else if (type === 'milestone') {
            const milestoneId = `milestone-${Date.now()}`;
            homdata.milestones.push({ text: value, timestamp: new Date().toISOString(), id: milestoneId });
            limitArrayEntries(homdata.milestones);
            updateMilestoneList();
        } else if (type === 'tip') {
            homdata.tips.push({ text: value, timestamp: new Date().toISOString(), id: `tip-${Date.now()}` });
            limitArrayEntries(homdata.tips);
            const tipElement = document.getElementById('quick-tip');
            if (tipElement) tipElement.textContent = value;
        } else if (type === 'music') {
            if (!homdata.user.playlist) homdata.user.playlist = [];
            homdata.user.playlist.push(value);
            updatePlaylistUI();
        }
        console.log('Updated homdata:', homdata);
        sendToApi(homdata);
    } catch (error) {
        console.error('Error updating homdata:', error);
    }
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

function redirectTo(feature) {
    if(feature=="leaderboard") {
        window.location.href = '/home/leaderboard/lead/prams?username=default&page=1&limit=10&users=true';        
    }
    updateHomdata('action', `navigate_${feature}`);
    const name = encodeURIComponent(homdata.user.name);
    window.location.href = `/home/${feature}/${name}`;
}

function generateAvatar() {
    const canvas = document.getElementById('avatar');
    if (!canvas || !homdata?.user?.name) {
        console.error('Cannot generate avatar: canvas or user name missing');
        return;
    }
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
    homdata.user.avatar = canvas.toDataURL();
    updateHomdata('action', 'generate_avatar');
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
    animate();
}

const affirmations = {
    happy: ["Your positivity is a gift! Keep shining.", "You're spreading joy today!"],
    neutral: ["You're on the right path. Let's make today count.", "Every moment is a new opportunity."],
    sad: ["It's okay to feel this way. We're here to support you.", "You're not alone; take it one step at a time."],
    stressed: ["Take a deep breath. You've got this.", "You're stronger than you know."]
};

let currentAffirmationIndex = 0;
function updateAffirmation(mood) {
    const affirmationList = affirmations[mood.toLowerCase()] || affirmations.neutral;
    const affirmationElement = document.getElementById('affirmation');
    if (affirmationElement) {
        affirmationElement.textContent = affirmationList[currentAffirmationIndex] || "You're on a journey to growth!";
    }
}

function generateAffirmation() {
    const mood = homdata.user.currentMood.toLowerCase();
    const affirmationList = affirmations[mood] || affirmations.neutral;
    currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmationList.length;
    updateAffirmation(mood);
    updateHomdata('action', 'generate_affirmation');
}

const tips = [
    "Take 5 deep breaths to reset.",
    "Write down one thing you’re grateful for.",
    "Step away for a 2-minute stretch."
];

function generateTip() {
    const tip = homdata.tips.length > 0 ? homdata.tips[homdata.tips.length - 1].text : tips[Math.floor(Math.random() * tips.length)];
    updateHomdata('tip', tip);
}

function doBreathingExercise() {
    const breathingModal = document.getElementById('breathingModal');
    if (!breathingModal) return;
    breathingModal.classList.add('active');
    let count = 0;
    const text = document.getElementById('breathing-text');
    if (!text) return;
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
    updateHomdata('action', 'breathing_exercise');
}

function startMindfulness() {
    const mindfulnessModal = document.getElementById('mindfulnessModal');
    if (!mindfulnessModal) return;
    mindfulnessModal.classList.add('active');
    const text = document.getElementById('meditation-text');
    if (!text) return;
    text.textContent = 'Close your eyes, focus on your breath. Let thoughts pass like clouds...';
    setTimeout(() => {
        text.textContent = 'Well done! You completed a 1-minute meditation.';
        setTimeout(() => toggleModal('mindfulnessModal', false), 2000);
    }, 60000);
    updateHomdata('action', 'mindfulness');
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
    updateHomdata('action', 'export_data');
}

function editGoal() {
    const newGoal = prompt('Enter your new goal:', homdata.user.goal);
    if (newGoal) {
        updateHomdata('goal', newGoal);
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    const completedToday = homdata.pomodoro?.tasks.some(t => t.completed && new Date(t.timestamp).toDateString() === today);
    if (completedToday) {
        homdata.user.streak++;
        homdata.user.streakHistory.push(homdata.user.streak);
        if (homdata.user.streakHistory.length > 3) homdata.user.streakHistory.shift();
        const streakDisplay = document.getElementById('streak-display');
        if (streakDisplay) streakDisplay.textContent = `Current Streak: ${homdata.user.streak} days`;
        checkMilestones();
        updateHomdata('action', 'update_streak');
    }
}

function checkMilestones() {
    const streak = homdata.user.streak;
    const completedTasks = homdata.pomodoro?.tasks.filter(t => t.completed).length || 0;
    if (streak === 5 && !homdata.milestones.some(m => m.text.includes('5-day streak'))) {
        updateHomdata('milestone', 'Reached 5-day streak! 🎉');
    } else if (completedTasks >= 10 && !homdata.milestones.some(m => m.text.includes('10 tasks'))) {
        updateHomdata('milestone', 'Completed 10 Pomodoro tasks! 🚀');
    }
}

function updateMilestoneList() {
    const milestoneList = document.getElementById('milestone-list');
    if (milestoneList) {
        milestoneList.innerHTML = homdata.milestones.map(m => `
            <p id="milestone-${m.id || m.timestamp}"><i class="fas fa-star"></i> ${m.text} (${new Date(m.timestamp).toLocaleDateString()})</p>
        `).join('') || '<p>No milestones yet.</p>';
    }
}

function updateDailyReminder() {
    const hour = new Date().getHours();
    const messages = {
        morning: 'Start your day strong!',
        afternoon: 'Keep pushing forward!',
        evening: 'Reflect and unwind.'
    };
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const dailyReminder = document.getElementById('daily-reminder');
    if (dailyReminder) dailyReminder.textContent = messages[timeOfDay];
    updateHomdata('action', `daily_reminder_${timeOfDay}`);
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
                        callback: value => ({ 1: 'Sad', 2: 'Stressed', 3: 'Neutral', 4: 'Happy', 5: 'Happy' }[value] || value)
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
        const moodScores = { happy: 5, neutral: 3, sad: 1, stressed: 2 };
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
    const gratitudeList = document.getElementById('gratitude-list');
    if (gratitudeList) {
        gratitudeList.innerHTML = homdata.gratitude.map(g => `
            <p id="gratitude-${g.id || g.timestamp}"><i class="fas fa-heart"></i> ${g.text} (${new Date(g.timestamp).toLocaleDateString()})</p>
        `).join('') || '<p>No gratitude entries yet.</p>';
    }
}

function updateReflectionList() {
    const reflectionList = document.getElementById('reflection-list');
    if (reflectionList) {
        reflectionList.innerHTML = homdata.reflections.map(r => `
            <p id="reflection-${r.id || r.timestamp}"><i class="fas fa-comment"></i> ${r.text} (${new Date(r.timestamp).toLocaleDateString()})</p>
        `).join('') || '<p>No reflections yet.</p>';
    }
}

let pomodoroInterval = null;
function updatePomodoroList(filter = '') {
    const pomodoroList = document.getElementById('pomodoro-list');
    if (pomodoroList) {
        if (!homdata.pomodoro || !homdata.pomodoro.tasks) {
            pomodoroList.innerHTML = '<li>No Pomodoro tasks added yet.</li>';
            return;
        }
        const filteredTasks = homdata.pomodoro.tasks.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));
        pomodoroList.innerHTML = filteredTasks.length > 0
            ? filteredTasks.map((t, i) => `
                <li class="pomodoro-task ${t.isActive ? 'active' : ''} ${t.completed ? 'completed' : ''}" id="pomodoro-task-${t.name.replace(/\s+/g, '-')}" data-task-name="${t.name}">
                    <input type="checkbox" id="pomodoro${i}" data-task="${t.name}" ${t.completed ? 'checked disabled' : ''}>
                    <label for="pomodoro${i}">${t.name} (${t.duration} min)</label>
                    <span class="pomodoro-time">${t.isActive ? formatTime(t.duration * 60 - t.timeSpent) : formatTime(t.timeSpent)} / ${t.duration}:00</span>
                    ${!t.completed ? `<button class="action-btn small-btn pomodoro-btn" onclick="startPomodoro('${t.name}')">${t.isActive ? 'Pause' : 'Start'}</button>` : ''}
                    ${!t.isActive && !t.completed ? `<button class="action-btn small-btn remove-btn" onclick="removePomodoroTask('${t.name}')">Remove</button>` : ''}
                </li>
            `).join('')
            : '<li>No matching tasks found.</li>';
        document.querySelectorAll('#pomodoro-list input').forEach(input => {
            input.addEventListener('change', () => {
                playCompleteSound();
                updateHomdata('pomodoro_complete', { name: input.dataset.task, completed: input.checked });
            });
        });
    }
}

function updatePomodoroHistory() {
    const historyList = document.getElementById('pomodoro-history');
    if (historyList) {
        historyList.innerHTML = homdata.pomodoro && homdata.pomodoro.history && homdata.pomodoro.history.length > 0
            ? homdata.pomodoro.history.slice(-5).map(h => `
                <p><i class="fas fa-clock"></i> ${h.name} (${h.duration} min) completed on ${new Date(h.completedAt).toLocaleDateString()}</p>
            `).join('')
            : '<p>No completed Pomodoro sessions yet.</p>';
    }
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
            updatePomodoroList();
            if (seconds <= 0) {
                clearInterval(pomodoroInterval);
                task.isActive = false;
                task.completed = true;
                updateHomdata('pomodoro_complete', { name: taskName, completed: true });
                playCompleteSound();
                triggerCelebration();
                alert('Pomodoro session completed! Take a break.');
            }
        }, 1000);
    }
    updatePomodoroList();
}

function removePomodoroTask(taskName) {
    if (!homdata.pomodoro || !homdata.pomodoro.tasks) return;
    playClickSound();
    updateHomdata('pomodoro_remove', taskName);
}

function searchPomodoro() {
    const searchInput = document.getElementById('pomodoro-search');
    if (searchInput) {
        updatePomodoroList(searchInput.value);
    }
}

function addPomodoroTask() {
    const taskName = document.getElementById('newPomodoroTask')?.value;
    const workDuration = parseInt(document.getElementById('pomodoroWorkDuration')?.value);
    const breakDuration = parseInt(document.getElementById('pomodoroBreakDuration')?.value);
    if (taskName && workDuration >= 1 && breakDuration >= 1) {
        if (!homdata.pomodoro) {
            homdata.pomodoro = { tasks: [], history: [], settings: { workDuration: 25, breakDuration: 5 } };
        }
        updateHomdata('pomodoro_task', { name: taskName, duration: workDuration, break: breakDuration, completed: false });
        updateHomdata('pomodoro_settings', { workDuration, breakDuration });
        document.getElementById('newPomodoroTask').value = '';
        document.getElementById('pomodoroWorkDuration').value = homdata.pomodoro.settings.workDuration;
        document.getElementById('pomodoroBreakDuration').value = homdata.pomodoro.settings.breakDuration;
        toggleModal('pomodoroModal', false);
    }
}

function updateHabitList(filter = '') {
    const habitList = document.getElementById('habit-list');
    if (habitList) {
        const filteredHabits = homdata.habits.filter(h => h.name.toLowerCase().includes(filter.toLowerCase()));
        habitList.innerHTML = filteredHabits.map(h => `
            <p data-habit="${h.name}"><i class="fas fa-check-circle"></i> ${h.name}: ${h.progress} <button class="action-btn small-btn" onclick="playCompleteSound(); completeHabit('${h.name}')">Complete Today</button></p>
        `).join('') || '<p>No matching habits found.</p>';
    }
}

function searchHabits() {
    const searchInput = document.getElementById('habit-search');
    if (searchInput) {
        updateHabitList(searchInput.value);
    }
}

function completeHabit(name) {
    updateHomdata('habit_complete', name);
}

function addHabit() {
    const habitName = document.getElementById('newHabit')?.value;
    const habitGoal = parseInt(document.getElementById('habitGoal')?.value);
    if (habitName  && habitGoal >= 7) {
        updateHomdata('habit', { name: habitName, goal: habitGoal });
        document.getElementById('newHabit').value = '';
        document.getElementById('habitGoal').value = '';
        toggleModal('habitModal', false);
    }
}

function updateTriggerLog() {
    const triggerLog = document.getElementById('trigger-log');
    if (triggerLog) {
        const recentTriggers = homdata.distractions.slice(-3).map(d => d.trigger).join(', ') || 'None';
        triggerLog.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> Recent triggers: ${recentTriggers}</p>`;
        const progressBar = triggerLog.parentElement.querySelector('.progress-bar div');
        if (progressBar) {
            const distractionCount = homdata.distractions.length;
            const maxDisplay = 10; // Max distractions to show full progress
            const progress = Math.min((distractionCount / maxDisplay) * 100, 100);
            progressBar.style.width = `${progress}%`;
        }
    }
}

function addCustomMusic() {
    const linkInput = document.getElementById('newMusicLink')?.value;
    if (linkInput) {
        const videoId = getYouTubeVideoId(linkInput);
        if (videoId) {
            const tag = prompt('Enter a name for this track:', 'Custom Track');
            if (tag) {
                const cleanTag = tag.replace(/\s+/g, '_').toLowerCase();
                updateHomdata('music', { tag: cleanTag, url: `https://www.youtube.com/watch?v=${videoId}` });
                document.getElementById('newMusicLink').value = '';
                toggleModal('addMusicModal', false);
            }
        } else {
            alert('Invalid YouTube link. Please use a valid format (e.g., youtube.com/watch?v=ID, youtu.be/ID, music.youtube.com/watch?v=ID).');
        }
    }
}

(async () => {
    try {
        const fetchedData = await GetHomeUser();
        if (fetchedData) {
            homdata = { ...defaultHomdata, ...fetchedData, user: { ...defaultHomdata.user, ...fetchedData.user }, pomodoro: fetchedData.pomodoro || defaultHomdata.pomodoro };
            // Limit arrays after fetching data
            limitArrayEntries(homdata.moods);
            limitArrayEntries(homdata.distractions);
            limitArrayEntries(homdata.actions);
            limitArrayEntries(homdata.gratitude);
            limitArrayEntries(homdata.reflections);
            limitArrayEntries(homdata.milestones);
            limitArrayEntries(homdata.tips);
            if (homdata.pomodoro && homdata.pomodoro.history) {
                limitArrayEntries(homdata.pomodoro.history);
            }
        }
        console.log('Initialized homdata:', homdata);
        if (!fetchedData) await sendToApi(homdata);

        const greeting = document.getElementById('greeting');
        if (greeting) greeting.textContent = `Welcome back, ${homdata.user.name}!`;
        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = homdata.user.name;
        const userGoal = document.getElementById('user-goal');
        if (userGoal) userGoal.textContent = homdata.user.goal;
        const streakDisplay = document.getElementById('streak-display');
        if (streakDisplay) streakDisplay.textContent = `Current Streak: ${homdata.user.streak} days`;

        if (homdata.user.avatar) {
            const canvas = document.getElementById('avatar');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.src = homdata.user.avatar;
                img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
        } else {
            generateAvatar();
        }

        updatePomodoroList();
        updatePomodoroHistory();
        updateHabitList();
        updateMilestoneList();
        updateDailyReminder();
        updateTriggerLog();
        updateGratitudeList();
        updateReflectionList();
        updateMoodChart();
        updateAffirmation(homdata.user.currentMood);
        generateTip();
        updatePlaylistUI();
        loadYouTubeAPI();

        document.querySelectorAll('.emoji-buttons button').forEach(btn => {
            btn.addEventListener('click', () => {
                playClickSound();
                const mood = btn.dataset.mood;
                document.querySelectorAll('.emoji-button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                homdata.user.currentMood = mood;
                updateHomdata('mood', mood);
            });
        });

        const trigger = document.getElementById('trigger');
        if (trigger) {
            trigger.addEventListener('change', () => {
                playClickSound();
                const triggerValue = trigger.value;
                if (triggerValue) {
                    updateHomdata('distraction', { trigger: triggerValue });
                    trigger.value = '';
                }
            });
        }

        const gratitude = document.getElementById('gratitude');
        if (gratitude) {
            gratitude.addEventListener('blur', () => {
                const text = gratitude.value.trim();
                if (text) {
                    updateHomdata('gratitude', text);
                    gratitude.value = '';
                }
            });
        }

        const moodReflection = document.getElementById('mood-reflection');
        if (moodReflection) {
            moodReflection.addEventListener('blur', () => {
                const text = moodReflection.value.trim();
                if (text) {
                    updateHomdata('reflection', text);
                    moodReflection.value = '';
                }
            });
        }

        document.querySelectorAll('.action-btn[data-feature], .nav-icon[data-feature]').forEach(btn => {
            btn.addEventListener('click', () => {
                playClickSound();
                const feature = btn.dataset.feature;
                if(feature === 'ededleaderboard') {
                    window.location.href = `/home/leaderboard/lead/prams?username=default&page=1&limit=10&users=true`;
                }else{
                    redirectTo(feature)
                }
                
            });
        });

        document.querySelectorAll('.card.clickable').forEach(card => {
            card.addEventListener('click', () => {
                playClickSound();
                const feature = card.dataset.feature;
                redirectTo(feature);
            });
        });

        const darkMode = document.getElementById('darkMode');
        if (darkMode) {
            darkMode.checked = homdata.settings.darkMode;
            document.documentElement.setAttribute('data-theme', homdata.settings.darkMode ? 'dark' : 'light');
            darkMode.addEventListener('change', () => {
                playClickSound();
                const isDark = darkMode.checked;
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                homdata.settings.darkMode = isDark;
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                updateHomdata('setting', { darkMode: isDark });
            });
        }

        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.value = homdata.settings.notifications;
            notifications.addEventListener('change', () => {
                playClickSound();
                const value = notifications.value;
                updateHomdata('setting', { notifications: value });
            });
        }

        const ambientSound = document.getElementById('ambientSound');
        if (ambientSound) {
            ambientSound.addEventListener('change', () => {
                homdata.settings.musicTime = 0;
                playMusic();
            });
        }

        const pomodoroWorkDuration = document.getElementById('pomodoroWorkDuration');
        const pomodoroBreakDuration = document.getElementById('pomodoroBreakDuration');
        if (pomodoroWorkDuration && pomodoroBreakDuration) {
            pomodoroWorkDuration.value = homdata.pomodoro?.settings?.workDuration || 25;
            pomodoroBreakDuration.value = homdata.pomodoro?.settings?.breakDuration || 5;
        }
    } catch (error) {
        console.error('Initialization error:', error);
        alert('An error occurred during initialization. Please try again.');
    }
})();