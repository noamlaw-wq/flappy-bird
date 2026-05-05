'use strict';

const AUTH_USERS_KEY = 'fb_users';
const AUTH_SESSION_KEY = 'fb_session';
const AUTH_LEADERBOARD_KEY = 'fb_leaderboard';

async function hashPassword(password) {
  const data = new TextEncoder().encode(password + ':flappy_salt_v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '{}'); }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem(AUTH_SESSION_KEY) || null;
}

async function register(username, password, confirm) {
  username = username.trim();
  if (!username || username.length < 2) return { ok: false, error: 'שם משתמש חייב להכיל לפחות 2 תווים' };
  if (/[<>"'`]/.test(username)) return { ok: false, error: 'שם המשתמש מכיל תווים לא חוקיים' };
  if (!password || password.length < 4) return { ok: false, error: 'סיסמה חייבת להכיל לפחות 4 תווים' };
  if (password !== confirm) return { ok: false, error: 'הסיסמאות אינן תואמות' };

  const users = getUsers();
  if (users[username]) return { ok: false, error: 'שם המשתמש כבר תפוס' };

  const passwordHash = await hashPassword(password);
  users[username] = { passwordHash, highScore: 0 };
  saveUsers(users);
  localStorage.setItem(AUTH_SESSION_KEY, username);
  return { ok: true };
}

async function login(username, password) {
  username = username.trim();
  if (!username || !password) return { ok: false, error: 'נא למלא את כל השדות' };

  const users = getUsers();
  if (!users[username]) return { ok: false, error: 'שם משתמש לא נמצא' };

  const hash = await hashPassword(password);
  if (hash !== users[username].passwordHash) return { ok: false, error: 'סיסמה שגויה' };

  localStorage.setItem(AUTH_SESSION_KEY, username);
  return { ok: true };
}

function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getUserHighScore(username) {
  const users = getUsers();
  return (users[username] && users[username].highScore) || 0;
}

function updateHighScore(username, score) {
  const users = getUsers();
  if (!users[username]) return false;
  const prev = users[username].highScore || 0;
  if (score <= prev) return false;
  users[username].highScore = score;
  saveUsers(users);
  _syncLeaderboard(username, score);
  return true;
}

function _syncLeaderboard(username, score) {
  let lb = getLeaderboard();
  const idx = lb.findIndex(e => e.username === username);
  if (idx >= 0) {
    lb[idx].score = Math.max(lb[idx].score, score);
  } else {
    lb.push({ username, score });
  }
  lb.sort((a, b) => b.score - a.score);
  lb = lb.slice(0, 10);
  localStorage.setItem(AUTH_LEADERBOARD_KEY, JSON.stringify(lb));
}

function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem(AUTH_LEADERBOARD_KEY) || '[]'); }
  catch { return []; }
}
