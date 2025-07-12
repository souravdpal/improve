const uname = localStorage.getItem('username');


if (!uname) {
    alert('Please login to get started');
    localStorage.clear();
    window.location.href = '/login.html';
    throw new Error('No username found');
}

let homdata = {
    user: {
        name: uname,
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

const clickSound = new Audio('/sounds/click');
const completeSound = new Audio('/sounds/fun');

function playClickSound() {
    clickSound.play().catch(() => console.log('Click sound failed'));
}

function playCompleteSound() {
    completeSound.play().catch(() => console.log('Complete sound failed'));
}

function triggerCelebration() {
    const canvas = document.getElementById('celebration');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: Math.random() * 5 + 2,
            color: ['#000000', '#ffffff', '#cccccc'][Math.floor(Math.random() * 3)],
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
            p.speed *= 0.97;
            p.opacity *= 0.98;
            p.radius *= 0.99;
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

async function sendJournalToApi(journalEntry) {
    try {
        const response = await fetch('/home/data/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uname, journal: journalEntry })
        });
        if (!response.ok) throw new Error('Journal API request failed');
        console.log('Journal sent:', journalEntry);
    } catch (error) {
        console.error('Error sending journal to API:', error);
    }
}

async function deleteJournalFromApi(index) {
    try {
        const response = await fetch('/home/data/journal', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uname, index: index })
        });
        if (!response.ok) throw new Error('Delete journal failed');
        console.log('Journal deleted:', index);
    } catch (error) {
        console.error('Error deleting journal from API:', error);
    }
}

async function deleteAllJournalsFromApi() {
    try {
        const response = await fetch('/home/data/journal/all', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: uname })
        });
        if (!response.ok) throw new Error('Delete all journals failed');
        console.log('All journals deleted');
        homdata.journal = [];
        updateJournalCards();
    } catch (error) {
        console.error('Error deleting all journals from API:', error);
    }
}

async function sendAIRequest(summary, answers) {
    try {
        const response = await fetch(`/ai/journal/${uname}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary, answers, mode: 'journal' })
        });
        if (!response.ok) throw new Error('AI request failed');
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI request failed, using mock response:', error);
        return `HINA: Today was a reflective day, ${homdata.user.name}. You worked on your goals and faced some challenges. Keep going!`;
    }
}

function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'journal',
        user: decodeURIComponent(path[3] || uname)
    };
}

async function fetchJournalData() {
    try {
        const response = await fetch('/home/data/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: uname })
        });
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        homdata.journal = data.journal || [];
        updateJournalCards();
    } catch (error) {
        console.error('Error fetching journal data:', error);
        updateJournalCards();
    }
}

function updateJournalCards() {
    const journalCards = document.getElementById('journal-cards');
    if (journalCards) {
        journalCards.innerHTML = homdata.journal.length > 0
            ? homdata.journal.map((j, i) => `
                <div class="card" data-index="${i}">
                    <p><strong>${new Date(j.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong><br>${j.text.substring(0, 100)}...</p>
                    <button class="delete-btn" onclick="deleteJournal(${i}, event)"><i class="fas fa-trash"></i></button>
                </div>
            `).join('')
            : '<div class="card empty-card"><p>No entries yet. Start writing!</p></div>';
    }
    journalCards.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card && !e.target.closest('.delete-btn')) {
            const index = card.getAttribute('data-index');
            if (index !== null) viewJournal(index);
        }
    });
}

function openJournalModal() {
    playClickSound();
    const journalModal = document.getElementById('journalModal');
    if (journalModal) {
        journalModal.classList.add('active');
        document.body.classList.add('modal-open');
        document.getElementById('journal-text').value = '';
        document.getElementById('reflective-questions').style.display = 'none';
    }
}

function closeJournalModal() {
    playClickSound();
    const journalModal = document.getElementById('journalModal');
    if (journalModal) {
        journalModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

function askAI() {
    playClickSound();
    document.getElementById('journalModal').classList.remove('active');
    const aiModal = document.getElementById('aiModal');
    if (aiModal) {
        aiModal.classList.add('active');
        document.body.classList.add('modal-open');
        document.getElementById('ai-summary').value = '';
        document.getElementById('ai-q1').value = '';
        document.getElementById('ai-q2').value = '';
        document.getElementById('ai-q3').value = '';
    }
}

function closeAIModal() {
    playClickSound();
    const aiModal = document.getElementById('aiModal');
    if (aiModal) {
        aiModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

async function submitAIRequest() {
    playClickSound();
    const summary = document.getElementById('ai-summary').value.trim();
    const answers = {
        q1: document.getElementById('ai-q1').value.trim(),
        q2: document.getElementById('ai-q2').value.trim(),
        q3: document.getElementById('ai-q3').value.trim()
    };
    if (!summary) {
        alert('Please provide a summary.');
        return;
    }
    const loading = document.createElement('div');
    loading.className = 'ai-loading active';
    loading.innerHTML = '<div class="loader"></div><p style="color: var(--text-color);">Crafting your entry...</p>';
    document.body.appendChild(loading);

    const response = await sendAIRequest(summary, answers);

    loading.remove();
    closeAIModal();
    document.getElementById('journalModal').classList.add('active');
    document.getElementById('journal-text').value = response;
    document.getElementById('reflective-questions').style.display = Object.values(answers).some(v => v) ? 'block' : 'none';
    document.getElementById('q1').value = answers.q1;
    document.getElementById('q2').value = answers.q2;
    document.getElementById('q3').value = answers.q3;
}

function saveJournal() {
    playClickSound();
    const text = document.getElementById('journal-text').value.trim();
    if (!text) {
        alert('Please enter a journal entry.');
        return;
    }
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

function viewJournal(index) {
    playClickSound();
    const journal = homdata.journal[index];
    const viewModal = document.getElementById('viewModal');
    if (viewModal) {
        document.getElementById('view-text').textContent = journal.text;
        const reflections = document.getElementById('view-reflections');
        reflections.innerHTML = '';
        if (Object.values(journal.answers).some(v => v)) {
            reflections.style.display = 'block';
            reflections.innerHTML = `
                ${journal.answers.q1 ? `<p><strong>What regret do you have?</strong> ${journal.answers.q1}</p>` : ''}
                ${journal.answers.q2 ? `<p><strong>What progress did you make?</strong> ${journal.answers.q2}</p>` : ''}
                ${journal.answers.q3 ? `<p><strong>What are you proud of?</strong> ${journal.answers.q3}</p>` : ''}
            `;
        } else {
            reflections.style.display = 'none';
        }
        viewModal.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

function closeViewModal() {
    playClickSound();
    const viewModal = document.getElementById('viewModal');
    if (viewModal) {
        viewModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

async function deleteJournal(index, event) {
    event.stopPropagation();
    playClickSound();
    if (confirm('Are you sure you want to delete this entry?')) {
        homdata.journal.splice(index, 1);
        await deleteJournalFromApi(index);
        updateJournalCards();
    }
}

function confirmDeleteAll() {
    playClickSound();
    const confirmModal = document.getElementById('confirmDeleteAllModal');
    if (confirmModal) {
        confirmModal.classList.add('active');
        document.body.classList.add('modal-open');
        document.getElementById('confirmUsername').value = '';
    }
}

function closeConfirmDeleteAllModal() {
    playClickSound();
    const confirmModal = document.getElementById('confirmDeleteAllModal');
    if (confirmModal) {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

async function deleteAllJournals() {
    playClickSound();
    const confirmUsername = document.getElementById('confirmUsername').value.trim();
    if (confirmUsername !== uname) {
        alert('Username does not match.');
        return;
    }
    if (confirm('This will delete all journals permanently. Proceed?')) {
        await deleteAllJournalsFromApi();
        closeConfirmDeleteAllModal();
    }
}

function goBack() {
    playClickSound();
    window.location.href = `/home/hi/${localStorage.getItem('name')}`;
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    homdata.settings.darkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', homdata.settings.darkMode);
    document.getElementById('themeToggle').textContent = homdata.settings.darkMode ? '☀️' : '🌙';
}

async function initializeJournal() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
    await fetchJournalData();
}

(async () => {
    try {
        await initializeJournal();
        document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
        const openJournalBtn = document.getElementById('openJournalBtn');
        if (openJournalBtn) openJournalBtn.addEventListener('click', openJournalModal);
        const saveJournalBtn = document.getElementById('saveJournal');
        if (saveJournalBtn) saveJournalBtn.addEventListener('click', saveJournal);
        const closeJournalBtn = document.getElementById('closeJournal');
        if (closeJournalBtn) closeJournalBtn.addEventListener('click', closeJournalModal);
        const askAIBtn = document.getElementById('askAI');
        if (askAIBtn) askAIBtn.addEventListener('click', askAI);
        const submitAIBtn = document.getElementById('submitAI');
        if (submitAIBtn) submitAIBtn.addEventListener('click', submitAIRequest);
        const closeAIBtn = document.getElementById('closeAI');
        if (closeAIBtn) closeAIBtn.addEventListener('click', closeAIModal);
        const closeViewBtn = document.getElementById('closeView');
        if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if (deleteAllBtn) deleteAllBtn.addEventListener('click', confirmDeleteAll);
    } catch (error) {
        console.error('Initialization error:', error);
        alert('An error occurred. Please try again.');
        window.location.href = '/login.html';
    }
})();