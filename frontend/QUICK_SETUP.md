# Quick Setup Guide

## The Error You're Seeing:
```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

This means your frontend doesn't have the Firebase Web App configuration.

## Quick Fix (2 minutes):

### Step 1: Get Firebase Web Config
1. Go to: https://console.firebase.google.com/project/hostelhive-5edc1/settings/general
2. Scroll to **"Your apps"** section
3. If no web app exists, click **"Add app"** → Select **Web (</>)** icon
4. Copy the `apiKey`, `messagingSenderId`, and `appId` values

### Step 2: Update frontend/.env
Open `frontend/.env` and replace:
- `YOUR_API_KEY_HERE` with your actual API key
- `YOUR_SENDER_ID_HERE` with your messaging sender ID  
- `YOUR_APP_ID_HERE` with your app ID

### Step 3: Restart Frontend
```bash
# Stop the server (Ctrl+C if running)
cd frontend
npm run dev
```

That's it! The login page should now work.

## Already Have a Web App?
If you already created a web app in Firebase Console, just copy the config values from there.

