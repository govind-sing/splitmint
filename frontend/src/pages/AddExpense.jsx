import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitMode, setSplitMode] = useState('equal');
  const [values, setValues] = useState({});
  
  // Custom UI State
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setParticipants(res.data.participants);
        if (res.data.participants.length > 0) setPayerId(res.data.participants[0].id);
      } catch (err) {
        console.error("Error fetching participants", err);
      }
    };
    fetchParticipants();
  }, [groupId]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const splitDetails = participants.map(p => ({
      participantId: p.id,
      value: splitMode === 'equal' ? 0 : parseFloat(values[p.id] || 0)
    }));

    try {
      await api.post('/expenses/add', {
        groupId,
        description,
        totalAmount: parseFloat(amount),
        payerId,
        splitMode,
        splitDetails
      });
      navigate(`/group/${groupId}`, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.error || "Error adding expense");
    }
  };

  const formatName = (p) => {
    const currentUserId = localStorage.getItem('userId');
    return p?.user_id === currentUserId ? "You" : p?.name;
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] text-slate-900 font-sans p-4 sm:p-8 flex flex-col items-center">
      
      {/* Relative UI Toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-rose-600 text-white text-xs font-bold rounded-full shadow-2xl transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast.message}
      </div>

      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button 
          onClick={() => navigate(`/group/${groupId}`)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">New Expense</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter transaction details</p>
          </div>

          <div className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Description</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 transition-all outline-none"
                placeholder="What was this for?" 
                onChange={e => setDescription(e.target.value)} 
                required 
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">₹</span>
                <input 
                  type="number" 
                  className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-lg font-black focus:bg-white focus:border-emerald-500/20 transition-all outline-none"
                  placeholder="0" 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Payer & Mode Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Paid By</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black appearance-none outline-none cursor-pointer"
                  value={payerId} 
                  onChange={e => setPayerId(e.target.value)}
                >
                  {participants.map(p => <option key={p.id} value={p.id}>{formatName(p)}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Split</label>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black appearance-none outline-none cursor-pointer"
                  value={splitMode} 
                  onChange={e => setSplitMode(e.target.value)}
                >
                  <option value="equal">Equally</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="custom">Amount (₹)</option>
                </select>
              </div>
            </div>

            {/* Split Details Box */}
            {splitMode !== 'equal' && (
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic text-center">Enter {splitMode} for each</p>
                <div className="space-y-3">
                  {participants.map(p => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">{formatName(p)}</span>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">
                          {splitMode === 'percentage' ? '%' : '₹'}
                        </span>
                        <input 
                          type="number" 
                          className="w-24 pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-right outline-none focus:border-emerald-500/30 transition-all"
                          placeholder="0"
                          onChange={e => setValues({...values, [p.id]: e.target.value})}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            Save Expense
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;