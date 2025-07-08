let homdata = {
    user: {
        name: localStorage.getItem('preferredName') || localStorage.getItem('username') || 'Guest',
        streak: 3,
        currentMood: 'Not set',
        goal: 'Overcome procrastination and build discipline',
        streakHistory: [3, 2, 1],
        avatar: ''
    },
    tasks: [
        { name: 'Walk 30 mins', completed: false, timestamp: new Date().toISOString() },
        { name: 'No social media for 2 hrs', completed: false, timestamp: new Date().toISOString() },
        { name: 'Study 6 hrs', completed: false, timestamp: new Date().toISOString() }
    ],
    moods: [],
    distractions: [],
    actions: [],
    habits: [
        { name: 'Meditation', progress: '4/7', goal: 7 },
        { name: 'Waking up early', progress: '6/7', goal: 7 }
    ],
    gratitude: [],
    journal: [],
    reflections: [],
    milestones: [{ text: 'Reached 3-day streak!', timestamp: new Date().toISOString() }],
    tips: [],
    settings: { darkMode: false, notifications: 'off', music: 'none' },
    playlist: [],
    navigation: []
};

// Audio for click and completion sounds
const clickSound = new Audio('/sounds/click'); // Updated to your path
const completeSound = new Audio('/sounds/fun'); // Updated to your path

function playClickSound() {
    clickSound.play().catch(() => console.log('Click sound failed'));
}

function playCompleteSound() {
    completeSound.play().catch(() => console.log('Complete sound failed'));
}

// Load YouTube IFrame Player API
let player;
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('music-player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    console.log('YouTube player ready');
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

// Send data to /data API
async function sendToApi() {
    try {
        const response = await fetch('/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: homdata.user.name, data: homdata })
        });
        if (!response.ok) throw new Error('API request failed');
        console.log('Data sent to /data:', homdata);
    } catch (error) {
        // Suppress API error logging as requested
    }
}

// Fetch playlist from voice.json
async function fetchPlaylist() {
    try {
        const response = await fetch('/voice.json');
        const data = await response.json();
        homdata.playlist = data;
        updatePlaylistUI();
    } catch (error) {
        console.log('Failed to fetch voice.json, using fallback');
        homdata.playlist = [
            { tag: 'rain', url: 'https://www.youtube.com/embed/yIQd2Ya0Ziw?autoplay=1&loop=1&playlist=yIQd2Ya0Ziw' },
            { tag: 'thunderrain', url: 'https://www.youtube.com/embed/qlLkTmoKjOY?autoplay=1&loop=1&playlist=qlLkTmoKjOY' },
            { tag: 'forest', url: 'https://www.youtube.com/embed/IvjMgVS6kng?autoplay=1&loop=1&playlist=IvjMgVS6kng' },
            { tag: 'interseteller', url: 'https://www.youtube.com/embed/p2zMXSXhZ9M?autoplay=1&loop=1&playlist=p2zMXSXhZ9M' },
            { tag: 'ambient_calming', url: 'https://www.youtube.com/embed/xDih5SwFs_c?autoplay=1&loop=1&playlist=xDih5SwFs_c' },
            { tag: 'calm_anxiety', url: 'https://www.youtube.com/embed/zPyg4N7bcHM?autoplay=1&loop=1&playlist=zPyg4N7bcHM' },
            { tag: 'motivation_speech', url: 'https://www.youtube.com/embed/VfNCUm7_FMU?autoplay=1&loop=1&playlist=VfNCUm7_FMU' },
            { tag: 'madra_uchiha_speech', url: 'https://www.youtube.com/embed/ZR377rPci64?autoplay=1&loop=1&playlist=ZR377rPci64' },
            { tag: 'hope', url: 'https://www.youtube.com/embed/xfzhezl_jts?autoplay=1&loop=1&playlist=xfzhezl_jts' },
            { tag: 'world_best_speech', url: 'https://www.youtube.com/embed/UF8uR6Z6KLc?autoplay=1&loop=1&playlist=UF8uR6Z6KLc' },
            { tag: 'elon_musk', url: 'https://www.youtube.com/embed/k9zTr2MAFRg?autoplay=1&loop=1&playlist=k9zTr2MAFRg' },
            { tag: 'calmdown', url: 'https://www.youtube.com/embed/0L38Z9hIi5s?autoplay=1&loop=1&playlist=0L38Z9hIi5s' },
            { tag: 'study', url: 'https://www.youtube.com/embed/idRi7ob_cQw?autoplay=1&loop=1&playlist=idRi7ob_cQw' },
            { tag: 'coding', url: 'https://www.youtube.com/embed/Yd7vDterctQ?autoplay=1&loop=1&playlist=Yd7vDterctQ' },
            { tag: 'chill_beats', url: 'https://www.youtube.com/embed/sF80I-TQiW0?autoplay=1&loop=1&playlist=sF80I-TQiW0' }
        ];
        updatePlaylistUI();
    }
}

function updatePlaylistUI() {
    const select = document.getElementById('ambientSound');
    select.innerHTML = '<option value="none">None</option>' + 
        homdata.playlist.map(item => `<option value="${item.tag}">${item.tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('');
}

// Update homdata and send to API
function updateHomdata(type, value) {
    if (type === 'mood') {
        homdata.moods.push({ mood: value, timestamp: new Date().toISOString() });
        homdata.user.currentMood = value;
        document.getElementById('current-mood').textContent = value.charAt(0).toUpperCase() + value.slice(1);
        updateAffirmation(value);
        updateMoodChart();
    } else if (type === 'task') {
        homdata.tasks.push({ ...value, timestamp: new Date().toISOString() });
        updateTaskList();
    } else if (type === 'task_complete') {
        const task = homdata.tasks.find(t => t.name === value.name);
        if (task) task.completed = value.completed;
        updateTaskList();
        updateStreak();
        triggerCelebration();
    } else if (type === 'distraction') {
        homdata.distractions.push({ ...value, timestamp: new Date().toISOString() });
        document.getElementById('distractions').textContent = homdata.distractions.length;
        updateTriggerLog();
    } else if (type === 'gratitude' && value) {
        homdata.gratitude.push({ text: value, timestamp: new Date().toISOString() });
    } else if (type === 'journal' && value) {
        homdata.journal.push({ text: value, timestamp: new Date().toISOString() });
    } else if (type === 'reflection' && value) {
        homdata.reflections.push({ text: value, timestamp: new Date().toISOString() });
    } else if (type === 'setting') {
        homdata.settings = { ...homdata.settings, ...value };
    } else if (type === 'action' || type === 'nav') {
        homdata.actions.push({ action: value, timestamp: new Date().toISOString() });
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
        document.getElementById('user-goal').textContent = value;
    } else if (type === 'milestone') {
        homdata.milestones.push({ text: value, timestamp: new Date().toISOString() });
        updateMilestoneList();
    } else if (type === 'tip') {
        homdata.tips.push({ text: value, timestamp: new Date().toISOString() });
        document.getElementById('quick-tip').textContent = value;
    }
    console.log('Updated homdata:', homdata);
    sendToApi();
}

// Redirect to feature page
function redirectTo(feature) {
    updateHomdata('action', `navigate_${feature}`);
    const name = encodeURIComponent(homdata.user.name);
    window.location.href = `/home/${feature}/${name}`;
}

// Generate avatar
function generateAvatar() {
    const canvas = document.getElementById('avatar');
    const ctx = canvas.getContext('2d');
    const colors = ['#5a7ff5', '#c4a1ff', '#28a745', '#ff6b6b'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(25, 25, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(homdata.user.name[0].toUpperCase(), 25, 25);
    homdata.user.avatar = canvas.toDataURL();
    updateHomdata('action', 'generate_avatar');
}

// Celebration animation
function triggerCelebration() {
    const canvas = document.getElementById('celebration');
    canvas.style.display = 'block'; // Show canvas
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
            opacity: 1 // Add opacity for fading
        });
    }
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let hasVisibleParticles = false;
        particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.speed *= 0.98; // Slow down
            p.opacity *= 0.98; // Fade out
            p.radius *= 0.98; // Shrink
            if (p.opacity > 0.1 && p.radius > 0.1) {
                hasVisibleParticles = true;
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.globalAlpha = 1; // Reset global alpha
            }
        });
        frame++;
        if (frame < 120 && hasVisibleParticles) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none'; // Hide canvas
        }
    }
    animate();
}

// Affirmations
const affirmations = {
    happy: [
        "Your positivity is a gift! Keep shining.",
        "You're spreading joy today!",
        "Your smile lights up the world."
    ],
    neutral: [
        "You're on the right path. Let's make today count.",
        "Every moment is a new opportunity.",
        "You're building a better you."
    ],
    sad: [
        "It's okay to feel this way. We're here to support you.",
        "You're not alone; take it one step at a time.",
        "Your feelings are valid, and we're here."
    ],
    stressed: [
        "Take a deep breath. You've got this, one step at a time.",
        "You're stronger than you know.",
        "Pause and breathe; you're in control."
    ]
};

let currentAffirmationIndex = 0;
function updateAffirmation(mood) {
    const affirmationList = affirmations[mood] || affirmations.neutral;
    document.getElementById('affirmation').textContent = affirmationList[currentAffirmationIndex] || "You're on a journey to growth!";
}

function generateAffirmation() {
    const mood = homdata.user.currentMood.toLowerCase();
    const affirmationList = affirmations[mood] || affirmations.neutral;
    currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmationList.length;
    updateAffirmation(mood);
    updateHomdata('action', 'generate_affirmation');
}

// Quick tips
const tips = [
    "Take 5 deep breaths to reset.",
    "Write down one thing you’re grateful for.",
    "Step away for a 2-minute stretch.",
    "Drink a glass of water to stay focused.",
    "Smile at yourself in the mirror!"
];

function generateTip() {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    updateHomdata('tip', tip);
}

// Initialize UI
document.getElementById('greeting').textContent = `Welcome back, ${homdata.user.name}!`;
document.getElementById('profile-name').textContent = homdata.user.name;
document.getElementById('user-goal').textContent = homdata.user.goal;
document.getElementById('streak-display').textContent = `${homdata.user.streak} days`;
document.getElementById('streak-history').textContent = homdata.user.streakHistory.join(', ') + ' days';
generateAvatar();
updateTaskList();
updateHabitList();
updateMilestoneList();
updateDailyReminder();
updateTriggerLog();
generateTip();
fetchPlaylist();
loadYouTubeAPI();

// Mood selector
document.querySelectorAll('.emoji-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        playClickSound();
        const mood = btn.dataset.mood;
        homdata.user.currentMood = mood;
        updateHomdata('mood', mood);
    });
});

// Task management
function updateTaskList() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = homdata.tasks.map((t, i) => `
        <li><input type="checkbox" id="task${i}" data-task="${t.name}" ${t.completed ? 'checked' : ''}> <label for="task${i}">${t.name}</label></li>
    `).join('');
    document.querySelectorAll('.task-list input').forEach(input => {
        input.addEventListener('change', () => {
            playCompleteSound();
            updateHomdata('task_complete', { name: input.dataset.task, completed: input.checked });
        });
    });
}

function openTaskModal() {
    document.getElementById('taskModal').classList.add('active');
}

function addTask() {
    const taskName = document.getElementById('newTask').value;
    if (taskName) {
        updateHomdata('task', { name: taskName, completed: false });
        document.getElementById('newTask').value = '';
        closeTaskModal();
    }
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    updateHomdata('action', 'close_task_modal');
}

// Habit management
function updateHabitList() {
    const habitList = document.getElementById('habit-list');
    habitList.innerHTML = homdata.habits.map(h => `
        <p data-habit="${h.name}">${h.name}: ${h.progress} ✅ <button class="action-btn small-btn" onclick="playCompleteSound && playCompleteSound(); completeHabit('${h.name}')">Complete Today</button></p>
    `).join('');
}

function completeHabit(name) {
    updateHomdata('habit_complete', name);
}

function openHabitModal() {
    document.getElementById('habitModal').classList.add('active');
}

function addHabit() {
    const name = document.getElementById('newHabit').value;
    const goal = parseInt(document.getElementById('habitGoal').value);
    if (name && goal >= 1 && goal <= 7) {
        updateHomdata('habit', { name, goal });
        document.getElementById('newHabit').value = '';
        document.getElementById('habitGoal').value = '';
        closeHabitModal();
    }
}

function closeHabitModal() {
    document.getElementById('habitModal').classList.remove('active');
    updateHomdata('action', 'close_habit_modal');
}

// Distraction trigger
function updateTriggerLog() {
    const triggerLog = document.getElementById('trigger-log');
    const recentTriggers = homdata.distractions.slice(-3).map(d => d.trigger).join(', ') || 'None';
    triggerLog.innerHTML = `<p>Recent triggers: ${recentTriggers}</p>`;
}

document.getElementById('trigger').addEventListener('change', () => {
    playClickSound();
    const trigger = document.getElementById('trigger').value;
    if (trigger) updateHomdata('distraction', { trigger });
});

// Gratitude log
document.getElementById('gratitude').addEventListener('blur', () => {
    const text = document.getElementById('gratitude').value;
    updateHomdata('gratitude', text);
});

// Mood reflection
document.getElementById('mood-reflection').addEventListener('blur', () => {
    const text = document.getElementById('mood-reflection').value;
    updateHomdata('reflection', text);
});

// Quick journal
document.querySelector('.action-btn[data-feature="journal"]').addEventListener('click', () => {
    playClickSound();
    document.getElementById('journalModal').classList.add('active');
});

function saveJournal() {
    const text = document.getElementById('quickJournal').value;
    if (text) {
        updateHomdata('journal', text);
        document.getElementById('quickJournal').value = '';
        closeJournal();
        redirectTo('journal');
    }
}

function closeJournal() {
    document.getElementById('journalModal').classList.remove('active');
    updateHomdata('action', 'close_journal');
}

// Action buttons
document.querySelectorAll('.action-btn[data-feature]').forEach(btn => {
    if (btn.dataset.feature !== 'journal') {
        btn.addEventListener('click', () => {
            playClickSound();
            const feature = btn.dataset.feature;
            redirectTo(feature);
        });
    }
});

// Clickable cards
document.querySelectorAll('.card.clickable').forEach(card => {
    card.addEventListener('click', () => {
        playClickSound();
        const feature = card.dataset.feature;
        redirectTo(feature);
    });
});

// Settings popup
document.querySelector('.nav-icon[data-feature="settings"]').addEventListener('click', () => {
    playClickSound();
    updateHomdata('nav', 'settings');
    document.getElementById('settingsPopup').classList.add('active');
});

function closeSettings() {
    document.getElementById('settingsPopup').classList.remove('active');
    updateHomdata('action', 'close_settings');
}

// Dark mode
document.getElementById('darkMode').addEventListener('change', () => {
    playClickSound();
    const isDark = document.getElementById('darkMode').checked;
    document.body.classList.toggle('dark-mode', isDark);
    homdata.settings.darkMode = isDark;
    localStorage.setItem('darkMode', isDark);
    updateHomdata('setting', { darkMode: isDark });
});

// Load dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.getElementById('darkMode').checked = true;
    document.body.classList.add('dark-mode');
    homdata.settings.darkMode = true;
}

// Notifications
document.getElementById('notifications').addEventListener('change', () => {
    playClickSound();
    const value = document.getElementById('notifications').value;
    updateHomdata('setting', { notifications: value });
});

// Ambient playlist
let musicInterval = null;
function toggleMusic() {
    const sound = document.getElementById('ambientSound').value;
    homdata.settings.music = sound;
    const progressBar = document.getElementById('music-progress');
    
    if (sound === 'none') {
        if (player && typeof player.stopVideo === 'function') {
            player.stopVideo();
        } else {
            document.getElementById('music-player').innerHTML = '';
        }
        clearInterval(musicInterval);
        progressBar.value = 0;
    } else {
        const track = homdata.playlist.find(p => p.tag === sound);
        if (track) {
            const videoId = track.url.match(/embed\/([^\?]+)/)[1];
            if (player && typeof player.loadVideoById === 'function') {
                player.loadVideoById({ videoId: videoId, suggestedQuality: 'small' });
                player.setLoop(true);
                player.playVideo();
            } else {
                document.getElementById('music-player').innerHTML = `
                    <iframe src="${track.url}" style="display: none;" allow="autoplay"></iframe>
                `;
            }
            clearInterval(musicInterval);
            let progress = 0;
            musicInterval = setInterval(() => {
                progress += (100 / 3600); // Increment to reach 100% in 1 hour
                if (progress >= 100) progress = 0;
                progressBar.value = progress;
                if (homdata.settings.music !== sound) clearInterval(musicInterval);
            }, 1000);
        }
    }
    updateHomdata('setting', { music: sound });
}

// Breathing exercise
function doBreathingExercise() {
    document.getElementById('breathingModal').classList.add('active');
    let count = 0;
    const text = document.getElementById('breathing-text');
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
            setTimeout(closeBreathing, 1000);
        }
    }, 4000);
    updateHomdata('action', 'breathing_exercise');
}

function closeBreathing() {
    document.getElementById('breathingModal').classList.remove('active');
    updateHomdata('action', 'close_breathing');
}

// Mindfulness
function startMindfulness() {
    document.getElementById('mindfulnessModal').classList.add('active');
    const text = document.getElementById('meditation-text');
    text.textContent = 'Close your eyes, focus on your breath. Let thoughts pass like clouds...';
    setTimeout(() => {
        text.textContent = 'Well done! You completed a 1-minute meditation.';
        setTimeout(closeMindfulness, 2000);
    }, 60000);
    updateHomdata('action', 'mindfulness');
}

function closeMindfulness() {
    document.getElementById('mindfulnessModal').classList.remove('active');
    updateHomdata('action', 'close_mindfulness');
}

// Export data
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

// Edit goal
function editGoal() {
    const newGoal = prompt('Enter your new goal:', homdata.user.goal);
    if (newGoal) {
        updateHomdata('goal', newGoal);
    }
}

// Update streak
function updateStreak() {
    const today = new Date().toDateString();
    const completedToday = homdata.tasks.some(t => t.completed && new Date(t.timestamp).toDateString() === today);
    if (completedToday) {
        homdata.user.streak++;
        homdata.user.streakHistory.push(homdata.user.streak);
        if (homdata.user.streakHistory.length > 3) homdata.user.streakHistory.shift();
        document.getElementById('streak').textContent = `${homdata.user.streak} days`;
        document.getElementById('streak-display').textContent = `${homdata.user.streak} days`;
        document.getElementById('streak-history').textContent = homdata.user.streakHistory.join(', ') + ' days';
        document.getElementById('streak-message').textContent = homdata.user.streak > 3 ? 'Amazing consistency!' : 'Keep it up!';
        checkMilestones();
        updateHomdata('action', 'update_streak');
    }
}

// Update milestones
function checkMilestones() {
    const streak = homdata.user.streak;
    const completedTasks = homdata.tasks.filter(t => t.completed).length;
    if (streak === 5) {
        updateHomdata('milestone', 'Reached 5-day streak! 🎉');
    } else if (completedTasks >= 10) {
        updateHomdata('milestone', 'Completed 10 tasks! 🚀');
    }
}

function updateMilestoneList() {
    const milestoneList = document.getElementById('milestone-list');
    milestoneList.innerHTML = homdata.milestones.map(m => `<p>${m.text}</p>`).join('');
}

// Daily reminder
function updateDailyReminder() {
    const hour = new Date().getHours();
    const messages = {
        morning: 'Start your day strong!',
        afternoon: 'Keep pushing forward!',
        evening: 'Reflect and unwind.'
    };
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    document.getElementById('daily-reminder').textContent = messages[timeOfDay];
    updateHomdata('action', `daily_reminder_${timeOfDay}`);
}

// Mood chart
const moodChart = new Chart(document.getElementById('moodChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Mood',
            data: [3, 4, 2, 5, 3, 4, 5],
            borderColor: '#5a7ff5',
            backgroundColor: 'rgba(90, 127, 245, 0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        scales: {
            y: { min: 1, max: 5, title: { display: true, text: 'Mood' } }
        },
        plugins: {
            legend: { display: false }
        }
    }
});

function updateMoodChart() {
    const moods = homdata.moods.slice(-7).map(m => {
        const scores = { happy: 5, neutral: 3, sad: 1, stressed: 2 };
        return scores[m.mood] || 3;
    });
    moodChart.data.datasets[0].data = moods.length >= 7 ? moods : [...moods, ...Array(7 - moods.length).fill(3)];
    moodChart.update();
}