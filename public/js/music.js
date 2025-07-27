let player = null;
let musicInterval = null;
let retryAttempts = 0;
const maxRetryAttempts = 3;

// Use window.homdata if available, otherwise define minimal musicData
const musicData = window.homdata || {
    user: {
        playlist: [
            { tag: 'rain', url: 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw' },
            { tag: 'thunderrain', url: 'https://www.youtube.com/watch?v=qlLkTmoKjOY' },
            { tag: 'forest', url: 'https://www.youtube.com/watch?v=IvjMgVS6kng' },
            { tag: 'salvatore', url: 'https://www.youtube.com/watch?v=GVQON-muEFc' },
            { tag: 'cry', url: 'https://www.youtube.com/watch?v=BfU1iB7UBH0' },
            { tag: 'rest_time', url: 'https://www.youtube.com/watch?v=EyyfRW3WC5c' },
            { tag: 'interseteller', url: 'https://www.youtube.com/watch?v=p2zMXSXhZ9M' },
            { tag: 'ambient_calming', url: 'https://www.youtube.com/watch?v=xDih5SwFs_c' },
            { tag: 'calm_anxiety', url: 'https://www.youtube.com/watch?v=zPyg4N7bcHM' },
            { tag: 'motivation_speech', url: 'https://www.youtube.com/watch?v=VfNCUm7_FMU' },
            { tag: 'madra_uchiha_speech', url: 'https://www.youtube.com/watch?v=ZR377rPci64' },
            { tag: 'hope', url: 'https://www.youtube.com/watch?v=xfzhezl_jts' },
            { tag: 'world_best_speech', url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc' },
            { tag: 'elon_musk', url: 'https://www.youtube.com/watch?v=k9zTr2MAFRg' },
            { tag: 'calmdown', url: 'https://www.youtube.com/watch?v=0L38Z9hIi5s' },
            { tag: 'study', url: 'https://www.youtube.com/watch?v=idRi7ob_cQw' },
            { tag: 'coding', url: 'https://www.youtube.com/watch?v=Yd7vDterctQ' },
            { tag: 'chill_beats', url: 'https://www.youtube.com/watch?v=sF80I-TQiW0' },
            { tag: 'lucid_dreams', url: 'https://www.youtube.com/watch?v=ff90ZV3OEsg' }
        ]
    },
    settings: { music: 'none', musicTime: 0, isPlaying: false }
};

// Load settings from localStorage
function loadMusicSettings() {
    const savedSettings = localStorage.getItem('musicSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            musicData.settings.music = parsedSettings.music || 'none';
            musicData.settings.musicTime = parsedSettings.musicTime || 0;
            musicData.settings.isPlaying = parsedSettings.isPlaying || false;
            const savedPlaylist = parsedSettings.playlist;
            if (savedPlaylist && Array.isArray(savedPlaylist)) {
                musicData.user.playlist = [
                    ...musicData.user.playlist,
                    ...savedPlaylist.filter(p => !musicData.user.playlist.some(ep => ep.tag === p.tag))
                ];
            }
            // Sync with window.homdata if available
            if (window.homdata) {
                window.homdata.user.playlist = musicData.user.playlist;
                window.homdata.settings.music = musicData.settings.music;
                window.homdata.settings.musicTime = musicData.settings.musicTime;
            }
        } catch (error) {
            console.error('Failed to parse music settings:', error);
        }
    }
}

// Save settings to localStorage and sync with window.homdata
function saveMusicSettings() {
    try {
        const settings = {
            music: musicData.settings.music,
            musicTime: musicData.settings.musicTime,
            isPlaying: musicData.settings.isPlaying,
            playlist: musicData.user.playlist,
            timestamp: Date.now()
        };
        localStorage.setItem('musicSettings', JSON.stringify(settings));
        // Sync with window.homdata if available
        if (window.homdata) {
            window.homdata.settings.music = musicData.settings.music;
            window.homdata.settings.musicTime = musicData.settings.musicTime;
            window.homdata.user.playlist = musicData.user.playlist;
            if (typeof window.updateHomdata === 'function') {
                window.updateHomdata('setting', {
                    music: musicData.settings.music,
                    musicTime: musicData.settings.musicTime
                });
            }
        }
    } catch (error) {
        console.error('Failed to save music settings:', error);
    }
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Load YouTube API with retry mechanism
function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
        return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
        console.error('Failed to load YouTube IFrame API, retrying:', retryAttempts + 1);
        if (retryAttempts < maxRetryAttempts) {
            retryAttempts++;
            setTimeout(loadYouTubeAPI, 2000); // Retry after 2 seconds
        } else {
            handlePlayerError('Max retry attempts reached for YouTube API');
        }
    };
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Initialize YouTube player
window.onYouTubeIframeAPIReady = function () {
    const playerElement = document.getElementById('music-player');
    if (playerElement && !player) {
        player = new window.YT.Player('music-player', {
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 0,
                controls: 0,
                modestbranding: 1
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }
};

function onPlayerReady(event) {
    console.log('YouTube player ready');
    retryAttempts = 0; // Reset retry attempts
    // Immediately attempt to resume music if it was playing
    if (musicData.settings.isPlaying && musicData.settings.music !== 'none') {
        resumeMusic();
    }
}

function onPlayerStateChange(event) {
    if (event.data === window.YT.PlayerState.PLAYING) {
        musicData.settings.isPlaying = true;
        updateMusicProgress();
        saveMusicSettings();
    } else if (event.data === window.YT.PlayerState.ENDED) {
        player.seekTo(0);
        player.playVideo();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
        musicData.settings.isPlaying = false;
        clearInterval(musicInterval);
        musicData.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        saveMusicSettings();
    } else if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
        musicData.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        saveMusicSettings();
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    handlePlayerError(`YouTube Player Error: ${event.data}`);
}

function handlePlayerError(message) {
    console.error(message);
    const musicPlayer = document.getElementById('music-player');
    if (musicPlayer) musicPlayer.innerHTML = '';
    const musicProgress = document.getElementById('music-progress');
    if (musicProgress) musicProgress.value = 0;
    musicData.settings.isPlaying = false;
    musicData.settings.music = 'none';
    musicData.settings.musicTime = 0;
    saveMusicSettings();
    updatePlaylistUI();
    if (window.location.pathname.includes('/home/hi/')) {
        alert('Failed to load music. Please disable ad blockers or try a different browser.');
    }
}

// Update playlist UI (only on home page)
function updatePlaylistUI() {
    if (!window.location.pathname.includes('/home/hi/')) return;
    const select = document.getElementById('ambientSound');
    if (select) {
        select.innerHTML = '<option value="none">None</option>' +
            musicData.user.playlist.map(item => `<option value="${item.tag}">${item.tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('');
        if (musicData.settings.music && musicData.settings.music !== 'none') {
            select.value = musicData.settings.music;
        }
    }
}

// Update music progress
function updateMusicProgress() {
    const progressBar = document.getElementById('music-progress');
    if (!progressBar || !player || !player.getCurrentTime) return;
    clearInterval(musicInterval);
    musicInterval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration ? player.getDuration() : 3600;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        musicData.settings.musicTime = currentTime;
        saveMusicSettings();
        if (musicData.settings.music === 'none' || !musicData.settings.isPlaying) {
            clearInterval(musicInterval);
        }
    }, 1000);
}

// Play music
function playMusic() {
    if (!window.location.pathname.includes('/home/hi/')) return;
    const sound = document.getElementById('ambientSound')?.value;
    if (sound === 'none') {
        stopMusic();
        return;
    }
    musicData.settings.music = sound;
    musicData.settings.isPlaying = true;
    const track = musicData.user.playlist.find(p => p.tag === sound);
    if (track && player && typeof player.loadVideoById === 'function') {
        const videoId = getYouTubeVideoId(track.url);
        if (videoId) {
            player.loadVideoById({ videoId: videoId, startSeconds: musicData.settings.musicTime || 0, suggestedQuality: 'small' });
            player.playVideo();
            updateMusicProgress();
            saveMusicSettings();
        } else {
            handlePlayerError('Invalid YouTube video ID');
        }
    } else {
        handlePlayerError('Player not initialized or invalid track');
    }
}

// Pause music
function pauseMusic() {
    if (!window.location.pathname.includes('/home/hi/')) return;
    if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
        musicData.settings.isPlaying = false;
        clearInterval(musicInterval);
        musicData.settings.musicTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        saveMusicSettings();
    }
}

// Stop music
function stopMusic() {
    if (!window.location.pathname.includes('/home/hi/')) return;
    if (player && typeof player.stopVideo === 'function') {
        player.stopVideo();
        clearInterval(musicInterval);
        musicData.settings.music = 'none';
        musicData.settings.musicTime = 0;
        musicData.settings.isPlaying = false;
        saveMusicSettings();
        const progressBar = document.getElementById('music-progress');
        if (progressBar) progressBar.value = 0;
        updatePlaylistUI();
    }
}

// Resume music
function resumeMusic() {
    const sound = musicData.settings.music;
    if (sound === 'none') return;
    musicData.settings.isPlaying = true;
    const track = musicData.user.playlist.find(p => p.tag === sound);
    if (track && player && typeof player.loadVideoById === 'function') {
        const videoId = getYouTubeVideoId(track.url);
        if (videoId) {
            player.loadVideoById({ videoId: videoId, startSeconds: musicData.settings.musicTime || 0, suggestedQuality: 'small' });
            player.playVideo();
            updateMusicProgress();
            saveMusicSettings();
        } else {
            handlePlayerError('Invalid YouTube video ID');
        }
    } else {
        handlePlayerError('Player not initialized or invalid track');
    }
}

// Add custom music (only on home page)
function addCustomMusic() {
    if (!window.location.pathname.includes('/home/hi/')) return;
    const linkInput = document.getElementById('newMusicLink')?.value;
    if (linkInput) {
        const videoId = getYouTubeVideoId(linkInput);
        if (videoId) {
            const tag = prompt('Enter a name for this track:', 'Custom Track');
            if (tag) {
                const cleanTag = tag.replace(/\s+/g, '_').toLowerCase();
                musicData.user.playlist.push({ tag: cleanTag, url: `https://www.youtube.com/watch?v=${videoId}` });
                updatePlaylistUI();
                saveMusicSettings();
                document.getElementById('newMusicLink').value = '';
                toggleModal('addMusicModal', false);
                if (typeof window.triggerCelebration === 'function') {
                    window.triggerCelebration();
                }
            }
        } else {
            alert('Invalid YouTube link. Please use a valid format (e.g., youtube.com/watch?v=ID, youtu.be/ID, music.youtube.com/watch?v=ID).');
        }
    }
}

// Initialize music player
function initializeMusicPlayer() {
    loadMusicSettings();
    updatePlaylistUI();
    loadYouTubeAPI();

    // Attach event listeners only on home page
    if (window.location.pathname.includes('/home/hi/')) {
        const ambientSound = document.getElementById('ambientSound');
        if (ambientSound) {
            ambientSound.addEventListener('change', () => {
                musicData.settings.musicTime = 0;
                playMusic();
            });
        }

        const playBtn = document.querySelector('.music-controls .action-btn[onclick="playMusic()"]');
        const pauseBtn = document.querySelector('.music-controls .action-btn[onclick="pauseMusic()"]');
        const stopBtn = document.querySelector('.music-controls .action-btn[onclick="stopMusic()"]');
        const resumeBtn = document.querySelector('.music-controls .action-btn[onclick="resumeMusic()"]');
        const addMusicBtn = document.querySelector('.action-btn[onclick="addCustomMusic()"]');

        if (playBtn) playBtn.addEventListener('click', playMusic);
        if (pauseBtn) pauseBtn.addEventListener('click', pauseMusic);
        if (stopBtn) stopBtn.addEventListener('click', stopMusic);
        if (resumeBtn) resumeBtn.addEventListener('click', resumeMusic);
        if (addMusicBtn) addMusicBtn.addEventListener('click', addCustomMusic);
    }
}

// Save state before unload
window.addEventListener('beforeunload', () => {
    if (player && player.getCurrentTime) {
        musicData.settings.musicTime = player.getCurrentTime();
        musicData.settings.isPlaying = player.getPlayerState && player.getPlayerState() === window.YT.PlayerState.PLAYING;
        saveMusicSettings();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicPlayer();
    // Ensure immediate resume attempt if music was playing
    if (musicData.settings.isPlaying && musicData.settings.music !== 'none') {
        setTimeout(() => {
            if (player && typeof player.loadVideoById === 'function') {
                resumeMusic();
            } else {
                // Retry resume after API loads
                const checkPlayer = setInterval(() => {
                    if (player && typeof player.loadVideoById === 'function') {
                        resumeMusic();
                        clearInterval(checkPlayer);
                    }
                }, 500);
                setTimeout(() => clearInterval(checkPlayer), 20000); // Stop retrying after 10 seconds
            }
        }, 1000); // Delay to allow API to load
    }
});