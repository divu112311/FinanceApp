# Supabase Setup Guide

If you're seeing issues with Supabase configuration, follow these steps to properly set up your environment.

## 1. Check Your Environment Variables

The application requires proper Supabase credentials to function correctly. You need to set:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 2. Create a .env File

1. Copy the `.env.example` file to create a new `.env` file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Get Your Supabase Credentials

If you don't have your Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Go to Project Settings > API
4. Copy the "Project URL" and "anon public" key

## 4. Restart Your Development Server

After updating your environment variables, restart your development server:

```
npm run dev
```

## 5. Verify Configuration

To verify your Supabase configuration is working:

1. Open your browser console
2. Look for the "=== SUPABASE CONFIGURATION ===" log
3. Check that "Valid Credentials" shows "true"

## 6. Troubleshooting

If you're still having issues:

1. **Invalid URL Format**: Make sure your Supabase URL starts with `https://` and ends with `.supabase.co`
2. **Invalid Key Format**: The anon key should be a long string starting with "eyJ..."
3. **Environment Variables Not Loading**: Try closing and reopening your terminal/editor
4. **Browser Cache Issues**: Try clearing your browser cache or using incognito mode

## 7. Using the Supabase CLI

For advanced configuration using the Supabase CLI:

1. Install the CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Set secrets for Edge Functions:
   ```
   supabase secrets set OPENROUTER_API_KEY=your-key-here
   supabase secrets set PLAID_CLIENT_ID=your-id-here
   supabase secrets set PLAID_SECRET=your-secret-here
   supabase secrets set PLAID_ENV=sandbox
   ```

## 8. Connect to Supabase Button

The easiest way to set up Supabase is to use the "Connect to Supabase" button in the top right of the StackBlitz editor. This will guide you through connecting to your Supabase project.