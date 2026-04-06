'use strict';

require('dotenv').config();

const app = require('./src/app');
const { initializeDatabase, getDb } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;

function seedDefaultAdmin() {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = 'admin@finance.com'").get();
  if (existing) return;

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uuidv4(), 'Admin', 'admin@finance.com', bcrypt.hashSync('admin123', 10), 'admin', 'active');

  console.log('✅ Default admin seeded — email: admin@finance.com  password: admin123');
}

function start() {
  try {
    initializeDatabase();
    console.log('✅ Database initialised');

    seedDefaultAdmin();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📖 API docs: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health:   http://localhost:${PORT}/health`);
    });

    // Graceful shutdown — finish in-flight requests before closing
    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
      // Force-kill if still open after 10 s
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
