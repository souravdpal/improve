const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const sanitizePath = require('sanitize-filename');

router.post('/save/:id/:username', async (req, res) => {
    try {
        const { id, username } = req.params;
        const friendData = req.body;

        // Sanitize inputs
        const sanitizedUsername = sanitizePath(username);
        const sanitizedId = sanitizePath(id);

        // Validate required fields
        if (!friendData.id || !friendData.name) {
            return res.status(400).json({ error: 'Missing required fields: id and name are required' });
        }

        console.log(`char id: ${sanitizedId} req by ${sanitizedUsername} the char is ${friendData.name}`);

        const CharSave = {
            charid: friendData.id,
            charname: friendData.name,
            chargender: friendData.gender || 'unspecified',
            charbehave: friendData.behavior || 'friend',
            charWork: friendData.work || 'none',
            charknow: friendData.memo || 'no memories',
            charage: friendData.age || 'unspecified',
            fallBack: null
        };

        const pathChar = path.join(__dirname, '..', 'database', 'char', `DA-${sanitizedUsername}-${friendData.id}.json`);
        const indexPath = path.join(__dirname, '..', 'database', 'char', `ind-${sanitizedUsername}.json`);

        const objDAT = {
            CharId: friendData.id,
            name: friendData.name,
            fallBackDAT: null
        };

        try {
            let indexData = [];
            const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
            if (indexExists) {
                const rawRead = await fs.readFile(indexPath, 'utf-8');
                indexData = JSON.parse(rawRead);
                if (!Array.isArray(indexData)) {
                    indexData = [indexData];
                }
                // Avoid duplicate entries
                if (!indexData.some(item => item.CharId === friendData.id)) {
                    indexData.push(objDAT);
                }
            } else {
                indexData = [objDAT];
            }

            await Promise.all([
                fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8'),
                fs.writeFile(pathChar, JSON.stringify(CharSave, null, 2), 'utf-8')
            ]);

            res.status(200).json({ message: 'Character saved successfully' });
        } catch (err) {
            console.error('File operation error:', err);
            res.status(500).json({ error: 'Failed to save character data', details: err.message });
        }
    } catch (err) {
        console.error('Request processing error:', err);
        res.status(400).json({ error: 'Invalid request data', details: err.message });
    }
});

router.get('/save/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const sanitizedUsername = sanitizePath(username);
        console.log(`${sanitizedUsername} tried to fetch char`);

        const indexPath = path.join(__dirname, '..', 'database', 'char', `ind-${sanitizedUsername}.json`);

        try {
            const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
            if (!indexExists) {
                // For new users, return an empty array instead of erroring
                let newdathina = {
                    CharId: "HINA-ai-op",
                    name: "Hina",
                    fallBackDAT: null

                }


                let maker = await fs.writeFile(indexPath, JSON.stringify(newdathina,null,2), "utf-8")
                if (maker) {
                    const rawRead = await fs.readFile(indexPath, 'utf-8');
                    let charData = JSON.parse(rawRead);
                    if (!Array.isArray(charData)) {
                        charData = [charData];
                    }
                    res.status(200).json({ char: charData });
                } else {
                    console.log(`No character index found for ${sanitizedUsername}, returning empty list`);
                    return res.status(200).json({ char: [] });
                }


            }

            const rawRead = await fs.readFile(indexPath, 'utf-8');
            let charData = JSON.parse(rawRead);
            if (!Array.isArray(charData)) {
                charData = [charData];
            }
            res.status(200).json({ char: charData });
        } catch (err) {
            console.error('Error fetching character index:', err);
            res.status(500).json({ error: 'Failed to fetch character index', details: err.message });
        }
    } catch (err) {
        console.error('Request processing error:', err);
        res.status(400).json({ error: 'Invalid request', details: err.message });
    }
});

router.post('/f/data', async (req, res) => {
    try {
        const { username, CharId, name, text } = req.body;
        const sanitizedUsername = sanitizePath(username);
        const sanitizedCharId = sanitizePath(CharId);

        // Validate required fields
        if (!username || !CharId || !name || !text) {
            return res.status(400).json({ error: 'Missing required fields: username, CharId, name, and text are required' });
        }

        // Check if character file exists
        const charPath = path.join(__dirname, '..', 'database', 'char', `DA-${sanitizedUsername}-${sanitizedCharId}.json`);
        const charExists = await fs.access(charPath).then(() => true).catch(() => false);
        if (!charExists) {
            return res.status(404).json({ error: `Character not found for ID: ${sanitizedCharId}` });
        }

        console.log(`${sanitizedUsername}: ${text}`);
        const pyPath = path.join(__dirname, '..', 'python', 'fai.py');

        const python = spawn('python3', [pyPath], { stdio: ['pipe', 'pipe', 'pipe'] });

        const input = {
            username: sanitizedUsername,
            CharId: sanitizedCharId,
            name,
            text,
            valProtect: null
        };

        try {
            python.stdin.write(JSON.stringify(input));
            python.stdin.end();
        } catch (err) {
            console.error('Error sending input to Python:', err.message);
            return res.status(500).json({ error: 'Failed to communicate with Python script', details: err.message });
        }

        let result = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            result += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                console.error(`Python script exited with code ${code}. Error: ${errorOutput}`);
                return res.status(500).json({
                    error: 'Python script execution failed',
                    details: errorOutput
                });
            }

            try {
                const parsedResult = JSON.parse(result);
                res.status(200).json({ response: parsedResult });
            } catch (err) {
                console.error('Failed to parse Python output:', err.message);
                res.status(500).json({
                    error: 'Failed to parse Python script output',
                    details: err.message
                });
            }
        });

        const timeout = setTimeout(() => {
            python.kill();
            res.status(504).json({ error: 'Python script timed out' });
        }, 10000);
    } catch (err) {
        console.error('Request processing error:', err);
        res.status(400).json({ error: 'Invalid request data', details: err.message });
    }
});

module.exports = router;