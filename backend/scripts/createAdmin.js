#!/usr/bin/env node

const AdminUser = require('../models/AdminUser');

async function createAdmin() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const email = process.argv[4] || 'admin@cumabaca.com';

  try {
    // Check if user already exists
    const existing = await AdminUser.findByUsername(username);
    if (existing) {
      console.log(`Admin user "${username}" already exists.`);
      process.exit(1);
    }

    // Create new admin user
    await AdminUser.create({ username, password, email });
    console.log(`✓ Admin user created successfully!`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  Email: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
