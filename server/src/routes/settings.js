import express from 'express';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get platform settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settingsResult = await db.query('SELECT * FROM platform_settings WHERE id = 1');
    const settings = settingsResult.rows[0];

    if (!settings) {
      // Should probably seed this or handle it gracefully, but returning defaults for now if empty
      return res.json({});
    }

    res.json({
      siteName: settings.site_name,
      supportEmail: settings.support_email,
      currency: settings.currency,
      maintenanceMode: settings.maintenance_mode,
      paymentGateway: settings.payment_gateway,
      emailService: settings.email_service,
      twoFactorEnabled: settings.two_factor_enabled,
      organizerVerification: settings.organizer_verification
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update platform settings (Admin only)
router.put('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      siteName,
      supportEmail,
      currency,
      maintenanceMode,
      paymentGateway,
      emailService,
      twoFactorEnabled,
      organizerVerification
    } = req.body;

    await db.query(`
      UPDATE platform_settings SET
        site_name = COALESCE($1, site_name),
        support_email = COALESCE($2, support_email),
        currency = COALESCE($3, currency),
        maintenance_mode = COALESCE($4, maintenance_mode),
        payment_gateway = COALESCE($5, payment_gateway),
        email_service = COALESCE($6, email_service),
        two_factor_enabled = COALESCE($7, two_factor_enabled),
        organizer_verification = COALESCE($8, organizer_verification),
        updated_at = NOW()
      WHERE id = 1
    `, [
      siteName,
      supportEmail,
      currency,
      maintenanceMode !== undefined ? maintenanceMode : null,
      paymentGateway,
      emailService,
      twoFactorEnabled !== undefined ? twoFactorEnabled : null,
      organizerVerification !== undefined ? organizerVerification : null
    ]);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ===================== ORGANIZER SETTINGS =====================

// Get organizer settings
router.get('/organizer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let settingsResult = await db.query('SELECT * FROM organizer_settings WHERE user_id = $1', [userId]);
    let settings = settingsResult.rows[0];

    // If no settings exist, create default ones
    if (!settings) {
      const id = uuidv4();
      await db.query(`
        INSERT INTO organizer_settings (id, user_id) VALUES ($1, $2)
      `, [id, userId]);
      settingsResult = await db.query('SELECT * FROM organizer_settings WHERE user_id = $1', [userId]);
      settings = settingsResult.rows[0];
    }

    res.json({
      organization: {
        businessName: settings.business_name || '',
        businessDescription: settings.business_description || '',
        website: settings.website || '',
        phone: settings.phone || '',
        address: settings.address || ''
      },
      payout: {
        method: settings.payout_method || 'mobile_money',
        bankName: settings.bank_name || '',
        accountNumber: settings.account_number || '',
        accountName: settings.account_name || '',
        mobileProvider: settings.mobile_provider || 'Orange Money',
        mobileNumber: settings.mobile_number || '',
        paypalEmail: settings.paypal_email || ''
      },
      notifications: {
        ticketSold: settings.notify_ticket_sold,
        dailySummary: settings.notify_daily_summary,
        weeklyReport: settings.notify_weekly_report,
        refundRequest: settings.notify_refund_request,
        eventReminders: settings.notify_event_reminders,
        teamUpdates: settings.notify_team_updates
      },
      defaults: {
        defaultVenue: settings.default_venue || '',
        defaultRefundPolicy: settings.default_refund_policy || 'Refunds available up to 24 hours before event',
        autoConfirmTickets: settings.auto_confirm_tickets,
        requireAttendeeInfo: settings.require_attendee_info
      }
    });
  } catch (error) {
    console.error('Get organizer settings error:', error);
    res.status(500).json({ error: 'Failed to get organizer settings' });
  }
});

// Update organizer organization profile
router.put('/organizer/organization', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, businessDescription, website, phone, address } = req.body;

    // Ensure settings record exists (UPSERT would be better, but sticking to logic structure)
    // Actually, let's use ON CONFLICT for robust UPSERT behavior in Postgres
    const id = uuidv4();
    await db.query(`
      INSERT INTO organizer_settings (id, user_id, business_name, business_description, website, phone, address, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_description = EXCLUDED.business_description,
        website = EXCLUDED.website,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = NOW()
    `, [id, userId, businessName, businessDescription, website, phone, address]);

    res.json({ message: 'Organization profile saved successfully' });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to save organization profile' });
  }
});

// Update organizer payout settings
router.put('/organizer/payout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, bankName, accountNumber, accountName, mobileProvider, mobileNumber, paypalEmail } = req.body;

    const id = uuidv4();
    await db.query(`
      INSERT INTO organizer_settings (
        id, user_id, payout_method, bank_name, account_number, account_name, 
        mobile_provider, mobile_number, paypal_email, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        payout_method = EXCLUDED.payout_method,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        account_name = EXCLUDED.account_name,
        mobile_provider = EXCLUDED.mobile_provider,
        mobile_number = EXCLUDED.mobile_number,
        paypal_email = EXCLUDED.paypal_email,
        updated_at = NOW()
    `, [id, userId, method, bankName, accountNumber, accountName, mobileProvider, mobileNumber, paypalEmail]);

    res.json({ message: 'Payout settings saved successfully' });
  } catch (error) {
    console.error('Update payout error:', error);
    res.status(500).json({ error: 'Failed to save payout settings' });
  }
});

// Update organizer notification settings
router.put('/organizer/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ticketSold, dailySummary, weeklyReport, refundRequest, eventReminders, teamUpdates } = req.body;

    const id = uuidv4();
    await db.query(`
      INSERT INTO organizer_settings (
        id, user_id, notify_ticket_sold, notify_daily_summary, notify_weekly_report, 
        notify_refund_request, notify_event_reminders, notify_team_updates, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        notify_ticket_sold = EXCLUDED.notify_ticket_sold,
        notify_daily_summary = EXCLUDED.notify_daily_summary,
        notify_weekly_report = EXCLUDED.notify_weekly_report,
        notify_refund_request = EXCLUDED.notify_refund_request,
        notify_event_reminders = EXCLUDED.notify_event_reminders,
        notify_team_updates = EXCLUDED.notify_team_updates,
        updated_at = NOW()
    `, [
      id, userId,
      ticketSold, dailySummary, weeklyReport, refundRequest, eventReminders, teamUpdates
    ]);

    res.json({ message: 'Notification preferences saved successfully' });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
});

// Update organizer default event settings
router.put('/organizer/defaults', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { defaultVenue, defaultRefundPolicy, autoConfirmTickets, requireAttendeeInfo } = req.body;

    const id = uuidv4();
    await db.query(`
      INSERT INTO organizer_settings (
        id, user_id, default_venue, default_refund_policy, 
        auto_confirm_tickets, require_attendee_info, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        default_venue = EXCLUDED.default_venue,
        default_refund_policy = EXCLUDED.default_refund_policy,
        auto_confirm_tickets = EXCLUDED.auto_confirm_tickets,
        require_attendee_info = EXCLUDED.require_attendee_info,
        updated_at = NOW()
    `, [
      id, userId,
      defaultVenue, defaultRefundPolicy, autoConfirmTickets, requireAttendeeInfo
    ]);

    res.json({ message: 'Default settings saved successfully' });
  } catch (error) {
    console.error('Update defaults error:', error);
    res.status(500).json({ error: 'Failed to save default settings' });
  }
});

export default router;
