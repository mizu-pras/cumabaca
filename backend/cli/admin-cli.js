const readline = require('readline');
const AdminUser = require('../models/AdminUser');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function register() {
  console.log('\n--- Admin User Registration ---\n');

  try {
    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const confirm = await question('Confirm Password: ');

    if (password !== confirm) {
      console.error('Error: Passwords do not match');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      process.exit(1);
    }

    const result = await AdminUser.create({ username, password, email });

    console.log('\n✓ Admin user registered successfully!');
    console.log(`  User ID: ${result.lastInsertRowid}`);
    console.log(`  Username: ${username}\n`);

    process.exit(0);
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.message.includes('constraint')) {
      console.error('Error: Username or email already exists');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

const command = process.argv[2];

if (command === 'register') {
  register();
} else {
  console.log('Usage: node admin-cli.js register');
  process.exit(1);
}
