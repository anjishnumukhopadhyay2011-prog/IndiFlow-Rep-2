// SQLite Database for Account Management
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'indiflow.db');

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create users table with role support
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    password_hash TEXT NOT NULL,
    email_verified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at TEXT NOT NULL,
    last_login TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`);

// Add role column if it doesn't exist (migration)
try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
} catch {
  // Column already exists
}

// Create AI training sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS training_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    model_type TEXT DEFAULT 'traffic_prediction',
    accuracy REAL DEFAULT 0,
    training_samples INTEGER DEFAULT 0,
    epochs_completed INTEGER DEFAULT 0,
    total_epochs INTEGER DEFAULT 100,
    loss REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_training_sessions_created_by ON training_sessions(created_by);
  CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
`);

// Create training data files table
db.exec(`
  CREATE TABLE IF NOT EXISTS training_files (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_content TEXT,
    analysis_result TEXT,
    processed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_training_files_session_id ON training_files(session_id);
`);

// Create model metrics table for tracking accuracy over time
db.exec(`
  CREATE TABLE IF NOT EXISTS model_metrics (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    epoch INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    loss REAL NOT NULL,
    val_accuracy REAL,
    val_loss REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_model_metrics_session_id ON model_metrics(session_id);
`);

// Create sessions table for token management
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
  CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
`);

// Create saved_locations table
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_locations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'favorite',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON saved_locations(user_id);
`);

// Create saved_routes table
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_routes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    origin_lat REAL NOT NULL,
    origin_lng REAL NOT NULL,
    destination_name TEXT NOT NULL,
    destination_lat REAL NOT NULL,
    destination_lng REAL NOT NULL,
    distance REAL NOT NULL,
    estimated_duration INTEGER NOT NULL,
    preferred_transport TEXT NOT NULL DEFAULT 'driving',
    is_favorite INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 1,
    last_used TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON saved_routes(user_id);
`);

// Create user_analytics table for tracking per-user metrics
db.exec(`
  CREATE TABLE IF NOT EXISTS user_analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    route_origin TEXT,
    route_destination TEXT,
    travel_time INTEGER,
    distance REAL,
    transport_mode TEXT,
    ai_accuracy REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
  CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at);
`);

// Create user_settings table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    default_city TEXT DEFAULT 'Mumbai',
    default_transport TEXT DEFAULT 'driving',
    distance_unit TEXT DEFAULT 'km',
    time_format TEXT DEFAULT '12h',
    voice_navigation INTEGER DEFAULT 1,
    traffic_alerts INTEGER DEFAULT 1,
    departure_reminders INTEGER DEFAULT 1,
    route_updates INTEGER DEFAULT 1,
    weekly_report INTEGER DEFAULT 0,
    sound_enabled INTEGER DEFAULT 1,
    vibration_enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export interface DbUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  password_hash: string;
  email_verified: number;
  role: string;
  created_at: string;
  last_login: string;
  updated_at: string;
}

export interface DbTrainingSession {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: string;
  model_type: string;
  accuracy: number;
  training_samples: number;
  epochs_completed: number;
  total_epochs: number;
  loss: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DbTrainingFile {
  id: string;
  session_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_content: string | null;
  analysis_result: string | null;
  processed: number;
  created_at: string;
}

export interface DbModelMetrics {
  id: string;
  session_id: string;
  epoch: number;
  accuracy: number;
  loss: number;
  val_accuracy: number | null;
  val_loss: number | null;
  created_at: string;
}

export interface DbSession {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export interface DbSavedLocation {
  id: string;
  user_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface DbSavedRoute {
  id: string;
  user_id: string;
  name: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  distance: number;
  estimated_duration: number;
  preferred_transport: string;
  is_favorite: number;
  usage_count: number;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export interface DbUserSettings {
  user_id: string;
  default_city: string;
  default_transport: string;
  distance_unit: string;
  time_format: string;
  voice_navigation: number;
  traffic_alerts: number;
  departure_reminders: number;
  route_updates: number;
  weekly_report: number;
  sound_enabled: number;
  vibration_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface DbUserAnalytics {
  id: string;
  user_id: string;
  event_type: string;
  event_data: string | null;
  route_origin: string | null;
  route_destination: string | null;
  travel_time: number | null;
  distance: number | null;
  transport_mode: string | null;
  ai_accuracy: number | null;
  created_at: string;
}

// User operations
export const userDb = {
  create: db.prepare<[string, string, string, string | null, string, string, string, string, string]>(`
    INSERT INTO users (id, email, name, phone, password_hash, role, created_at, last_login, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findByEmail: db.prepare<[string]>(`
    SELECT * FROM users WHERE email = ?
  `).get.bind(db.prepare(`SELECT * FROM users WHERE email = ?`)) as (email: string) => DbUser | undefined,

  findById: db.prepare<[string]>(`
    SELECT * FROM users WHERE id = ?
  `).get.bind(db.prepare(`SELECT * FROM users WHERE id = ?`)) as (id: string) => DbUser | undefined,

  findAll: (): DbUser[] => {
    return db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all() as DbUser[];
  },

  findByRole: (role: string): DbUser[] => {
    return db.prepare(`SELECT * FROM users WHERE role = ? ORDER BY created_at DESC`).all(role) as DbUser[];
  },

  countByRole: (): { role: string; count: number }[] => {
    return db.prepare(`SELECT role, COUNT(*) as count FROM users GROUP BY role`).all() as { role: string; count: number }[];
  },

  updateProfile: db.prepare<[string, string | null, string | null, string, string]>(`
    UPDATE users SET name = ?, phone = ?, avatar = ?, updated_at = ? WHERE id = ?
  `),

  updatePassword: db.prepare<[string, string, string]>(`
    UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
  `),

  updateRole: db.prepare<[string, string, string]>(`
    UPDATE users SET role = ?, updated_at = ? WHERE id = ?
  `),

  updateLastLogin: db.prepare<[string, string]>(`
    UPDATE users SET last_login = ? WHERE id = ?
  `),

  delete: db.prepare<[string]>(`
    DELETE FROM users WHERE id = ?
  `),

  search: (query: string): DbUser[] => {
    const searchPattern = `%${query}%`;
    return db.prepare(`
      SELECT * FROM users
      WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `).all(searchPattern, searchPattern, searchPattern) as DbUser[];
  },
};

// Session operations
export const sessionDb = {
  create: db.prepare<[string, string, string, string, string, string]>(`
    INSERT INTO sessions (id, user_id, access_token, refresh_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  findByAccessToken: db.prepare<[string]>(`
    SELECT * FROM sessions WHERE access_token = ?
  `).get.bind(db.prepare(`SELECT * FROM sessions WHERE access_token = ?`)) as (token: string) => DbSession | undefined,

  findByRefreshToken: db.prepare<[string]>(`
    SELECT * FROM sessions WHERE refresh_token = ?
  `).get.bind(db.prepare(`SELECT * FROM sessions WHERE refresh_token = ?`)) as (token: string) => DbSession | undefined,

  deleteByUserId: db.prepare<[string]>(`
    DELETE FROM sessions WHERE user_id = ?
  `),

  deleteById: db.prepare<[string]>(`
    DELETE FROM sessions WHERE id = ?
  `),

  deleteExpired: db.prepare(`
    DELETE FROM sessions WHERE expires_at < datetime('now')
  `),
};

// Saved locations operations
export const locationDb = {
  create: db.prepare<[string, string, string, string, number, number, string, string, string]>(`
    INSERT INTO saved_locations (id, user_id, name, address, lat, lng, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findByUserId: (userId: string): DbSavedLocation[] => {
    return db.prepare(`SELECT * FROM saved_locations WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as DbSavedLocation[];
  },

  findById: db.prepare<[string]>(`
    SELECT * FROM saved_locations WHERE id = ?
  `).get.bind(db.prepare(`SELECT * FROM saved_locations WHERE id = ?`)) as (id: string) => DbSavedLocation | undefined,

  update: db.prepare<[string, string, number, number, string, string, string]>(`
    UPDATE saved_locations SET name = ?, address = ?, lat = ?, lng = ?, type = ?, updated_at = ? WHERE id = ?
  `),

  delete: db.prepare<[string]>(`
    DELETE FROM saved_locations WHERE id = ?
  `),
};

// Saved routes operations
export const routeDb = {
  create: db.prepare<[string, string, string, string, number, number, string, number, number, number, number, string, number, string, string, string]>(`
    INSERT INTO saved_routes (id, user_id, name, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, distance, estimated_duration, preferred_transport, is_favorite, last_used, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findByUserId: (userId: string): DbSavedRoute[] => {
    return db.prepare(`SELECT * FROM saved_routes WHERE user_id = ? ORDER BY last_used DESC`).all(userId) as DbSavedRoute[];
  },

  findById: db.prepare<[string]>(`
    SELECT * FROM saved_routes WHERE id = ?
  `).get.bind(db.prepare(`SELECT * FROM saved_routes WHERE id = ?`)) as (id: string) => DbSavedRoute | undefined,

  update: db.prepare<[string, string, number, number, string, number, number, number, number, string, number, string, string]>(`
    UPDATE saved_routes SET name = ?, origin_name = ?, origin_lat = ?, origin_lng = ?, destination_name = ?, destination_lat = ?, destination_lng = ?, distance = ?, estimated_duration = ?, preferred_transport = ?, is_favorite = ?, updated_at = ? WHERE id = ?
  `),

  toggleFavorite: db.prepare<[number, string, string]>(`
    UPDATE saved_routes SET is_favorite = ?, updated_at = ? WHERE id = ?
  `),

  incrementUsage: db.prepare<[string, string]>(`
    UPDATE saved_routes SET usage_count = usage_count + 1, last_used = ? WHERE id = ?
  `),

  delete: db.prepare<[string]>(`
    DELETE FROM saved_routes WHERE id = ?
  `),
};

// User settings operations
export const settingsDb = {
  create: db.prepare<[string, string, string]>(`
    INSERT INTO user_settings (user_id, created_at, updated_at)
    VALUES (?, ?, ?)
  `),

  findByUserId: db.prepare<[string]>(`
    SELECT * FROM user_settings WHERE user_id = ?
  `).get.bind(db.prepare(`SELECT * FROM user_settings WHERE user_id = ?`)) as (userId: string) => DbUserSettings | undefined,

  update: db.prepare<[string, string, string, string, number, number, number, number, number, number, number, string, string]>(`
    UPDATE user_settings
    SET default_city = ?, default_transport = ?, distance_unit = ?, time_format = ?,
        voice_navigation = ?, traffic_alerts = ?, departure_reminders = ?, route_updates = ?,
        weekly_report = ?, sound_enabled = ?, vibration_enabled = ?, updated_at = ?
    WHERE user_id = ?
  `),
};

// User analytics operations
export const analyticsDb = {
  create: db.prepare<[string, string, string, string | null, string | null, string | null, number | null, number | null, string | null, number | null, string]>(`
    INSERT INTO user_analytics (id, user_id, event_type, event_data, route_origin, route_destination, travel_time, distance, transport_mode, ai_accuracy, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findByUserId: (userId: string, limit: number = 100): DbUserAnalytics[] => {
    return db.prepare(`SELECT * FROM user_analytics WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit) as DbUserAnalytics[];
  },

  findByEventType: (userId: string, eventType: string): DbUserAnalytics[] => {
    return db.prepare(`SELECT * FROM user_analytics WHERE user_id = ? AND event_type = ? ORDER BY created_at DESC`).all(userId, eventType) as DbUserAnalytics[];
  },

  getUserStats: (userId: string) => {
    const totalRoutes = db.prepare(`SELECT COUNT(*) as count FROM user_analytics WHERE user_id = ? AND event_type = 'route_searched'`).get(userId) as { count: number };
    const totalTrips = db.prepare(`SELECT COUNT(*) as count FROM user_analytics WHERE user_id = ? AND event_type = 'trip_completed'`).get(userId) as { count: number };
    const avgTravelTime = db.prepare(`SELECT AVG(travel_time) as avg FROM user_analytics WHERE user_id = ? AND travel_time IS NOT NULL`).get(userId) as { avg: number | null };
    const totalDistance = db.prepare(`SELECT SUM(distance) as total FROM user_analytics WHERE user_id = ? AND distance IS NOT NULL`).get(userId) as { total: number | null };
    const avgAiAccuracy = db.prepare(`SELECT AVG(ai_accuracy) as avg FROM user_analytics WHERE user_id = ? AND ai_accuracy IS NOT NULL`).get(userId) as { avg: number | null };
    const transportModes = db.prepare(`SELECT transport_mode, COUNT(*) as count FROM user_analytics WHERE user_id = ? AND transport_mode IS NOT NULL GROUP BY transport_mode ORDER BY count DESC`).all(userId) as { transport_mode: string; count: number }[];
    const topRoutes = db.prepare(`
      SELECT route_origin, route_destination, COUNT(*) as count, AVG(travel_time) as avg_time
      FROM user_analytics
      WHERE user_id = ? AND route_origin IS NOT NULL AND route_destination IS NOT NULL
      GROUP BY route_origin, route_destination
      ORDER BY count DESC
      LIMIT 5
    `).all(userId) as { route_origin: string; route_destination: string; count: number; avg_time: number | null }[];

    return {
      totalRoutes: totalRoutes.count,
      totalTrips: totalTrips.count,
      avgTravelTime: avgTravelTime.avg || 0,
      totalDistance: totalDistance.total || 0,
      avgAiAccuracy: avgAiAccuracy.avg || 0,
      transportModes,
      topRoutes,
    };
  },

  getRecentActivity: (userId: string, limit: number = 10): DbUserAnalytics[] => {
    return db.prepare(`SELECT * FROM user_analytics WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit) as DbUserAnalytics[];
  },
};

// Training sessions operations
export const trainingDb = {
  createSession: db.prepare<[string, string, string | null, string, string, string, number, string, string]>(`
    INSERT INTO training_sessions (id, name, description, created_by, status, model_type, total_epochs, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findAllSessions: (): DbTrainingSession[] => {
    return db.prepare(`SELECT * FROM training_sessions ORDER BY created_at DESC`).all() as DbTrainingSession[];
  },

  findSessionById: db.prepare<[string]>(`
    SELECT * FROM training_sessions WHERE id = ?
  `).get.bind(db.prepare(`SELECT * FROM training_sessions WHERE id = ?`)) as (id: string) => DbTrainingSession | undefined,

  findSessionsByUser: (userId: string): DbTrainingSession[] => {
    return db.prepare(`SELECT * FROM training_sessions WHERE created_by = ? ORDER BY created_at DESC`).all(userId) as DbTrainingSession[];
  },

  updateSessionStatus: db.prepare<[string, number, number, number | null, string, string | null, string]>(`
    UPDATE training_sessions SET status = ?, epochs_completed = ?, accuracy = ?, loss = ?, updated_at = ?, completed_at = ? WHERE id = ?
  `),

  updateSessionSamples: db.prepare<[number, string, string]>(`
    UPDATE training_sessions SET training_samples = ?, updated_at = ? WHERE id = ?
  `),

  deleteSession: db.prepare<[string]>(`
    DELETE FROM training_sessions WHERE id = ?
  `),

  // Training files
  createFile: db.prepare<[string, string, string, string, number, string | null, string]>(`
    INSERT INTO training_files (id, session_id, filename, file_type, file_size, file_content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  findFilesBySession: (sessionId: string): DbTrainingFile[] => {
    return db.prepare(`SELECT * FROM training_files WHERE session_id = ? ORDER BY created_at DESC`).all(sessionId) as DbTrainingFile[];
  },

  updateFileAnalysis: db.prepare<[string | null, number, string]>(`
    UPDATE training_files SET analysis_result = ?, processed = ? WHERE id = ?
  `),

  deleteFile: db.prepare<[string]>(`
    DELETE FROM training_files WHERE id = ?
  `),

  // Model metrics
  createMetrics: db.prepare<[string, string, number, number, number, number | null, number | null, string]>(`
    INSERT INTO model_metrics (id, session_id, epoch, accuracy, loss, val_accuracy, val_loss, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  findMetricsBySession: (sessionId: string): DbModelMetrics[] => {
    return db.prepare(`SELECT * FROM model_metrics WHERE session_id = ? ORDER BY epoch ASC`).all(sessionId) as DbModelMetrics[];
  },

  getLatestMetrics: db.prepare<[string]>(`
    SELECT * FROM model_metrics WHERE session_id = ? ORDER BY epoch DESC LIMIT 1
  `).get.bind(db.prepare(`SELECT * FROM model_metrics WHERE session_id = ? ORDER BY epoch DESC LIMIT 1`)) as (sessionId: string) => DbModelMetrics | undefined,

  // Stats
  getTrainingStats: () => {
    const totalSessions = db.prepare(`SELECT COUNT(*) as count FROM training_sessions`).get() as { count: number };
    const completedSessions = db.prepare(`SELECT COUNT(*) as count FROM training_sessions WHERE status = 'completed'`).get() as { count: number };
    const avgAccuracy = db.prepare(`SELECT AVG(accuracy) as avg FROM training_sessions WHERE status = 'completed'`).get() as { avg: number | null };
    const totalFiles = db.prepare(`SELECT COUNT(*) as count FROM training_files`).get() as { count: number };
    return {
      totalSessions: totalSessions.count,
      completedSessions: completedSessions.count,
      avgAccuracy: avgAccuracy.avg || 0,
      totalFiles: totalFiles.count,
    };
  },
};

// Seed developer account - always ensure it exists with correct password
import bcrypt from 'bcryptjs';

const DEV_EMAIL = 'dev1@indiflow';
const DEV_PASSWORD = '12345678';
const DEV_ID = 'dev-001-indiflow';

const existingDev = userDb.findByEmail(DEV_EMAIL);
const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync(DEV_PASSWORD, 10);

if (!existingDev) {
  try {
    userDb.create.run(DEV_ID, DEV_EMAIL, 'IndiFlow Developer', null, passwordHash, 'developer', now, now, now);
    settingsDb.create.run(DEV_ID, now, now);
    console.log('[Database] Developer account created: dev1@indiflow / 12345678');
  } catch (e) {
    console.log('[Database] Developer account creation error:', e);
  }
} else {
  // Update the developer account password to ensure it's correct
  try {
    userDb.updatePassword.run(passwordHash, now, existingDev.id);
    // Ensure role is set to developer
    if (existingDev.role !== 'developer') {
      userDb.updateRole.run('developer', now, existingDev.id);
    }
    console.log('[Database] Developer account password reset: dev1@indiflow / 12345678');
  } catch (e) {
    console.log('[Database] Developer account update error:', e);
  }
}

export default db;
