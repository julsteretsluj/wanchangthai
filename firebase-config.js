/**
 * Firebase configuration for Wan Chang Thai leaderboard
 *
 * SAVE NOT WORKING? Common causes:
 * - Running from file:// — Use a local server: npx serve .  or  python3 -m http.server 8000
 * - Anonymous Auth disabled — Firebase Console → Authentication → Sign-in method → Anonymous → Enable
 * - Firestore not created — Firebase Console → Firestore Database → Create database
 * - Firestore rules blocking writes — Use rules below (Firestore → Rules)
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a project (or use existing)
 * 3. Add a Web app → Register app → Copy the config object
 * 4. Replace the placeholder below with your config
 * 5. Enable Anonymous Authentication: Authentication → Sign-in method → Anonymous → Enable
 * 6. Create Firestore Database: Firestore Database → Create database → Start in test mode (or use rules below)
 * 7. Create composite index - when you first load the leaderboard, Firestore may show an error
 *    with a link to create the required index (merit desc, createdAt desc). Click it to create.
 *
 * 8. (Optional) Firestore rules for leaderboard - in Firestore → Rules:
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /leaderboard/{docId} {
 *          allow read: if true;
 *          allow create: if request.auth != null;
 *          allow update, delete: if false;
 *        }
 *      }
 *    }
 */

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCeNET6RdZEhXsbvGyIVRSPev8joO4t8Fg',
  authDomain: 'wanchangthai-ada96.firebaseapp.com',
  projectId: 'wanchangthai-ada96',
  storageBucket: 'wanchangthai-ada96.firebasestorage.app',
  messagingSenderId: '138625287169',
  appId: '1:138625287169:web:e0ff17cf5f16433a4e6c00',
  measurementId: 'G-NRKC1C2HBF',
};

// Set to true when you've added your config (disables leaderboard if false)
const FIREBASE_ENABLED = true;

if (FIREBASE_ENABLED && typeof firebase !== 'undefined') {
  firebase.initializeApp(FIREBASE_CONFIG);
}
