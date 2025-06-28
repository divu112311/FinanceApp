# OpenRouter Setup Guide

OpenRouter provides access to multiple AI models at competitive prices, including free credits for new users!

## Step 1: Create OpenRouter Account

1. Go to [openrouter.ai](https://openrouter.ai)
2. Click **Sign Up** (you can use Google/GitHub for quick signup)
3. Verify your email if required

## Step 2: Get Your API Key

1. Once logged in, go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Click **Create Key**
3. Give it a name like "LuxeFi App"
4. Copy the API key (starts with `sk-or-v1-`)

## Step 3: Add Credits (Optional)

OpenRouter often provides free credits for new users, but you can also:
1. Go to [openrouter.ai/credits](https://openrouter.ai/credits)
2. Add credits via credit card or crypto
3. Minimum is usually $5, which goes a long way!

## Step 4: Configure in Supabase

### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Secrets**
3. Click **Add Secret**
4. Set:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key (starts with `sk-or-v1-`)
5. Click **Save**

### Option B: Via Supabase CLI (if available locally)
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

## Step 5: Deploy Updated Function

You need to deploy the updated Edge Function that uses OpenRouter:

### Option A: Via Supabase CLI
```bash
supabase functions deploy chat-ai
```

### Option B: Via Dashboard
1. Go to Supabase dashboard → **Edge Functions**
2. Click on `chat-ai`
3. Replace the existing code with the new OpenRouter version
4. Click **Deploy**

## Step 6: Test the Integration

1. Go back to your LuxeFi app
2. Send a message in the chat
3. You should now get intelligent AI responses!

## Model Information

The function is configured to use `anthropic/claude-3.5-haiku` which is:
- ✅ Fast and responsive
- ✅ Cost-effective (~$0.25 per 1M input tokens)
- ✅ Great for conversational AI
- ✅ Excellent at following instructions

## Alternative Models

You can change the model in the Edge Function if needed:

### Budget-friendly options:
- `anthropic/claude-3.5-haiku` (current choice)
- `meta-llama/llama-3.1-8b-instruct:free` (free!)
- `microsoft/wizardlm-2-8x22b:nitro`

### Premium options:
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4o`
- `google/gemini-pro-1.5`

## Pricing Comparison

OpenRouter is typically much cheaper than direct OpenAI:
- **OpenAI GPT-4**: ~$30 per 1M tokens
- **Claude 3.5 Haiku**: ~$0.25 per 1M tokens
- **Free models**: $0 (with rate limits)

## Troubleshooting

### If you get "API key not configured":
- Double-check the secret name is exactly `OPENROUTER_API_KEY`
- Redeploy the function after adding the secret

### If you get "insufficient credits":
- Add credits to your OpenRouter account
- Or switch to a free model like `meta-llama/llama-3.1-8b-instruct:free`

### If responses are slow:
- Try a faster model like `anthropic/claude-3.5-haiku`
- Check OpenRouter status at [status.openrouter.ai](https://status.openrouter.ai)

## Benefits of OpenRouter

✅ **Much cheaper** than direct OpenAI API  
✅ **Multiple models** to choose from  
✅ **Free tier** available  
✅ **Same API format** as OpenAI  
✅ **Better rate limits** for most models  
✅ **Transparent pricing** with real-time costs  

## Next Steps

Once configured, your LuxeBot will provide intelligent, personalized financial advice using the power of Claude 3.5 Haiku at a fraction of the cost of GPT-4!

The AI will have full context of your user profile, goals, XP level, and conversation history for truly personalized responses.