const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  // 1. Bearer token
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  // 2. Verify token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token is invalid' });
  }

  // 3. Attach the user to the request object
  req.user = user;
  next();
};

module.exports = { protect };