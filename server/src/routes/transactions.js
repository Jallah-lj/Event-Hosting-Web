import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get transactions (Organizer sees their own, Admin sees all)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let transactionsResult;

    if (req.user.role === 'ADMIN') {
      transactionsResult = await db.query('SELECT * FROM transactions ORDER BY date DESC');
    } else if (req.user.role === 'ORGANIZER') {
      transactionsResult = await db.query('SELECT * FROM transactions WHERE organizer_id = $1 ORDER BY date DESC', [req.user.id]);
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const transactions = transactionsResult.rows;

    res.json(transactions.map(t => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: parseFloat(t.amount),
      date: t.date,
      status: t.status,
      user: t.user_name,
      event: t.event_title,
      organizerId: t.organizer_id
    })));
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (req.user.role === 'ORGANIZER') {
      whereClause = `WHERE organizer_id = $${paramIndex}`;
      params = [req.user.id];
    }

    const salesQuery = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'SALE' AND status = 'COMPLETED'
    `;

    const feesQuery = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'FEE' AND status = 'COMPLETED'
    `;

    const payoutsQuery = `
      SELECT COALESCE(SUM(ABS(amount)), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'PAYOUT'
    `;

    const [salesResult, feesResult, payoutsResult] = await Promise.all([
      db.query(salesQuery, params),
      db.query(feesQuery, params),
      db.query(payoutsQuery, params)
    ]);

    const totalSales = parseFloat(salesResult.rows[0].total);
    const totalFees = parseFloat(feesResult.rows[0].total);
    const totalPayouts = parseFloat(payoutsResult.rows[0].total);

    res.json({
      totalSales: totalSales,
      totalFees: totalFees,
      totalPayouts: totalPayouts,
      netRevenue: totalSales - totalFees - totalPayouts
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
