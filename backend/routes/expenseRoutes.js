const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');

// add expense to a group with split logic
router.post('/add', protect, async (req, res) => {
  const { groupId, description, totalAmount, payerId, splitMode, splitDetails } = req.body;

  // 1. Insert the main Expense record
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .insert([{ 
      group_id: groupId, 
      description, 
      amount: totalAmount, 
      payer_id: payerId 
    }])
    .select().single();

  if (expError) return res.status(400).json(expError);

  let splits = [];

  // 2. The Split Engine Logic
  if (splitMode === 'equal') {
    const share = (totalAmount / splitDetails.length).toFixed(2);
    splits = splitDetails.map(item => ({
      expense_id: expense.id,
      participant_id: item.participantId,
      share_amount: share
    }));
  } 
  else if (splitMode === 'percentage') {
    splits = splitDetails.map(item => ({
      expense_id: expense.id,
      participant_id: item.participantId,
      share_amount: ((item.value / 100) * totalAmount).toFixed(2)
    }));
  } 
  else if (splitMode === 'custom') {
    splits = splitDetails.map(item => ({
      expense_id: expense.id,
      participant_id: item.participantId,
      share_amount: item.value.toFixed(2)
    }));
  }

  // 3. Rounding Errors 
  const totalCalculated = splits.reduce((sum, s) => sum + parseFloat(s.share_amount), 0);
  const difference = totalAmount - totalCalculated;
  if (Math.abs(difference) > 0) {
    splits[0].share_amount = (parseFloat(splits[0].share_amount) + difference).toFixed(2);
  }

  // 4. Save splits to the database
  const { error: splitError } = await supabase
    .from('expense_splits')
    .insert(splits);

  if (splitError) return res.status(400).json(splitError);

  res.status(201).json({ message: "Expense added and split successfully!", expenseId: expense.id });
});

// Calculate Balances & Settlements

router.get('/balances/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;

  // 1. Fetch data
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, payer_id')
    .eq('group_id', groupId);

  if (!expenses || expenses.length === 0) {
    return res.json({ netBalances: {}, suggestions: [] });
  }

  const expenseIds = expenses.map(e => e.id);
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('participant_id, share_amount')
    .in('expense_id', expenseIds);

  // 2. Compute Net Balances per Participant
  let balances = {}; 

  expenses.forEach(exp => {
    balances[exp.payer_id] = (balances[exp.payer_id] || 0) + parseFloat(exp.amount);
  });

  splits.forEach(split => {
    balances[split.participant_id] = (balances[split.participant_id] || 0) - parseFloat(split.share_amount);
  });

  // 3. Minimal Settlement Algorithm
  let creditors = []; // Owed money (+)
  let debtors = [];   // Owe money (-)

  Object.keys(balances).forEach(id => {
    const bal = parseFloat(balances[id].toFixed(2));
    if (bal > 0.01) creditors.push({ id, amount: bal });
    else if (bal < -0.01) debtors.push({ id, amount: Math.abs(bal) });
  });

  let settlements = [];
  while (creditors.length > 0 && debtors.length > 0) {
    let creditor = creditors[0];
    let debtor = debtors[0];
    let payment = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: payment.toFixed(2)
    });

    creditor.amount -= payment;
    debtor.amount -= payment;

    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }

  res.json({ netBalances: balances, suggestions: settlements });
});
// DELETE an expense
router.delete('/:expenseId', protect, async (req, res) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', req.params.expenseId); 

  if (error) return res.status(400).json(error);
  res.json({ message: "Expense deleted and balances updated" });
});

// EDIT an expense (Reshuffle shares)
router.put('/:expenseId', protect, async (req, res) => {
  const { totalAmount, description, splitDetails, splitMode } = req.body;

  // 1. Update the main expense 
  const { error: updateError } = await supabase
    .from('expenses')
    .update({ amount: totalAmount, description })
    .eq('id', req.params.expenseId);

  if (updateError) return res.status(400).json(updateError);

  await supabase.from('expense_splits').delete().eq('expense_id', req.params.expenseId);
  
  res.json({ message: "Expense reshuffled successfully" });
});



router.get('/:expenseId/splits', protect, async (req, res) => {
  const { expenseId } = req.params;

  const { data, error } = await supabase
    .from('expense_splits')
    .select(`
      share_amount,
      participant_id,
      participants (name)
    `)
    .eq('expense_id', expenseId);

  if (error) return res.status(400).json(error);
  
  const formattedSplits = data.map(item => ({
    participant_id: item.participant_id,
    name: item.participants.name,
    amount: item.share_amount
  }));

  res.json(formattedSplits);
});

router.get('/group/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Database Error:", error.message); // Check terminal for this!
    return res.status(400).json(error);
  }
  
  res.json(data);
});



router.post('/settle', protect, async (req, res) => {
  const { groupId, fromId, toId, amount, fromName, toName } = req.body;

  // 1. Create a "Settlement" expense record
  const { data: expense, error: expError } = await supabase
    .from('expenses')
    .insert([{
      group_id: groupId,
      description: `Settlement: ${fromName} to ${toName}`,
      amount: amount,
      payer_id: fromId,
    }])
    .select().single();

  if (expError) return res.status(400).json(expError);

  // 2. Assign the entire share to the receiver
  const { error: splitError } = await supabase
    .from('expense_splits')
    .insert([{
      expense_id: expense.id,
      participant_id: toId,
      share_amount: amount
    }]);

  if (splitError) return res.status(400).json(splitError);

  res.status(201).json({ message: "Settlement recorded!" });
});

module.exports = router;