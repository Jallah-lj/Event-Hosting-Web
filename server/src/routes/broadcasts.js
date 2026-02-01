import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get broadcasts
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    let broadcastsResult;

    if (req.user.role === 'ADMIN') {
      broadcastsResult = await db.query('SELECT * FROM broadcasts ORDER BY date DESC');
    } else {
      broadcastsResult = await db.query('SELECT * FROM broadcasts WHERE organizer_id = $1 ORDER BY date DESC', [req.user.id]);
    }

    const broadcasts = broadcastsResult.rows;

    res.json(broadcasts.map(b => ({
      id: b.id,
      subject: b.subject,
      body: b.body,
      event: b.event_title,
      eventId: b.event_id,
      date: b.date,
      recipientCount: b.recipient_count
    })));
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({ error: 'Failed to get broadcasts' });
  }
});

// Create broadcast
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { subject, body, eventId } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    // Get event details and attendee count
    let eventTitle = null;
    let recipientCount = 0;

    if (eventId) {
      const eventResult = await db.query('SELECT title FROM events WHERE id = $1', [eventId]);
      const event = eventResult.rows[0];
      if (event) {
        eventTitle = event.title;
        const countResult = await db.query('SELECT COUNT(*) as count FROM tickets WHERE event_id = $1', [eventId]);
        recipientCount = parseInt(countResult.rows[0].count);
      }
    }

    const broadcastId = uuidv4();

    await db.query(`
      INSERT INTO broadcasts (id, subject, body, event_id, event_title, date, recipient_count, organizer_id)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
    `, [broadcastId, subject, body || null, eventId || null, eventTitle, recipientCount, req.user.id]);

    res.status(201).json({
      message: 'Broadcast sent',
      broadcast: {
        id: broadcastId,
        subject,
        body,
        event: eventTitle,
        eventId,
        date: new Date().toISOString(),
        recipientCount
      }
    });
  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

// Delete broadcast
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    await db.query(`
      DELETE FROM broadcasts 
      WHERE id = $1 AND (organizer_id = $2 OR $3 = 'ADMIN')
    `, [req.params.id, req.user.id, req.user.role]);

    res.json({ message: 'Broadcast deleted' });
  } catch (error) {
    console.error('Delete broadcast error:', error);
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

export default router;
