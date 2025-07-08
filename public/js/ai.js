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
    messages: [] // New array for chat messages
};

// Audio for click and completion sounds
const clickSound = new Audio('/sounds/click');
const completeSound = new Audio('/sounds/checkworkif');

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
        return await response.json(); // Expect AI response
    } catch (error) {
        // Suppress API error logging
        return { response: `I'm here to help, ${homdata.user.name}. How can I support you?` }; // Mock response
    }
}

// Get URL parameters
function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'therapy',
        user: decodeURIComponent(path[3] || 'Guest')
    };
}

// Initialize chat
function initializeChat() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    // Initial greeting from HINA
    addMessage('HINA', `Hello, ${user}! I'm HINA, your AI therapist. How can I assist you today?`, true);
}

// Add message to chat
function addMessage(sender, text, isHina = false) {
    const messages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isHina ? 'hina' : 'user'}`;
    messageDiv.innerHTML = `
        <p>${text}</p>
        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    `;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    if (!isHina) {
        homdata.messages.push({ sender, text, timestamp: new Date().toISOString(), mode: homdata.mode });
        triggerCelebration();
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;
    playClickSound();
    addMessage(homdata.user.name, text);
    input.value = '';
    const response = await sendToApi();
    addMessage('HINA', response.response, true);
    triggerCelebration();
}

// Voice input
let recognition = null;
function toggleMic() {
    playClickSound();
    const input = document.getElementById('message-input');
    if (!recognition) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            input.value = transcript;
            if (event.results[0].isFinal) {
                sendMessage();
                recognition.stop();
                recognition = null;
            }
        };
        recognition.onerror = () => {
            recognition.stop();
            recognition = null;
            input.placeholder = 'Mic error, try typing...';
        };
        recognition.start();
        input.placeholder = 'Listening...';
    } else {
        recognition.stop();
        recognition = null;
        input.placeholder = 'Talk to HINA...';
    }
}

// Initialize
initializeChat();