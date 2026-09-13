const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// User storage (persists while application is running)
const users = {};

// Account Sign-Up Endpoint
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const key = username.toLowerCase();
  if (users[key]) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  users[key] = { username, password };
  res.json({ success: true, username });
});

// Account Login Endpoint (Strict Password Verification)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const key = username ? username.toLowerCase() : '';
  const user = users[key];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  res.json({ success: true, username: user.username });
});

// Catch-all route to serve lowercase index.html
app.get('*', (req, res) => {
  const rootIndex = path.join(__dirname, 'index.html');
  const publicIndex = path.join(__dirname, 'public', 'index.html');

  if (fs.existsSync(rootIndex)) return res.sendFile(rootIndex);
  if (fs.existsSync(publicIndex)) return res.sendFile(publicIndex);

  res.status(404).send('index.html missing');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
