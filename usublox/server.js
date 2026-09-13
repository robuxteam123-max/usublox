const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = 'usuadminpowers';

app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Storage
const users = {}; 
const sessions = {}; 

// Default Advertisements
let ads = [
  {
    id: 'ad_1',
    title: 'usuthebanna — YouTube',
    description: 'Check out usuthebanna on YouTube for awesome gaming content and updates!',
    url: 'https://www.youtube.com/@usuthebanna',
    icon: '📺',
    active: true
  },
  {
    id: 'ad_2',
    title: '@shootinggamenerf — YouTube',
    description: 'Subscribe to @shootinggamenerf on YouTube for intense nerf battles and reviews!',
    url: 'https://www.youtube.com/@shootinggamenerf',
    icon: '🎯',
    active: true
  }
];

// Leaderboards In-Memory Data
let leaderboards = {
  box: [
    { username: 'usuthebanna', score: 150 },
    { username: 'nerfmaster', score: 90 }
  ],
  clicker: [
    { username: 'nerfmaster', score: 125 },
    { username: 'usuthebanna', score: 80 }
  ]
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.body.adminKey;
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid Admin Key' });
  }
  next();
};

// ----------------- USER AUTH ROUTES ----------------- //

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid username and password required.' });
  }

  const key = username.toLowerCase().trim();
  if (users[key]) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  users[key] = { username: username.trim(), password: String(password), status: 'active' };
  sessions[key] = true;

  res.json({ success: true, username: users[key].username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const key = username.toLowerCase().trim();
  const user = users[key];

  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'This account has been banned by an administrator.' });
  }

  sessions[key] = true;
  res.json({ success: true, username: user.username, status: user.status });
});

// ----------------- PUBLIC LEADERBOARD ROUTES ----------------- //

app.get('/api/leaderboard', (req, res) => {
  res.json({ success: true, leaderboards });
});

app.post('/api/leaderboard/submit', (req, res) => {
  const { username, gameMode, score } = req.body;
  if (!username || !gameMode || score === undefined || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters.' });
  }

  if (!leaderboards[gameMode]) {
    return res.status(400).json({ error: 'Invalid game mode.' });
  }

  const existingEntry = leaderboards[gameMode].find(e => e.username.toLowerCase() === username.toLowerCase());

  if (existingEntry) {
    if (score > existingEntry.score) {
      existingEntry.score = score;
    }
  } else {
    leaderboards[gameMode].push({ username, score });
  }

  leaderboards[gameMode].sort((a, b) => b.score - a.score);
  leaderboards[gameMode] = leaderboards[gameMode].slice(0, 10); // Keep top 10

  res.json({ success: true, leaderboard: leaderboards[gameMode] });
});

// ----------------- PUBLIC ADS ROUTE ----------------- //

app.get('/api/ads', (req, res) => {
  const activeAds = ads.filter(ad => ad.active);
  res.json({ success: true, ads: activeAds });
});

// ----------------- ADMIN API ROUTES ----------------- //

app.post('/api/admin/auth', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Admin authenticated successfully.' });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const userList = Object.values(users).map(u => ({
    username: u.username,
    status: u.status,
    isLoggedIn: !!sessions[u.username.toLowerCase()]
  }));
  res.json({ success: true, users: userList });
});

app.post('/api/admin/users/action', requireAdmin, (req, res) => {
  const { targetUser, action } = req.body;
  const key = targetUser ? targetUser.toLowerCase().trim() : '';

  if (!users[key]) {
    return res.status(404).json({ error: 'User not found.' });
  }

  switch (action) {
    case 'ban':
      users[key].status = 'banned';
      delete sessions[key];
      break;
    case 'unban':
      users[key].status = 'active';
      break;
    case 'mute':
      users[key].status = 'muted';
      break;
    case 'unmute':
      users[key].status = 'active';
      break;
    case 'kick':
      delete sessions[key];
      break;
    default:
      return res.status(400).json({ error: 'Invalid action.' });
  }

  res.json({
    success: true,
    message: `User '${users[key].username}' action '${action}' applied successfully.`,
    user: { username: users[key].username, status: users[key].status }
  });
});

app.get('/api/admin/ads', requireAdmin, (req, res) => {
  res.json({ success: true, ads });
});

app.post('/api/admin/ads', requireAdmin, (req, res) => {
  const { title, description, url, icon } = req.body;
  if (!title || !description || !url) {
    return res.status(400).json({ error: 'Title, description, and link URL are required.' });
  }

  const newAd = {
    id: 'ad_' + Date.now(),
    title: title.trim(),
    description: description.trim(),
    url: url.trim(),
    icon: icon ? icon.trim() : '📢',
    active: true
  };

  ads.push(newAd);
  res.json({ success: true, ad: newAd, message: 'Advertisement created successfully.' });
});

app.put('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, url, icon, active } = req.body;

  const ad = ads.find(a => a.id === id);
  if (!ad) {
    return res.status(404).json({ error: 'Advertisement not found.' });
  }

  if (title !== undefined) ad.title = title.trim();
  if (description !== undefined) ad.description = description.trim();
  if (url !== undefined) ad.url = url.trim();
  if (icon !== undefined) ad.icon = icon.trim();
  if (active !== undefined) ad.active = Boolean(active);

  res.json({ success: true, ad, message: 'Advertisement updated successfully.' });
});

app.delete('/api/admin/ads/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const initialLength = ads.length;
  ads = ads.filter(a => a.id !== id);

  if (ads.length === initialLength) {
    return res.status(404).json({ error: 'Advertisement not found.' });
  }

  res.json({ success: true, message: 'Advertisement deleted successfully.' });
});

// Admin Route to Reset Leaderboards
app.post('/api/admin/leaderboard/reset', requireAdmin, (req, res) => {
  const { gameMode } = req.body;
  if (gameMode && leaderboards[gameMode]) {
    leaderboards[gameMode] = [];
  } else {
    leaderboards = { box: [], clicker: [] };
  }
  res.json({ success: true, message: 'Leaderboard reset successfully.' });
});

// Server Route Handler
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const rootIndex = path.join(__dirname, 'index.html');
  const publicIndex = path.join(__dirname, 'public', 'index.html');

  if (fs.existsSync(rootIndex)) return res.sendFile(rootIndex);
  if (fs.existsSync(publicIndex)) return res.sendFile(publicIndex);

  res.status(404).send('index.html missing');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
