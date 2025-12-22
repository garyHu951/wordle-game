const express = require('express');
const app = express();
const PORT = 3002;

app.get('/', (req, res) => {
  res.send('Old version server is running!');
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});
