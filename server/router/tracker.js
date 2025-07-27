const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

router.use(express.json());

// Ensure tracks directory exists
const ensureTracksDirectory = () => {
    const tracksDir = path.join(__dirname, '..', 'database', 'tracks');
    if (!fs.existsSync(tracksDir)) {
        fs.mkdirSync(tracksDir, { recursive: true });
    }
    return tracksDir;
};

// Get user track file path
const getUserTrackPath = (username) => {
    const tracksDir = ensureTracksDirectory();
    return path.join(tracksDir, `${username}-tracks.json`);
};

// Initialize user track file if it doesn't exist
const initializeUserTracks = (username) => {
    const trackPath = getUserTrackPath(username);
    if (!fs.existsSync(trackPath)) {
        const initialData = {
            user: { 
                name: username, 
                streak: 0, 
                currentMood: '', 
                goal: '', 
                streakHistory: [], 
                avatar: '', 
                playlist: [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            },
            moods: [],
            distractions: [],
            actions: [],
            habits: [],
            gratitude: [],
            reflections: [],
            milestones: [],
            tips: [],
            tasks: [],
            settings: { 
                darkMode: false, 
                notifications: 'off', 
                music: '', 
                musicTime: 0 
            }
        };
        fs.writeFileSync(trackPath, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return null;
};

// Save tracking entry
router.post('/t', (req, res) => {
    try {
        const { username, track } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (!track) {
            return res.status(400).json({ error: 'Track data is required' });
        }

        console.log(`Saving track entry for user: ${username}`);
        console.log('Track data:', track);

        // Initialize user tracks if new user
        initializeUserTracks(username);
        
        const trackPath = getUserTrackPath(username);
        let userData = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));

        // Update last active time
        userData.user.lastActive = new Date().toISOString();

        // Add mood entry
        if (track.mood) {
            userData.moods.push(track.mood);
        }

        // Add distraction entries
        if (track.distractions && Array.isArray(track.distractions)) {
            userData.distractions.push(...track.distractions);
        }

        // Add reflection entry
        if (track.reflection) {
            userData.reflections.push(track.reflection);
        }

        // Update streak logic
        const today = new Date().toDateString();
        const lastEntry = userData.moods[userData.moods.length - 2]; // Previous entry
        
        if (lastEntry) {
            const lastDate = new Date(lastEntry.timestamp).toDateString();
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            
            if (lastDate === yesterday) {
                userData.user.streak += 1;
            } else if (lastDate !== today) {
                userData.user.streak = 1;
            }
        } else {
            userData.user.streak = 1;
        }

        // Save updated data
        fs.writeFileSync(trackPath, JSON.stringify(userData, null, 2));

        res.status(200).json({ 
            success: true, 
            message: 'Track entry saved successfully',
            streak: userData.user.streak
        });

    } catch (err) {
        console.error('Error saving track entry:', err);
        res.status(500).json({ error: 'Server error while saving track entry: ' + err.message });
    }
});

// Read user tracking data
router.get('/read/track', (req, res) => {
    try {
        const { user } = req.query;
        
        if (!user) {
            return res.status(400).json({ error: 'User parameter is required' });
        }

        console.log(`${user} asking server for track records!`);

        // Initialize user tracks if new user
        const initialData = initializeUserTracks(user);
        
        const trackPath = getUserTrackPath(user);
        
        if (fs.existsSync(trackPath)) {
            const rawData = fs.readFileSync(trackPath, 'utf-8');
            const userData = JSON.parse(rawData);
            
            // Update last active time
            userData.user.lastActive = new Date().toISOString();
            fs.writeFileSync(trackPath, JSON.stringify(userData, null, 2));
            
            res.status(200).json(userData);
        } else {
            // This shouldn't happen due to initialization, but just in case
            res.status(404).json({ error: 'User track data not found' });
        }

    } catch (err) {
        console.error('Error reading track data:', err);
        res.status(500).json({ error: 'Server error while reading track data: ' + err.message });
    }
});

// Get all users (for admin purposes)
router.get('/users', (req, res) => {
    try {
        const tracksDir = ensureTracksDirectory();
        const files = fs.readdirSync(tracksDir);
        const users = files
            .filter(file => file.endsWith('-tracks.json'))
            .map(file => {
                const username = file.replace('-tracks.json', '');
                const filePath = path.join(tracksDir, file);
                const stats = fs.statSync(filePath);
                return {
                    username,
                    lastModified: stats.mtime,
                    fileSize: stats.size
                };
            });

        res.status(200).json({ users });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: 'Server error while getting users: ' + err.message });
    }
});

// Delete user tracking data (for cleanup)
router.delete('/user/:username', (req, res) => {
    try {
        const { username } = req.params;
        const trackPath = getUserTrackPath(username);
        
        if (fs.existsSync(trackPath)) {
            fs.unlinkSync(trackPath);
            res.status(200).json({ success: true, message: `User ${username} track data deleted` });
        } else {
            res.status(404).json({ error: 'User track data not found' });
        }
    } catch (err) {
        console.error('Error deleting user data:', err);
        res.status(500).json({ error: 'Server error while deleting user data: ' + err.message });
    }
});


module.exports = router;