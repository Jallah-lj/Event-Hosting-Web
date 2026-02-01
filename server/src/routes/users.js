import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const usersResult = await db.query(`
      SELECT id, name, email, role, status, profile_picture, verified, joined, last_active
      FROM users ORDER BY joined DESC
    `);

    const users = usersResult.rows;

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      profilePicture: u.profile_picture,
      verified: u.verified,
      joined: u.joined,
      lastActive: u.last_active
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(`
      SELECT id, name, email, role, status, profile_picture, verified, joined, last_active
      FROM users WHERE id = $1
    `, [req.params.id]);

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user notes if admin
    let notes = [];
    if (req.user.role === 'ADMIN') {
      const notesResult = await db.query('SELECT * FROM user_notes WHERE user_id = $1 ORDER BY date DESC', [req.params.id]);
      notes = notesResult.rows;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profile_picture,
      verified: user.verified,
      joined: user.joined,
      lastActive: user.last_active,
      notes: notes.map(n => ({
        id: n.id,
        text: n.text,
        date: n.date,
        author: n.author
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Only allow updating own profile or admin can update any
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, email, profilePicture, status, role } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (name) {
      updates.push(`name = $${queryIndex++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${queryIndex++}`);
      values.push(email);
    }
    if (profilePicture !== undefined) {
      updates.push(`profile_picture = $${queryIndex++}`);
      values.push(profilePicture);
    }

    // Only admin can change status and role
    if (req.user.role === 'ADMIN') {
      if (status) {
        updates.push(`status = $${queryIndex++}`);
        values.push(status);
      }
      if (role) {
        updates.push(`role = $${queryIndex++}`);
        values.push(role);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex}`, values);

    const updatedUserResult = await db.query(`
      SELECT id, name, email, role, status, profile_picture, verified, joined
      FROM users WHERE id = $1
    `, [req.params.id]);

    const updatedUser = updatedUserResult.rows[0];

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profilePicture: updatedUser.profile_picture,
        verified: updatedUser.verified,
        joined: updatedUser.joined
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Add note to user (Admin only)
router.post('/:id/notes', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { text } = req.body;
    const noteId = uuidv4();

    await db.query(`
      INSERT INTO user_notes (id, user_id, text, date, author)
      VALUES ($1, $2, $3, NOW(), $4)
    `, [noteId, req.params.id, text, req.user.name || 'Admin']);

    res.status(201).json({
      message: 'Note added',
      note: { id: noteId, text, date: new Date().toISOString(), author: req.user.name }
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Update user preferences
router.put('/:id/preferences', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { textSize, currency, language, autoCalendar, dataSaver, notifications } = req.body;

    const existingResult = await db.query('SELECT id FROM user_preferences WHERE user_id = $1', [req.params.id]);
    const existing = existingResult.rows[0];

    if (existing) {
      await db.query(`
        UPDATE user_preferences SET
          text_size = COALESCE($1, text_size),
          currency = COALESCE($2, currency),
          language = COALESCE($3, language),
          auto_calendar = COALESCE($4, auto_calendar),
          data_saver = COALESCE($5, data_saver),
          notifications_email = COALESCE($6, notifications_email),
          notifications_sms = COALESCE($7, notifications_sms),
          notifications_promotional = COALESCE($8, notifications_promotional),
          updated_at = NOW()
        WHERE user_id = $9
      `, [
        textSize,
        currency,
        language,
        autoCalendar,
        dataSaver,
        notifications?.email,
        notifications?.sms,
        notifications?.promotional,
        req.params.id
      ]);
    } else {
      await db.query(`
        INSERT INTO user_preferences (id, user_id, text_size, currency, language, auto_calendar, data_saver, notifications_email, notifications_sms, notifications_promotional)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        uuidv4(),
        req.params.id,
        textSize || 'Standard',
        currency || 'USD',
        language || 'English (Liberia)',
        autoCalendar ? true : false,
        dataSaver ? true : false,
        notifications?.email ? true : false,
        notifications?.sms ? true : false,
        notifications?.promotional ? true : false
      ]);
    }

    res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Create User (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if user exists
    const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, joined)
      VALUES ($1, $2, $3, $4, $5, 'Active', NOW())
    `, [userId, name, email, passwordHash, role]);

    // Create default preferences
    await db.query(`
      INSERT INTO user_preferences (id, user_id)
      VALUES ($1, $2)
    `, [uuidv4(), userId]);

    const newUserResult = await db.query('SELECT id, name, email, role, status, joined FROM users WHERE id = $1', [userId]);
    const newUser = newUserResult.rows[0];

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
