// Express Backend Server for IndiFlow Account Management
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  userDb,
  sessionDb,
  locationDb,
  routeDb,
  settingsDb,
  trainingDb,
  analyticsDb,
  type DbUser,
  type DbSavedLocation,
  type DbSavedRoute,
  type DbUserSettings,
  type DbTrainingSession,
  type DbTrainingFile,
  type DbModelMetrics,
  type DbUserAnalytics,
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'indiflow-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Types
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT token generation
function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return { accessToken, refreshToken, expiresAt };
}

// Auth middleware
function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Helper to format user for response
function formatUser(dbUser: DbUser) {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    phone: dbUser.phone,
    avatar: dbUser.avatar,
    emailVerified: dbUser.email_verified === 1,
    role: dbUser.role || 'user',
    createdAt: dbUser.created_at,
    lastLogin: dbUser.last_login,
  };
}

// ============ AUTH ROUTES ============

// POST /api/auth/signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // Check if user exists
    const existingUser = userDb.findByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const now = new Date().toISOString();
    const userId = uuidv4();
    const role = 'user'; // Default role for regular signups

    userDb.create.run(userId, email.toLowerCase(), name, phone || null, passwordHash, role, now, now, now);

    // Create default settings
    settingsDb.create.run(userId, now, now);

    // Generate tokens
    const tokens = generateTokens(userId, email.toLowerCase());

    // Store session
    sessionDb.create.run(uuidv4(), userId, tokens.accessToken, tokens.refreshToken, tokens.expiresAt, now);

    const user = userDb.findById(userId);
    if (!user) {
      return res.status(500).json({ success: false, error: 'Failed to create user' });
    }

    console.log(`[Auth] User registered: ${userId} (${email})`);

    return res.status(201).json({
      success: true,
      data: {
        user: formatUser(user),
        tokens,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = userDb.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update last login
    const now = new Date().toISOString();
    userDb.updateLastLogin.run(now, user.id);

    // Generate tokens
    const tokens = generateTokens(user.id, user.email);

    // Store session
    sessionDb.create.run(uuidv4(), user.id, tokens.accessToken, tokens.refreshToken, tokens.expiresAt, now);

    console.log(`[Auth] User logged in: ${user.id} (${user.email})`);

    return res.json({
      success: true,
      data: {
        user: formatUser({ ...user, last_login: now }),
        tokens,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    sessionDb.deleteByUserId.run(userId);

    console.log(`[Auth] User logged out: ${userId}`);

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; email: string };
      const tokens = generateTokens(decoded.userId, decoded.email);

      // Update session
      const now = new Date().toISOString();
      sessionDb.deleteByUserId.run(decoded.userId);
      sessionDb.create.run(uuidv4(), decoded.userId, tokens.accessToken, tokens.refreshToken, tokens.expiresAt, now);

      return res.json({ success: true, data: tokens });
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = userDb.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: formatUser(user) });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  // In production, send password reset email
  console.log(`[Auth] Password reset requested for: ${email}`);

  return res.json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link.',
  });
});

// ============ USER ROUTES ============

// PATCH /api/user/profile
app.patch('/api/user/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user!.id;

    const user = userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const now = new Date().toISOString();
    userDb.updateProfile.run(
      name || user.name,
      phone !== undefined ? phone : user.phone,
      avatar !== undefined ? avatar : user.avatar,
      now,
      userId
    );

    const updatedUser = userDb.findById(userId);
    if (!updatedUser) {
      return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }

    console.log(`[User] Profile updated: ${userId}`);

    return res.json({
      success: true,
      data: formatUser(updatedUser),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[User] Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/user/change-password
app.post('/api/user/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const user = userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const now = new Date().toISOString();
    userDb.updatePassword.run(newPasswordHash, now, userId);

    console.log(`[User] Password changed: ${userId}`);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[User] Change password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/user/account
app.delete('/api/user/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.user!.id;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const user = userDb.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Password is incorrect' });
    }

    // Delete user and all related data (cascades in SQLite)
    userDb.delete.run(userId);

    console.log(`[User] Account deleted: ${userId}`);

    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[User] Delete account error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ LOCATIONS ROUTES ============

// GET /api/locations
app.get('/api/locations', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const locations = locationDb.findByUserId(req.user!.id);
    return res.json({
      success: true,
      data: locations.map((loc: DbSavedLocation) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        type: loc.type,
        createdAt: loc.created_at,
      })),
    });
  } catch (error) {
    console.error('[Locations] Get error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/locations
app.post('/api/locations', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, address, lat, lng, type } = req.body;
    const userId = req.user!.id;

    if (!name || !address || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Name, address, lat, and lng are required' });
    }

    const now = new Date().toISOString();
    const locationId = uuidv4();

    locationDb.create.run(locationId, userId, name, address, lat, lng, type || 'favorite', now, now);

    const location = locationDb.findById(locationId);
    if (!location) {
      return res.status(500).json({ success: false, error: 'Failed to create location' });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: location.id,
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        type: location.type,
        createdAt: location.created_at,
      },
      message: 'Location saved successfully',
    });
  } catch (error) {
    console.error('[Locations] Create error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/locations/:id
app.put('/api/locations/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, address, lat, lng, type } = req.body;

    const location = locationDb.findById(id);
    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    const now = new Date().toISOString();
    locationDb.update.run(
      name || location.name,
      address || location.address,
      lat !== undefined ? lat : location.lat,
      lng !== undefined ? lng : location.lng,
      type || location.type,
      now,
      id
    );

    const updatedLocation = locationDb.findById(id);
    return res.json({
      success: true,
      data: {
        id: updatedLocation!.id,
        name: updatedLocation!.name,
        address: updatedLocation!.address,
        lat: updatedLocation!.lat,
        lng: updatedLocation!.lng,
        type: updatedLocation!.type,
        createdAt: updatedLocation!.created_at,
      },
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('[Locations] Update error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/locations/:id
app.delete('/api/locations/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const location = locationDb.findById(id);
    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    locationDb.delete.run(id);

    return res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    console.error('[Locations] Delete error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ ROUTES (saved routes) ROUTES ============

// GET /api/routes
app.get('/api/routes', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const routes = routeDb.findByUserId(req.user!.id);
    return res.json({
      success: true,
      data: routes.map((route: DbSavedRoute) => ({
        id: route.id,
        name: route.name,
        origin: {
          name: route.origin_name,
          lat: route.origin_lat,
          lng: route.origin_lng,
        },
        destination: {
          name: route.destination_name,
          lat: route.destination_lat,
          lng: route.destination_lng,
        },
        distance: route.distance,
        estimatedDuration: route.estimated_duration,
        preferredTransport: route.preferred_transport,
        isFavorite: route.is_favorite === 1,
        usageCount: route.usage_count,
        lastUsed: route.last_used,
        createdAt: route.created_at,
      })),
    });
  } catch (error) {
    console.error('[Routes] Get error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/routes
app.post('/api/routes', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, origin, destination, distance, estimatedDuration, preferredTransport, isFavorite } = req.body;
    const userId = req.user!.id;

    if (!name || !origin || !destination) {
      return res.status(400).json({ success: false, error: 'Name, origin, and destination are required' });
    }

    const now = new Date().toISOString();
    const routeId = uuidv4();

    routeDb.create.run(
      routeId,
      userId,
      name,
      origin.name,
      origin.lat,
      origin.lng,
      destination.name,
      destination.lat,
      destination.lng,
      distance || 0,
      estimatedDuration || 0,
      preferredTransport || 'driving',
      isFavorite ? 1 : 0,
      now,
      now,
      now
    );

    const route = routeDb.findById(routeId);
    if (!route) {
      return res.status(500).json({ success: false, error: 'Failed to create route' });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: route.id,
        name: route.name,
        origin: { name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng },
        destination: { name: route.destination_name, lat: route.destination_lat, lng: route.destination_lng },
        distance: route.distance,
        estimatedDuration: route.estimated_duration,
        preferredTransport: route.preferred_transport,
        isFavorite: route.is_favorite === 1,
        usageCount: route.usage_count,
        lastUsed: route.last_used,
        createdAt: route.created_at,
      },
      message: 'Route saved successfully',
    });
  } catch (error) {
    console.error('[Routes] Create error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/routes/:id/favorite
app.patch('/api/routes/:id/favorite', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isFavorite } = req.body;

    const route = routeDb.findById(id);
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    const now = new Date().toISOString();
    routeDb.toggleFavorite.run(isFavorite ? 1 : 0, now, id);

    return res.json({ success: true, message: 'Route favorite status updated' });
  } catch (error) {
    console.error('[Routes] Toggle favorite error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/routes/:id
app.delete('/api/routes/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const route = routeDb.findById(id);
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    routeDb.delete.run(id);

    return res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('[Routes] Delete error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ SETTINGS ROUTES ============

// GET /api/settings
app.get('/api/settings', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const settings = settingsDb.findByUserId(req.user!.id);
    if (!settings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }

    return res.json({
      success: true,
      data: {
        defaultCity: settings.default_city,
        defaultTransport: settings.default_transport,
        distanceUnit: settings.distance_unit,
        timeFormat: settings.time_format,
        voiceNavigation: settings.voice_navigation === 1,
        notifications: {
          trafficAlerts: settings.traffic_alerts === 1,
          departureReminders: settings.departure_reminders === 1,
          routeUpdates: settings.route_updates === 1,
          weeklyReport: settings.weekly_report === 1,
          soundEnabled: settings.sound_enabled === 1,
          vibrationEnabled: settings.vibration_enabled === 1,
        },
      },
    });
  } catch (error) {
    console.error('[Settings] Get error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/settings
app.put('/api/settings', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const settings = settingsDb.findByUserId(userId);

    if (!settings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }

    const {
      defaultCity,
      defaultTransport,
      distanceUnit,
      timeFormat,
      voiceNavigation,
      notifications,
    } = req.body;

    const now = new Date().toISOString();

    settingsDb.update.run(
      defaultCity ?? settings.default_city,
      defaultTransport ?? settings.default_transport,
      distanceUnit ?? settings.distance_unit,
      timeFormat ?? settings.time_format,
      voiceNavigation !== undefined ? (voiceNavigation ? 1 : 0) : settings.voice_navigation,
      notifications?.trafficAlerts !== undefined ? (notifications.trafficAlerts ? 1 : 0) : settings.traffic_alerts,
      notifications?.departureReminders !== undefined ? (notifications.departureReminders ? 1 : 0) : settings.departure_reminders,
      notifications?.routeUpdates !== undefined ? (notifications.routeUpdates ? 1 : 0) : settings.route_updates,
      notifications?.weeklyReport !== undefined ? (notifications.weeklyReport ? 1 : 0) : settings.weekly_report,
      notifications?.soundEnabled !== undefined ? (notifications.soundEnabled ? 1 : 0) : settings.sound_enabled,
      notifications?.vibrationEnabled !== undefined ? (notifications.vibrationEnabled ? 1 : 0) : settings.vibration_enabled,
      now,
      userId
    );

    const updatedSettings = settingsDb.findByUserId(userId);

    return res.json({
      success: true,
      data: {
        defaultCity: updatedSettings!.default_city,
        defaultTransport: updatedSettings!.default_transport,
        distanceUnit: updatedSettings!.distance_unit,
        timeFormat: updatedSettings!.time_format,
        voiceNavigation: updatedSettings!.voice_navigation === 1,
        notifications: {
          trafficAlerts: updatedSettings!.traffic_alerts === 1,
          departureReminders: updatedSettings!.departure_reminders === 1,
          routeUpdates: updatedSettings!.route_updates === 1,
          weeklyReport: updatedSettings!.weekly_report === 1,
          soundEnabled: updatedSettings!.sound_enabled === 1,
          vibrationEnabled: updatedSettings!.vibration_enabled === 1,
        },
      },
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('[Settings] Update error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ DEVELOPER ROUTES ============

// Middleware to check developer role
function requireDeveloper(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const user = userDb.findById(req.user.id);
  if (!user || user.role !== 'developer') {
    return res.status(403).json({ success: false, error: 'Developer access required' });
  }

  next();
}

// GET /api/dev/dashboard - Get developer dashboard stats
app.get('/api/dev/dashboard', authenticate, requireDeveloper, (_req: AuthRequest, res: Response) => {
  try {
    const userCounts = userDb.countByRole();
    const trainingStats = trainingDb.getTrainingStats();
    const allUsers = userDb.findAll();
    const recentUsers = allUsers.slice(0, 10);

    return res.json({
      success: true,
      data: {
        userStats: {
          total: allUsers.length,
          byRole: userCounts,
          recent: recentUsers.map((u: DbUser) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            createdAt: u.created_at,
            lastLogin: u.last_login,
          })),
        },
        trainingStats,
        serverInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      },
    });
  } catch (error) {
    console.error('[Dev] Dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dev/users - Get all users
app.get('/api/dev/users', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const { search, role } = req.query;

    let users: DbUser[];
    if (search && typeof search === 'string') {
      users = userDb.search(search);
    } else if (role && typeof role === 'string') {
      users = userDb.findByRole(role);
    } else {
      users = userDb.findAll();
    }

    return res.json({
      success: true,
      data: users.map((u: DbUser) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        emailVerified: u.email_verified === 1,
        createdAt: u.created_at,
        lastLogin: u.last_login,
      })),
    });
  } catch (error) {
    console.error('[Dev] Get users error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dev/users/:id - Get user details
app.get('/api/dev/users/:id', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = userDb.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const locations = locationDb.findByUserId(id);
    const routes = routeDb.findByUserId(id);
    const settings = settingsDb.findByUserId(id);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          emailVerified: user.email_verified === 1,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
        locations: locations.length,
        routes: routes.length,
        settings: settings ? {
          defaultCity: settings.default_city,
          defaultTransport: settings.default_transport,
        } : null,
      },
    });
  } catch (error) {
    console.error('[Dev] Get user error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dev/users/:id/analytics - Get user analytics
app.get('/api/dev/users/:id/analytics', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = userDb.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const stats = analyticsDb.getUserStats(id);
    const recentActivity = analyticsDb.getRecentActivity(id, 20);
    const locations = locationDb.findByUserId(id);
    const routes = routeDb.findByUserId(id);

    return res.json({
      success: true,
      data: {
        userId: id,
        userEmail: user.email,
        userName: user.name,
        stats: {
          totalRoutes: stats.totalRoutes,
          totalTrips: stats.totalTrips,
          avgTravelTime: Math.round(stats.avgTravelTime),
          totalDistance: Math.round(stats.totalDistance * 100) / 100,
          avgAiAccuracy: Math.round(stats.avgAiAccuracy * 1000) / 10,
          transportModes: stats.transportModes,
          topRoutes: stats.topRoutes.map(r => ({
            origin: r.route_origin,
            destination: r.route_destination,
            usageCount: r.count,
            avgTime: Math.round(r.avg_time || 0),
          })),
        },
        savedLocations: locations.length,
        savedRoutes: routes.length,
        routeDetails: routes.slice(0, 10).map((r: DbSavedRoute) => ({
          id: r.id,
          name: r.name,
          origin: r.origin_name,
          destination: r.destination_name,
          distance: r.distance,
          duration: r.estimated_duration,
          transport: r.preferred_transport,
          usageCount: r.usage_count,
          isFavorite: r.is_favorite === 1,
          lastUsed: r.last_used,
        })),
        recentActivity: recentActivity.map((a: DbUserAnalytics) => ({
          id: a.id,
          eventType: a.event_type,
          eventData: a.event_data ? JSON.parse(a.event_data) : null,
          origin: a.route_origin,
          destination: a.route_destination,
          travelTime: a.travel_time,
          distance: a.distance,
          transport: a.transport_mode,
          aiAccuracy: a.ai_accuracy,
          timestamp: a.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Dev] Get user analytics error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/analytics/track - Track user event (for frontend to call)
app.post('/api/analytics/track', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventType, eventData, routeOrigin, routeDestination, travelTime, distance, transportMode, aiAccuracy } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'Event type is required' });
    }

    const now = new Date().toISOString();
    const eventId = uuidv4();

    analyticsDb.create.run(
      eventId,
      userId,
      eventType,
      eventData ? JSON.stringify(eventData) : null,
      routeOrigin || null,
      routeDestination || null,
      travelTime || null,
      distance || null,
      transportMode || null,
      aiAccuracy || null,
      now
    );

    return res.json({
      success: true,
      data: { eventId },
      message: 'Event tracked',
    });
  } catch (error) {
    console.error('[Analytics] Track event error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============ TRAINING ROUTES ============

// GET /api/dev/training/sessions - Get all training sessions
app.get('/api/dev/training/sessions', authenticate, requireDeveloper, (_req: AuthRequest, res: Response) => {
  try {
    const sessions = trainingDb.findAllSessions();
    return res.json({
      success: true,
      data: sessions.map((s: DbTrainingSession) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        modelType: s.model_type,
        accuracy: s.accuracy,
        trainingSamples: s.training_samples,
        epochsCompleted: s.epochs_completed,
        totalEpochs: s.total_epochs,
        loss: s.loss,
        createdAt: s.created_at,
        completedAt: s.completed_at,
      })),
    });
  } catch (error) {
    console.error('[Dev] Get training sessions error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/dev/training/sessions - Create a new training session
app.post('/api/dev/training/sessions', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, modelType, totalEpochs } = req.body;
    const userId = req.user!.id;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Session name is required' });
    }

    const now = new Date().toISOString();
    const sessionId = uuidv4();

    trainingDb.createSession.run(
      sessionId,
      name,
      description || null,
      userId,
      'pending',
      modelType || 'traffic_prediction',
      totalEpochs || 100,
      now,
      now
    );

    const session = trainingDb.findSessionById(sessionId);
    return res.status(201).json({
      success: true,
      data: session,
      message: 'Training session created',
    });
  } catch (error) {
    console.error('[Dev] Create training session error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dev/training/sessions/:id - Get session details
app.get('/api/dev/training/sessions/:id', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const session = trainingDb.findSessionById(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const files = trainingDb.findFilesBySession(id);
    const metrics = trainingDb.findMetricsBySession(id);

    return res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          name: session.name,
          description: session.description,
          status: session.status,
          modelType: session.model_type,
          accuracy: session.accuracy,
          trainingSamples: session.training_samples,
          epochsCompleted: session.epochs_completed,
          totalEpochs: session.total_epochs,
          loss: session.loss,
          createdAt: session.created_at,
          completedAt: session.completed_at,
        },
        files: files.map((f: DbTrainingFile) => ({
          id: f.id,
          filename: f.filename,
          fileType: f.file_type,
          fileSize: f.file_size,
          processed: f.processed === 1,
          analysisResult: f.analysis_result ? JSON.parse(f.analysis_result) : null,
          createdAt: f.created_at,
        })),
        metrics: metrics.map((m: DbModelMetrics) => ({
          epoch: m.epoch,
          accuracy: m.accuracy,
          loss: m.loss,
          valAccuracy: m.val_accuracy,
          valLoss: m.val_loss,
        })),
      },
    });
  } catch (error) {
    console.error('[Dev] Get session error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/dev/training/sessions/:id/files - Upload training file
app.post('/api/dev/training/sessions/:id/files', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const { filename, fileType, fileSize, fileContent } = req.body;

    const session = trainingDb.findSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (!filename || !fileType) {
      return res.status(400).json({ success: false, error: 'Filename and file type are required' });
    }

    const now = new Date().toISOString();
    const fileId = uuidv4();

    trainingDb.createFile.run(fileId, sessionId, filename, fileType, fileSize || 0, fileContent || null, now);

    // Update sample count
    const files = trainingDb.findFilesBySession(sessionId);
    trainingDb.updateSessionSamples.run(files.length, now, sessionId);

    return res.status(201).json({
      success: true,
      data: { id: fileId, filename, fileType },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('[Dev] Upload file error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/dev/training/sessions/:id/analyze - Analyze file with LLM
app.post('/api/dev/training/sessions/:id/analyze', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.id as string;
    const { fileId, content } = req.body;

    const session = trainingDb.findSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Simulate LLM analysis (in production, this would call actual LLM)
    const analysisResult = {
      dataQuality: 'good',
      recordCount: Math.floor(Math.random() * 1000) + 100,
      features: ['origin', 'destination', 'time', 'traffic_level', 'weather'],
      missingValues: Math.floor(Math.random() * 5),
      outliers: Math.floor(Math.random() * 10),
      recommendations: [
        'Data is suitable for training',
        'Consider normalizing time features',
        'Traffic levels are well-distributed',
      ],
      estimatedAccuracyImpact: `+${(Math.random() * 3).toFixed(1)}%`,
    };

    if (fileId) {
      trainingDb.updateFileAnalysis.run(JSON.stringify(analysisResult), 1, fileId);
    }

    return res.json({
      success: true,
      data: analysisResult,
      message: 'Analysis completed',
    });
  } catch (error) {
    console.error('[Dev] Analyze error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/dev/training/sessions/:id/train - Start training
app.post('/api/dev/training/sessions/:id/train', authenticate, requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.params.id as string;

    const session = trainingDb.findSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Start training simulation
    const now = new Date().toISOString();
    trainingDb.updateSessionStatus.run('training', 0, 0, null, now, null, sessionId);

    // Simulate training progress (in production, this would be async background job)
    let epoch = 0;
    const totalEpochs = session.total_epochs;
    const interval = setInterval(() => {
      epoch++;
      const accuracy = 0.5 + (epoch / totalEpochs) * 0.4 + (Math.random() * 0.05);
      const loss = 1.0 - (epoch / totalEpochs) * 0.8 + (Math.random() * 0.1);
      const valAccuracy = accuracy - (Math.random() * 0.03);
      const valLoss = loss + (Math.random() * 0.05);

      const metricNow = new Date().toISOString();
      trainingDb.createMetrics.run(uuidv4(), sessionId, epoch, accuracy, loss, valAccuracy, valLoss, metricNow);

      if (epoch >= totalEpochs || epoch >= 10) { // Limit to 10 epochs for demo
        clearInterval(interval);
        const completedAt = new Date().toISOString();
        trainingDb.updateSessionStatus.run('completed', epoch, accuracy, loss, completedAt, completedAt, sessionId);
        console.log(`[Training] Session ${sessionId} completed with ${(accuracy * 100).toFixed(1)}% accuracy`);
      } else {
        trainingDb.updateSessionStatus.run('training', epoch, accuracy, loss, metricNow, null, sessionId);
      }
    }, 500); // Simulate quick training for demo

    return res.json({
      success: true,
      message: 'Training started',
      data: { sessionId, status: 'training' },
    });
  } catch (error) {
    console.error('[Dev] Start training error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dev/training/stats - Get training statistics
app.get('/api/dev/training/stats', authenticate, requireDeveloper, (_req: AuthRequest, res: Response) => {
  try {
    const stats = trainingDb.getTrainingStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Dev] Training stats error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 IndiFlow Backend Server running on http://localhost:${PORT}`);
  console.log(`   API endpoints available at http://localhost:${PORT}/api`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
