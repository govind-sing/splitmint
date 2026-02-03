import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState(['']); 
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '' });

  const loggedInUserName = localStorage.getItem('full_name');

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleAddParticipant = () => {
    if (participants.length < 3) {
      setParticipants([...participants, '']);
    } else {
      showToast("Maximum 3 guests allowed");
    }
  };

  const handleParticipantChange = (index, value) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const handleRemoveParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const participantNames = participants.filter(p => p.trim() !== '');
      
      const response = await api.post('/groups/create', { 
        name: groupName, 
        ownerName: loggedInUserName,
        participantNames 
      });

      navigate(`/group/${response.data.group.id}`, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.error || "Error creating group");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] text-slate-900 font-sans p-4 sm:p-8 flex items-center justify-center">
      
      {/* Mini Toast */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-full shadow-2xl transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast.message}
      </div>

      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 space-y-8">
          
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Create Group</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Start a new ledger</p>
          </div>

          <div className="space-y-6">
            {/* Group Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Group Name</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Goa Trip 2026"
                required
              />
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Members</label>
                <span className="text-[10px] font-bold text-slate-300 italic">{participants.length + 1}/4 Slots</span>
              </div>

              {/* Automatic User Entry (The "You" badge) */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group animate-in fade-in duration-500">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs font-black">Y</div>
                <span className="text-xs font-bold text-emerald-700">{loggedInUserName} (You)</span>
              </div>

              {/* Guest Inputs */}
              <div className="space-y-3">
                {participants.map((p, index) => (
                  <div key={index} className="flex gap-2 group animate-in slide-in-from-left-2 duration-300">
                    <input 
                      className="flex-1 px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-emerald-500/10 transition-all outline-none"
                      value={p}
                      onChange={(e) => handleParticipantChange(index, e.target.value)}
                      placeholder={`Guest ${index + 1} Name`}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveParticipant(index)}
                      className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Button */}
              {participants.length < 3 && (
                <button 
                  type="button" 
                  onClick={handleAddParticipant} 
                  className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all active:scale-[0.98]"
                >
                  + Add Another Guest
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              type="submit" 
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95"
            >
              Create Group
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;