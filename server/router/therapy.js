const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

router.use(express.json());

// Utility function to sanitize username for file paths
function sanitizePath(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[^a-zA-Z0-9_-]/g, '').replace(/(\.\.\/|\.\/|\/)/g, '');
}

router.post('/u', async (req, res) => {
    const { user, mode, messages } = req.body;

    // Validate request body
    if (
        !user ||
        !user.name ||
        !mode ||
        !messages ||
        !Array.isArray(messages) ||
        !messages[0] ||
        !messages[0].text
    ) {
        return res.status(400).json({ response: 'Invalid request body. Missing required fields.' });
    }

    // Sanitize username
    const sanitizedUname = sanitizePath(user.name);
    if (!sanitizedUname) {
        return res.status(400).json({ response: 'Invalid username provided.' });
    }

    // Read user goals file
    const goalsFilePath = path.join(__dirname, '..', 'database', 'user', `${sanitizedUname}-goals.json`);
    let goalsData;
    try {
        await fs.access(goalsFilePath);
        goalsData = JSON.parse(await fs.readFile(goalsFilePath, 'utf-8'));
    } catch (err) {
        return res.status(400).json({ response: 'User goals data not found or invalid.', error: err.message });
    }

    // Read user profile file
    const profileFilePath = path.join(__dirname, '..', 'database', `${sanitizedUname}.json`);
    let profileData;
    try {
        await fs.access(profileFilePath);
        profileData = JSON.parse(await fs.readFile(profileFilePath, 'utf-8'));
    } catch (err) {
        return res.status(400).json({ response: 'User profile data not found or invalid.', error: err.message });
    }

    // Extract relevant data from goals file
    const {
        user: { name, streak, currentMood, goal, streakHistory } = {},
        tasks = [],
        moods = [],
        distractions = [],
        habits = [],
        gratitude = [],
        reflections = [],
        milestones = [],
    } = goalsData;

    // Extract relevant data from profile file
    const {
        age,
        gender,
        major,
        hobbies,
        habits: profileHabits,
        why,
        challange: challenge, // Note: 'challange' is likely a typo; should be 'challenge'
        motivation,
        petname,
    } = profileData;

    // Summarize user data
    const userSummary = {
        profile: {
            name: name || sanitizedUname,
            age: age || 'unknown',
            gender: gender || 'unknown',
            major: major || 'none',
            hobbies: hobbies || 'none',
            petname: petname || 'none',
            motivation: motivation || 'none',
            challenge: challenge || 'none',
            why: why || 'none',
        },
        currentState: {
            mood: currentMood || 'unknown',
            streak: streak || 0,
            goal: goal || 'none',
            tasks,
            moods,
            distractions,
            habits,
            gratitude,
            reflections,
            milestones,
        },
    };

    // Path to Python script
    const pypath = path.join(__dirname, '..', 'python', 'therapist.py');

    // Spawn Python process
    const python = spawn('python3', [pypath], { stdio: ['pipe', 'pipe', 'pipe'] });

    // Prepare input for Python
    const input = {
        uname: sanitizedUname,
        mode,
        summary: messages[0].text, // Use message text as summary
        userSummary,
    };

    // Send input to Python
    try {
        python.stdin.write(JSON.stringify(input));
        python.stdin.end();
    } catch (err) {
        console.error('Error sending input to Python:', err.message);
        return res.status(500).json({ response: 'Failed to send input to Python script.', error: err.message });
    }

    let result = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
        result += data.toString();
    });

    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    const timeout = setTimeout(() => {
        python.kill();
        res.status(504).json({ response: 'Python script timed out.' });
    }, 10000);

    python.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
            console.error(`Python script exited with code ${code}. Error: ${errorOutput}`);
            return res.status(500).json({
                response: 'Python script failed.',
                error: errorOutput || 'Unknown error in Python script.',
            });
        }

        try {
            const parsedResult = JSON.parse(result);
            return res.status(200).json({ response: parsedResult });
        } catch (err) {
            console.error('Failed to parse Python output:', result, 'Error:', err.message);
            return res.status(500).json({
                response: 'Failed to parse Python script output.',
                error: err.message,
            });
        }
    });
});

module.exports = router;