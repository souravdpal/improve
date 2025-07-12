let username = localStorage.getItem('username') || 'Guest';
const clickSound = new Audio('/sounds/click');
const completeSound = new Audio('s');

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

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: Math.random() * 8 + 3,
            color: ['#0288d1', '#26a69a', '#2e7d32', '#0288d1', '#ff6b6b'][Math.floor(Math.random() * 5)],
            speed: Math.random() * 7 + 3,
            angle: Math.random() * Math.PI * 2,
            opacity: 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let hasVisibleParticles = false;
        particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.speed *= 0.96;
            p.opacity *= 0.97;
            p.radius *= 0.97;
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

        if (hasVisibleParticles) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }

    animate();
    playCompleteSound();
}

const chatSession = {
    user: { name: username },
    mode: 'therapy',
    messages: []
};

function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'therapy',
        user: decodeURIComponent(path[3] || username)
    };
}

function initializeChat() {
    const { mode, user } = getUrlParams();
    chatSession.mode = mode;
    chatSession.user.name = user;
    const input = document.getElementById('message-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    } else {
        console.error('Message input element not found');
    }

    addMessage('HINA', `Hello, **${user}**! I'm **HINA**, your AI therapist. How can I **help** you today?`, true);
}

async function addMessage(sender, text, isHina = false, isLoading = false) {
    const messages = document.getElementById('chat-messages');
    if (!messages) {
        console.error('Chat messages container not found');
        return null;
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isHina ? 'hina' : isLoading ? 'loading' : 'user'}`;
    const p = document.createElement('p');
    if (isLoading) {
        const dots = document.createElement('div');
        dots.className = 'loading-dots';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'loading-dot';
            dot.textContent = '.';
            dots.appendChild(dot);
        }
        p.appendChild(dots);
    } else {
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        p.innerHTML = formattedText;
    }
    messageDiv.appendChild(p);
    if (!isLoading) {
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timestamp);
    }
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;

    if (isHina && !isLoading) {
        const tokens = p.innerHTML.split(/(\s+)/).filter(Boolean);
        p.innerHTML = '';
        for (let i = 0; i < tokens.length; i++) {
            const span = document.createElement('span');
            span.style.opacity = '0';
            span.innerHTML = tokens[i];
            p.appendChild(span);
            await new Promise(resolve => setTimeout(resolve, 50));
            span.style.animation = 'tokenFade 0.3s forwards';
        }
    }

    if (!isHina && !isLoading) {
        chatSession.messages.push({
            sender,
            text,
            timestamp: new Date().toISOString(),
            mode: chatSession.mode
        });
        triggerCelebration();
    }
    return messageDiv;
}

async function sendToApi() {
    const loadingMessage = await addMessage('HINA', '', true, true);
    try {
        const response = await fetch('/home/u', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: { name: chatSession.user.name },
                mode: "therapy",
                messages: chatSession.messages.slice(-1)
            })
        });

        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
        const data = await response.json();
        loadingMessage.remove();
        return data.response.response || `I'm **here** to help, **${chatSession.user.name}**! What's on your **mind**?`;
    } catch (error) {
        console.error('API error:', error);
        loadingMessage.remove();
        return `I'm **here** to help, **${chatSession.user.name}**. How can I **support** you today?`;
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    playClickSound();
    await addMessage(chatSession.user.name, text);
    input.value = '';
    if (recognition) {
        recognition.stop();
        recognition = null;
        input.placeholder = 'Talk to HINA...';
    }

    const response = await sendToApi();
    await addMessage('HINA', response, true);
}

let recognition = null;

function toggleMic() {
    playClickSound();
    const input = document.getElementById('message-input');
    if (!input) return;

    if (!recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            input.placeholder = 'Speech recognition not supported';
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            input.placeholder = 'Listening...';
            input.value = '';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            input.value = finalTranscript + interimTranscript;
        };

        recognition.onend = () => {
            recognition = null;
            input.placeholder = 'Talk to HINA...';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            recognition.stop();
            recognition = null;
            input.placeholder = 'Mic error, try typing...';
        };

        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            recognition = null;
            input.placeholder = 'Mic error, try typing...';
        }
    } else {
        recognition.stop();
        recognition = null;
        input.placeholder = 'Talk to HINA...';
    }
}

function toggleTheme() {
    playClickSound();
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    initializeChat();
});