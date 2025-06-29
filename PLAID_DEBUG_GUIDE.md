# Plaid Integration Debugging Guide

## Common Issues and Solutions

### 1. 400 Bad Request Error

This error typically occurs when there's an issue with the request parameters sent to Plaid.

#### Possible Causes and Solutions:

1. **Missing or Invalid Environment Variables**
   - Ensure `PLAID_CLIENT_ID` and `PLAID_SECRET` are correctly set in your Supabase Edge Function secrets
   - Verify `PLAID_ENV` is set to `sandbox`, `development`, or `production`
   - Check that `VITE_PLAID_ENV` is set in your frontend .env file

2. **Incorrect Products Configuration**
   - The error might be due to requesting products that aren't available in your Plaid account
   - In `plaid-link-token/index.ts`, we've simplified the products array to just `['transactions']`
   - Optional products are now limited to `['auth', 'investments']`

3. **Invalid User Information**
   - Ensure the user email is valid
   - Make sure the user ID exists in your database

### 2. Plaid Script Loading Issues

If the Plaid script isn't loading properly:

1. Check browser console for any script loading errors
2. Verify that `https://cdn.plaid.com/link/v2/stable/link-initialize.js` is accessible
3. We've added a script loading check in BankAccountManager.tsx

### 3. Token Exchange Failures

If you get a token but exchange fails:

1. Ensure the public token is being correctly passed to the exchange endpoint
2. Check that your Plaid credentials have the necessary permissions
3. Verify the institution and accounts data is properly formatted

## Testing in Sandbox Mode

For testing in Plaid's sandbox environment:

1. Use these test credentials:
   - Username: `user_good`
   - Password: `pass_good`

2. Other test accounts:
   - `user_custom` / `pass_good` - For custom accounts
   - `user_bad` / `pass_good` - For testing error flows

## Debugging Steps

1. **Check Environment Variables**
   ```bash
   # In Supabase Dashboard
   1. Go to Settings > API
   2. Verify your project URL and anon key are correct
   
   # For Edge Functions
   1. Go to Settings > API > Edge Functions
   2. Verify PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV are set
   ```

2. **Inspect Network Requests**
   - Open browser developer tools
   - Go to Network tab
   - Filter for requests to `plaid-link-token` and `plaid-exchange-token`
   - Check request/response data for errors

3. **Check Console Logs**
   - We've added extensive logging to help diagnose issues
   - Look for errors in the browser console
   - Check Edge Function logs in Supabase Dashboard

4. **Verify Database Permissions**
   - Ensure RLS policies allow the user to insert into bank_accounts table
   - Check that the service role key has proper permissions

## Next Steps

If you're still experiencing issues:

1. Try using the PlaidCredentialsModal which provides a more controlled testing environment
2. Check if your Plaid account has the necessary permissions for the products you're requesting
3. Verify that your Supabase Edge Functions are properly deployed and accessible