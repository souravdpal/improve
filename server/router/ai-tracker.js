const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.use(express.json());

// Get user track file path
const getUserTrackPath = (username) => {
    const tracksDir = path.join(__dirname, '..', 'database', 'tracks');
    return path.join(tracksDir, `${username}-tracks.json`);
};

// Simple AI analysis function (you can replace this with actual AI service calls)
const analyzeUserData = (userData, currentMood, distractions, reflections) => {
    const { user, moods, habits, tasks } = userData;
    
    // Analyze mood patterns
    const moodPattern = moods.slice(-7); // Last 7 entries
    const moodCounts = moodPattern.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
    }, {});
    
    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
    ) || currentMood;

    // Analyze distractions
    const commonDistractions = userData.distractions
        .slice(-10) // Last 10 distractions
        .reduce((acc, d) => {
            acc[d.trigger] = (acc[d.trigger] || 0) + 1;
            return acc;
        }, {});
    
    const topDistraction = Object.keys(commonDistractions).reduce((a, b) => 
        commonDistractions[a] > commonDistractions[b] ? a : b
    ) || 'distractions';

    // Analyze habits
    const goodHabits = habits.filter(h => h.type === 'good').length;
    const badHabits = habits.filter(h => h.type === 'bad').length;

    // Generate personalized advice
    let advice = '';
    let encouragement = '';
    let suggestions = [];

    // Mood-based advice
    if (dominantMood === 'happy' || dominantMood === 'excited') {
        encouragement = `Great job maintaining a positive mood! Your ${dominantMood} energy is fantastic.`;
        advice = "Keep up the great work! Try to identify what's contributing to your positive mood and do more of it.";
    } else if (dominantMood === 'sad' || dominantMood === 'anxious') {
        encouragement = `I notice you've been feeling ${dominantMood} lately. Remember that this is temporary.`;
        advice = "Consider practicing mindfulness or talking to someone you trust. Small steps can make a big difference.";
        suggestions.push("Try 5 minutes of deep breathing");
        suggestions.push("Go for a short walk outside");
        suggestions.push("Write down three things you're grateful for");
    } else if (dominantMood === 'neutral') {
        encouragement = "Stability is good! You're maintaining a balanced emotional state.";
        advice = "Consider adding some activities that bring you joy to elevate your mood.";
        suggestions.push("Try a new hobby or activity");
        suggestions.push("Connect with a friend or family member");
    }

    // Distraction-based advice
    if (topDistraction && topDistraction !== 'distractions') {
        suggestions.push(`Try to limit ${topDistraction} - it seems to be your main distraction`);
        suggestions.push(`Set specific times for ${topDistraction} instead of avoiding it throughout the day`);
    }

    // Habit-based advice
    if (badHabits > goodHabits) {
        suggestions.push("Focus on replacing one bad habit with a good one");
        suggestions.push("Start small - even 5 minutes of a good habit daily helps");
    } else if (goodHabits > 0) {
        encouragement += ` You're doing well with your ${goodHabits} good habits!`;
    }

    // Goal progress
    if (user.goal) {
        suggestions.push(`Remember your goal: "${user.goal}" - break it into smaller daily actions`);
    }

    // Recent reflection analysis
    const latestReflection = reflections[reflections.length - 1] || reflections.slice(-1)[0];
    if (latestReflection) {
        advice += ` I see you're reflecting on "${latestReflection.substring(0, 50)}..." - self-reflection is a powerful tool for growth.`;
    }

    // Streak encouragement
    if (user.streak > 0) {
        encouragement += ` Your ${user.streak}-day streak shows great consistency!`;
    }

    // Compile final response
    const response = `HINA: Hi ${user.name}! ${encouragement} 

${advice}

Here are some personalized suggestions for you:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Remember, progress isn't always linear. You're doing better than you think! 🌟`;

    return response;
};

// AI analysis endpoint
router.post('/track/:user', (req, res) => {
    try {
        const { user } = req.params;
        const { mood, distractions, reflections } = req.body;

        console.log(`AI analysis requested for user: ${user}`);

        // Get user data
        const trackPath = getUserTrackPath(user);
        
        if (!fs.existsSync(trackPath)) {
            return res.status(404).json({ error: 'User track data not found' });
        }

        const userData = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));

        // Generate AI analysis
        const analysis = analyzeUserData(userData, mood, distractions || [], reflections || []);

        // Save the analysis as a tip
        const tip = {
            text: analysis,
            timestamp: new Date().toISOString(),
            id: `tip-${Date.now()}`,
            type: 'ai_analysis'
        };

        userData.tips.push(tip);

        // Update user data with the new tip
        fs.writeFileSync(trackPath, JSON.stringify(userData, null, 2));

        res.status(200).json({
            success: true,
            response: analysis,
            tip: tip
        });

    } catch (err) {
        console.error('Error in AI analysis:', err);
        
        // Fallback response
        const fallbackResponse = `HINA: Hi there! I'm having trouble accessing your full data right now, but I'm here to help. Based on your current mood (${req.body.mood || 'neutral'}), here are some general tips:

1. Take a moment to breathe deeply and center yourself
2. Focus on one small task you can complete today
3. Remember that every small step counts toward your goals
4. Practice self-compassion - you're doing your best!

Keep tracking your progress - it really helps with self-awareness and growth! 🌟`;

        res.status(200).json({
            success: true,
            response: fallbackResponse,
            fallback: true
        });
    }
});

// Get AI insights for user (historical analysis)
router.get('/insights/:user', (req, res) => {
    try {
        const { user } = req.params;
        const trackPath = getUserTrackPath(user);
        
        if (!fs.existsSync(trackPath)) {
            return res.status(404).json({ error: 'User track data not found' });
        }

        const userData = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
        
        // Generate insights
        const insights = {
            moodTrends: {},
            commonDistractions: {},
            habitProgress: {
                good: userData.habits.filter(h => h.type === 'good').length,
                bad: userData.habits.filter(h => h.type === 'bad').length
            },
            streakInfo: {
                current: userData.user.streak,
                best: Math.max(...(userData.user.streakHistory || [userData.user.streak]))
            },
            totalEntries: userData.moods.length,
            lastAnalysis: userData.tips[userData.tips.length - 1] || null
        };

        // Calculate mood trends
        userData.moods.forEach(entry => {
            insights.moodTrends[entry.mood] = (insights.moodTrends[entry.mood] || 0) + 1;
        });

        // Calculate common distractions
        userData.distractions.forEach(entry => {
            insights.commonDistractions[entry.trigger] = (insights.commonDistractions[entry.trigger] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            insights: insights,
            userData: {
                name: userData.user.name,
                goal: userData.user.goal,
                createdAt: userData.user.createdAt,
                lastActive: userData.user.lastActive
            }
        });

    } catch (err) {
        console.error('Error getting AI insights:', err);
        res.status(500).json({ error: 'Server error while getting AI insights: ' + err.message });
    }
});

module.exports = router;