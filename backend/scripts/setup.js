#!/usr/bin/env node

/**
 * Setup script - Create admin user after database initialization
 * Run this after starting the backend for the first time
 */

const AdminUser = require('../models/AdminUser');

async function setup() {
  console.log('Setting up admin account...\n');

  try {
    // Check if admin already exists
    const existing = await AdminUser.findByUsername('admin');
    if (existing) {
      console.log('✓ Admin user "admin" already exists.');
      console.log('  Username: admin');
      console.log('  Password: (use your existing password)\n');
      return;
    }

    // Create admin user
    await AdminUser.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@cumabaca.com'
    });

    console.log('✓ Admin user created successfully!');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Email: admin@cumabaca.com\n');
    console.log('You can now login at: http://localhost:5174/login\n');
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.message.includes('constraint')) {
      console.log('✓ Admin user "admin" already exists.\n');
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }
}

setup();
