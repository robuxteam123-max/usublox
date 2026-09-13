const express = require('express');
const path = require('path');
const app = express();

// Render assigns a dynamic port via process.env.PORT
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'INDEX.HTML'));
});

app.listen(PORT, () => {
  console.log(`Usublox server listening on port ${PORT}`);
});
