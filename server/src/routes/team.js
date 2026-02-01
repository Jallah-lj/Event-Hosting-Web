import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get team members
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    let membersResult;

    if (req.user.role === 'ADMIN') {
      membersResult = await db.query('SELECT * FROM team_members ORDER BY created_at DESC');
    } else {
      membersResult = await db.query('SELECT * FROM team_members WHERE organizer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }

    const members = membersResult.rows;

    res.json(members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      scans: m.scans
    })));
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Add team member
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { name, email, role, password = 'Password@123' } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // 1. Check if user exists
    let userId = uuidv4();
    const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const existingUser = existingUserResult.rows[0];

    if (existingUser) {
      // If user exists, we just link them (assuming they are not already a team member for someone else?)
      // For simplicity, we'll allow linking existing users, or fail if they are an ORGANIZER themselves.
      userId = existingUser.id;
      // Optionally update their role if they were just an ATTENDEE?
      // await db.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
    } else {
      // Create new user
      const passwordHash = bcrypt.hashSync(password, 10);
      await db.query(`
          INSERT INTO users (id, name, email, password_hash, role, status, joined, verified)
          VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), TRUE)
        `, [userId, name, email, passwordHash, role]);

      // Create preferences
      await db.query(`INSERT INTO user_preferences (id, user_id) VALUES ($1, $2)`, [uuidv4(), userId]);
    }

    // 2. Add to team_members
    const memberId = uuidv4();

    // Check if already in team
    const existingMemberResult = await db.query('SELECT id FROM team_members WHERE email = $1 AND organizer_id = $2', [email, req.user.id]);
    if (existingMemberResult.rows.length > 0) {
      return res.status(400).json({ error: 'User is already in your team' });
    }

    await db.query(`
      INSERT INTO team_members (id, name, email, role, status, scans, organizer_id)
      VALUES ($1, $2, $3, $4, 'ACTIVE', 0, $5)
    `, [memberId, name, email, role, req.user.id]);

    res.status(201).json({
      message: 'Team member account created',
      member: { id: memberId, name, email, role, status: 'ACTIVE', scans: 0 }
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member. ' + error.message });
  }
});

// Update team member
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { role, status, scans } = req.body;

    await db.query(`
      UPDATE team_members SET 
        role = COALESCE($1, role),
        status = COALESCE($2, status),
        scans = COALESCE($3, scans)
      WHERE id = $4 AND (organizer_id = $5 OR $6 = 'ADMIN')
    `, [role, status, scans, req.params.id, req.user.id, req.user.role]);

    res.json({ message: 'Team member updated' });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Delete team member
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    await db.query(`
      DELETE FROM team_members WHERE id = $1 AND (organizer_id = $2 OR $3 = 'ADMIN')
    `, [req.params.id, req.user.id, req.user.role]);
    res.json({ message: 'Team member removed' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Increment scan count
router.post('/:id/scan', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    await db.query('UPDATE team_members SET scans = scans + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Scan recorded' });
  } catch (error) {
    console.error('Record scan error:', error);
    res.status(500).json({ error: 'Failed to record scan' });
  }
});

export default router;
