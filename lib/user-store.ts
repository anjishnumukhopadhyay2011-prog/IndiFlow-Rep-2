// User store for managing user profile, settings, and saved routes

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface UserLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'home' | 'work' | 'favorite' | 'recent';
  icon?: string;
  createdAt: Date;
}

export interface SavedRoute {
  id: string;
  name: string;
  origin: UserLocation;
  destination: UserLocation;
  distance: number;
  estimatedDuration: number;
  preferredTransport: 'driving' | 'cycling' | 'walking' | 'bus' | 'bike';
  isFavorite: boolean;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
  notes?: string;
}

export interface NotificationPreferences {
  trafficAlerts: boolean;
  departureReminders: boolean;
  routeUpdates: boolean;
  weeklyReport: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';
  distanceUnit: 'km' | 'mi';
  timeFormat: '12h' | '24h';
  defaultTransport: 'driving' | 'cycling' | 'walking' | 'bus' | 'bike';
  defaultCity: string;
  notifications: NotificationPreferences;
  voiceNavigation: boolean;
  autoStartNavigation: boolean;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  skipped: boolean;
}

// Developer credentials
export const DEV_CREDENTIALS = {
  username: 'Dev@Aditya',
  password: 'Aditya@4321',
};

export interface DevAuthState {
  isDevAuthenticated: boolean;
  devUsername: string | null;
  authTime: Date | null;
}

export interface UserState {
  profile: UserProfile | null;
  settings: UserSettings;
  savedLocations: UserLocation[];
  savedRoutes: SavedRoute[];
  onboarding: OnboardingState;
  isLoggedIn: boolean;
  devAuth: DevAuthState;
}

// Storage keys
const USER_PROFILE_KEY = 'indiflow_user_profile';
const USER_SETTINGS_KEY = 'indiflow_user_settings';
const SAVED_LOCATIONS_KEY = 'indiflow_saved_locations';
const SAVED_ROUTES_KEY = 'indiflow_saved_routes';
const ONBOARDING_KEY = 'indiflow_onboarding';
const DETECTED_CITY_KEY = 'indiflow_detected_city';

// Default settings - city will be detected from IP geolocation
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'en',
  distanceUnit: 'km',
  timeFormat: '12h',
  defaultTransport: 'driving',
  defaultCity: 'Detecting...', // Will be updated by IP geolocation
  notifications: {
    trafficAlerts: true,
    departureReminders: true,
    routeUpdates: true,
    weeklyReport: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  voiceNavigation: true,
  autoStartNavigation: false,
};

// Default onboarding state
export const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  currentStep: 0,
  totalSteps: 5,
  skipped: false,
};

// Indian cities for selection
export const INDIAN_CITIES = [
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, aliases: ['Calcutta'] },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7333, lng: 76.7794 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
];

// Helper functions for localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle date conversions
      if (key === USER_PROFILE_KEY && parsed) {
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastActive: new Date(parsed.lastActive),
        } as T;
      }
      if (key === SAVED_LOCATIONS_KEY && Array.isArray(parsed)) {
        return parsed.map((loc: any) => ({
          ...loc,
          createdAt: new Date(loc.createdAt),
        })) as T;
      }
      if (key === SAVED_ROUTES_KEY && Array.isArray(parsed)) {
        return parsed.map((route: any) => ({
          ...route,
          lastUsed: new Date(route.lastUsed),
          createdAt: new Date(route.createdAt),
          origin: { ...route.origin, createdAt: new Date(route.origin.createdAt) },
          destination: { ...route.destination, createdAt: new Date(route.destination.createdAt) },
        })) as T;
      }
      return parsed;
    }
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

// Storage key for dev auth
const DEV_AUTH_KEY = 'indiflow_dev_auth';

// Default dev auth state
const DEFAULT_DEV_AUTH: DevAuthState = {
  isDevAuthenticated: false,
  devUsername: null,
  authTime: null,
};

// User store class
class UserStore {
  private profile: UserProfile | null = null;
  private settings: UserSettings = DEFAULT_SETTINGS;
  private savedLocations: UserLocation[] = [];
  private savedRoutes: SavedRoute[] = [];
  private onboarding: OnboardingState = DEFAULT_ONBOARDING;
  private devAuth: DevAuthState = DEFAULT_DEV_AUTH;
  private listeners: Set<() => void> = new Set();
  private cityDetectionInProgress: boolean = false;

  constructor() {
    this.loadState();
    // Auto-detect city from IP geolocation if not already set
    this.detectCityFromIP();
  }

  private loadState(): void {
    this.profile = loadFromStorage(USER_PROFILE_KEY, null);
    this.settings = loadFromStorage(USER_SETTINGS_KEY, DEFAULT_SETTINGS);
    this.savedLocations = loadFromStorage(SAVED_LOCATIONS_KEY, []);
    this.savedRoutes = loadFromStorage(SAVED_ROUTES_KEY, []);
    this.onboarding = loadFromStorage(ONBOARDING_KEY, DEFAULT_ONBOARDING);
    const storedDevAuth = loadFromStorage<DevAuthState | null>(DEV_AUTH_KEY, null);
    if (storedDevAuth) {
      this.devAuth = {
        ...storedDevAuth,
        authTime: storedDevAuth.authTime ? new Date(storedDevAuth.authTime) : null,
      };
    }

    // Check if we have a previously detected city
    const detectedCity = loadFromStorage<string | null>(DETECTED_CITY_KEY, null);
    if (detectedCity && this.settings.defaultCity === 'Detecting...') {
      this.settings.defaultCity = detectedCity;
    }
  }

  // Detect city from IP geolocation
  async detectCityFromIP(): Promise<void> {
    // Only detect if city is not already set or is still "Detecting..."
    if (this.settings.defaultCity !== 'Detecting...' && this.settings.defaultCity !== '') {
      return;
    }

    if (this.cityDetectionInProgress) {
      return;
    }

    this.cityDetectionInProgress = true;

    try {
      // Use ipgeolocation.io API to detect user's location
      const IP_GEOLOCATION_API_KEY = '268b807014336acc37511ae32915bc69';
      const response = await fetch(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${IP_GEOLOCATION_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`IP Geolocation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.city) {
        // Try to match with known Indian cities first
        const matchedCity = this.findMatchingIndianCity(data.city);
        const cityName = matchedCity || data.city;

        this.settings.defaultCity = cityName;
        saveToStorage(USER_SETTINGS_KEY, this.settings);
        saveToStorage(DETECTED_CITY_KEY, cityName);
        this.notifyListeners();

        console.log(`[UserStore] City detected from IP: ${cityName}`);
      }
    } catch (error) {
      console.error('[UserStore] Failed to detect city from IP:', error);
      // Fallback to Mumbai if detection fails
      this.settings.defaultCity = 'Mumbai';
      saveToStorage(USER_SETTINGS_KEY, this.settings);
      this.notifyListeners();
    } finally {
      this.cityDetectionInProgress = false;
    }
  }

  // Find matching Indian city from our list
  private findMatchingIndianCity(cityName: string): string | null {
    const lowerCityName = cityName.toLowerCase();

    for (const city of INDIAN_CITIES) {
      // Check direct name match
      if (city.name.toLowerCase() === lowerCityName) {
        return city.name;
      }
      // Check aliases (like Kolkata/Calcutta)
      const cityWithAliases = city as { name: string; aliases?: string[] };
      if (cityWithAliases.aliases) {
        for (const alias of cityWithAliases.aliases) {
          if (alias.toLowerCase() === lowerCityName) {
            return city.name;
          }
        }
      }
      // Check partial match
      if (lowerCityName.includes(city.name.toLowerCase()) ||
          city.name.toLowerCase().includes(lowerCityName)) {
        return city.name;
      }
    }

    return null;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): UserState {
    return {
      profile: this.profile,
      settings: this.settings,
      savedLocations: this.savedLocations,
      savedRoutes: this.savedRoutes,
      onboarding: this.onboarding,
      isLoggedIn: this.profile !== null,
      devAuth: this.devAuth,
    };
  }

  // Developer authentication methods
  authenticateDev(username: string, password: string): boolean {
    if (username === DEV_CREDENTIALS.username && password === DEV_CREDENTIALS.password) {
      this.devAuth = {
        isDevAuthenticated: true,
        devUsername: username,
        authTime: new Date(),
      };
      saveToStorage(DEV_AUTH_KEY, this.devAuth);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  logoutDev(): void {
    this.devAuth = DEFAULT_DEV_AUTH;
    localStorage.removeItem(DEV_AUTH_KEY);
    this.notifyListeners();
  }

  isDevAuthenticated(): boolean {
    return this.devAuth.isDevAuthenticated;
  }

  // Profile methods
  createProfile(name: string, email?: string, phone?: string): UserProfile {
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      email,
      phone,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    this.profile = profile;
    saveToStorage(USER_PROFILE_KEY, profile);
    this.notifyListeners();
    return profile;
  }

  updateProfile(updates: Partial<UserProfile>): void {
    if (this.profile) {
      this.profile = { ...this.profile, ...updates, lastActive: new Date() };
      saveToStorage(USER_PROFILE_KEY, this.profile);
      this.notifyListeners();
    }
  }

  deleteProfile(): void {
    this.profile = null;
    this.savedLocations = [];
    this.savedRoutes = [];
    this.onboarding = DEFAULT_ONBOARDING;
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(SAVED_LOCATIONS_KEY);
    localStorage.removeItem(SAVED_ROUTES_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    this.notifyListeners();
  }

  // Settings methods
  updateSettings(updates: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...updates };
    saveToStorage(USER_SETTINGS_KEY, this.settings);
    this.notifyListeners();
  }

  updateNotificationPreferences(updates: Partial<NotificationPreferences>): void {
    this.settings.notifications = { ...this.settings.notifications, ...updates };
    saveToStorage(USER_SETTINGS_KEY, this.settings);
    this.notifyListeners();
  }

  resetSettings(): void {
    this.settings = DEFAULT_SETTINGS;
    saveToStorage(USER_SETTINGS_KEY, this.settings);
    this.notifyListeners();
  }

  // Saved locations methods
  addLocation(location: Omit<UserLocation, 'id' | 'createdAt'>): UserLocation {
    const newLocation: UserLocation = {
      ...location,
      id: `loc_${Date.now()}`,
      createdAt: new Date(),
    };
    this.savedLocations.push(newLocation);
    saveToStorage(SAVED_LOCATIONS_KEY, this.savedLocations);
    this.notifyListeners();
    return newLocation;
  }

  updateLocation(id: string, updates: Partial<UserLocation>): void {
    const index = this.savedLocations.findIndex(loc => loc.id === id);
    if (index !== -1) {
      this.savedLocations[index] = { ...this.savedLocations[index], ...updates };
      saveToStorage(SAVED_LOCATIONS_KEY, this.savedLocations);
      this.notifyListeners();
    }
  }

  deleteLocation(id: string): void {
    this.savedLocations = this.savedLocations.filter(loc => loc.id !== id);
    saveToStorage(SAVED_LOCATIONS_KEY, this.savedLocations);
    this.notifyListeners();
  }

  getLocationsByType(type: UserLocation['type']): UserLocation[] {
    return this.savedLocations.filter(loc => loc.type === type);
  }

  // Saved routes methods
  addRoute(route: Omit<SavedRoute, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>): SavedRoute {
    const newRoute: SavedRoute = {
      ...route,
      id: `route_${Date.now()}`,
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
    };
    this.savedRoutes.push(newRoute);
    saveToStorage(SAVED_ROUTES_KEY, this.savedRoutes);
    this.notifyListeners();
    return newRoute;
  }

  updateRoute(id: string, updates: Partial<SavedRoute>): void {
    const index = this.savedRoutes.findIndex(route => route.id === id);
    if (index !== -1) {
      this.savedRoutes[index] = { ...this.savedRoutes[index], ...updates };
      saveToStorage(SAVED_ROUTES_KEY, this.savedRoutes);
      this.notifyListeners();
    }
  }

  deleteRoute(id: string): void {
    this.savedRoutes = this.savedRoutes.filter(route => route.id !== id);
    saveToStorage(SAVED_ROUTES_KEY, this.savedRoutes);
    this.notifyListeners();
  }

  incrementRouteUsage(id: string): void {
    const index = this.savedRoutes.findIndex(route => route.id === id);
    if (index !== -1) {
      this.savedRoutes[index].usageCount++;
      this.savedRoutes[index].lastUsed = new Date();
      saveToStorage(SAVED_ROUTES_KEY, this.savedRoutes);
      this.notifyListeners();
    }
  }

  toggleRouteFavorite(id: string): void {
    const index = this.savedRoutes.findIndex(route => route.id === id);
    if (index !== -1) {
      this.savedRoutes[index].isFavorite = !this.savedRoutes[index].isFavorite;
      saveToStorage(SAVED_ROUTES_KEY, this.savedRoutes);
      this.notifyListeners();
    }
  }

  getFavoriteRoutes(): SavedRoute[] {
    return this.savedRoutes.filter(route => route.isFavorite);
  }

  getRecentRoutes(limit: number = 5): SavedRoute[] {
    return [...this.savedRoutes]
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, limit);
  }

  getMostUsedRoutes(limit: number = 5): SavedRoute[] {
    return [...this.savedRoutes]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // Onboarding methods
  setOnboardingStep(step: number): void {
    this.onboarding.currentStep = step;
    saveToStorage(ONBOARDING_KEY, this.onboarding);
    this.notifyListeners();
  }

  completeOnboarding(): void {
    this.onboarding.completed = true;
    this.onboarding.currentStep = this.onboarding.totalSteps;
    saveToStorage(ONBOARDING_KEY, this.onboarding);
    this.notifyListeners();
  }

  skipOnboarding(): void {
    this.onboarding.completed = true;
    this.onboarding.skipped = true;
    saveToStorage(ONBOARDING_KEY, this.onboarding);
    this.notifyListeners();
  }

  resetOnboarding(): void {
    this.onboarding = DEFAULT_ONBOARDING;
    saveToStorage(ONBOARDING_KEY, this.onboarding);
    this.notifyListeners();
  }

  // Utility methods
  isOnboardingComplete(): boolean {
    return this.onboarding.completed;
  }

  hasHomeLocation(): boolean {
    return this.savedLocations.some(loc => loc.type === 'home');
  }

  hasWorkLocation(): boolean {
    return this.savedLocations.some(loc => loc.type === 'work');
  }

  getHomeLocation(): UserLocation | undefined {
    return this.savedLocations.find(loc => loc.type === 'home');
  }

  getWorkLocation(): UserLocation | undefined {
    return this.savedLocations.find(loc => loc.type === 'work');
  }

  getCityCoordinates(): { lat: number; lng: number } | null {
    const city = INDIAN_CITIES.find(c => c.name === this.settings.defaultCity);
    return city ? { lat: city.lat, lng: city.lng } : null;
  }
}

// Singleton instance
export const userStore = new UserStore();

// React hook for using the store
export function useUserStore(): UserState {
  const [state, setState] = React.useState<UserState>(userStore.getState());

  React.useEffect(() => {
    const unsubscribe = userStore.subscribe(() => {
      setState(userStore.getState());
    });
    return unsubscribe;
  }, []);

  return state;
}

// Need to import React for the hook
import React from 'react';
