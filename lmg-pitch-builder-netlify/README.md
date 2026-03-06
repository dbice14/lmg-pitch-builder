# LMG Pitch Builder — Netlify Deployment

## Quick Setup

1. **Push this folder to a GitHub repo** (or drag-drop to Netlify)

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repo

3. **Add your OpenAI API key:**
   - In Netlify dashboard → Site settings → Environment variables
   - Add: `OPENAI_API_KEY` = `sk-...your key...`
   - Click Save

4. **Deploy!** Netlify will auto-build and deploy.

## How It Works

- The frontend (public/index.html) makes requests to `/.netlify/functions/ai`
- The serverless function (netlify/functions/ai.mjs) securely proxies those requests to OpenAI
- Your API key never leaves the server — it's stored as a Netlify environment variable
- Uses `gpt-4o-mini` with web search for research, and regular chat completions for ad copy/taglines

## File Structure

```
netlify-pitch/
├── netlify.toml              # Netlify config
├── public/
│   └── index.html            # The pitch builder app
└── netlify/
    └── functions/
        └── ai.mjs            # Serverless proxy to OpenAI
```

## Cost

- gpt-4o-mini is very cheap (~$0.15 per million input tokens)
- Web search adds a small per-query cost
- A typical pitch (research + ad copy + tagline) costs roughly $0.01–0.03
