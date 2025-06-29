# Chatbot Debugging Guide

## Overview

The DoughJo AI chatbot is designed to provide personalized financial advice based on the user's actual financial data. If the chatbot is showing incorrect information (like 0 balance when accounts have balances), this guide will help you troubleshoot the issue.

## Common Issues and Solutions

### 1. Chatbot Shows Zero Balance

If the chatbot is showing $0 balance when the user has connected accounts with balances:

#### Possible Causes:

1. **Data Access Issues**
   - The Edge Function might not have proper permissions to access bank account data
   - The function might be using the anon key instead of the service role key

2. **Data Fetching Issues**
   - The query to fetch bank accounts might be incorrect
   - The account data might be in a different format than expected

3. **Data Processing Issues**
   - The balance calculation might be incorrect
   - The function might not be handling null values properly

#### Solutions:

1. **Fixed Service Role Key Usage**
   - Updated the Edge Function to use the service role key for admin access
   - This ensures the function can access all user data regardless of RLS policies

2. **Enhanced Data Logging**
   - Added detailed logging of account data in the Edge Function
   - This helps identify if accounts are being fetched correctly

3. **Improved Data Processing**
   - Fixed the balance calculation to handle both account_subtype and subtype fields
   - Added better error handling for missing or null values

4. **Updated Fallback Responses**
   - Enhanced fallback responses to include actual account data
   - This ensures users get personalized responses even if the AI model fails

### 2. Chatbot Not Referencing User Data

If the chatbot isn't mentioning the user's goals, accounts, or other personal data:

#### Possible Causes:

1. **Context Building Issues**
   - The system prompt might not include enough user context
   - The user data might not be properly formatted in the prompt

2. **AI Model Issues**
   - The model might be ignoring parts of the system prompt
   - The token limit might be exceeded, causing context truncation

#### Solutions:

1. **Enhanced System Prompt**
   - Restructured the system prompt to emphasize user data
   - Added explicit instructions to reference user's actual financial data

2. **Improved Context Building**
   - Added more detailed user context including account names and balances
   - Formatted financial data for better readability in the prompt

### 3. Debugging Steps

If you're still experiencing issues:

1. **Check Edge Function Logs**
   - Go to Supabase Dashboard > Edge Functions > chat-ai > Logs
   - Look for errors or warnings in the logs
   - Check if account data is being properly fetched and formatted

2. **Verify Database Access**
   - Ensure the service role key has proper permissions
   - Check that bank_accounts table has the expected data
   - Verify that RLS policies aren't blocking access

3. **Test with Sample Data**
   - Try sending a message that specifically asks about account balances
   - Check if the response includes the correct information

## Recent Fixes

The following fixes have been implemented:

1. **Service Role Key Usage**
   - Now using SUPABASE_SERVICE_ROLE_KEY for admin access to all data
   - This bypasses RLS policies that might restrict data access

2. **Enhanced Data Logging**
   - Added detailed logging of account data in the Edge Function
   - This helps identify if accounts are being fetched correctly

3. **Improved Data Processing**
   - Fixed the balance calculation to handle both account_subtype and subtype fields
   - Added better error handling for missing or null values

4. **Updated Fallback Responses**
   - Enhanced fallback responses to include actual account data
   - This ensures users get personalized responses even if the AI model fails

These changes should resolve the issue of the chatbot showing incorrect balance information.