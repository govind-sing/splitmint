import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [groupRes, profileRes] = await Promise.all([
          api.get('/groups/my-groups'),
          api.get('/auth/me') 
        ]);
        setGroups(groupRes.data);
        setUserData(profileRes.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      }
    };
    if (token) fetchDashboardData();
  }, [token]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#F9FBFC] text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex justify-between items-center bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-white/20">
          <div className="px-4 py-2">
            <h1 className="text-2xl font-black tracking-tight text-emerald-600">SplitMint</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Hi, <span className="text-slate-700">{userData?.full_name?.split(' ')[0]}</span> 👋
            </p>
          </div>
          <button 
            onClick={logout} 
            className="px-5 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 uppercase tracking-widest"
          >
            Logout
          </button>
        </header>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Groups</p>
              <p className="text-3xl font-black text-slate-900">{groups.length}</p>
            </div>
            <div className="text-4xl opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">📁</div>
          </div>
          
          <Link 
            to="/create-group" 
            className="bg-emerald-500 p-6 rounded-4xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 active:scale-[0.98] group"
          >
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:rotate-90 transition-transform duration-300">+</div>
            <span className="text-white font-black text-sm uppercase tracking-widest">Create New Group</span>
          </Link>
        </div>

        {/* Group List Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your Ledgers</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map(group => (
              <Link 
                to={`/group/${group.id}`} 
                key={group.id} 
                className="group bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors font-black text-xl shadow-inner">
                    {group.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-emerald-600 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">View Details</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="bg-white rounded-4xl border-2 border-dashed border-slate-100 p-16 text-center space-y-4">
              <div className="text-5xl opacity-20">🍃</div>
              <p className="text-sm font-bold text-slate-400 italic">No groups found. Time to split some bills!</p>
              <Link to="/create-group" className="inline-block text-xs font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-colors">
                + Create your first group
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;