import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const [loading, setLoading] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Redirect if logged in
  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });

      if (type === "success") navigate('/login');

    }, 2000);
  };

  const handleSignup = async (e) => {

    e.preventDefault();

    if (loading) return;

    try {

      setLoading(true);

      await api.post('/auth/signup', formData);

      showToast("Registration successful!", "success");

    } catch (err) {

      showToast(err.response?.data?.error || "Registration failed", "error");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex flex-col items-center justify-center p-6 font-sans">

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl text-white text-xs font-black animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center space-y-2">

          <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-sm mb-4">
            ✨
          </div>

          <h1 className="text-3xl font-black tracking-tighter text-slate-800">
            Join SplitMint
          </h1>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Start sharing bills today
          </p>

        </div>

        <form
          onSubmit={handleSignup}
          className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 space-y-5"
        >

          <p className="text-[10px] font-bold text-slate-300 italic text-center pb-2 uppercase tracking-tight">
            * Dummy emails allowed for testing
          </p>

          <div className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Full Name
              </label>

              <input
                placeholder="Full Name"
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>

              <input
                type="email"
                placeholder="test@example.com"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>

              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                required
              />
            </div>

          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2
            ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
            }`}
          >

            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}

            {loading ? "Creating account..." : "Create Account"}

          </button>

          <p className="text-center text-[11px] font-bold text-slate-400 pt-2 uppercase tracking-tight">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-emerald-500 hover:text-emerald-600 transition-colors font-black cursor-pointer"
            >
              Sign in here
            </Link>
          </p>

        </form>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          v1.0 • Built for transparency
        </p>

      </div>
    </div>
  );
};

export default Register;