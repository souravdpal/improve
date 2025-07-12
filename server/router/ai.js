const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const sanitizePath = require('sanitize-filename');

const pypath = path.join(__dirname, '..', 'python', 'therapy.py');

router.post('/journal/:uname', async (req, res) => {
    const { summary, answers = {}, mode } = req.body;
    const { uname } = req.params;

    // Sanitize uname
    const sanitizedUname = sanitizePath(uname);
    if (!sanitizedUname) {
        return res.status(400).json({ response: 'Invalid username provided.' });
    }

    // Validate inputs
    if (!summary || !mode || !answers.q1 || !answers.q2 || !answers.q3) {
        return res.status(400).json({
            response: 'Missing required fields: summary, mode, answers.q1, answers.q2, answers.q3',
        });
    }

    // Validate mode
    const validModes = ['journal', 'therapy', 'fai'];
    if (!validModes.includes(mode)) {
        return res.status(400).json({ response: `Invalid mode. Must be one of: ${validModes.join(', ')}` });
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
        challange: challenge,
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
            streakHistory: streakHistory ? streakHistory.join(', ') : 'none',
            recentMoods: moods.slice(-3).map(m => m.mood).join(', ') || 'none',
            distractions: distractions.map(d => d.trigger).join(', ') || 'none',
            completedTasks: tasks.filter(t => t.completed).map(t => t.name).join(', ') || 'none',
            habits: habits.map(h => `${h.name} (${h.progress})`).concat((profileHabits || '').split(', ')).join(', ') || 'none',
            gratitude: gratitude.slice(-2).map(g => g.text).join('; ') || 'none',
            reflections: reflections.slice(-2).map(r => r.text).join('; ') || 'none',
            milestones: milestones.slice(-2).map(m => m.text).join('; ') || 'none',
        },
    };

    // Spawn Python process
    const python = spawn('python3', [pypath], { stdio: ['pipe', 'pipe', 'pipe'] });

    // Prepare input for Python
    const input = {
        uname: sanitizedUname,
        summary,
        mode,
        a1: answers.q1,
        a2: answers.q2,
        a3: answers.q3,
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

    // Capture stdout
    python.stdout.on('data', (data) => {
        result += data.toString();
    });

    // Capture stderr
    python.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    // Handle process close
    python.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
            console.error(`Python script exited with code ${code}. Error: ${errorOutput}`);
            return res.status(500).json({
                response: 'Python script failed.',
                error: errorOutput || 'Unknown error in Python script.',
            });
        }

        // Parse Python output
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

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
        python.kill();
        res.status(504).json({ response: 'Python script timed out.' });
    }, 10000);
});

module.exports = router;