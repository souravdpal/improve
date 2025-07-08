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
    messages: []
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
    playCompleteSound();
}

// Send journal data to /data/journal
async function sendJournalToApi(journalEntry) {
    try {
        const response = await fetch('/data/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: homdata.user.name, journal: journalEntry })
        });
        if (!response.ok) throw new Error('Journal API request failed');
        console.log('Journal sent to /data/journal:', journalEntry);
    } catch (error) {
        // Suppress API error logging
    }
}

// Send AI request to /ai/journal/:user
async function sendAIRequest(summary, answers) {
    try {
        const response = await fetch(`/ai/journal/${homdata.user.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary, answers, mode: 'journal' })
        });
        if (!response.ok) throw new Error('AI request failed');
        const data = await response.json();
        return data.response;
    } catch (error) {
        // Mock AI response
        return `HINA: Based on your input "${summary}", here's a journal entry: Today was a reflective day. You worked on your goals and faced some challenges. Keep going, ${homdata.user.name}!`;
    }
}

// Get URL parameters
function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'journal',
        user: decodeURIComponent(path[3] || 'Guest')
    };
}

// Initialize journal
function initializeJournal() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    updateJournalCards();
}

// Fake journal data
const fakeJournals = [
    {
        text: 'Today was a productive day. I completed my tasks and felt accomplished.',
        answers: {
            q1: 'I got frustrated at a colleague, wish I stayed calm.',
            q2: 'Improved my time management by setting timers.',
            q3: 'Proud of finishing my project early.'
        },
        timestamp: new Date('2025-07-07T10:00:00Z').toISOString()
    },
    {
        text: 'Felt a bit stressed but took time to meditate.',
        answers: {
            q1: 'I skipped my workout, wish I hadn’t.',
            q2: 'Better at saying no to distractions.',
            q3: 'Proud of helping a friend today.'
        },
        timestamp: new Date('2025-07-06T15:00:00Z').toISOString()
    }
];

// Update journal cards
function updateJournalCards() {
    const journalCards = document.getElementById('journal-cards');
    journalCards.innerHTML = fakeJournals.concat(homdata.journal).map((j, i) => `
        <div class="card clickable" onclick="viewJournal(${i})">
            <p>${new Date(j.timestamp).toLocaleDateString()} - ${j.text.substring(0, 50)}...</p>
        </div>
    `).join('');
}

// Open journal modal
function openJournalModal() {
    playClickSound();
    document.getElementById('journalModal').classList.add('active');
    document.getElementById('journal-text').value = '';
    document.getElementById('reflective-questions').style.display = 'none';
}

// Close journal modal
function closeJournalModal() {
    playClickSound();
    document.getElementById('journalModal').classList.remove('active');
}

// Open AI modal
function askAI() {
    playClickSound();
    document.getElementById('journalModal').classList.remove('active');
    document.getElementById('aiModal').classList.add('active');
    document.getElementById('ai-summary').value = '';
    document.getElementById('ai-q1').value = '';
    document.getElementById('ai-q2').value = '';
    document.getElementById('ai-q3').value = '';
}

// Close AI modal
function closeAIModal() {
    playClickSound();
    document.getElementById('aiModal').classList.remove('active');
}

// Submit AI request
async function submitAIRequest() {
    playClickSound();
    const summary = document.getElementById('ai-summary').value.trim();
    const answers = {
        q1: document.getElementById('ai-q1').value.trim(),
        q2: document.getElementById('ai-q2').value.trim(),
        q3: document.getElementById('ai-q3').value.trim()
    };
    if (!summary) return;
    const response = await sendAIRequest(summary, answers);
    document.getElementById('aiModal').classList.remove('active');
    document.getElementById('journalModal').classList.add('active');
    document.getElementById('journal-text').value = response;
    document.getElementById('reflective-questions').style.display = 'block';
    document.getElementById('q1').value = answers.q1;
    document.getElementById('q2').value = answers.q2;
    document.getElementById('q3').value = answers.q3;
}

// Save journal
function saveJournal() {
    playClickSound();
    const text = document.getElementById('journal-text').value.trim();
    if (!text) return;
    const answers = {
        q1: document.getElementById('q1').value.trim(),
        q2: document.getElementById('q2').value.trim(),
        q3: document.getElementById('q3').value.trim()
    };
    const journalEntry = {
        text,
        answers,
        timestamp: new Date().toISOString()
    };
    homdata.journal.push(journalEntry);
    sendJournalToApi(journalEntry);
    updateJournalCards();
    triggerCelebration();
    closeJournalModal();
}

// View journal
function viewJournal(index) {
    playClickSound();
    const journal = fakeJournals.concat(homdata.journal)[index];
    document.getElementById('view-text').textContent = journal.text;
    document.getElementById('view-q1').textContent = `Q: What bad thing did you do today you wish could be reversed? A: ${journal.answers.q1 || 'N/A'}`;
    document.getElementById('view-q2').textContent = `Q: What did you improve today? A: ${journal.answers.q2 || 'N/A'}`;
    document.getElementById('view-q3').textContent = `Q: What are you proud of today? A: ${journal.answers.q3 || 'N/A'}`;
    document.getElementById('viewModal').classList.add('active');
}

// Close view modal
function closeViewModal() {
    playClickSound();
    document.getElementById('viewModal').classList.remove('active');
}

// Initialize
initializeJournal();