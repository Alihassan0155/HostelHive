# How to Get Firebase Web App Config

## Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **hostelhive-5edc1**

2. **Get Web App Configuration**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select **"Project settings"**
   - Scroll down to **"Your apps"** section
   - If you don't have a web app yet:
     - Click **"Add app"** or the **</>** (web) icon
     - Register your app (name it "HostelHelp Web")
     - Click **"Register app"**
   - You'll see your Firebase configuration object

3. **Copy the Values**
   You'll see something like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "hostelhive-5edc1.firebaseapp.com",
     projectId: "hostelhive-5edc1",
     storageBucket: "hostelhive-5edc1.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```

4. **Update frontend/.env**
   Replace the values in `frontend/.env`:
   - `VITE_FIREBASE_API_KEY` = the `apiKey` value
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = the `messagingSenderId` value
   - `VITE_FIREBASE_APP_ID` = the `appId` value

5. **Restart Frontend Server**
   After updating `.env`, restart your frontend dev server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Quick Copy-Paste Format:

Once you have the config, update `frontend/.env` like this:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=hostelhive-5edc1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hostelhive-5edc1
VITE_FIREBASE_STORAGE_BUCKET=hostelhive-5edc1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

