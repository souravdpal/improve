document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const searchInput = document.getElementById('searchInput');
  const autocomplete = document.getElementById('autocomplete');
  const leaderboard = document.getElementById('leaderboard');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const scrollToRank = document.getElementById('scrollToRank');
  const profileModal = document.getElementById('profileModal');
  const closeModal = document.getElementById('closeModal');
  const modalUsername = document.getElementById('modalUsername');
  const modalDetails = document.getElementById('modalDetails');
  const topGainer = document.getElementById('topGainer');
  const mostActive = document.getElementById('mostActive');
  const yourProgress = document.getElementById('yourProgress');

  let currentPage = 1;
  const limit = 10;
  let allUsers = [];
  let currentUserId = 'aarav_mehta691'; // Replace with actual user ID logic
  const nextLevelXP = 1000; // Assume 1000 XP per level for simplicity

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    themeIcon.innerHTML = isLightMode 
      ? '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
      : '<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>';
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  });

  // Load saved theme
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
  }

  // Fetch leaderboard data
  async function fetchLeaderboard(page = 1, searchFilter = '', fidME = false) {
    try {
      console.log('Fetching with:', { page, limit, searchFilter, fidME, username: currentUserId }); // Debug log
      const response = await fetch('/home/leaderboard/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, limit, users: false, searchFilter, fidME, username: currentUserId })
      });
      const data = await response.json();
      console.log('Response data:', data); // Debug log
      if (data.userRank) {
        currentPage = Math.floor((data.userRank - 1) / limit) + 1;
        allUsers = data.leaderboard;
        renderLeaderboard(allUsers, data.userRank);
      } else if (searchFilter && data.leaderboard) {
        allUsers = data.leaderboard;
        renderLeaderboard(allUsers);
        prevPage.disabled = true;
        nextPage.disabled = true;
      } else {
        allUsers = data.leaderboard;
        renderLeaderboard(allUsers);
      }
      updatePagination(data);
      updateSidebar();
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  // Render leaderboard
  function renderLeaderboard(users, userRank = null) {
    leaderboard.innerHTML = '';
    users.forEach((user, index) => {
      const globalRank = userRank ? index + (currentPage - 1) * limit + 1 : (currentPage - 1) * limit + index + 1;
      const isCurrentUser = user.username === currentUserId;
      const rankClass = globalRank === 1 ? 'rank-1' : globalRank === 2 ? 'rank-2' : globalRank === 3 ? 'rank-3' : '';
      const premiumClass = user.pack === 'premium' ? 'premium' : '';
      const currentUserClass = isCurrentUser ? 'current-user' : '';
      const xp = user.XP || 0;
      const xpPercentage = (xp / nextLevelXP) * 100;

      const item = document.createElement('div');
      item.className = `leaderboard-item ${rankClass} ${premiumClass} ${currentUserClass}`;
      item.innerHTML = `
        <div class="rank">${globalRank}</div>
        <img class="avatar" src="${user.avatar || `https://ui-avatars.com/api/?name=${user.name || user.username}&background=random&size=256`}" alt="${user.username}">
        <div class="user-info">
          <p class="member-name">${user.name || user.username}</p>
          <p class="reputation-points">${xp} RP</p>
          <div class="xp-bar"><div class="xp-bar-fill" style="width: ${xpPercentage}%"></div></div>
          <p class="xp-progress">To Level ${user.level + 1}: ${xp} / ${nextLevelXP}</p>
          <span class="badge member-since">${new Date(user.joinDate || Date.now()).toLocaleDateString()}</span>
          <span class="badge ${user.pack === 'premium' ? 'premium' : 'free'}">${user.pack === 'premium' ? 'Premium' : 'Free'}</span>
          <div class="tooltip">
            👤 ${user.name || user.username}<br>
            🔥 ${xp} RP<br>
            🕒 ${new Date(user.lastLogin || Date.now()).toLocaleDateString()}<br>
            🎖️ ${user.pack === 'premium' ? 'Premium' : 'Free'}
          </div>
        </div>
      `;
      item.addEventListener('click', () => showProfileModal(user));
      if (isCurrentUser) item.classList.add('highlight');
      leaderboard.appendChild(item);
    });
  }

  // Update pagination
  function updatePagination(data) {
    prevPage.disabled = currentPage === 1 || searchInput.value.trim();
    nextPage.disabled = data.leaderboard.length < limit || searchInput.value.trim();
  }

  // Update sidebar
  function updateSidebar() {
    const topUser = allUsers.reduce((max, user) => (user.XP || 0) > (max.XP || 0) ? user : max, allUsers[0]);
    const mostActiveUser = allUsers.reduce((max, user) => (user.streak || 0) > (max.streak || 0) ? user : max, allUsers[0]);
    const currentUser = allUsers.find(user => user.username === currentUserId) || { XP: 0, level: 0 };
    topGainer.textContent = `${topUser.name || topUser.username} (+${topUser.XP || 0} RP)`;
    mostActive.textContent = `${mostActiveUser.name || mostActiveUser.username} (${mostActiveUser.streak || 0} days)`;
    yourProgress.textContent = `${((currentUser.XP || 0) / nextLevelXP * 100).toFixed(1)}% to Level ${currentUser.level + 1}`;
  }

  // Search functionality
  searchInput.addEventListener('input', async () => {
    const searchFilter = searchInput.value.trim();
    autocomplete.innerHTML = '';
    if (searchFilter) {
      await fetchLeaderboard(1, searchFilter);
      const suggestions = allUsers.slice(0, 5).map(user => user.username);
      suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', () => {
          searchInput.value = suggestion;
          autocomplete.innerHTML = '';
          fetchLeaderboard(1, suggestion);
        });
        autocomplete.appendChild(div);
      });
    } else {
      currentPage = 1;
      await fetchLeaderboard(1);
    }
  });

  // Pagination controls
  prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchLeaderboard(currentPage, searchInput.value.trim());
    }
  });

  nextPage.addEventListener('click', () => {
    currentPage++;
    fetchLeaderboard(currentPage, searchInput.value.trim());
  });

  // Scroll to rank
  scrollToRank.addEventListener('click', async () => {
    await fetchLeaderboard(1, '', true);
    const currentUserItem = document.querySelector('.leaderboard-item.current-user');
    if (currentUserItem) {
      currentUserItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Profile modal
  function showProfileModal(user) {
    modalUsername.textContent = user.name || user.username;
    modalDetails.innerHTML = `
      Username: @${user.username}<br>
      Level: ${user.level}<br>
      XP: ${user.XP || 0} / ${nextLevelXP}<br>
      Status: ${user.pack === 'premium' ? 'Premium' : 'Free'}<br>
      Joined: ${new Date(user.joinDate || Date.now()).toLocaleDateString()}<br>
      Last Login: ${new Date(user.lastLogin || Date.now()).toLocaleDateString()}<br>
      Streak: ${user.streak || 0} days
    `;
    profileModal.style.display = 'flex';
  }

  closeModal.addEventListener('click', () => {
    profileModal.style.display = 'none';
  });

  // Initialize
  fetchLeaderboard();
});