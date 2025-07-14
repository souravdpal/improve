const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Ensure the database/user directory exists
const userDataDir = path.join(__dirname, './../database/user');
if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
}

// Default user data structure
const defaultUserData = {
    user: {
        name: '',
        streak: 0,
        currentMood: 'Not set',
        goal: 'Overcome procrastination and build discipline',
        streakHistory: [0, 0, 0],
        avatar: ''
    },
    tasks: [
        { name: 'Walk 30 mins', completed: false, timestamp: new Date().toISOString() },
        { name: 'No social media for 2 hrs', completed: false, timestamp: new Date().toISOString() },
        { name: 'Study 6 hrs', completed: false, timestamp: new Date().toISOString() }
    ],
    moods: [],
    distractions: [],
    //actions: [],
    habits: [
        { name: 'Meditation', progress: '0/7', goal: 7 },
        { name: 'Waking up early', progress: '0/7', goal: 7 }
    ],
    gratitude: ['Grateful for a productive day', 'Thankful for supportive friends'],
    journal: [],
    reflections: [],
    milestones: [{ text: 'Reached 3-day streak!', timestamp: new Date().toISOString() }],
    tips: [],
    settings: { darkMode: false, notifications: 'off', music: 'none' },
    playlist: [
        { tag: 'rain', url: 'https://www.youtube.com/watch?v=yIQd2Ya0Ziw' },
        { tag: 'thunderrain', url: 'https://www.youtube.com/watch?v=qlLkTmoKjOY' },
        { tag: 'forest', url: 'https://www.youtube.com/watch?v=IvjMgVS6kng' },
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
    ],
    navigation: [],
    messages: []
};

// Save or update user data
router.post('/data', (req, res) => {
    let { username, data } = req.body;
    //console.log('Received username:', username);

    try {
        if (!username) {
            return res.status(400).json({ msg: 'Username is required' });
        }

        const filedir = path.join(userDataDir, `${username}-goals.json`);

        // If no data provided, initialize with default
        if (!data) {
            data = { ...defaultUserData, user: { ...defaultUserData.user, name: username } };
        }

        fs.writeFileSync(filedir, JSON.stringify(data, null, 2), 'utf-8');
        res.status(200).json({ msg: 'success' });
    } catch (err) {
        console.error('Error writing file:', err);
        res.status(500).json({ msg: `error: ${err.message}` });
    }
});

// Fetch user data
router.post('/data/user', (req, res) => {
    let { id } = req.body;
    console.log('Fetching data for ID:', id);

    try {
        if (!id) {
            return res.status(400).json({ msg: 'User ID is required' });
        }

        const fileDirRead = path.join(userDataDir, `${id}-goals.json`);

        if (!fs.existsSync(fileDirRead)) {
            return res.status(404).json({ msg: 'User data not found' });
        }

        const BINfile = fs.readFileSync(fileDirRead, 'utf-8');
        const mainData = JSON.parse(BINfile);
        res.status(200).json(mainData);
    } catch (err) {
        console.error('Error reading file:', err);
        res.status(500).json({ msg: `error: ${err.message}` });
    }
});

// Save journal entry
router.post('/data/journal', (req, res) => {
    let { username, journal } = req.body;
    console.log('Received journal for username:', username);

    try {
        if (!username || !journal) {
            return res.status(400).json({ msg: 'Username and journal entry are required' });
        }

        const filedir = path.join(userDataDir, `${username}-goals.json`);

        let userData = {};
        if (fs.existsSync(filedir)) {
            const BINfile = fs.readFileSync(filedir, 'utf-8');
            userData = JSON.parse(BINfile);
        } else {
            userData = { ...defaultUserData, user: { ...defaultUserData.user, name: username } };
        }

        userData.journal = userData.journal || [];
        userData.journal.push(journal);

        fs.writeFileSync(filedir, JSON.stringify(userData, null, 2), 'utf-8');
        res.status(200).json({ msg: 'success' });
    } catch (err) {
        console.error('Error writing journal:', err);
        res.status(500).json({ msg: `error: ${err.message}` });
    }
});

// Delete a single journal entry
router.delete('/data/journal', (req, res) => {
    let { username, index } = req.body;
    console.log('Deleting journal entry for username:', username, 'at index:', index);

    try {
        if (!username || index === undefined) {
            return res.status(400).json({ msg: 'Username and index are required' });
        }

        const filedir = path.join(userDataDir, `${username}-goals.json`);

        if (!fs.existsSync(filedir)) {
            return res.status(404).json({ msg: 'User data not found' });
        }

        const BINfile = fs.readFileSync(filedir, 'utf-8');
        let userData = JSON.parse(BINfile);

        if (!userData.journal || index < 0 || index >= userData.journal.length) {
            return res.status(400).json({ msg: 'Invalid journal index' });
        }

        // Remove the journal entry at the specified index
        userData.journal.splice(index, 1);

        // Write updated data back to file
        fs.writeFileSync(filedir, JSON.stringify(userData, null, 2), 'utf-8');
        res.status(200).json({ msg: 'Journal entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting journal:', err);
        res.status(500).json({ msg: `error: ${err.message}` });
    }
});
const defaultUserDataClean = {
    user: {},
    tasks: [],
    pomodoro: {},
    moods: [],
    distractions: [],
    actions: [],
    habits: [],
    gratitude: [],
    reflections: [],
    milestones: [],
    tips: [],
    settings: {
        darkMode: false,
        notifications: "off",
        music: "none"
    },
    journal: []
};

router.post('/clean', (req, res) => {
    let { type, username } = req.body;
    console.log('Received clean request for username:', username, 'type:', type);

    if (!username) {
        return res.status(400).json({ msg: 'Username is required' });
    }

    const filedir = path.join(userDataDir, `${username}-goals.json`);

    try {
        if (!fs.existsSync(filedir)) {
            return res.status(404).json({ msg: 'User data not found' });
        }

        if (type === "removeuser") {
            fs.unlinkSync(filedir);
            console.log(`User data for ${username} deleted successfully.`);
            return res.status(200).json({ msg: 'User data deleted successfully' });
        }

        const fileData = fs.readFileSync(filedir, 'utf-8');
        let userData = JSON.parse(fileData);

        switch (type) {
            case "mood":
                userData.reflections = [];
                break;
            case "distraction":
                userData.distractions = [];
                break;
            case "habits":
                userData.habits = [];
                break;
            case "gratitude":
                userData.gratitude = [];
                break;
            case "reflections":
                userData.reflections = [];
                break;
            case "milestones":
                userData.milestones = [];
                break;
            case "tips":
                userData.tips = [];
                break;
            case "settings":
                userData.settings = { darkMode: false, notifications: 'off', music: 'none' };
                break;
            case "actions":
                userData.actions = [];
                break;
            default:
                return res.status(400).json({ msg: 'Invalid type provided' });
        }

        fs.writeFileSync(filedir, JSON.stringify(userData, null, 2), 'utf-8');
        res.status(200).json({ msg: `Cleared ${type} data successfully` });

    } catch (err) {
        console.error('Error processing clean operation:', err);
        res.status(500).json({ msg: `error: ${err.message}` });
    }
});



module.exports = router;