# Project 9: L'Oréal Routine Builder

L’Oréal is expanding what’s possible with AI, and now your chatbot is getting smarter. This week, you’ll upgrade it into a product-aware routine builder.

Users will be able to browse real L’Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine—just like chatting with a real advisor.

## Cloudflare Worker Setup (Secure API Key)

This project now sends chat requests through a Cloudflare Worker instead of calling OpenAI directly from the browser.

### 1) Install Wrangler CLI

Run in terminal:

npm install -g wrangler

### 2) Login to Cloudflare

wrangler login

### 3) Add your OpenAI key as a Worker secret

wrangler secret put OPENAI_API_KEY

Paste your key when prompted.

### 4) Deploy the worker

wrangler deploy

After deploy, copy the Worker URL.

### 5) Set Worker URL in frontend

In script.js, update the workerUrl constant to your deployed URL.

Example:

https://your-worker-name.your-subdomain.workers.dev

### Security note

If an API key has ever been in frontend code (including secrets.js), treat it as exposed. Rotate that key in OpenAI dashboard and use only the new key in Cloudflare Worker secrets.
