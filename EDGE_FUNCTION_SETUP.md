# Edge Function Configuration

Since you already have the `chat-ai` function deployed in Supabase, you just need to configure it with your OpenAI API key.

## Step 1: Add OpenAI API Key to Supabase

### Option A: Via Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Secrets**
3. Click **Add Secret**
4. Set:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key (starts with `sk-`)
5. Click **Save**

### Option B: Via Supabase CLI (if you have it installed locally)
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

## Step 2: Get Your OpenAI API Key

If you don't have an OpenAI API key yet:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** in the sidebar
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-`)
6. Add it to your Supabase secrets (Step 1 above)

## Step 3: Test the Function

Once you've added the API key:

1. Go back to your LuxeFi app
2. Try sending a message in the chat
3. You should now get intelligent AI responses instead of generic ones!

## Step 4: Monitor Function Performance

You can monitor your Edge Function:

1. In Supabase dashboard, go to **Edge Functions**
2. Click on `chat-ai`
3. View logs and performance metrics
4. Check for any errors in the **Logs** tab

## Troubleshooting

### If AI responses aren't working:
1. Check that the `OPENAI_API_KEY` secret is properly set
2. Verify your OpenAI account has credits/billing set up
3. Look at the Edge Function logs for error messages

### If you see "fallback responses":
- This means the OpenAI API isn't responding
- Check your API key and OpenAI account status
- The app will still work with contextual fallback responses

### To check if everything is working:
- Send a message like "Help me with my budget"
- You should get a personalized response that mentions your name, level, and goals
- If you get a generic response, the API key might not be configured correctly

## What Happens Next

Once configured, your LuxeBot will:
- ✅ Provide personalized financial advice
- ✅ Remember your conversation history
- ✅ Reference your goals and progress
- ✅ Adapt responses to your XP level
- ✅ Give contextual, intelligent answers

The AI has full access to your user profile, goals, XP level, and chat history for truly personalized responses!