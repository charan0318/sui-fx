import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Connect to the SQLite database
const db = new Database('./suifx.db');

// Read the SQL script
const sqlScript = fs.readFileSync('../../scripts/init-missing-sqlite-tables.sql', 'utf8');

// Split the script into individual statements
const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);

console.log('🔧 Adding missing database tables...');

try {
  // Execute each statement
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (trimmedStatement) {
      console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
      db.prepare(trimmedStatement).run();
    }
  }
  
  console.log('✅ Successfully added missing tables!');
  
  // Verify the faucet_metrics table was created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='faucet_metrics'").all();
  if (tables.length > 0) {
    console.log('✅ faucet_metrics table created successfully');
  } else {
    console.log('❌ faucet_metrics table not found');
  }
  
} catch (error) {
  console.error('❌ Error creating tables:', error);
} finally {
  db.close();
  console.log('Database connection closed');
}
