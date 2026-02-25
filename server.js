const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/assess', async (req, res) => {
    const { route } = req.body;

    if (!route) {
        return res.status(400).json({ error: 'No route provided' });
    }

    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `You are a maritime shipping risk analyst. Assess the following shipping route and determine if it is currently "Safe" or "At Risk".

Route: ${route}

You MUST respond with raw JSON only. No markdown, no code blocks, no extra text. Exactly this structure:
{"verdict": "Safe", "reason": "your explanation here", "factors": ["factor 1", "factor 2", "factor 3"]}`
                }
            ]
        });

        const raw = message.content[0].text;
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});