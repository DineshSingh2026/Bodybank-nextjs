/**
 * Creates tables on DATABASE_URL only (default: local `bodybank_nextjs`).
 * Does NOT connect to any other database. Safe to re-run (IF NOT EXISTS).
 *
 * Usage: from backend/: `npm run db:bootstrap`
 */
import 'dotenv/config';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy backend/.env.example to backend/.env');
  process.exit(1);
}

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    country TEXT DEFAULT '',
    state_province TEXT DEFAULT '',
    city TEXT DEFAULT '',
    dob DATE,
    gender TEXT DEFAULT '',
    timezone TEXT DEFAULT '',
    profile_picture TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    approval_status TEXT DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    suspended BOOLEAN DEFAULT FALSE,
    height_cm INTEGER,
    goal_type TEXT DEFAULT '',
    primary_training_days_per_week INTEGER,
    diet_type TEXT DEFAULT '',
    injury_limitations TEXT DEFAULT '',
    stress_level_baseline INTEGER,
    leaderboard_opt_in BOOLEAN DEFAULT FALSE,
    leaderboard_display_name TEXT DEFAULT '',
    leaderboard_opt_in_at TIMESTAMPTZ,
    focus_wheel_last_spin_date TEXT DEFAULT '',
    focus_wheel_last_label TEXT DEFAULT '',
    leaderboard_public_program BOOLEAN DEFAULT TRUE,
    leaderboard_public_global BOOLEAN DEFAULT FALSE
  )`,

  `CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_weight NUMERIC,
    target_body_fat NUMERIC,
    weekly_workout_target INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight NUMERIC(5,2),
    body_fat NUMERIC(5,2),
    calories_intake INTEGER,
    protein_intake INTEGER,
    workout_completed BOOLEAN DEFAULT false,
    workout_type VARCHAR(100),
    strength_bench NUMERIC(6,2),
    strength_squat NUMERIC(6,2),
    strength_deadlift NUMERIC(6,2),
    sleep_hours NUMERIC(3,1),
    water_intake NUMERIC(4,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_progress_logs_user_id ON progress_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_logs_created_at ON progress_logs(created_at)`,

  `CREATE TABLE IF NOT EXISTS daily_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    checkin_date DATE NOT NULL,
    steps INTEGER,
    water_ml INTEGER,
    protein_g INTEGER,
    sleep_hours REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date)`,

  `CREATE TABLE IF NOT EXISTS sunday_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    reply_email TEXT NOT NULL,
    plan TEXT DEFAULT '',
    current_weight_waist_week TEXT DEFAULT '',
    last_week_weight_waist TEXT DEFAULT '',
    total_weight_loss TEXT DEFAULT '',
    training_go TEXT DEFAULT '',
    nutrition_go TEXT DEFAULT '',
    sleep TEXT DEFAULT '',
    occupation_stress TEXT DEFAULT '',
    other_stress TEXT DEFAULT '',
    differences_felt TEXT DEFAULT '',
    achievements TEXT DEFAULT '',
    improve_next_week TEXT DEFAULT '',
    questions TEXT DEFAULT '',
    body_fat_percent REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS workout_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workout_name TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER DEFAULT 0,
    feedback TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_date DATE,
    workout_type TEXT,
    session_lifts JSONB,
    bench_kg REAL,
    squat_kg REAL,
    deadlift_kg REAL,
    weight_kg REAL,
    body_fat_percent REAL,
    calories INTEGER,
    protein_g INTEGER,
    water_liters REAL,
    sleep_hrs REAL,
    workout_completed BOOLEAN,
    intensity TEXT,
    energy_level TEXT
  )`,
];

async function main() {
  const pool = new pg.Pool({ connectionString: url });
  try {
    await pool.query('SELECT 1');
    console.log('Connected:', url.replace(/:[^:@/]+@/, ':***@'));
  } catch (e) {
    console.error('Connection failed:', e.message);
    process.exit(1);
  }

  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch (e) {
      console.error('Statement failed:\n', sql.slice(0, 120), '...\n', e.message);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('Bootstrap complete (tables ready on target database).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
