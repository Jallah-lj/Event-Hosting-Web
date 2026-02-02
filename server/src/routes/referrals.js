import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get referrals
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    let referralsResult;

    if (req.user.role === 'ADMIN') {
      referralsResult = await db.query('SELECT * FROM referrals ORDER BY created_at DESC');
    } else {
      referralsResult = await db.query('SELECT * FROM referrals WHERE organizer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }

    const referrals = referralsResult.rows;

    res.json(referrals.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      url: r.url,
      clicks: r.clicks,
      sales: r.sales,
      revenue: parseFloat(r.revenue)
    })));
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Create referral
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { name, code, url } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const referralId = uuidv4();

    await db.query(`
      INSERT INTO referrals (id, name, code, url, clicks, sales, revenue, organizer_id)
      VALUES ($1, $2, $3, $4, 0, 0, 0, $5)
    `, [referralId, name, code, url || null, req.user.id]);

    res.status(201).json({
      message: 'Referral created',
      referral: { id: referralId, name, code, url, clicks: 0, sales: 0, revenue: 0 }
    });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Update referral
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { name, url, clicks, sales, revenue } = req.body;

    await db.query(`
      UPDATE referrals SET 
        name = COALESCE($1, name),
        url = COALESCE($2, url),
        clicks = COALESCE($3, clicks),
        sales = COALESCE($4, sales),
        revenue = COALESCE($5, revenue)
      WHERE id = $6 AND (organizer_id = $7 OR $8 = 'ADMIN')
    `, [name, url, clicks, sales, revenue, req.params.id, req.user.id, req.user.role]);

    res.json({ message: 'Referral updated' });
  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// Delete referral
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    await db.query(`
      DELETE FROM referrals 
      WHERE id = $1 AND (organizer_id = $2 OR $3 = 'ADMIN')
    `, [req.params.id, req.user.id, req.user.role]);
    res.json({ message: 'Referral deleted' });
  } catch (error) {
    console.error('Delete referral error:', error);
    res.status(500).json({ error: 'Failed to delete referral' });
  }
});

// Track referral click
router.post('/:code/click', async (req, res) => {
  try {
    await db.query('UPDATE referrals SET clicks = clicks + 1 WHERE code = $1', [req.params.code]);
    res.json({ message: 'Click tracked' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
