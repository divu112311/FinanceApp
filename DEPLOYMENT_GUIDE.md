# Edge Function Deployment Guide

## Prerequisites
You'll need to do this from your local machine (not in this browser environment) because the Supabase CLI needs to be installed locally.

## Step 1: Install Supabase CLI

### On macOS:
```bash
brew install supabase/tap/supabase
```

### On Windows:
```bash
# Using Chocolatey
choco install supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### On Linux:
```bash
# Download and install
curl -fsSL https://supabase.com/install.sh | sh
```

### Alternative (npm - works on all platforms):
```bash
npm install -g supabase
```

## Step 2: Login to Supabase
```bash
supabase login
```
This will open your browser to authenticate with Supabase.

## Step 3: Get Your Project Reference
1. Go to your Supabase dashboard at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > General
4. Copy your "Reference ID" (it looks like: `abcdefghijklmnop`)

## Step 4: Link Your Local Project
```bash
# Navigate to your project directory
cd path/to/your/luxefi-project

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REFERENCE_ID
```

## Step 5: Deploy the Edge Function
```bash
# Deploy the chat-ai function
supabase functions deploy chat-ai
```

## Step 6: Set Your OpenAI API Key
```bash
# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Step 7: Test the Function
You can test the function directly:
```bash
# Test the function
supabase functions invoke chat-ai --data '{"message": "Hello", "userId": "test-user-id"}'
```

## Troubleshooting

### If you get permission errors:
```bash
# Deploy with no JWT verification for testing
supabase functions deploy chat-ai --no-verify-jwt
```

### To check function logs:
```bash
# View real-time logs
supabase functions logs chat-ai --follow
```

### To list all functions:
```bash
supabase functions list
```

### If deployment fails:
1. Make sure you're in the correct directory (where `supabase/functions/chat-ai/index.ts` exists)
2. Check that your project is properly linked: `supabase status`
3. Verify your authentication: `supabase auth status`

## Alternative: Manual Deployment via Dashboard

If CLI doesn't work, you can also deploy via the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" in the sidebar
3. Click "Create Function"
4. Name it `chat-ai`
5. Copy and paste the code from `supabase/functions/chat-ai/index.ts`
6. Click "Deploy"
7. Go to Settings > Secrets and add `OPENAI_API_KEY`

## Verification

After deployment, your Edge Function will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-ai
```

The app will automatically start using the deployed function for AI responses!