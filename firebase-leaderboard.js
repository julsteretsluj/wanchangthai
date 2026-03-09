/**
 * Firebase leaderboard for Wan Chang Thai
 */

(function () {
  if (typeof FIREBASE_ENABLED === 'undefined' || !FIREBASE_ENABLED) return;
  if (typeof firebase === 'undefined') return;

  const db = firebase.firestore();
  const auth = firebase.auth();
  const LEADERBOARD_COLLECTION = 'leaderboard';
  const LEADERBOARD_LIMIT = 20;

  let authReady = false;

  auth.onAuthStateChanged((user) => {
    authReady = true;
  });

  async function ensureAuth() {
    if (!authReady) {
      await new Promise((resolve) => {
        const unsub = auth.onAuthStateChanged(() => {
          unsub();
          resolve();
        });
      });
    }
    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }
    return auth.currentUser;
  }

  window.wanchangthaiLeaderboard = {
    async saveScore(data) {
      try {
        await ensureAuth();
        await db.collection(LEADERBOARD_COLLECTION).add({
          playerName: (data.playerName || 'Player').slice(0, 30),
          elephantName: (data.elephantName || 'Elephant').slice(0, 30),
          merit: data.merit || 0,
          level: data.level || 1,
          threatsDefeated: data.threatsDefeated || 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      } catch (err) {
        console.error('Leaderboard save failed:', err.message || err);
        if (err.code) console.error('Firebase error code:', err.code, '- Check Firebase Console setup.');
        return false;
      }
    },

    async getLeaderboard() {
      try {
        await ensureAuth();
        // Single orderBy avoids composite index requirement; secondary sort done in JS
        const snapshot = await db
          .collection(LEADERBOARD_COLLECTION)
          .orderBy('merit', 'desc')
          .limit(200)
          .get();

        const byName = new Map();
        for (const doc of snapshot.docs) {
          const d = doc.data();
          const name = (d.elephantName || '—').trim();
          const key = name.toLowerCase();
          const entry = {
            id: doc.id,
            playerName: d.playerName || name || '—',
            elephantName: name || '—',
            merit: d.merit || 0,
            level: d.level || 1,
            threatsDefeated: d.threatsDefeated || 0,
            createdAt: d.createdAt ? d.createdAt.toMillis ? d.createdAt.toMillis() : 0 : 0,
          };
          const existing = byName.get(key);
          if (!existing || entry.merit > existing.merit ||
              (entry.merit === existing.merit && entry.level > existing.level) ||
              (entry.merit === existing.merit && entry.level === existing.level && entry.createdAt > existing.createdAt)) {
            byName.set(key, entry);
          }
        }

        const unique = Array.from(byName.values())
          .sort((a, b) => b.merit - a.merit || b.level - a.level || b.createdAt - a.createdAt)
          .slice(0, LEADERBOARD_LIMIT);

        return unique.map((e, i) => ({ ...e, rank: i + 1 }));
      } catch (err) {
        console.error('Leaderboard fetch failed:', err.message || err);
        if (err.code) console.error('Firebase code:', err.code, '- Check Firestore rules allow read.');
        return { _error: err.message || String(err), _code: err.code };
      }
    },
  };
})();
