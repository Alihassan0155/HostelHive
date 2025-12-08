import admin from "firebase-admin";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let firebaseApp;

// Check if Firebase is already initialized
if (admin.apps.length === 0) {
  try {
    // Option 1: Using environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log(
        "✅ Firebase Admin SDK initialized successfully with environment variables"
      );
      console.log(`   Project ID: ${serviceAccount.projectId}`);
    } else {
      // Option 2: Using service account JSON file
      const serviceAccountPath = join(
        __dirname,
        "../../serviceAccountKey.json"
      );
      try {
        const serviceAccount = JSON.parse(
          readFileSync(serviceAccountPath, "utf8")
        );
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(
          "✅ Firebase Admin SDK initialized successfully with service account file"
        );
      } catch (fileError) {
        // Option 3: Use default credentials (for Firebase Functions/App Engine/Cloud Run)
        try {
          firebaseApp = admin.initializeApp();
          console.log(
            "✅ Firebase Admin SDK initialized with default credentials"
          );
        } catch (defaultError) {
          console.error("❌ Failed to initialize Firebase Admin SDK");
          console.error(
            "📋 Missing configuration. Please ensure one of the following:"
          );
          console.error("   1. Set environment variables in .env file:");
          console.error("      - FIREBASE_PROJECT_ID");
          console.error("      - FIREBASE_PRIVATE_KEY");
          console.error("      - FIREBASE_CLIENT_EMAIL");
          console.error(
            "   2. Place serviceAccountKey.json in backend/ directory"
          );
          console.error(
            "   3. Use default credentials (Firebase Functions/App Engine)\n"
          );
          throw new Error(
            `Firebase Admin SDK initialization failed: ${defaultError.message}`
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error.message);
    throw error;
  }
} else {
  firebaseApp = admin.apps[0];
  console.log("✅ Firebase Admin SDK already initialized");
}

// Get Firestore instance from the initialized app
export const db = firebaseApp
  ? admin.firestore(firebaseApp)
  : admin.firestore();

// Get Auth instance from the initialized app
export const auth = firebaseApp ? admin.auth(firebaseApp) : admin.auth();

// Get Storage instance (optional) from the initialized app
export const storage = firebaseApp
  ? admin.storage(firebaseApp)
  : admin.storage();

export default firebaseApp;
