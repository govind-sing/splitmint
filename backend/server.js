const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const serverless = require('serverless-http');

dotenv.config();

const groupRoutes = require('./routes/groupRoutes'); 
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();

// middleware
app.use(express.json());

app.use(cors());

// test route
app.get('/', (req, res) => {
  res.send('SplitMint API is running...');
});

// routes
app.use('/api/groups', groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// ❌ REMOVE app.listen (Lambda doesn't use ports)

// ✅ export handler for AWS Lambda
module.exports.handler = serverless(app);