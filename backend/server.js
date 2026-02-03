const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const groupRoutes = require('./routes/groupRoutes'); 
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();

app.use(express.json());

app.use(cors()); 

app.get('/', (req, res) => {
  res.send('SplitMint API is running...');
});

// Routes
app.use('/api/groups', groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});