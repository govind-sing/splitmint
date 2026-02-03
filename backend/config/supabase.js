const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL ? 'Loaded' : 'Missing');
// console.log('🔑 SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Loaded' : 'Missing');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;
