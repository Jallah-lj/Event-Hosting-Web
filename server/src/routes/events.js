import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all events (public - approved only, authenticated - all for organizer/admin)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let eventsResult;

    if (req.user?.role === 'ADMIN') {
      // Admin sees all events
      eventsResult = await db.query('SELECT * FROM events ORDER BY date DESC');
    } else if (req.user?.role === 'ORGANIZER') {
      // Organizer sees approved events + their own
      eventsResult = await db.query(`
        SELECT * FROM events 
        WHERE status = 'APPROVED' OR organizer_id = $1
        ORDER BY date DESC
      `, [req.user.id]);
    } else {
      // Public/Attendee sees only approved
      eventsResult = await db.query("SELECT * FROM events WHERE status = 'APPROVED' ORDER BY date DESC");
    }

    const events = eventsResult.rows;

    // Get ticket tiers for each event
    // Note: N+1 query here, but kept for logic parity. Optimization would use a JOIN.
    const eventsWithTiers = await Promise.all(events.map(async (event) => {
      const tiersResult = await db.query('SELECT * FROM ticket_tiers WHERE event_id = $1', [event.id]);
      const tiers = tiersResult.rows;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        price: event.price,
        capacity: event.capacity,
        status: event.status,
        organizerId: event.organizer_id,
        attendeeCount: event.attendee_count,
        imageUrl: event.image_url,
        ticketTiers: tiers.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          allocation: t.allocation
        }))
      };
    }));

    res.json(eventsWithTiers);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get events by organizer
router.get('/organizer/:id', authenticateToken, async (req, res) => {
  try {
    // Only allow organizer to view their own events or Admin
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const eventsResult = await db.query('SELECT * FROM events WHERE organizer_id = $1 ORDER BY date DESC', [req.params.id]);
    const events = eventsResult.rows;

    // Get ticket tiers for each event
    const eventsWithTiers = await Promise.all(events.map(async (event) => {
      const tiersResult = await db.query('SELECT * FROM ticket_tiers WHERE event_id = $1', [event.id]);
      const tiers = tiersResult.rows;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        price: event.price,
        capacity: event.capacity,
        status: event.status,
        organizerId: event.organizer_id,
        attendeeCount: event.attendee_count,
        imageUrl: event.image_url,
        ticketTiers: tiers.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          allocation: t.allocation
        }))
      };
    }));

    res.json(eventsWithTiers);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ error: 'Failed to get organizer events' });
  }
});

// Get event by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = eventResult.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check access
    if (event.status !== 'APPROVED' &&
      req.user?.role !== 'ADMIN' &&
      req.user?.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to view this event' });
    }

    const tiersResult = await db.query('SELECT * FROM ticket_tiers WHERE event_id = $1', [event.id]);
    const tiers = tiersResult.rows;

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.end_date,
      location: event.location,
      category: event.category,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
      organizerId: event.organizer_id,
      attendeeCount: event.attendee_count,
      imageUrl: event.image_url,
      ticketTiers: tiers.map(t => ({
        id: t.id,
        name: t.name,
        price: t.price,
        description: t.description,
        allocation: t.allocation
      }))
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Create event (Organizer/Admin)
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers
    } = req.body;

    if (!title || !date || !location || !category) {
      return res.status(400).json({ error: 'Title, date, location, and category are required' });
    }

    const eventId = uuidv4();
    const eventStatus = status || 'PENDING';

    await db.query(`
      INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12)
    `, [
      eventId, title, description, date, endDate || null, location, category,
      price || 0, capacity || null, eventStatus, req.user.id, imageUrl || null
    ]);

    // Create ticket tiers
    if (ticketTiers && ticketTiers.length > 0) {
      for (const tier of ticketTiers) {
        await db.query(`
          INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          uuidv4(),
          eventId,
          tier.name,
          tier.price || 0,
          tier.description || null,
          tier.allocation || null
        ]);
      }
    }

    const newEventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const newEvent = newEventResult.rows[0];

    const tiersResult = await db.query('SELECT * FROM ticket_tiers WHERE event_id = $1', [eventId]);
    const tiers = tiersResult.rows;

    res.status(201).json({
      message: eventStatus === 'PENDING' ? 'Event submitted for review' : 'Event saved as draft',
      event: {
        ...newEvent,
        ticketTiers: tiers
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = eventResult.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && req.user.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers
    } = req.body;

    await db.query(`
      UPDATE events SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        date = COALESCE($3, date),
        end_date = COALESCE($4, end_date),
        location = COALESCE($5, location),
        category = COALESCE($6, category),
        price = COALESCE($7, price),
        capacity = COALESCE($8, capacity),
        status = COALESCE($9, status),
        image_url = COALESCE($10, image_url),
        updated_at = NOW()
      WHERE id = $11
    `, [
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, req.params.id
    ]);

    // Update ticket tiers if provided
    if (ticketTiers) {
      // Delete existing tiers
      await db.query('DELETE FROM ticket_tiers WHERE event_id = $1', [req.params.id]);

      // Insert new tiers
      for (const tier of ticketTiers) {
        await db.query(`
          INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          tier.id || uuidv4(),
          req.params.id,
          tier.name,
          tier.price || 0,
          tier.description || null,
          tier.allocation || null
        ]);
      }
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = eventResult.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Delete ticket tiers first (foreign key) - although Postgres supports CASCADE, explicit delete is safer
    await db.query('DELETE FROM ticket_tiers WHERE event_id = $1', [req.params.id]);
    await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Approve event (Admin only)
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await db.query("UPDATE events SET status = 'APPROVED', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ message: 'Event approved' });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

// Reject event (Admin only)
router.post('/:id/reject', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await db.query("UPDATE events SET status = 'REJECTED', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ message: 'Event rejected' });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
});

// Update event status (Admin only)
router.put('/:id/status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.query("UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2", [status, req.params.id]);
    res.json({ message: `Event status updated to ${status}` });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Helper function to generate recurring event dates
const generateRecurringDates = (startDate, endDate, recurringType, recurringEndDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  const recurEnd = new Date(recurringEndDate);

  let current = new Date(start);

  while (current <= recurEnd) {
    // Calculate event end time based on original duration
    const duration = end.getTime() - start.getTime();
    const eventEnd = new Date(current.getTime() + duration);

    dates.push({
      start: current.toISOString(),
      end: eventEnd.toISOString()
    });

    // Move to next occurrence
    switch (recurringType) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 7); // Default to weekly
    }
  }

  return dates;
};

// Create recurring event (Organizer/Admin)
router.post('/recurring', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers,
      recurringType, recurringEndDate
    } = req.body;

    if (!title || !date || !location || !category) {
      return res.status(400).json({ error: 'Title, date, location, and category are required' });
    }

    if (!recurringType || !recurringEndDate) {
      return res.status(400).json({ error: 'Recurring type and end date are required' });
    }

    // Generate all recurring dates
    const dates = generateRecurringDates(date, endDate, recurringType, recurringEndDate);

    if (dates.length === 0) {
      return res.status(400).json({ error: 'No valid dates generated for recurring event' });
    }

    if (dates.length > 52) {
      return res.status(400).json({ error: 'Maximum 52 occurrences allowed. Please choose a shorter date range.' });
    }

    const createdEvents = [];
    const parentId = uuidv4();
    const eventStatus = status || 'PENDING';

    // Create each event occurrence
    for (let i = 0; i < dates.length; i++) {
      const eventId = i === 0 ? parentId : uuidv4();
      const occurrenceDate = dates[i];

      await db.query(`
        INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url, parent_event_id, occurrence_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13, $14)
      `, [
        eventId,
        `${title}${dates.length > 1 ? ` (#${i + 1})` : ''}`,
        description,
        occurrenceDate.start,
        occurrenceDate.end,
        location,
        category,
        price || 0,
        capacity || null,
        eventStatus,
        req.user.id,
        imageUrl || null,
        i === 0 ? null : parentId,
        i + 1
      ]);

      // Create ticket tiers for each occurrence
      if (ticketTiers && ticketTiers.length > 0) {
        for (const tier of ticketTiers) {
          await db.query(`
            INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            uuidv4(),
            eventId,
            tier.name,
            tier.price || 0,
            tier.description || null,
            tier.allocation || null
          ]);
        }
      }

      createdEvents.push({
        id: eventId,
        title: `${title}${dates.length > 1 ? ` (#${i + 1})` : ''}`,
        date: occurrenceDate.start,
        endDate: occurrenceDate.end
      });
    }

    res.status(201).json({
      message: `Created ${createdEvents.length} recurring event${createdEvents.length > 1 ? 's' : ''}`,
      events: createdEvents,
      parentId
    });
  } catch (error) {
    console.error('Create recurring event error:', error);
    res.status(500).json({ error: 'Failed to create recurring events' });
  }
});

// Get recurring event series
router.get('/:id/series', optionalAuth, async (req, res) => {
  try {
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = eventResult.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Find parent ID - either this event is the parent, or it has a parent
    const parentId = event.parent_event_id || event.id;

    // Get all events in the series
    const seriesResult = await db.query(`
      SELECT id, title, date, end_date, status, occurrence_number
      FROM events 
      WHERE id = $1 OR parent_event_id = $2
      ORDER BY date ASC
    `, [parentId, parentId]);

    const series = seriesResult.rows;

    res.json({
      parentId,
      totalOccurrences: series.length,
      events: series.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        endDate: e.end_date,
        status: e.status,
        occurrenceNumber: e.occurrence_number
      }))
    });
  } catch (error) {
    console.error('Get event series error:', error);
    res.status(500).json({ error: 'Failed to get event series' });
  }
});

export default router;
