# Team Creation Troubleshooting Guide

## Step 1: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try creating a team
4. Look for any red error messages

## Step 2: Check Network Requests

1. Go to Network tab in DevTools
2. Try creating a team
3. Look for POST request to `/api/teams/create`
4. Check:
   - Request Status (should be 200/201 for success)
   - Request Headers (should include Authorization)
   - Request Payload (should contain team data)
   - Response (should contain team object or error message)

## Step 3: Common Issues and Solutions

### Issue 1: "You are already in a team"

- **Cause**: User is already a member of another team
- **Solution**: Leave current team first, or use a different user account

### Issue 2: "Team name already exists"

- **Cause**: Another team with the same name exists
- **Solution**: Use a different team name

### Issue 3: "No token, authorization denied"

- **Cause**: User is not properly logged in
- **Solution**:
  1. Log out and log back in
  2. Check if JWT token exists in localStorage
  3. Verify token is not expired

### Issue 4: "Validation failed"

- **Cause**: Team data doesn't meet requirements
- **Solution**: Check:
  - Team name is 3-50 characters long
  - Description is under 200 characters
  - Max members is between 1-10

### Issue 5: Network/Connection Issues

- **Cause**: Backend server not running or unreachable
- **Solution**:
  1. Check if backend is running on port 5000
  2. Verify API_BASE_URL in frontend
  3. Check for CORS issues

## Step 4: Test with Known Good Data

Try creating a team with this data:

- Name: "Test Team"
- Description: "This is a test team"
- Max Members: 4

## Step 5: Check Backend Logs

Look at the backend terminal for any error messages when creating a team.

## Step 6: Database Check

If all else fails, check if the team was actually created in the database but the frontend didn't update properly.
