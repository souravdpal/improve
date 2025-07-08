// UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
    track: [],
    friends: [
        {
            id: 'default-hina',
            name: 'HINA',
            gender: 'female',
            behavior: 'Empathetic, supportive',
            works: 'Therapist'
        }
    ],
    selectedFriend: 'default-hina'
};

// Audio for click and completion sounds
const clickSound = new Audio('/sounds/click.mp3');
const completeSound = new Audio('/sounds/fun.mp3');

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
            color: ['#ff6f61', '#a3e4d7', '#ff8a65'][Math.floor(Math.random() * 3)],
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

// Send friend data to /ai/save/:id/:username
async function sendFriendToApi(friend) {
    try {
        const response = await fetch(`/ai/save/${friend.id}/${homdata.user.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(friend)
        });
        if (!response.ok) throw new Error('Friend save API request failed');
        console.log('Friend sent to /ai/save:', friend);
    } catch (error) {
        // Suppress API error logging
    }
}

// Fetch friends from /ai/show/:username
async function fetchFriends() {
    try {
        const response = await fetch(`/ai/show/${homdata.user.name}`);
        if (!response.ok) throw new Error('Fetch friends API request failed');
        const friends = await response.json();
        homdata.friends = friends;
    } catch (error) {
        // Mock friends data
        homdata.friends = [
            {
                id: 'default-hina',
                name: 'HINA',
                gender: 'female',
                behavior: 'Empathetic, supportive',
                works: 'Therapist'
            },
            {
                id: 'mock1',
                name: 'Alex',
                gender: 'male',
                behavior: 'Witty, motivational',
                works: 'Coach'
            },
            {
                id: 'mock2',
                name: 'Luna',
                gender: 'female',
                behavior: 'Calm, insightful',
                works: 'Counselor'
            }
        ];
    }
}

// Send chat message to /ai/f/data
async function sendMessageToApi(text, friendId) {
    try {
        const response = await fetch(`/ai/f/data?username=${homdata.user.name}&character=${friendId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error('Chat API request failed');
        const data = await response.json();
        return data.response;
    } catch (error) {
        // Mock chat response
        const friend = homdata.friends.find(f => f.id === friendId);
        return `${friend.name}: Hey ${homdata.user.name}, you said "${text}". I'm here to help! How about we discuss your goals?`;
    }
}

// Get URL parameters
function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'talk',
        user: decodeURIComponent(path[3] || 'Guest')
    };
}

// Initialize talk page
async function initializeTalk() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    await fetchFriends();
    updateFriendScroll();
    updateChatBox();
}

// Update friend scroll bar
function updateFriendScroll() {
    const friendScroll = document.getElementById('friend-scroll');
    friendScroll.innerHTML = homdata.friends.map(f => `
        <div class="friend-card ${f.id === homdata.selectedFriend ? 'selected' : ''}" onclick="selectFriend('${f.id}')">
            <p>${f.name}</p>
        </div>
    `).join('');
}

// Update chat box
function updateChatBox() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = homdata.messages
        .filter(m => m.friendId === homdata.selectedFriend)
        .map(m => `
            <div class="chat-message ${m.sender === 'user' ? 'user' : 'ai'}">
                <p><strong>${m.sender === 'user' ? 'You' : homdata.friends.find(f => f.id === m.friendId).name}</strong>: ${m.text}</p>
            </div>
        `).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Open friend modal
function openFriendModal() {
    playClickSound();
    document.getElementById('friendModal').classList.add('active');
    document.getElementById('friend-name').value = '';
    document.getElementById('friend-gender').value = 'female';
    document.getElementById('friend-behavior').value = '';
    document.getElementById('friend-works').value = '';
}

// Close friend modal
function closeFriendModal() {
    playClickSound();
    document.getElementById('friendModal').classList.remove('active');
}

// Save friend
async function saveFriend() {
    playClickSound();
    const name = document.getElementById('friend-name').value.trim();
    const gender = document.getElementById('friend-gender').value;
    const behavior = document.getElementById('friend-behavior').value.trim();
    const works = document.getElementById('friend-works').value.trim();
    if (!name || !behavior || !works) return;
    const friend = {
        id: generateUUID(),
        name,
        gender,
        behavior,
        works
    };
    homdata.friends.push(friend);
    await sendFriendToApi(friend);
    updateFriendScroll();
    triggerCelebration();
    closeFriendModal();
}

// Select friend
function selectFriend(friendId) {
    playClickSound();
    homdata.selectedFriend = friendId;
    updateFriendScroll();
    updateChatBox();
}

// View friend details
function viewFriend(friendId) {
    playClickSound();
    const friend = homdata.friends.find(f => f.id === friendId);
    document.getElementById('view-name').textContent = `Name: ${friend.name}`;
    document.getElementById('view-gender').textContent = `Gender: ${friend.gender.charAt(0).toUpperCase() + friend.gender.slice(1)}`;
    document.getElementById('view-behavior').textContent = `Behavior: ${friend.behavior}`;
    document.getElementById('view-works').textContent = `Works: ${friend.works}`;
    document.getElementById('viewModal').classList.add('active');
}

// Close view modal
function closeViewModal() {
    playClickSound();
    document.getElementById('viewModal').classList.remove('active');
}

// Send chat message
async function sendMessage() {
    playClickSound();
    const text = document.getElementById('chat-message').value.trim();
    if (!text) return;
    homdata.messages.push({
        sender: 'user',
        text,
        friendId: homdata.selectedFriend,
        timestamp: new Date().toISOString()
    });
    document.getElementById('chat-message').value = '';
    updateChatBox();
    const response = await sendMessageToApi(text, homdata.selectedFriend);
    homdata.messages.push({
        sender: 'ai',
        text: response,
        friendId: homdata.selectedFriend,
        timestamp: new Date().toISOString()
    });
    updateChatBox();
}

// Initialize
initializeTalk();