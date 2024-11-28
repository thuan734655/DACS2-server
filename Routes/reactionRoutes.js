import express from 'express';
import Reactions from '../models/reactions.js';

const router = express.Router();

// Add or update reaction
router.post('/add', async (req, res) => {
  try {
    const { userId, commentId, type } = req.body;
    await Reactions.addOrUpdateReaction(userId, commentId, type);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction
router.post('/remove', async (req, res) => {
  try {
    const { userId, commentId } = req.body;
    await Reactions.removeReaction(userId, commentId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Get reactions for multiple comments
router.post('/get-multiple', async (req, res) => {
  try {
    const { commentIds } = req.body;
    const reactions = await Reactions.getReactionsForComments(commentIds);
    res.json(reactions);
  } catch (error) {
    console.error('Error getting reactions:', error);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

export default router;
