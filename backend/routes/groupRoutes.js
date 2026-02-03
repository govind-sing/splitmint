const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');

// Create a group
router.post('/create', protect, async (req, res) => {
  const { name, participantNames } = req.body;
  const owner_id = req.user.id; 

  // 1. Create the Group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([{ name, owner_id }])
    .select().single();

  if (groupError) return res.status(400).json(groupError);

  // 2. Automatically include the Creator as "You"
  const allParticipants = [
    { group_id: group.id, name: "You (Owner)" }, 
    ...participantNames.map(pName => ({
      group_id: group.id,
      name: pName
    }))
  ];

  // 3. Save all 1-4 participants
  const { error: partError } = await supabase
    .from('participants')
    .insert(allParticipants);

  if (partError) return res.status(400).json(partError);

  res.status(201).json({ message: "Group created!", group });
});

router.get('/my-groups', protect, async (req, res) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', req.user.id);

  if (error) return res.status(400).json(error);
  res.json(data);
});

router.delete('/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // 1. Verify ownership
  const { data: group } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (!group || group.owner_id !== userId) {
    return res.status(403).json({ error: "Only the owner can delete this group" });
  }
  // 2. Delete related expenses, splits, participants
  await supabase.from('expense_splits').delete().in('expense_id', 
    (await supabase.from('expenses').select('id').eq('group_id', groupId)).data?.map(e => e.id) || []
  );
  await supabase.from('expenses').delete().eq('group_id', groupId);
  await supabase.from('participants').delete().eq('group_id', groupId);

  // 3. Finally delete the group
  const { error } = await supabase.from('groups').delete().eq('id', groupId);

  if (error) return res.status(400).json(error);
  res.json({ message: "Group deleted successfully" });
});

router.get('/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;

  // 1. Fetch Group Info
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) return res.status(400).json(groupError);

  // 2. Fetch Participants
  const { data: participants, error: partError } = await supabase
    .from('participants')
    .select('*')
    .eq('group_id', groupId);

  if (partError) return res.status(400).json(partError);

  res.json({ group, participants });
});

module.exports = router;