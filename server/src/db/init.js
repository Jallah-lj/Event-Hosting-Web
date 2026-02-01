import pool from './index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing Database...');

    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) CHECK(role IN ('GUEST', 'ATTENDEE', 'ORGANIZER', 'ADMIN', 'SCANNER', 'ANALYST', 'MODERATOR')) DEFAULT 'ATTENDEE',
        status VARCHAR(50) CHECK(status IN ('Active', 'Suspended')) DEFAULT 'Active',
        verified BOOLEAN DEFAULT FALSE,
        profile_picture TEXT,
        joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        capacity INTEGER,
        status VARCHAR(50) CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'DRAFT')) DEFAULT 'PENDING',
        organizer_id VARCHAR(255) NOT NULL,
        attendee_count INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    // Ticket Tiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_tiers (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        description TEXT,
        allocation INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // Tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        tier_id VARCHAR(255),
        attendee_name VARCHAR(255),
        attendee_email VARCHAR(255),
        tier_name VARCHAR(255),
        price_paid DECIMAL(10, 2) DEFAULT 0,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        check_in_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id)
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) CHECK(type IN ('SALE', 'PAYOUT', 'FEE', 'REFUND')) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) CHECK(status IN ('COMPLETED', 'PENDING', 'CLEARED', 'FAILED', 'PROCESSED', 'REJECTED')) DEFAULT 'PENDING',
        user_name VARCHAR(255),
        event_title VARCHAR(255),
        organizer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    // Promo Codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) CHECK(type IN ('PERCENT', 'FIXED')) NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        usage_count INTEGER DEFAULT 0,
        usage_limit INTEGER,
        status VARCHAR(50) CHECK(status IN ('ACTIVE', 'EXPIRED')) DEFAULT 'ACTIVE',
        organizer_id VARCHAR(255),
        event_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id),
        FOREIGN KEY (event_id) REFERENCES events(id)
      )
    `);

    // Referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        url TEXT,
        clicks INTEGER DEFAULT 0,
        sales INTEGER DEFAULT 0,
        revenue DECIMAL(10, 2) DEFAULT 0,
        organizer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    // Broadcasts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id VARCHAR(255) PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        body TEXT,
        event_id VARCHAR(255),
        event_title VARCHAR(255),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recipient_count INTEGER DEFAULT 0,
        organizer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    // Team Members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) CHECK(status IN ('ACTIVE', 'PENDING')) DEFAULT 'PENDING',
        scans INTEGER DEFAULT 0,
        organizer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
      )
    `);

    // Platform Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        site_name VARCHAR(255) DEFAULT 'LiberiaConnect Events',
        support_email VARCHAR(255) DEFAULT 'support@liberiaconnect.com',
        currency VARCHAR(10) DEFAULT 'USD',
        maintenance_mode BOOLEAN DEFAULT FALSE,
        payment_gateway VARCHAR(50) DEFAULT 'Flutterwave',
        email_service VARCHAR(50) DEFAULT 'SendGrid',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        organizer_verification BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        text_size VARCHAR(50) CHECK(text_size IN ('Small', 'Standard', 'Large')) DEFAULT 'Standard',
        currency VARCHAR(10) DEFAULT 'USD',
        language VARCHAR(50) DEFAULT 'English (Liberia)',
        auto_calendar BOOLEAN DEFAULT TRUE,
        data_saver BOOLEAN DEFAULT FALSE,
        notifications_email BOOLEAN DEFAULT TRUE,
        notifications_sms BOOLEAN DEFAULT FALSE,
        notifications_promotional BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User Notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Organizer Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizer_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        business_name VARCHAR(255),
        business_description TEXT,
        website VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        payout_method VARCHAR(50) CHECK(payout_method IN ('bank', 'mobile_money', 'paypal')) DEFAULT 'mobile_money',
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        account_name VARCHAR(255),
        mobile_provider VARCHAR(255),
        mobile_number VARCHAR(50),
        paypal_email VARCHAR(255),
        notify_ticket_sold BOOLEAN DEFAULT TRUE,
        notify_daily_summary BOOLEAN DEFAULT FALSE,
        notify_weekly_report BOOLEAN DEFAULT TRUE,
        notify_refund_request BOOLEAN DEFAULT TRUE,
        notify_event_reminders BOOLEAN DEFAULT TRUE,
        notify_team_updates BOOLEAN DEFAULT TRUE,
        default_venue VARCHAR(255),
        default_refund_policy VARCHAR(255) DEFAULT 'Refunds available up to 24 hours before event',
        auto_confirm_tickets BOOLEAN DEFAULT TRUE,
        require_attendee_info BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Email Verifications (Added missing table from auth route analysis)
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        user_id VARCHAR(255) PRIMARY KEY,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Password Resets (Added missing table from auth route analysis)
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        user_id VARCHAR(255) PRIMARY KEY,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);


    // Initialize Platform Settings
    await client.query(`
      INSERT INTO platform_settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Database Schema Initialized');

    // Seed Data
    await seedDemoData(client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedDemoData(client) {
  try {
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(rows[0].count) > 0) return;

    console.log('🌱 Seeding demo data...');

    const adminId = uuidv4();
    const organizerId = 'org1';
    const attendeeId = 'user1';

    const passwordHash = bcrypt.hashSync('demo123', 10);

    // Users
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [adminId, 'Admin User', 'admin@liberiaconnect.com', passwordHash, 'ADMIN', 'Active', true]);

    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [organizerId, 'Joseph Jenkins', 'org@example.com', passwordHash, 'ORGANIZER', 'Active', true]);

    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [attendeeId, 'Alice Doe', 'attendee@example.com', passwordHash, 'ATTENDEE', 'Active', true]);

    // Events
    const events = [
      {
        id: '1',
        title: 'Monrovia Cultural Festival',
        description: 'A vibrant celebration of Liberian heritage, music, and dance in the heart of the capital.',
        date: '2024-08-15T10:00:00',
        endDate: '2024-08-15T22:00:00',
        location: 'Centennial Pavilion, Monrovia',
        category: 'Culture',
        price: 15,
        capacity: 500,
        status: 'APPROVED',
        organizerId: organizerId,
        attendeeCount: 120,
        imageUrl: 'https://picsum.photos/seed/monrovia/800/600'
      },
      // ... other events can be added similarly if needed, keeping it minimal for now to ensure success
    ];

    for (const event of events) {
      await client.query(`
        INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        event.id, event.title, event.description, event.date, event.endDate,
        event.location, event.category, event.price, event.capacity,
        event.status, event.organizerId, event.attendeeCount, event.imageUrl
      ]);
    }

    console.log('✅ Demo data seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    // Don't throw here, ensure init completes even if seeding fails slightly
  }
}
