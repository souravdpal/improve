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
    navigation: [],
    messages: [],
    track: []
};

// Audio for click and completion sounds
const clickSound = new Audio('/sounds/click');
const completeSound = new Audio('/sounds/fun');

function playClickSound() {
    clickSound.play().catch(() => console.log('Click sound failed'));
}

function playCompleteSound() {
    completeSound.play().catch(() => console.log('Complete sound failed'));
}



function  io(){
    window.location.href=`/home/hi/${encodeURIComponent(localStorage.getItem('name'))}`
}





// Celebration animation
function triggerCelebration() {
    const canvas = document.getElementById('celebration');
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
            color: ['#4db6ac', '#b39ddb', '#26a69a'][Math.floor(Math.random() * 3)],
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
    playCompleteSound();
}

// Send tracking data to /data/track
async function sendTrackToApi(trackEntry) {
    try {
        const response = await fetch('/data/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: homdata.user.name, track: trackEntry })
        });
        if (!response.ok) throw new Error('Track API request failed');
        console.log('Track sent to /data/track:', trackEntry);
    } catch (error) {
        // Suppress API error logging
    }
}

// Send tracking data to /ai/track/:user for analysis
async function sendAnalyzeRequest() {
    try {
        const response = await fetch(`/ai/track/${homdata.user.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track: homdata.track })
        });
        if (!response.ok) throw new Error('AI analysis request failed');
        const data = await response.json();
        return data.response;
    } catch (error) {
        // Mock AI response
        const latestTrack = homdata.track[homdata.track.length - 1] || {
            mood: 'neutral',
            badHabits: [],
            goodHabits: [],
            works: [],
            focus: [],
            distractions: [],
            workOn: [],
            avoid: [],
            summary: ''
        };
        return `HINA: Hi ${homdata.user.name}, your recent mood was ${latestTrack.mood}. I see you're working on ${latestTrack.workOn[0] || 'your goals'}. To improve, try reducing ${latestTrack.distractions[0] || 'distractions'} and focus on ${latestTrack.goodHabits[0] || 'building positive habits'}. You're making progress!`;
    }
}

// Get URL parameters
function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'track',
        user: decodeURIComponent(path[3] || 'Guest')
    };
}

// Initialize tracking
function initializeTracking() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    updateDashboard();
    updateTrackCards();
}

// Fake tracking data
const fakeTracks = [
    {
        mood: 'happy',
        badHabits: ['Procrastination'],
        goodHabits: ['Meditation'],
        works: ['Finished report'],
        focus: ['Deep work for 2 hours'],
        distractions: ['Social media'],
        workOn: ['Time management'],
        avoid: ['Overthinking'],
        summary: 'Productive day, felt accomplished.',
        timestamp: new Date('2025-07-07T10:00:00Z').toISOString()
    },
    {
        mood: 'stressed',
        badHabits: ['Skipping workout'],
        goodHabits: ['Waking up early'],
        works: ['Attended meeting'],
        focus: ['Task prioritization'],
        distractions: ['Notifications'],
        workOn: ['Stress management'],
        avoid: ['Multitasking'],
        summary: 'Challenging day but managed priorities.',
        timestamp: new Date('2025-07-06T15:00:00Z').toISOString()
    }
];

// Update dashboard
function updateDashboard() {
    const latestTrack = homdata.track[homdata.track.length - 1] || fakeTracks[0] || {
        mood: 'No data yet',
        badHabits: [],
        goodHabits: [],
        works: [],
        focus: [],
        distractions: [],
        workOn: [],
        avoid: [],
        summary: 'No data yet',
        analysis: 'No analysis yet'
    };
    document.getElementById('dash-mood').textContent = latestTrack.mood.charAt(0).toUpperCase() + latestTrack.mood.slice(1);
    document.getElementById('dash-bad-habits').textContent = latestTrack.badHabits.join(', ') || 'None';
    document.getElementById('dash-good-habits').textContent = latestTrack.goodHabits.join(', ') || 'None';
    document.getElementById('dash-works').textContent = latestTrack.works.join(', ') || 'None';
    document.getElementById('dash-focus').textContent = latestTrack.focus.join(', ') || 'None';
    document.getElementById('dash-distractions').textContent = latestTrack.distractions.join(', ') || 'None';
    document.getElementById('dash-work-on').textContent = latestTrack.workOn.join(', ') || 'None';
    document.getElementById('dash-avoid').textContent = latestTrack.avoid.join(', ') || 'None';
    document.getElementById('dash-summary').textContent = latestTrack.summary || 'No summary yet';
    document.getElementById('dash-analysis').textContent = latestTrack.analysis || 'No analysis yet';
}

// Update tracking cards
function updateTrackCards() {
    const trackCards = document.getElementById('track-cards');
    trackCards.innerHTML = fakeTracks.concat(homdata.track).map((t, i) => `
        <div class="card clickable" onclick="viewTracking(${i})">
            <p>${new Date(t.timestamp).toLocaleDateString()} - Mood: ${t.mood.charAt(0).toUpperCase() + t.mood.slice(1)}, ${t.summary.substring(0, 30)}...</p>
        </div>
    `).join('');
}

// Open tracking modal
function openTrackModal() {
    playClickSound();
    document.getElementById('trackModal').classList.add('active');
    document.getElementById('track-mood').value = 'happy';
    document.getElementById('track-bad-habits').value = '';
    document.getElementById('track-good-habits').value = '';
    document.getElementById('track-works').value = '';
    document.getElementById('track-focus').value = '';
    document.getElementById('track-distractions').value = '';
    document.getElementById('track-work-on').value = '';
    document.getElementById('track-avoid').value = '';
    document.getElementById('track-summary').value = '';
}

// Close tracking modal
function closeTrackModal() {
    playClickSound();
    document.getElementById('trackModal').classList.remove('active');
}

// Add tracking
function addTracking() {
    playClickSound();
    const mood = document.getElementById('track-mood').value;
    const badHabits = document.getElementById('track-bad-habits').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const goodHabits = document.getElementById('track-good-habits').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const works = document.getElementById('track-works').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const focus = document.getElementById('track-focus').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const distractions = document.getElementById('track-distractions').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const workOn = document.getElementById('track-work-on').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const avoid = document.getElementById('track-avoid').value.trim().split(',').map(s => s.trim()).filter(s => s);
    const summary = document.getElementById('track-summary').value.trim();
    if (!summary) return;
    const trackEntry = {
        mood,
        badHabits,
        goodHabits,
        works,
        focus,
        distractions,
        workOn,
        avoid,
        summary,
        timestamp: new Date().toISOString()
    };
    homdata.track.push(trackEntry);
    sendTrackToApi(trackEntry);
    updateDashboard();
    updateTrackCards();
    triggerCelebration();
    closeTrackModal();
}

// Analyze with HINA
async function analyzeWithHina() {
    playClickSound();
    const response = await sendAnalyzeRequest();
    homdata.track[homdata.track.length - 1] = homdata.track[homdata.track.length - 1] || {};
    homdata.track[homdata.track.length - 1].analysis = response;
    document.getElementById('analyze-response').textContent = response;
    document.getElementById('analyzeModal').classList.add('active');
    updateDashboard();
    triggerCelebration();
}

// View tracking
function viewTracking(index) {
    playClickSound();
    const track = fakeTracks.concat(homdata.track)[index];
    document.getElementById('view-mood').textContent = `Mood: ${track.mood.charAt(0).toUpperCase() + track.mood.slice(1)}`;
    document.getElementById('view-bad-habits').textContent = `Bad Habits: ${track.badHabits.join(', ') || 'None'}`;
    document.getElementById('view-good-habits').textContent = `Good Habits: ${track.goodHabits.join(', ') || 'None'}`;
    document.getElementById('view-works').textContent = `Works: ${track.works.join(', ') || 'None'}`;
    document.getElementById('view-focus').textContent = `Focus: ${track.focus.join(', ') || 'None'}`;
    document.getElementById('view-distractions').textContent = `Distractions: ${track.distractions.join(', ') || 'None'}`;
    document.getElementById('view-work-on').textContent = `What to Work On: ${track.workOn.join(', ') || 'None'}`;
    document.getElementById('view-avoid').textContent = `What to Avoid: ${track.avoid.join(', ') || 'None'}`;
    document.getElementById('view-summary').textContent = `Summary: ${track.summary || 'None'}`;
    document.getElementById('viewModal').classList.add('active');
}

// Close view modal
function closeViewModal() {
    playClickSound();
    document.getElementById('viewModal').classList.remove('active');
}

// Close analyze modal
function closeAnalyzeModal() {
    playClickSound();
    document.getElementById('analyzeModal').classList.remove('active');
}

// Initialize
initializeTracking();