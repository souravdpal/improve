const homdata = {
    user: { name: '', profile: {} },
    mode: 'talk',
    messages: [],
    friends: [],
    selectedFriend: null
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function triggerCelebration() {
    const canvas = document.createElement('canvas');
    canvas.id = 'celebration';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '2000';
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: Math.random() * 8 + 4,
            color: ['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
            speed: Math.random() * 7 + 4,
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

        frame++;
        if (frame < 180 && hasVisibleParticles) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    animate();
}

async function fetchUserData() {
    try {
        const response = await fetch('/data/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: homdata.user.name })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Fetch user data failed: ${response.status} - ${error}`);
        }
        const data = await response.json();
        homdata.user.profile = data.user || {};
        console.log('User data fetched:', homdata.user.profile);
    } catch (error) {
        console.error('Fetch user data error:', error);
        alert('Failed to load user data. Using default profile.');
        homdata.user.profile = { name: homdata.user.name, streak: 0, currentMood: 'Not set', goal: 'None' };
    }
}

async function sendFriendToApi(friend) {
    try {
        const response = await fetch(`/save/${friend.id}/${homdata.user.name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(friend)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Friend save failed');
        }
        triggerCelebration();
        return true;
    } catch (error) {
        console.error('Friend save error:', error);
        alert(`Failed to save friend: ${error.message}`);
        return false;
    }
}

async function fetchFriends() {
    try {
        const response = await fetch(`/save/${homdata.user.name}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch friends failed:', response.status, errorText);
            throw new Error(`Fetch friends failed: ${response.status}`);
        }
        const raw = await response.json();

        homdata.friends = Array.isArray(raw.char)
            ? raw.char.map(f => ({
                id: f.CharId,
                name: f.name,
                gender: f.chargender || 'unspecified',
                behavior: f.charbehave || '',
                work: f.charWork || '',
                memo: f.charknow || ''
            }))
            : [{
                id: raw.char.CharId,
                name: raw.char.name,
                gender: raw.char.chargender || 'unspecified',
                behavior: raw.char.charbehave || '',
                work: f.charWork || '',
                memo: raw.char.charknow || ''
            }];

        if (!homdata.friends.length) {
            const defaultFriend = {
                id: generateUUID(),
                name: "Hina",
                gender: "female",
                behavior: "Witty, cute, shy, sweet, loving, caring, friendly, blushing, beautiful",
                work: "College friend",
                memo: null
            };
            homdata.friends.push(defaultFriend);
            await sendFriendToApi(defaultFriend);
        }
        updateFriendScroll();
    } catch (error) {
        console.error('Fetch friends error:', error);
        alert('Failed to load friends. Using default friend.');
        const defaultFriend = {
            id: generateUUID(),
            name: "Hina",
            gender: "female",
            behavior: "Witty, cute, shy, sweet, loving, caring, friendly, blushing, beautiful",
            work: "College friend",
            memo: null
        };
        homdata.friends.push(defaultFriend);
        await sendFriendToApi(defaultFriend);
        updateFriendScroll();
    }
}

async function sendMessageToApi(text, friendId) {
    try {
        const friend = homdata.friends.find(f => f.id === friendId);
        if (!friend) throw new Error('Friend not found');

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        document.getElementById('chat-messages').appendChild(typingIndicator);

        const response = await fetch(`/f/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: homdata.user.name,
                CharId: friend.id,
                name: friend.name,
                text: text
            })
        });

        typingIndicator.remove();
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Chat API failed');
        }
        const data = await response.json();
        return data.response.response || '...';
    } catch (error) {
        console.error('Send message error:', error);
        const friend = homdata.friends.find(f => f.id === friendId);
        return `${friend ? friend.name : 'Friend'}: I'm sorry, something went wrong. Let's try again.`;
    }
}

async function sendTherapyMessage(text) {
    try {
        const response = await fetch('/u', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: { name: homdata.user.name },
                mode: 'therapy',
                messages: [{ text }]
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.response || 'Therapy API failed');
        }
        const data = await response.json();
        return data.response.response || 'Thank you for sharing. How can I assist you further?';
    } catch (error) {
        console.error('Therapy message error:', error);
        return 'Therapist: Sorry, something went wrong. Please try again.';
    }
}

function getUrlParams() {
    const path = window.location.pathname.split('/');
    return {
        mode: path[2] || 'talk',
        user: decodeURIComponent(path[3] || 'testuser')
    };
}

async function initializeTalk() {
    const { mode, user } = getUrlParams();
    homdata.user.name = user;
    homdata.mode = mode;
    localStorage.setItem('username', user);
    await fetchUserData();
    await fetchFriends();

    const savedFriendId = localStorage.getItem('selectedFriend');
    if (savedFriendId && homdata.friends.find(f => f.id === savedFriendId)) {
        homdata.selectedFriend = savedFriendId;
    } else if (homdata.friends.length > 0) {
        homdata.selectedFriend = homdata.friends[0].id;
        localStorage.setItem('selectedFriend', homdata.selectedFriend);
    }

    updateFriendScroll();
    updateChatBox();
    setupEventListeners();
}

function updateFriendScroll() {
    const friendList = document.getElementById('friend-list');
    friendList.innerHTML = homdata.friends.map(f => `
        <div class="friend-item ${f.id === homdata.selectedFriend ? 'selected' : ''}" data-friend-id="${f.id}">
            ${f.name}
        </div>
    `).join('');
}

function updateChatBox() {
    const chatBox = document.getElementById('chat-messages');
    const friend = homdata.friends.find(f => f.id === homdata.selectedFriend);
    document.getElementById('chat-header').textContent = friend ? `Chatting with ${friend.name}` : 'Select a friend to start chatting!';

    chatBox.innerHTML = homdata.messages
        .filter(m => m.friendId === homdata.selectedFriend)
        .map(m => `
            <div class="chat-message ${m.sender === 'user' ? 'user' : 'ai'}">
                <div class="message-content">
                    <p><strong>${m.sender === 'user' ? 'You' : homdata.friends.find(f => f.id === m.friendId).name}</strong>: ${m.text}</p>
                    <div class="timestamp">${new Date(m.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showAllFriends() {
    const friendsList = document.getElementById('friends-list-content');
    friendsList.innerHTML = homdata.friends.map(f => `
        <div class="friend-list-item" data-friend-id="${f.id}">
            <p><strong>${f.name}</strong> (${f.gender}) - ${f.work}</p>
        </div>
    `).join('');
    document.getElementById('friends-list-popup').style.display = 'flex';
}

function showFriendDetails(friendId) {
    const friend = homdata.friends.find(f => f.id === friendId);
    const detailsContent = document.getElementById('friend-details-content');
    detailsContent.innerHTML = `
        <p><strong>Name:</strong> ${friend.name}</p>
        <p><strong>Gender:</strong> ${friend.gender}</p>
        <p><strong>Behavior:</strong> ${friend.behavior || '-'}</p>
        <p><strong>Occupation:</strong> ${friend.work || '-'}</p>
        <p><strong>Memo:</strong> ${friend.memo || '-'}</p>
    `;
    document.getElementById('friend-details-popup').style.display = 'flex';
}

async function saveFriend() {
    const name = document.getElementById('friend-name').value.trim();
    const gender = document.getElementById('friend-gender').value;
    const behavior = document.getElementById('friend-behavior').value.trim();
    const work = document.getElementById('friend-work').value.trim();
    const memo = document.getElementById('friend-memo').value.trim();

    if (!name) {
        alert('Name is required!');
        return;
    }

    const friend = {
        id: generateUUID(),
        name,
        gender,
        behavior,
        work,
        memo
    };

    const success = await sendFriendToApi(friend);
    if (success) {
        homdata.friends.push(friend);
        selectFriend(friend.id);
        localStorage.setItem('selectedFriend', friend.id);
        updateFriendScroll();
        document.getElementById('add-friend-popup').style.display = 'none';
        document.getElementById('add-friend-form').reset();
    }
}

function selectFriend(friendId) {
    homdata.selectedFriend = friendId;
    localStorage.setItem('selectedFriend', friendId);
    updateFriendScroll();
    updateChatBox();
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !homdata.selectedFriend) {
        if (!homdata.selectedFriend) alert('Please select a friend to chat with!');
        return;
    }

    homdata.messages.push({ sender: 'user', text, friendId: homdata.selectedFriend, timestamp: new Date() });
    input.value = '';
    updateChatBox();

    let aiResponse;
    if (homdata.mode === 'therapy') {
        aiResponse = await sendTherapyMessage(text);
    } else {
        aiResponse = await sendMessageToApi(text, homdata.selectedFriend);
    }
    homdata.messages.push({ sender: 'ai', text: aiResponse, friendId: homdata.selectedFriend, timestamp: new Date() });
    updateChatBox();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function setupEventListeners() {
    document.getElementById('friend-list').addEventListener('click', (e) => {
        const item = e.target.closest('.friend-item');
        if (item) {
            selectFriend(item.dataset.friendId);
        }
    });

    document.getElementById('friends-list-content').addEventListener('click', (e) => {
        const item = e.target.closest('.friend-list-item');
        if (item) {
            selectFriend(item.dataset.friendId);
            document.getElementById('friends-list-popup').style.display = 'none';
        }
    });

    document.getElementById('add-friend-btn').addEventListener('click', () => {
        document.getElementById('add-friend-popup').style.display = 'flex';
    });

    document.getElementById('cancel-friend-btn').addEventListener('click', () => {
        document.getElementById('add-friend-popup').style.display = 'none';
        document.getElementById('add-friend-form').reset();
    });

    document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveFriend();
    });

    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('close-friends-btn').addEventListener('click', () => {
        document.getElementById('friends-list-popup').style.display = 'none';
    });

    homdata = {
        user: { name: '' },
        mode: 'talk',
        messages: [],
        friends: [],
        selectedFriend: null
    };

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function triggerCelebration() {
        const canvas = document.createElement('canvas');
        canvas.id = 'celebration';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '2000';
        document.body.appendChild(canvas);

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const particles = [];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: Math.random() * 8 + 4,
                color: ['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                speed: Math.random() * 7 + 4,
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

            frame++;
            if (frame < 180 && hasVisibleParticles) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        }
        animate();
    }

    async function sendFriendToApi(friend) {
        try {
            const response = await fetch(`/save/${friend.id}/${homdata.user.name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(friend)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Friend save failed');
            }
            triggerCelebration();
            return true;
        } catch (error) {
            console.error('Friend save error:', error);
            alert(`Failed to save friend: ${error.message}`);
            return false;
        }
    }

    async function fetchFriends() {
        try {
            const response = await fetch(`/save/${homdata.user.name}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch friends failed:', response.status, errorText);
                throw new Error(`Fetch friends failed: ${response.status}`);
            }
            const raw = await response.json();

            homdata.friends = Array.isArray(raw.char)
                ? raw.char.map(f => ({
                    id: f.CharId,
                    name: f.name,
                    gender: f.chargender || 'unspecified',
                    behavior: f.charbehave || '',
                    work: f.charWork || '',
                    memo: f.charknow || ''
                }))
                : [{
                    id: raw.char.CharId,
                    name: raw.char.name,
                    gender: raw.char.chargender || 'unspecified',
                    behavior: raw.char.charbehave || '',
                    work: raw.char.charWork || '',
                    memo: raw.char.charknow || ''
                }];

            if (!homdata.friends.length) {
                const defaultFriend = {
                    id: generateUUID(),
                    name: "Hina",
                    gender: "female",
                    behavior: "Witty, cute, shy, sweet, loving, caring, friendly, blushing, beautiful",
                    work: "College friend",
                    memo: null
                };
                homdata.friends.push(defaultFriend);
                await sendFriendToApi(defaultFriend);
            }
            updateFriendScroll();
        } catch (error) {
            console.error('Fetch friends error:', error);
            alert('Failed to load friends. Using default friend.');
            const defaultFriend = {
                id: generateUUID(),
                name: "Hina",
                gender: "female",
                behavior: "Witty, cute, shy, sweet, loving, caring, friendly, blushing, beautiful",
                work: "College friend",
                memo: null
            };
            homdata.friends.push(defaultFriend);
            await sendFriendToApi(defaultFriend);
            updateFriendScroll();
        }
    }

    async function sendMessageToApi(text, friendId) {
        try {
            const friend = homdata.friends.find(f => f.id === friendId);
            if (!friend) throw new Error('Friend not found');

            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            document.getElementById('chat-messages').appendChild(typingIndicator);

            const response = await fetch(`/f/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: homdata.user.name,
                    CharId: friend.id,
                    name: friend.name,
                    text: text
                })
            });

            typingIndicator.remove();
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Chat API failed');
            }
            const data = await response.json();
            return data.response.response || '...';
        } catch (error) {
            console.error('Send message error:', error);
            const friend = homdata.friends.find(f => f.id === friendId);
            return `${friend ? friend.name : 'Friend'}: I'm sorry, something went wrong. Let's try again.`;
        }
    }

    function getUrlParams() {
        const path = window.location.pathname.split('/');
        return {
            mode: path[2] || 'talk',
            user: decodeURIComponent(path[3] || 'testuser') // Default to 'testuser' for testing
        };
    }

    async function initializeTalk() {
        const { mode, user } = getUrlParams();
        homdata.user.name = user;
        homdata.mode = mode;
        localStorage.setItem('username', user);
        await fetchFriends();

        const savedFriendId = localStorage.getItem('selectedFriend');
        if (savedFriendId && homdata.friends.find(f => f.id === savedFriendId)) {
            homdata.selectedFriend = savedFriendId;
        } else if (homdata.friends.length > 0) {
            homdata.selectedFriend = homdata.friends[0].id;
            localStorage.setItem('selectedFriend', homdata.selectedFriend);
        }

        updateFriendScroll();
        updateChatBox();
        setupEventListeners();
    }

    function updateFriendScroll() {
        const friendList = document.getElementById('friend-list');
        friendList.innerHTML = homdata.friends.map(f => `
        <div class="friend-item ${f.id === homdata.selectedFriend ? 'selected' : ''}" data-friend-id="${f.id}">
            ${f.name}
        </div>
    `).join('');
    }

    function updateChatBox() {
        const chatBox = document.getElementById('chat-messages');
        const friend = homdata.friends.find(f => f.id === homdata.selectedFriend);
        document.getElementById('chat-header').textContent = friend ? `Chatting with ${friend.name}` : 'Select a friend to start chatting!';

        chatBox.innerHTML = homdata.messages
            .filter(m => m.friendId === homdata.selectedFriend)
            .map(m => `
            <div class="chat-message ${m.sender === 'user' ? 'user' : 'ai'}">
                <div class="message-content">
                    <p><strong>${m.sender === 'user' ? 'You' : homdata.friends.find(f => f.id === m.friendId).name}</strong>: ${m.text}</p>
                    <div class="timestamp">${new Date(m.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showAllFriends() {
        const friendsList = document.getElementById('friends-list-content');
        friendsList.innerHTML = homdata.friends.map(f => `
        <div class="friend-list-item" data-friend-id="${f.id}">
            <p><strong>${f.name}</strong> (${f.gender}) - ${f.work}</p>
        </div>
    `).join('');
        document.getElementById('friends-list-popup').style.display = 'flex';
    }

    function showFriendDetails(friendId) {
        const friend = homdata.friends.find(f => f.id === friendId);
        const detailsContent = document.getElementById('friend-details-content');
        detailsContent.innerHTML = `
        <p><strong>Name:</strong> ${friend.name}</p>
        <p><strong>Gender:</strong> ${friend.gender}</p>
        <p><strong>Behavior:</strong> ${friend.behavior || '-'}</p>
        <p><strong>Occupation:</strong> ${friend.work || '-'}</p>
        <p><strong>Memo:</strong> ${friend.memo || '-'}</p>
    `;
        document.getElementById('friend-details-popup').style.display = 'flex';
    }

    async function saveFriend() {
        const name = document.getElementById('friend-name').value.trim();
        const gender = document.getElementById('friend-gender').value;
        const behavior = document.getElementById('friend-behavior').value.trim();
        const work = document.getElementById('friend-work').value.trim();
        const memo = document.getElementById('friend-memo').value.trim();

        if (!name) {
            alert('Name is required!');
            return;
        }

        const friend = {
            id: generateUUID(),
            name,
            gender,
            behavior,
            work,
            memo
        };

        const success = await sendFriendToApi(friend);
        if (success) {
            homdata.friends.push(friend);
            selectFriend(friend.id);
            localStorage.setItem('selectedFriend', friend.id);
            updateFriendScroll();
            document.getElementById('add-friend-popup').style.display = 'none';
            document.getElementById('add-friend-form').reset();
        }
    }

    function selectFriend(friendId) {
        homdata.selectedFriend = friendId;
        localStorage.setItem('selectedFriend', friendId);
        updateFriendScroll();
        updateChatBox();
    }

    async function sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (!text || !homdata.selectedFriend) {
            if (!homdata.selectedFriend) alert('Please select a friend to chat with!');
            return;
        }

        homdata.messages.push({ sender: 'user', text, friendId: homdata.selectedFriend, timestamp: new Date() });
        input.value = '';
        updateChatBox();

        const aiResponse = await sendMessageToApi(text, homdata.selectedFriend);
        homdata.messages.push({ sender: 'ai', text: aiResponse, friendId: homdata.selectedFriend, timestamp: new Date() });
        updateChatBox();
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    function setupEventListeners() {
        document.getElementById('friend-list').addEventListener('click', (e) => {
            const item = e.target.closest('.friend-item');
            if (item) {
                selectFriend(item.dataset.friendId);
            }
        });

        document.getElementById('friends-list-content').addEventListener('click', (e) => {
            const item = e.target.closest('.friend-list-item');
            if (item) {
                selectFriend(item.dataset.friendId);
                document.getElementById('friends-list-popup').style.display = 'none';
            }
        });

        document.getElementById('add-friend-btn').addEventListener('click', () => {
            document.getElementById('add-friend-popup').style.display = 'flex';
        });

        document.getElementById('cancel-friend-btn').addEventListener('click', () => {
            document.getElementById('add-friend-popup').style.display = 'none';
            document.getElementById('add-friend-form').reset();
        });

        document.getElementById('add-friend-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveFriend();
        });

        document.getElementById('send-btn').addEventListener('click', sendMessage);
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        document.getElementById('close-friends-btn').addEventListener('click', () => {
            document.getElementById('friends-list-popup').style.display = 'none';
        });

        document.getElementById('close-details-btn').addEventListener('click', () => {
            document.getElementById('friend-details-popup').style.display = 'none';
        });

        document.getElementById('friend-list').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const item = e.target.closest('.friend-item');
            if (item) {
                showFriendDetails(item.dataset.friendId);
            }
        });

        document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
    }

    function initializeTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
        initializeTalk();
    }); document.getElementById('close-details-btn').addEventListener('click', () => {
        document.getElementById('friend-details-popup').style.display = 'none'

    })

}

document.getElementById('friend-list').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const item = e.target.closest('.friend-item');
    if (item) {
        showFriendDetails(item.dataset.friendId);
    }
});

document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);

function initializeTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeTalk();
});