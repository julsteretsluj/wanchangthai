# Wan Chang Thai — Protect the Elephant

A small browser game where you protect an elephant (ช้าง) named Wan Chang Thai: keep **Love**, **Hunger**, and **Health** high, and distract poachers with money or food.

## How to play

1. **Care for your elephant**
   - **Feed** — uses 1 food; increases Hunger and a little Love.
   - **Care** — increases Health and a little Love.
   - **Love** — increases Love and a little Health.

2. **When poachers appear**
   - **Pay them (20)** — spend 20 money to send them away.
   - **Lure away with food (1)** — spend 1 food to distract them.

3. **Resources**
   - You start with 100 money and 5 food.
   - Money and food increase slowly over time so you can keep playing.

4. **Goal**
   - Keep all three scales (Love, Hunger, Health) above zero. If any hits zero, the game ends.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server, for example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the URL shown (e.g. http://localhost:3000 or http://localhost:8000).

## Leaderboard (Firebase)

The game includes an optional Firebase leaderboard. To enable it:

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Add a Web app and copy the config
3. Edit `firebase-config.js` — paste your config and set `FIREBASE_ENABLED = true`
4. Enable **Anonymous Authentication** in Firebase
5. Create a **Firestore Database**
6. Set Firestore rules (see comments in `firebase-config.js`)

Scores are saved automatically when the game ends. Click the 🏆 button to view the leaderboard.
# wanchangthai
