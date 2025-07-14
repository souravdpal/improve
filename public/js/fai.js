

// UUID generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let getid = generateUUID();

// Audio setup
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

// Card placeholder
let Card = {};

// API: Send friend data to /ai/save
async function sendFriendToApi(friend) {
    try {
        const response = await fetch(`/ai/save/${getid}/${localStorage.getItem('username')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(friend)
        });
        if (!response.ok) throw new Error('Friend save API request failed');
        console.log('Friend sent to /ai/save:', friend);
    } catch (error) {
        // Silent fail
    }
}

// API: Fetch friends (adjusted for new structure)
async function fetchFriends() {
    try {
        const response = await fetch(`/ai/save/${localStorage.getItem("username")}`);
        if (!response.ok) throw new Error('Fetch friends API request failed');
        const raw = await response.json();

        console.log("RAW CHAR DATA:", raw.char);

        if (Array.isArray(raw.char)) {
            homdata.friends = raw.char.map(f => ({
                id: f.CharId,
                name: f.name,
                gender: f.gender || 'unknown',
                behavior: f.behavior || '',
                works: f.works || '',
                memo: f.memo || ''
            }));
        } else if (typeof raw.char === 'object') {
            homdata.friends = [{
                id: raw.char.CharId,
                name: raw.char.name,
                gender: raw.char.gender || 'unknown',
                behavior: raw.char.behavior || '',
                works: raw.char.works || '',
                memo: raw.char.memo || ''
            }];
        } else {
            homdata.friends = [];
        }
    } catch (error) {
        console.error('Fetch friend error:', error);
        let fr = {
            id : generateUUID(),
            name :"Hina",
            gender :"Female",
            behavior: "Witty , cute , shy , sweet , loving , caring , freindly, and blushing and beutiful",
            work : "hina is a freind where she and both you are collage freinds",
            memo : null
        }
        sendFriendToApi(fr)
    }
}

// API: Send message to /ai/f/data
async function sendMessageToApi(text, friendId) {
    try {
        const friend = homdata.friends.find(f => f.id === friendId);
        const response = await fetch(`/ai/f/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: homdata.user.name,
                CharId: friend.id,
                name: friend.name,
                text: text
            })
        });

        if (!response.ok) throw new Error('Chat API request failed');
        const data = await response.json();
        console.log(data)
        return data.response.response || '...';
    } catch (error) {
        const friend = homdata.friends.find(f => f.id === friendId);
        return `${friend.name}: I'm sorry, something went wrong. Let's try again.`;
    }
}

// Get URL params
function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'talk',
        user: decodeURIComponent(path[3] || 'Guest')
    };
}

// Init
async function initializeTalk() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    await fetchFriends();
    updateFriendScroll();
    updateChatBox();
}

// Friend list UI
function updateFriendScroll() {
    const friendScroll = document.getElementById('friend-scroll');
    friendScroll.innerHTML = homdata.friends.map(f => `
        <div class="friend-card ${f.id === homdata.selectedFriend ? 'selected' : ''}" onclick="selectFriend('${f.id}')">
            <p>${f.name}</p>
        </div>
    `).join('');
}

// Chat UI
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

// Modal controls
function openFriendModal() {
    playClickSound();
    document.getElementById('friendModal').classList.add('active');
    document.getElementById('friend-name').value = '';
    document.getElementById('friend-gender').value = 'female';
    document.getElementById('friend-behavior').value = '';
    document.getElementById('friend-works').value = '';
    document.getElementById('friend-memo').value = '';
}

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
    const memo = document.getElementById('friend-memo').value.trim();

    if (!name || !behavior || !works) return;

    const friend = {
        id: generateUUID(),
        name,
        gender,
        behavior,
        works,
        memo
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
    document.getElementById('view-gender').textContent = `Gender: ${friend.gender}`;
    document.getElementById('view-behavior').textContent = `Behavior: ${friend.behavior}`;
    document.getElementById('view-works').textContent = `Works: ${friend.works}`;
    document.getElementById('view-memo').textContent = `Memo: ${friend.memo || '-'}`;
    document.getElementById('viewModal').classList.add('active');
}

function closeViewModal() {
    playClickSound();
    document.getElementById('viewModal').classList.remove('active');
}

// Send message
async function sendMessage() {
    playClickSound();
    const input = document.getElementById('chat-message');
    const text = input.value.trim();
    if (!text || !homdata.selectedFriend) return;

    homdata.messages.push({ sender: 'user', text, friendId: homdata.selectedFriend });
    input.value = '';
    updateChatBox();

    const aiResponse = await sendMessageToApi(text, homdata.selectedFriend);
    homdata.messages.push({ sender: 'ai', text: aiResponse, friendId: homdata.selectedFriend });
    updateChatBox();
}

// Global app state
let homdata = {
    user: { name: '' },
    mode: '',
    messages: [],
    friends: [],
    selectedFriend: null
};

// Initialize
initializeTalk();

// Expose globally for inline onclick handlers
window.openFriendModal = openFriendModal;
window.closeFriendModal = closeFriendModal;
window.saveFriend = saveFriend;
window.sendMessage = sendMessage;
window.selectFriend = selectFriend;
window.viewFriend = viewFriend;
window.closeViewModal = closeViewModal;
