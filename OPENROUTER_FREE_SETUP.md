# OpenRouter Free Setup Guide

OpenRouter provides FREE access to powerful AI models! Perfect for getting started without any costs.

## Step 1: Create Free OpenRouter Account

1. Go to [openrouter.ai](https://openrouter.ai)
2. Click **Sign Up** (completely free!)
3. You can use Google/GitHub for quick signup
4. No credit card required!

## Step 2: Get Your Free API Key

1. Once logged in, go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Click **Create Key**
3. Give it a name like "DoughJo App"
4. Copy the API key (starts with `sk-or-v1-`)

## Step 3: Free Models Available

OpenRouter offers several completely FREE models:

### Primary Model (Configured):
- **meta-llama/llama-3.1-8b-instruct:free**
  - 20 requests per minute
  - Excellent for conversational AI
  - Great at following instructions

### Backup Model (Auto-fallback):
- **google/gemma-2-9b-it:free**
  - Alternative if primary is rate-limited
  - Also completely free

### Other Free Options:
- `microsoft/phi-3-mini-128k-instruct:free`
- `microsoft/phi-3-medium-128k-instruct:free`
- `huggingfaceh4/zephyr-7b-beta:free`

## Step 4: Configure in Supabase

### Via Supabase Dashboard (Recommended):
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Secrets**
3. Click **Add Secret**
4. Set:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: Your OpenRouter API key (starts with `sk-or-v1-`)
5. Click **Save**

## Step 5: Deploy Updated Function

### Via Supabase Dashboard:
1. Go to **Edge Functions** → `chat-ai`
2. Replace the code with the updated version
3. Click **Deploy**

### Via CLI (if available locally):
```bash
supabase functions deploy chat-ai
```

## Step 6: Test Your Free AI!

1. Go back to your DoughJo app
2. Send a message in the chat
3. You should get intelligent AI responses - completely free!

## Rate Limits (Free Tier)

The free models have generous limits:
- **20 requests per minute** per model
- **Unlimited daily usage**
- **No credit card required**
- **No expiration**

If you hit the rate limit on one model, the function automatically tries the backup model!

## What You Get for FREE

✅ **Intelligent AI responses** tailored to your financial situation  
✅ **Personalized advice** based on your goals and XP level  
✅ **Context-aware conversations** that remember your history  
✅ **Multiple fallback models** for reliability  
✅ **No costs or credit card required**  

## Upgrade Options (Optional)

If you want even better responses later, you can:
- Add $5 credits to access premium models like Claude 3.5 Sonnet
- Use faster models with higher rate limits
- Access cutting-edge models like GPT-4o

But the free tier is perfect for getting started and provides excellent results!

## Troubleshooting

### "API key not configured":
- Double-check the secret name is exactly `OPENROUTER_API_KEY`
- Redeploy the function after adding the secret

### "Rate limit exceeded":
- The function automatically tries backup models
- Free tier allows 20 requests/minute per model
- Wait a minute and try again, or the backup model will kick in

### Slow responses:
- Free models may be slightly slower during peak times
- Still much faster than no AI at all!
- Consider upgrading to paid models for faster responses

## Why This is Amazing

You're getting access to:
- **Meta's Llama 3.1** - One of the best open-source AI models
- **Google's Gemma 2** - Advanced conversational AI
- **Completely free** - No hidden costs or trials
- **Production-ready** - Reliable for your app

Your DoughJo chatbot will now provide intelligent, personalized financial advice using state-of-the-art AI models - all for free!