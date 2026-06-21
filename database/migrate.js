const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "docapinexusdb",
  user: process.env.DB_USER || "docapiuser",
  password: process.env.DB_PASSWORD || "DocApi@123"
});

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function hasMigrationRun(filename) {
  const result = await pool.query(
    "SELECT filename FROM schema_migrations WHERE filename = $1",
    [filename]
  );

  return result.rows.length > 0;
}

async function recordMigration(filename) {
  await pool.query(
    "INSERT INTO schema_migrations (filename) VALUES ($1)",
    [filename]
  );
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log("Starting DocApiNexus database migrations...");

  await ensureMigrationTable();

  for (const file of files) {
    const alreadyRun = await hasMigrationRun(file);

    if (alreadyRun) {
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Running migration: ${file}`);

    await pool.query("BEGIN");

    try {
      await pool.query(sql);
      await recordMigration(file);
      await pool.query("COMMIT");
      console.log(`Migration completed: ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error(`Migration failed: ${file}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("All migrations completed successfully.");
  await pool.end();
}

runMigrations().catch(async (error) => {
  console.error("Migration runner failed:", error);
  await pool.end();
  process.exit(1);
});