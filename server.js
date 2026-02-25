const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fetch live news for a route
async function fetchRouteNews(route) {
    try {
        const query = encodeURIComponent(route + ' shipping route');
        const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.NEWS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
            return data.articles.map(a => ({
                title: a.title,
                date: a.publishedAt.slice(0, 10),
                url: a.url,
                source: a.source.name
            }));
        }
        return [];
    } catch (err) {
        console.error('News fetch error:', err);
        return [];
    }
}

// Fetch port image from Wikipedia
async function fetchPortImage(portName) {
    try {
        const query = encodeURIComponent(portName + ' port harbor');
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.query.search.length) return null;

        for (let i = 0; i < Math.min(3, searchData.query.search.length); i++) {
            const pageTitle = encodeURIComponent(searchData.query.search[i].title);
            const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
            const imageRes = await fetch(imageUrl);
            const imageData = await imageRes.json();

            const pages = imageData.query.pages;
            const page = Object.values(pages)[0];

            if (page && page.thumbnail) {
                const src = page.thumbnail.source;
                if (src.includes('.svg')) continue;
                return {
                    url: src,
                    credit: 'Wikipedia',
                    creditLink: `https://en.wikipedia.org/wiki/${pageTitle}`
                };
            }
        }
        return null;
    } catch (err) {
        console.error('Wikipedia image fetch error:', err);
        return null;
    }
}

// Extract port names from route using Claude
async function extractPorts(route) {
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 100,
            messages: [
                {
                    role: 'user',
                    content: `Extract the two main port or location names from this shipping route: "${route}"
                    
Respond with raw JSON only. No markdown, no extra text:
{"port1": "first port name", "port2": "second port name"}`
                }
            ]
        });
        const raw = message.content[0].text;
        const cleaned = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('Port extraction error:', err);
        return null;
    }
}

// Route Risk Assessment
app.post('/assess', async (req, res) => {
    const { route } = req.body;

    if (!route) {
        return res.status(400).json({ error: 'No route provided' });
    }

    try {
        const [news, ports] = await Promise.all([
            fetchRouteNews(route),
            extractPorts(route)
        ]);

        let portImages = { port1: null, port2: null };
        if (ports) {
            const [img1, img2] = await Promise.all([
                fetchPortImage(ports.port1),
                fetchPortImage(ports.port2)
            ]);
            portImages = {
                port1: { name: ports.port1, image: img1 },
                port2: { name: ports.port2, image: img2 }
            };
        }

        const headlinesText = news.length > 0
            ? news.map(a => `- ${a.title} (${a.date})`).join('\n')
            : 'No recent news found.';

        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `You are a maritime shipping expert and risk analyst. Assess the following shipping route based on your knowledge AND the latest real-time news headlines provided below.

Route: ${route}

Latest News Headlines:
${headlinesText}

Based on both your knowledge and these headlines, provide a full assessment.

Respond with raw JSON only. No markdown, no code blocks, no extra text. Exactly this structure:
{
  "verdict": "Safe" or "At Risk",
  "score": <number 0-100>,
  "reason": "2-3 sentence explanation",
  "factors": ["factor 1", "factor 2", "factor 3"],
  "shipping_line": "Best shipping line to use on this route and why in one sentence",
  "transit_time": "Approximate transit time e.g. 14-18 days",
  "transhipment": {
    "count": <number of transhipment ports>,
    "ports": ["port 1", "port 2"]
  },
  "route_overview": "A 2-sentence description of the full route path from origin to destination including key waypoints",
  "news_used": true
}`
                }
            ]
        });

        const raw = message.content[0].text;
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const response = {
            ...parsed,
            headlines: headlinesText,
            newsArticles: news,
            portImages: portImages
        };

        console.log('Port images being sent:', JSON.stringify(portImages));

        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Follow-up Chat
app.post('/chat', async (req, res) => {
    const { route, assessment, history, userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        const messages = [
            {
                role: 'user',
                content: `You are a maritime shipping risk analyst assistant. The user has just assessed this shipping route:

Route: ${route}
Verdict: ${assessment.verdict}
Risk Score: ${assessment.score}/100
Reason: ${assessment.reason}
Risk Factors: ${assessment.factors.join(', ')}
Best Shipping Line: ${assessment.shipping_line || 'N/A'}
Transit Time: ${assessment.transit_time || 'N/A'}
Transhipment Ports: ${assessment.transhipment ? assessment.transhipment.ports.join(', ') : 'N/A'}
Route Overview: ${assessment.route_overview || 'N/A'}
Latest News Used: ${assessment.headlines || 'N/A'}

The user will now ask follow-up questions about this route. Be concise, helpful, and professional.`
            },
            {
                role: 'assistant',
                content: `Understood. I've assessed the ${route} route as ${assessment.verdict} with a risk score of ${assessment.score}/100. I'm ready to answer any follow-up questions.`
            },
            ...history,
            {
                role: 'user',
                content: userMessage
            }
        ];

        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages
        });

        res.json({ reply: message.content[0].text });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});