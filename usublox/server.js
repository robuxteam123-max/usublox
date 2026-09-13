const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Server-side memory storage for registered users
const users = {};

// Register API
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid username and password required.' });
  }

  const key = username.toLowerCase().trim();
  if (users[key]) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  users[key] = { username: username.trim(), password: String(password) };
  return res.json({ success: true, username: users[key].username });
});

// Strict Login Verification API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const key = username.toLowerCase().trim();
  const user = users[key];

  // Block login if user does not exist OR password does not match exactly
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  return res.json({ success: true, username: user.username });
});

// Route handler with anti-caching headers
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
