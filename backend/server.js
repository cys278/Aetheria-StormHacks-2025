require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // parse JSON bodies

// Test endpoint
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// TODO: Add /api/converse endpoint

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
