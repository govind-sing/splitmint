import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({ netBalances: {}, suggestions: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [activeSplits, setActiveSplits] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const [confirmState, setConfirmState] = useState({
    show: false,
    title: '',
    onConfirm: null,
    type: 'danger',
  });
  const [toast, setToast] = useState({ show: false, message: '' });

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setShowGroupMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  const fetchGroupData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [groupRes, balanceRes, expenseRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/expenses/balances/${groupId}`),
        api.get(`/expenses/group/${groupId}`),
      ]);
      setGroup(groupRes.data.group);
      setParticipants(groupRes.data.participants || []);
      setBalances(balanceRes.data);
      setExpenses(expenseRes.data || []);
    } catch (err) {
      if (!silent) showToast('Failed to load group data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const formatName = (p) => (p?.user_id === currentUserId ? 'You' : p?.name || 'Member');
  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const filteredExpenses = expenses.filter((exp) =>
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = expenses.reduce(
    (acc, curr) =>
      curr.description?.toLowerCase().includes('settlement') ? acc : acc + parseFloat(curr.amount || 0),
    0
  );

  const toggleExpense = async (e, id) => {
    e.stopPropagation();
    if (expandedExpenseId === id) {
      setExpandedExpenseId(null);
      return;
    }

    if (actionLoading === `splits-${id}`) return;

    setActionLoading(`splits-${id}`);
    try {
      const res = await api.get(`/expenses/${id}/splits`);
      setActiveSplits(res.data || []);
      setExpandedExpenseId(id);
    } catch (err) {
      showToast('Error loading expense details');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (actionLoading) return;
    setActionLoading(`delete-${expenseId}`);

    const previousExpenses = expenses;
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

    try {
      await api.delete(`/expenses/${expenseId}`);
      showToast('Expense deleted');
      fetchGroupData(true);
    } catch (err) {
      showToast('Failed to delete expense');
      setExpenses(previousExpenses);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettle = async (suggestion) => {
    const key = `settle-${suggestion.from}-${suggestion.to}`;
    if (actionLoading) return;
    setActionLoading(key);

    const previousSuggestions = balances.suggestions;
    setBalances((prev) => ({
      ...prev,
      suggestions: prev.suggestions.filter(
        (s) => !(s.from === suggestion.from && s.to === suggestion.to)
      ),
    }));

    try {
      await api.post('/expenses/settle', {
        groupId,
        fromId: suggestion.from,
        toId: suggestion.to,
        amount: suggestion.amount,
        fromName: formatName(participants.find((p) => p.id === suggestion.from)),  // ✅ fix
        toName: formatName(participants.find((p) => p.id === suggestion.to)),      // ✅ fix
      });

      showToast('Payment recorded!');
      setTimeout(() => fetchGroupData(true), 800);
    } catch (err) {
      showToast('Failed to record settlement');
      setBalances((prev) => ({
        ...prev,
        suggestions: previousSuggestions,
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (actionLoading) return;
    setActionLoading('delete-group');

    try {
      await api.delete(`/groups/${groupId}`);
      showToast('Group deleted');
      navigate('/dashboard');
    } catch (err) {
      showToast('Failed to delete group');
    } finally {
      setActionLoading(null);
    }
  };

  const triggerConfirm = (title, type, action) => {
    setConfirmState({
      show: true,
      title,
      type,
      onConfirm: async () => {
        await action();
        setConfirmState((prev) => ({ ...prev, show: false }));
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFC] text-slate-900 font-sans">
      {/* Mini Toast */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg transition-all duration-300 ${
          toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {toast.message}
      </div>

      {/* Confirmation Overlay */}
      {confirmState.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl p-6 w-full max-w-70 shadow-2xl animate-in zoom-in-95 duration-200">
            <p className="text-center font-bold text-slate-800 mb-6 text-sm">{confirmState.title}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmState({ ...confirmState, show: false })}
                className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmState.onConfirm}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  confirmState.type === 'danger'
                    ? 'bg-rose-500 shadow-rose-100 hover:bg-rose-600'
                    : 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600'
                } ${actionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {actionLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base font-bold tracking-tight">{group?.name || 'Group'}</h1>
          </div>
          <div className="flex gap-1 relative">
            <button
              onClick={() => navigate(`/group/${groupId}/add-expense`)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupMenu(!showGroupMenu);
              }}
              className="p-2 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {showGroupMenu && (
              <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl py-1 animate-in zoom-in-95 duration-150 ring-1 ring-black/5">
                <button
                  onClick={() =>
                    triggerConfirm('Delete this group permanently?', 'danger', handleDeleteGroup)
                  }
                  disabled={actionLoading === 'delete-group'}
                  className="w-full text-left px-4 py-3 text-[11px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  {actionLoading === 'delete-group' ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Total Spending Card */}
        <div className="bg-white p-7 rounded-4xl border border-slate-100 shadow-sm flex justify-between items-center overflow-hidden relative group cursor-default">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">Total Spending</p>
            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors duration-500">
              {formatINR(totalSpent)}
            </p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            ₹
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* Pending Debts */}
            <section className="bg-white rounded-4xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Pending Debts</h3>
              <div className="space-y-3">
                {balances.suggestions?.length > 0 ? (
                  balances.suggestions.map((s, i) => {
                    const settleKey = `settle-${s.from}-${s.to}`;
                    const isLoading = actionLoading === settleKey;
                    return (
                      <div
                        key={i}
                        className="p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all group/settle"
                      >
                        <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase leading-relaxed">
                          {formatName(participants.find((p) => p.id === s.from))}{' '}
                          <span className="text-emerald-300 font-black px-1">→</span>{' '}
                          {formatName(participants.find((p) => p.id === s.to))}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-emerald-600 text-sm">{formatINR(s.amount)}</span>
                          <button
                            onClick={() => triggerConfirm(`Settle ${formatINR(s.amount)}?`, 'success', () => handleSettle(s))}
                            disabled={isLoading}
                            className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-90 flex items-center gap-2 cursor-pointer ${
                              isLoading
                                ? 'bg-emerald-500/70 text-white border-emerald-500/70 cursor-not-allowed'
                                : 'bg-white border border-slate-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                            }`}
                          >
                            {isLoading && (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {isLoading ? 'Settling...' : 'Settle'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-slate-300 font-bold italic text-center py-2">All clear</p>
                )}
              </div>
            </section>

            {/* Net Status */}
            <section className="bg-white rounded-4xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Net Status</h3>
              <div className="space-y-4">
                {participants.map((p) => {
                  const bal = balances.netBalances?.[p.id] || 0;
                  return (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600 cursor-default">{formatName(p)}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          bal >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-400 bg-rose-50'
                        }`}
                      >
                        {bal >= 0 ? '+' : '-'}{formatINR(Math.abs(bal))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Ledger */}
          <div className="md:col-span-2">
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-7 py-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Ledger</h3>
                <input
                  placeholder="Search..."
                  className="bg-slate-50 text-[11px] font-bold px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 w-32 transition-all focus:w-44 border-none cursor-text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="divide-y divide-slate-50 min-h-50">
                {filteredExpenses.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm font-medium">
                    No expenses found
                  </div>
                ) : (
                  filteredExpenses.map((exp) => {
                    const isExpanded = expandedExpenseId === exp.id;
                    const isSettlement = exp.description?.toLowerCase().includes('settlement');
                    const deleteKey = `delete-${exp.id}`;
                    const splitsKey = `splits-${exp.id}`;
                    const isDeleting = actionLoading === deleteKey;
                    const isLoadingSplits = actionLoading === splitsKey;

                    return (
                      <div
                        key={exp.id}
                        className={`transition-all duration-300 ${
                          isExpanded ? 'bg-emerald-50/10' : 'hover:bg-slate-50/40'
                        }`}
                      >
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div
                            className="flex-1 flex items-center gap-4 cursor-pointer group/item"
                            onClick={(e) => toggleExpense(e, exp.id)}
                          >
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
                                isSettlement
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-50'
                                  : 'bg-slate-100 text-slate-400 group-hover/item:bg-slate-200 group-hover/item:text-slate-500'
                              } ${isLoadingSplits ? 'opacity-70' : ''}`}
                            >
                              {isLoadingSplits ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : isSettlement ? (
                                '✓'
                              ) : (
                                exp.description?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight mb-0.5">
                                {exp.description || 'Unnamed expense'}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                Paid by {formatName(participants.find((p) => p.id === exp.payer_id))}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 relative">
                            <span
                              className={`text-sm font-black ${isSettlement ? 'text-emerald-500' : 'text-slate-900'}`}
                            >
                              {formatINR(exp.amount)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === exp.id ? null : exp.id);
                              }}
                              className="p-2 text-slate-200 hover:text-slate-400 transition-colors active:scale-90 focus:outline-none cursor-pointer"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>

                            {activeMenuId === exp.id && (
                              <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-slate-100 shadow-2xl rounded-2xl py-1 z-30 animate-in zoom-in-95 duration-100 ring-1 ring-black/5">
                                <button
                                  onClick={() =>
                                    triggerConfirm('Delete this expense?', 'danger', () =>
                                      handleDeleteExpense(exp.id)
                                    )
                                  }
                                  disabled={isDeleting}
                                  className="w-full text-left px-4 py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3 shadow-inner">
                              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                                Split Breakdown
                              </p>
                              {activeSplits.length === 0 ? (
                                <div className="text-[11px] text-slate-400">No splits available</div>
                              ) : (
                                activeSplits.map((s, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center text-[11px] font-bold group/split"
                                  >
                                    <span className="text-slate-500 group-hover/split:text-slate-800 transition-colors">
                                      {s.name || 'Member'}
                                    </span>
                                    <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">
                                      {formatINR(s.amount)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetails;