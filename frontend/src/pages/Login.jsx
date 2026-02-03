import React, { useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { token, setToken, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('full_name', response.data.user.full_name);
      localStorage.setItem('userId', response.data.user.id);
      
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.error || "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Relative UI Toast */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-rose-600 text-white text-xs font-black rounded-full shadow-2xl transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast.message}
      </div>

      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-emerald-100 mb-4 animate-bounce duration-2000">
            🍃
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">SplitMint</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share bills, not stress</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 space-y-5">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                required 
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            Sign In
          </button>

          <p className="text-center text-[11px] font-bold text-slate-400 pt-2 uppercase tracking-tight">
            New here? <Link to="/register" className="text-emerald-500 hover:text-emerald-600 transition-colors font-black">Create an account</Link>
          </p>
        </form>

        {/* Subtle Footer */}
        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          Securely managed by SplitMint v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;