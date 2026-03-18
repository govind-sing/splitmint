const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');

// 1. REGISTER
router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  // 2. Create a profile entry in the 'profiles' table
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: authData.user.id, 
          email: email,
          full_name: fullName 
        }
      ]);

    if (profileError) return res.status(400).json({ error: profileError.message });
  }

  res.status(201).json({ message: "Signup successful! Profile created.", user: authData.user });
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });
  
  // This 'session.access_token' is what you need for Postman
  res.status(200).json({ 
    token: data.session.access_token, 
    user: data.user 
  });
});


router.get('/me', protect, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(400).json(error);
  res.json(data);
});

module.exports = router;