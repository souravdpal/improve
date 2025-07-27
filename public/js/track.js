// Global data object to store fetched data
let homdata = {
  user: { name: '', streak: 0, currentMood: '', goal: '', streakHistory: [], avatar: '', playlist: [] },
  moods: [],
  distractions: [],
  actions: [],
  habits: [],
  gratitude: [],
  reflections: [],
  milestones: [],
  tips: [],
  settings: { darkMode: false, notifications: 'off', music: '', musicTime: 0 }
};

// Fetch user data
const GetReadParams1 = async () => {
  try {
    const username = localStorage.getItem('username');
    if (!username) {
      window.location.href = 'login.html';
      return "user to home";
    }
    const response = await fetch(`/data/read/track?user=${username}`);
    if (!response.ok) {
     // window.location.href = 'sww';
      return "user to home";
    }
    const dataRead = await response.json();
    console.log('Fetched data:', dataRead);
    // Ensure all expected fields exist
    homdata = {
      ...homdata,
      ...dataRead,
      tasks: dataRead.tasks || [],
      habits: dataRead.habits || [],
      distractions: dataRead.distractions || [],
      reflections: dataRead.reflections || [],
      moods: dataRead.moods || [],
      tips: dataRead.tips || [],
      user: { ...homdata.user, ...dataRead.user }
    };
    initializeTracking();
    return dataRead;
  } catch (error) {
    console.error('Error fetching data:', error);
    window.location.href = 'login.html';
    return "user to home";
  }
};
GetReadParams1();

const username = localStorage.getItem('username');

// Audio for click and completion sounds
// Update paths to match your server's file structure
const clickSound = new Audio('/sounds/click'); // Ensure this file exists
const completeSound = new Audio('/sounds/fun'); // Ensure this file exists

function playClickSound() {
  clickSound.play().catch(() => console.warn('Click sound failed to play (possibly missing file)'));
}

function playCompleteSound() {
  completeSound.play().catch(() => console.warn('Complete sound failed to play (possibly missing file)'));
}

function io() {
  window.location.href = `/home/hi/${encodeURIComponent(localStorage.getItem('name') || '')}`;
}

// Celebration animation
function triggerCelebration() {
  const canvas = document.getElementById('celebration');
  if (!canvas) {
    console.warn('Celebration canvas not found');
    playCompleteSound();
    return;
  }
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Canvas context not available');
    return;
  }
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

// Send tracking data to /data/t
async function sendTrackToApi(trackEntry) {
  try {
    const response = await fetch(`/data/t`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, track: trackEntry })
    });
    if (!response.ok) throw new Error('Track API request failed');
    console.log('Track sent to /data/t:', trackEntry);
  } catch (error) {
    console.warn('Track API error suppressed');
  }
}

// Send tracking data to /ai/track/:user for analysis
async function sendAnalyzeRequest() {
  try {
    const response = await fetch(`/ai/track/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood: homdata.moods[homdata.moods.length - 1]?.mood || 'neutral',
        distractions: Array.isArray(homdata.distractions) ? homdata.distractions.map(d => d.trigger) : [],
        reflections: Array.isArray(homdata.reflections) ? homdata.reflections.map(r => r.text) : []
      })
    });
    if (!response.ok) throw new Error('AI analysis request failed');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.warn('AI analysis failed:', error);
    const latestMood = homdata.moods[homdata.moods.length - 1]?.mood || 'neutral';
    const latestDistraction = Array.isArray(homdata.distractions) && homdata.distractions.length > 0 ? homdata.distractions[homdata.distractions.length - 1].trigger : 'distractions';
    const latestReflection = Array.isArray(homdata.reflections) && homdata.reflections.length > 0 ? homdata.reflections[homdata.reflections.length - 1].text : 'your goals';
    return `HINA: Hi ${homdata.user.name || 'User'}, your recent mood was ${latestMood}. I see you're reflecting on "${latestReflection}". To improve, try reducing ${latestDistraction} and keep focusing on your goals. You're making progress!`;
  }
}

// Get URL parameters
function getUrlParams() {
  const path = window.location.pathname.split('/');
  return {
    mode: path[2] || 'track',
    user: decodeURIComponent(path[3] || (window.location.href = 'login.html'))
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

// Update dashboard
function updateDashboard() {
  const latestMood = homdata.moods[homdata.moods.length - 1] || { mood: 'No data yet' };
  const latestDistraction = Array.isArray(homdata.distractions) && homdata.distractions.length > 0 ? homdata.distractions[homdata.distractions.length - 1] : { trigger: 'None' };
  const latestReflection = Array.isArray(homdata.reflections) && homdata.reflections.length > 0 ? homdata.reflections[homdata.reflections.length - 1] : { text: 'No data yet' };
  const latestMilestone = Array.isArray(homdata.milestones) && homdata.milestones.length > 0 ? homdata.milestones[homdata.milestones.length - 1] : { text: 'No data yet' };

  document.getElementById('dash-mood').textContent = latestMood.mood.charAt(0).toUpperCase() + latestMood.mood.slice(1);
  document.getElementById('dash-bad-habits').textContent = Array.isArray(homdata.habits) ? homdata.habits.filter(h => h.type === 'bad').map(h => h.name).join(', ') || 'None' : 'None';
  document.getElementById('dash-good-habits').textContent = Array.isArray(homdata.habits) ? homdata.habits.filter(h => h.type === 'good').map(h => h.name).join(', ') || 'None' : 'None';
  document.getElementById('dash-works').textContent = Array.isArray(homdata.tasks) ? homdata.tasks.map(t => t.title).join(', ') || 'None' : 'None';
  document.getElementById('dash-focus').textContent = homdata.user.goal || 'None';
  document.getElementById('dash-distractions').textContent = Array.isArray(homdata.distractions) ? homdata.distractions.map(d => d.trigger).join(', ') || 'None' : 'None';
  document.getElementById('dash-work-on').textContent = latestReflection.text || 'None';
  document.getElementById('dash-avoid').textContent = latestDistraction.trigger || 'None';
  document.getElementById('dash-summary').textContent = latestReflection.text || 'No summary yet';
  document.getElementById('dash-analysis').textContent = Array.isArray(homdata.tips) && homdata.tips.length > 0 ? homdata.tips[homdata.tips.length - 1].text : 'No analysis yet';
}

// Update tracking cards
function updateTrackCards() {
  const trackCards = document.getElementById('track-cards');
  if (!trackCards) {
    console.warn('Track cards container not found');
    return;
  }
  const trackData = homdata.moods.map((m, i) => ({
    mood: m.mood,
    summary: Array.isArray(homdata.reflections) && homdata.reflections[i] ? homdata.reflections[i].text : 'No summary',
    timestamp: m.timestamp
  }));
  trackCards.innerHTML = trackData.map((t, i) => `
    <div class="card clickable" onclick="viewTracking(${i})">
      <p>${new Date(t.timestamp).toLocaleDateString()} - Mood: ${t.mood.charAt(0).toUpperCase() + t.mood.slice(1)}, ${t.summary.substring(0, 30)}...</p>
    </div>
  `).join('');
}

// Open tracking modal
function openTrackModal() {
  playClickSound();
  const trackModal = document.getElementById('trackModal');
  if (!trackModal) {
    console.warn('Track modal not found');
    return;
  }
  trackModal.classList.add('active');
  document.getElementById('track-mood').value = 'happy';
  document.getElementById('track-distractions').value = '';
  document.getElementById('track-summary').value = '';
}

// Close tracking modal
function closeTrackModal() {
  playClickSound();
  const trackModal = document.getElementById('trackModal');
  if (trackModal) trackModal.classList.remove('active');
}

// Add tracking
function addTracking() {
  playClickSound();
  const mood = document.getElementById('track-mood')?.value;
  const distractions = document.getElementById('track-distractions')?.value.trim().split(',').map(s => s.trim()).filter(s => s) || [];
  const summary = document.getElementById('track-summary')?.value.trim();
  if (!summary) {
    console.warn('Summary is required to add tracking');
    return;
  }

  const timestamp = new Date().toISOString();
  const moodEntry = { mood, timestamp, id: `mood-${Date.now()}` };
  const distractionEntries = distractions.map(d => ({ trigger: d, timestamp, id: `distraction-${Date.now() + Math.random()}` }));
  const reflectionEntry = { text: summary, timestamp, id: `reflection-${Date.now()}` };

  homdata.moods.push(moodEntry);
  homdata.distractions.push(...distractionEntries);
  homdata.reflections.push(reflectionEntry);

  sendTrackToApi({ mood: moodEntry, distractions: distractionEntries, reflection: reflectionEntry });
  updateDashboard();
  updateTrackCards();
  triggerCelebration();
  closeTrackModal();
}

// Analyze with HINA
async function analyzeWithHina() {
  playClickSound();
  const response = await sendAnalyzeRequest();
  homdata.tips.push({ text: response, timestamp: new Date().toISOString(), id: `tip-${Date.now()}` });
  const analyzeModal = document.getElementById('analyzeModal');
  if (analyzeModal) {
    document.getElementById('analyze-response').textContent = response;
    analyzeModal.classList.add('active');
  } else {
    console.warn('Analyze modal not found');
  }
  updateDashboard();
  triggerCelebration();
}

// View tracking
function viewTracking(index) {
  playClickSound();
  const track = homdata.moods[index];
  if (!track) {
    console.warn(`No mood data at index ${index}`);
    return;
  }
  const reflection = Array.isArray(homdata.reflections) && homdata.reflections[index] ? homdata.reflections[index] : { text: 'None' };
  const distractions = Array.isArray(homdata.distractions) ? homdata.distractions.filter(d => new Date(d.timestamp).toDateString() === new Date(track.timestamp).toDateString()) : [];

  document.getElementById('view-mood').textContent = `Mood: ${track.mood.charAt(0).toUpperCase() + track.mood.slice(1)}`;
  document.getElementById('view-bad-habits').textContent = `Bad Habits: ${Array.isArray(homdata.habits) ? homdata.habits.filter(h => h.type === 'bad').map(h => h.name).join(', ') || 'None' : 'None'}`;
  document.getElementById('view-good-habits').textContent = `Good Habits: ${Array.isArray(homdata.habits) ? homdata.habits.filter(h => h.type === 'good').map(h => h.name).join(', ') || 'None' : 'None'}`;
  document.getElementById('view-works').textContent = `Works: ${Array.isArray(homdata.tasks) ? homdata.tasks.map(t => t.title).join(', ') || 'None' : 'None'}`;
  document.getElementById('view-focus').textContent = `Focus: ${homdata.user.goal || 'None'}`;
  document.getElementById('view-distractions').textContent = `Distractions: ${distractions.map(d => d.trigger).join(', ') || 'None'}`;
  document.getElementById('view-work-on').textContent = `What to Work On: ${reflection.text || 'None'}`;
  document.getElementById('view-avoid').textContent = `What to Avoid: ${distractions.map(d => d.trigger).join(', ') || 'None'}`;
  document.getElementById('view-summary').textContent = `Summary: ${reflection.text || 'None'}`;
  const viewModal = document.getElementById('viewModal');
  if (viewModal) viewModal.classList.add('active');
}

// Close view modal
function closeViewModal() {
  playClickSound();
  const viewModal = document.getElementById('viewModal');
  if (viewModal) viewModal.classList.remove('active');
}

// Close analyze modal
function closeAnalyzeModal() {
  playClickSound();
  const analyzeModal = document.getElementById('analyzeModal');
  if (analyzeModal) analyzeModal.classList.remove('active');
}

// Initialize
initializeTracking();