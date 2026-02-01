import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get live analytics for organizer
router.get('/organizer/live', authenticateToken, requireRole('ORGANIZER', 'ADMIN', 'ANALYST'), async (req, res) => {
  try {
    const organizerId = req.user.id;
    const now = new Date();

    // 1. Get total stats (restricted to organizer)
    const totalStatsResult = await db.query(`
      SELECT 
        COUNT(t.id) as total_tickets,
        COALESCE(SUM(t.price_paid), 0) as total_revenue,
        SUM(CASE WHEN t.used = true THEN 1 ELSE 0 END) as total_check_ins
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE e.organizer_id = $1
    `, [organizerId]);

    const totalStats = totalStatsResult.rows[0];

    // 2. Mock live data stream (Last 60 minutes simulation for "Live" effect)
    // In a real app, you'd aggregate actual timestamps grouped by minute.
    // For this demo, we'll generate realistic looking "live" data based on actual totals + random variance
    // to give the 3D chart something to display immediately.

    const timeSeriesData = [];
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      // Generate somewhat random but consistent-looking data
      // Base activity on time of day? scaling factor? 
      // Let's just make it random mostly for visual flair as requested
      const sales = Math.floor(Math.random() * 5);
      const checkIns = Math.floor(Math.random() * 8);

      timeSeriesData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sales,
        checkIns,
        activeUsers: Math.floor(Math.random() * 20) + 10 // Mock "Active viewers" on event page
      });
    }

    // 3. Get Recent Activity (Real data)
    const recentActivityResult = await db.query(`
      SELECT 
        t.id, 
        'CHECKIN' as type,
        t.check_in_time as timestamp,
        e.title as event_title,
        COALESCE(t.attendee_name, 'Unknown') as attendee
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE e.organizer_id = $1 AND t.used = true
      ORDER BY t.check_in_time DESC
      LIMIT 5
    `, [organizerId]);

    const recentActivity = recentActivityResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      timestamp: row.timestamp,
      eventTitle: row.event_title,
      attendee: row.attendee
    }));

    res.json({
      stats: {
        revenue: parseFloat(totalStats.total_revenue),
        ticketsSold: parseInt(totalStats.total_tickets),
        checkInRate: parseInt(totalStats.total_tickets) ? Math.round((parseInt(totalStats.total_check_ins) / parseInt(totalStats.total_tickets)) * 100) : 0
      },
      chartData: timeSeriesData,
      recentActivity
    });

  } catch (error) {
    console.error('Analytics error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

export default router;
