# 🛡️ LogiShield — AI-Powered Shipping Route Risk Analyzer

> Real-time maritime risk intelligence powered by Claude AI, live news, and Wikipedia port imagery.

**Live Demo:** [https://logi-shield-dashboard.vercel.app](https://logi-shield-dashboard.vercel.app)

---

## What is LogiShield?

LogiShield is a one-page web application that lets users assess the risk of any global shipping route in seconds. Enter a route (e.g. "Red Sea - Suez Canal") and instantly receive:

- 🔴🟡🟢 **Risk verdict** (Safe / At Risk) with a 0–100 score
- 📡 **Live news headlines** used in the analysis (with clickable links)
- 🚢 **Best shipping line** recommendation
- ⏱️ **Approximate transit time**
- 🔀 **Transhipment ports**
- 🗺️ **Route overview**
- 📏 **Shipping distance** in Nautical Miles and Kilometers
- 🖼️ **Port images** fetched from Wikipedia
- 💬 **AI follow-up chat** with full conversation memory

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Live News | NewsAPI |
| Port Images | Wikipedia API (free, no key needed) |
| Deployment | Vercel |

---

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org) v18 or higher — verify with `node --version`
- [Git](https://git-scm.com) — verify with `git --version`
- A free [Anthropic API key](https://console.anthropic.com)
- A free [NewsAPI key](https://newsapi.org)

---

## Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/sahilsanghai3/LogiShield-Dashboard.git
cd LogiShield-Dashboard
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs:
- `express` — local web server
- `@anthropic-ai/sdk` — Claude AI client
- `dotenv` — loads environment variables

### Step 3 — Configure environment variables

Create a `.env` file in the root of the project:

```bash
# On Windows (PowerShell)
New-Item .env

# On Mac/Linux
touch .env
```

Open the `.env` file and add your API keys:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEWS_API_KEY=your_newsapi_key_here
```

**How to get your API keys:**

- **Anthropic API Key:** Go to [https://console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
- **NewsAPI Key:** Go to [https://newsapi.org](https://newsapi.org) → Get API Key → Sign up for free

> ⚠️ Never share your `.env` file or commit it to GitHub. It is already listed in `.gitignore`.

### Step 4 — Run locally

```bash
node server.js
```

You should see:

```
Server running at http://localhost:3000
```

Open your browser and go to: **http://localhost:3000**

---

## Project Structure

```
LogiShield-Dashboard/
├── public/
│   └── index.html        # Frontend (single page app)
├── server.js             # Backend (Express + Claude API)
├── .env                  # API keys (not committed to GitHub)
├── .gitignore            # Ignores node_modules and .env
├── package.json          # Project dependencies
├── vercel.json           # Vercel deployment config
└── README.md             # This file
```

---

## How It Works

1. User enters a shipping route in the text box
2. The frontend sends the route to `/assess` on the Express server
3. The server simultaneously:
   - Fetches **live news headlines** from NewsAPI
   - Extracts **port names** using Claude AI
   - Fetches **port images** from Wikipedia API
4. Claude AI receives the route + live news and returns a structured JSON risk assessment
5. The result is displayed on the frontend with images, score, info boxes, and clickable news links
6. Users can ask **follow-up questions** via the chat box — full conversation history is sent to Claude on each message (multi-turn memory)

---

## Deployment on Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2 — Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Select your `LogiShield-Dashboard` repository
4. Leave all settings as default (Framework: Other)
5. Click **Deploy**

### Step 3 — Add environment variables on Vercel

1. Go to your project on Vercel → **Settings** → **Environment Variables**
2. Add the following:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `NEWS_API_KEY` | Your NewsAPI key |

3. Click **Redeploy** to apply the variables

Your app will be live at a URL like: `https://your-project-name.vercel.app`

---

## AI Concepts Used

| Concept | Implementation |
|---|---|
| **Retrieval-Augmented Generation (RAG)** | Live news headlines are fetched and injected into Claude's prompt before generating the risk assessment |
| **Multi-turn Conversation** | Full chat history is sent to Claude on every follow-up message, enabling contextual memory |
| **Structured JSON Output** | Claude is prompted to return strict JSON, which is parsed and rendered dynamically |
| **Prompt Engineering** | System prompts define Claude's role as a maritime risk analyst with specific output constraints |
| **Tool Chaining** | Port extraction, image fetching, news fetching, and risk assessment run in parallel using `Promise.all` |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/assess` | Assess a shipping route — returns risk verdict, score, factors, info boxes, port images, and news |
| `POST` | `/chat` | Send a follow-up message — returns Claude's reply with full conversation context |

---

## Disclaimer

LogiShield is for **informational and educational purposes only**. Results may be incomplete, approximate, or inaccurate. Users rely on this tool at their own risk. This tool does not constitute professional, legal, financial, or operational advice.

---

## Author

**Sahil Sanghai** — UNC Kenan-Flagler Business School  
Built as part of the Data Science & AI course bonus assignment.
