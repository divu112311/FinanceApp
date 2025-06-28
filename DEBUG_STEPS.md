# Debugging Edge Function Issues

Since you've added the OpenAI API key but it's still not working, let's debug step by step:

## Step 1: Check Edge Function Logs

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions**
3. Click on `chat-ai`
4. Go to the **Logs** tab
5. Send a test message in your app
6. Check what appears in the logs

## Step 2: Redeploy the Function

The updated function now has better logging. You need to redeploy it:

### Option A: Via Supabase CLI (if available locally)
```bash
supabase functions deploy chat-ai
```

### Option B: Via Dashboard
1. Go to Supabase dashboard → Edge Functions
2. Click on `chat-ai`
3. Replace the code with the updated version from this project
4. Click **Deploy**

## Step 3: Verify API Key Format

Make sure your OpenAI API key:
- Starts with `sk-`
- Is the correct length (usually 51 characters)
- Has no extra spaces or characters

## Step 4: Check OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Check **Usage** to see if API calls are being made
3. Verify you have available credits/billing set up
4. Check if there are any API key restrictions

## Step 5: Test Function Directly

You can test the function directly in Supabase:

1. Go to Edge Functions → `chat-ai`
2. Click **Invoke Function**
3. Use this test payload:
```json
{
  "message": "Hello, how can you help me?",
  "userId": "test-user-id"
}
```

## Step 6: Common Issues & Solutions

### Issue: "OpenAI API key not configured"
- **Solution**: Double-check the secret name is exactly `OPENAI_API_KEY`
- **Solution**: Redeploy the function after adding the secret

### Issue: "OpenAI API error: 401"
- **Solution**: Your API key is invalid or expired
- **Solution**: Generate a new API key from OpenAI

### Issue: "OpenAI API error: 429"
- **Solution**: You've hit rate limits or ran out of credits
- **Solution**: Check your OpenAI billing and usage

### Issue: Function times out
- **Solution**: The model might be too slow, try `gpt-4o-mini` instead of `gpt-4`

## Step 7: What to Look For in Logs

After sending a test message, you should see logs like:
```
Edge function called with method: POST
Received message: [your message] for user: [user-id]
Fetching user context...
User data fetched: {...}
OpenAI API key available: true
Calling OpenAI API...
OpenAI response status: 200
OpenAI response received
Sending response back to client
```

If you see different logs, that tells us where the issue is!

## Step 8: Temporary Workaround

If the OpenAI integration still doesn't work, the app will fall back to contextual responses that are still quite good. The function has been updated to provide better fallback responses while we debug the OpenAI integration.

Let me know what you see in the logs and we can fix the specific issue!