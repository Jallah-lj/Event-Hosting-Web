import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get promo codes (Organizer sees their own, Admin sees all)
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    let promosResult;

    if (req.user.role === 'ADMIN') {
      promosResult = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    } else {
      promosResult = await db.query('SELECT * FROM promo_codes WHERE organizer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }

    const promos = promosResult.rows;

    res.json(promos.map(p => ({
      id: p.id,
      code: p.code,
      type: p.type,
      value: p.value,
      usage: p.usage_count,
      limit: p.usage_limit,
      status: p.status,
      eventId: p.event_id
    })));
  } catch (error) {
    console.error('Get promos error:', error);
    res.status(500).json({ error: 'Failed to get promo codes' });
  }
});

// Create promo code
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { code, type, value, limit, eventId } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({ error: 'Code, type, and value are required' });
    }

    const promoId = uuidv4();

    await db.query(`
      INSERT INTO promo_codes (id, code, type, value, usage_count, usage_limit, status, organizer_id, event_id)
      VALUES ($1, $2, $3, $4, 0, $5, 'ACTIVE', $6, $7)
    `, [promoId, code.toUpperCase(), type, value, limit || null, req.user.id, eventId || null]);

    res.status(201).json({
      message: 'Promo code created',
      promo: { id: promoId, code: code.toUpperCase(), type, value, usage: 0, limit, status: 'ACTIVE' }
    });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Update promo code
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { status, limit } = req.body;

    await db.query(`
      UPDATE promo_codes SET status = COALESCE($1, status), usage_limit = COALESCE($2, usage_limit)
      WHERE id = $3 AND (organizer_id = $4 OR $5 = 'ADMIN')
    `, [status, limit, req.params.id, req.user.id, req.user.role]);

    res.json({ message: 'Promo code updated' });
  } catch (error) {
    console.error('Update promo error:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete promo code
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    await db.query(`
      DELETE FROM promo_codes 
      WHERE id = $1 AND (organizer_id = $2 OR $3 = 'ADMIN')
    `, [req.params.id, req.user.id, req.user.role]);
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Validate promo code
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, eventId } = req.body;

    const promoResult = await db.query(`
      SELECT * FROM promo_codes 
      WHERE code = $1 AND status = 'ACTIVE' 
      AND (event_id IS NULL OR event_id = $2)
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    `, [code.toUpperCase(), eventId]);

    const promo = promoResult.rows[0];

    if (!promo) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

    res.json({
      valid: true,
      type: promo.type,
      value: promo.value,
      code: promo.code
    });
  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;
