import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Car,
  Bus,
  Bike,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  Home,
  Briefcase,
  Navigation,
  Search,
  Loader2,
  LocateFixed,
  AlertCircle,
  Mail,
  Smartphone
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  userStore,
  INDIAN_CITIES,
  type UserSettings
} from "@/lib/user-store";
import { UserORM, type UserModel } from "@/sdk/database/orm/orm_user";

// Secret developer code
const DEVELOPER_SECRET_CODE = "INDIFLOW2024DEV";

// Function to register user in backend (sends to dev dashboard)
async function registerUserInBackend(userData: {
  name: string;
  email: string;
  authProvider: 'google' | 'apple' | 'phone' | 'manual' | null;
  defaultCity: string;
  homeLocation?: { name: string; address: string; lat: number; lng: number } | null;
  workLocation?: { name: string; address: string; lat: number; lng: number } | null;
}): Promise<UserModel | null> {
  try {
    const userORM = UserORM.getInstance();
    const now = new Date().toISOString();

    // Check if user already exists by email
    if (userData.email) {
      const existingUsers = await userORM.getUserByEmail(userData.email);
      if (existingUsers.length > 0) {
        // Update last login
        const existingUser = existingUsers[0];
        await userORM.setUserByEmail(userData.email, {
          ...existingUser,
          last_login: now,
          name: userData.name || existingUser.name,
        });
        console.log('[Onboarding] User already exists, updated last login:', userData.email);
        return existingUser;
      }
    }

    // Create new user
    const newUser: Partial<UserModel> = {
      name: userData.name || 'User',
      email: userData.email || `user_${Date.now()}@indiflow.app`,
      google_id: userData.authProvider === 'google' ? `google_${Date.now()}` : null,
      apple_id: userData.authProvider === 'apple' ? `apple_${Date.now()}` : null,
      created_at: now,
      last_login: now,
    };

    const inserted = await userORM.insertUser([newUser as UserModel]);
    console.log('[Onboarding] New user registered in backend:', inserted);
    return inserted[0] || null;
  } catch (error) {
    console.error('[Onboarding] Failed to register user in backend:', error);
    // Don't block onboarding if backend registration fails
    return null;
  }
}

interface OnboardingProps {
  onComplete: () => void;
}

// Location search interface
interface LocationSearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  placeType: string;
}

// Reverse geocoding to get address from coordinates
async function reverseGeocode(lat: number, lng: number): Promise<LocationSearchResult | null> {
  try {
    const response = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties;

      const nameParts = [
        props.name,
        props.street,
        props.city || props.county,
        props.state,
      ].filter(Boolean);

      return {
        name: nameParts.slice(0, 2).join(', ').trim() || 'Current Location',
        displayName: nameParts.join(', '),
        lat,
        lng,
        placeType: props.type || 'place',
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Geocoding function
async function searchLocation(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const indiaBounds = {
      lon_min: 68.1,
      lat_min: 6.7,
      lon_max: 97.4,
      lat_max: 35.7
    };

    const response = await fetch(
      `https://photon.komoot.io/api/?` +
      `q=${encodeURIComponent(query)}&` +
      `limit=8&` +
      `lang=en&` +
      `bbox=${indiaBounds.lon_min},${indiaBounds.lat_min},${indiaBounds.lon_max},${indiaBounds.lat_max}`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data.features.map((item: any) => {
      const props = item.properties;
      const coords = item.geometry.coordinates;
      const nameParts = [
        props.name,
        props.city || props.county,
        props.state,
      ].filter(Boolean);

      return {
        name: nameParts.slice(0, 2).join(', ').trim() || props.name,
        displayName: nameParts.join(', '),
        lat: coords[1],
        lng: coords[0],
        placeType: props.type || 'place',
      };
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

// Google icon component (SVG)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Apple icon component (SVG)
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// Step 1: Welcome & Name with Social Login
function WelcomeStep({
  name,
  setName,
  email,
  setEmail,
  secretCode,
  setSecretCode,
  onNext,
  onSocialLogin
}: {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  secretCode: string;
  setSecretCode: (code: string) => void;
  onNext: () => void;
  onSocialLogin: (provider: 'google' | 'apple' | 'phone') => void;
}) {
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isLoadingSocial, setIsLoadingSocial] = useState<string | null>(null);

  // Hidden developer access - tap logo 5 times
  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setShowSecretInput(true);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'phone') => {
    setIsLoadingSocial(provider);
    // Simulate OAuth flow - in production this would redirect to OAuth provider
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSocialLogin(provider);
    setIsLoadingSocial(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <button
          onClick={handleLogoTap}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 focus:outline-none"
        >
          <Navigation className="h-10 w-10 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">Welcome to IndiFlow</h2>
        <p className="text-slate-400 text-sm">
          Smart traffic navigation for India
        </p>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => handleSocialLogin('google')}
          disabled={isLoadingSocial !== null}
          variant="outline"
          className="w-full bg-white hover:bg-gray-100 text-gray-800 border-gray-300 py-5"
        >
          {isLoadingSocial === 'google' ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5 mr-2" />
          )}
          Continue with Google
        </Button>

        <Button
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoadingSocial !== null}
          variant="outline"
          className="w-full bg-black hover:bg-gray-900 text-white border-gray-700 py-5"
        >
          {isLoadingSocial === 'apple' ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <AppleIcon className="h-5 w-5 mr-2" />
          )}
          Continue with Apple
        </Button>

        <Button
          onClick={() => handleSocialLogin('phone')}
          disabled={isLoadingSocial !== null}
          variant="outline"
          className="w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-600 py-5"
        >
          {isLoadingSocial === 'phone' ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Smartphone className="h-5 w-5 mr-2" />
          )}
          Continue with Phone
        </Button>
      </div>

      <div className="relative">
        <Separator className="bg-slate-700" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-xs text-slate-500">
          or continue manually
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-slate-300">Your name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div>
          <Label className="text-sm text-slate-300">Email (optional)</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mt-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Hidden developer code input */}
        {showSecretInput && (
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <Label className="text-xs text-slate-400">Developer Access Code</Label>
            <Input
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="mt-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
            />
            {secretCode === DEVELOPER_SECRET_CODE && (
              <p className="text-xs text-green-400 mt-1">Developer mode will be enabled</p>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5"
      >
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// Step 2: Location Setup (GPS first, then manual)
function LocationStep({
  homeLocation,
  setHomeLocation,
  workLocation,
  setWorkLocation,
  selectedCity,
  setSelectedCity,
  onNext,
  onBack
}: {
  homeLocation: { name: string; address: string; lat: number; lng: number } | null;
  setHomeLocation: (loc: { name: string; address: string; lat: number; lng: number } | null) => void;
  workLocation: { name: string; address: string; lat: number; lng: number } | null;
  setWorkLocation: (loc: { name: string; address: string; lat: number; lng: number } | null) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [activeInput, setActiveInput] = useState<'home' | 'work' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  // Request GPS location on mount
  useEffect(() => {
    requestCurrentLocation();
  }, []);

  const requestCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsRequestingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        const result = await reverseGeocode(latitude, longitude);

        setDetectedLocation({
          lat: latitude,
          lng: longitude,
          address: result?.displayName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });

        // Improved city detection - check ALL parts of the address
        if (result) {
          const addressParts = result.displayName.split(',').map(part => part.trim().toLowerCase());

          // Find the best matching city from the address
          let matchedCity = null;
          let bestMatchScore = 0;

          for (const city of INDIAN_CITIES) {
            const cityNameLower = city.name.toLowerCase();
            const stateLower = city.state.toLowerCase();
            // Get aliases if they exist (e.g., Kolkata has alias Calcutta)
            const cityAliases = (city as any).aliases?.map((a: string) => a.toLowerCase()) || [];
            const allCityNames = [cityNameLower, ...cityAliases];

            for (const part of addressParts) {
              for (const cityName of allCityNames) {
                // Exact match gets highest score
                if (part === cityName) {
                  if (bestMatchScore < 3) {
                    matchedCity = city;
                    bestMatchScore = 3;
                  }
                }
                // Contains city name
                else if (part.includes(cityName) || cityName.includes(part)) {
                  if (bestMatchScore < 2) {
                    matchedCity = city;
                    bestMatchScore = 2;
                  }
                }
              }
              // State match as fallback
              if (part.includes(stateLower)) {
                if (bestMatchScore < 1) {
                  matchedCity = city;
                  bestMatchScore = 1;
                }
              }
            }
          }

          // Also check by coordinates - find nearest city
          if (!matchedCity || bestMatchScore < 2) {
            let nearestCity = null;
            let minDistance = Infinity;

            for (const city of INDIAN_CITIES) {
              const dist = Math.sqrt(
                Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
              );
              // If within ~100km (roughly 1 degree)
              if (dist < 1 && dist < minDistance) {
                minDistance = dist;
                nearestCity = city;
              }
            }

            // Use nearest city if it's closer/better match
            if (nearestCity && (bestMatchScore < 2 || minDistance < 0.3)) {
              matchedCity = nearestCity;
            }
          }

          if (matchedCity) {
            console.log('[Onboarding] Detected city:', matchedCity.name, 'from location');
            setSelectedCity(matchedCity.name);
          }
        }

        setIsRequestingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enter your location manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Please enter manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please enter manually.");
            break;
          default:
            setLocationError("Could not get location. Please enter manually.");
        }
        setIsRequestingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const useDetectedAsHome = () => {
    if (detectedLocation) {
      setHomeLocation({
        name: "Home",
        address: detectedLocation.address,
        lat: detectedLocation.lat,
        lng: detectedLocation.lng
      });
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      const results = await searchLocation(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleSelectLocation = (result: LocationSearchResult) => {
    const loc = {
      name: result.name,
      address: result.displayName,
      lat: result.lat,
      lng: result.lng,
    };
    if (activeInput === 'home') {
      setHomeLocation(loc);
    } else if (activeInput === 'work') {
      setWorkLocation(loc);
    }
    setActiveInput(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const filteredCities = INDIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    city.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/20 mb-2">
          <MapPin className="h-7 w-7 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Set Your Locations</h2>
        <p className="text-slate-400 text-sm">We'll use this to optimize your routes</p>
      </div>

      {/* GPS Detection Status */}
      {isRequestingLocation && (
        <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          <div>
            <p className="text-sm text-blue-300">Detecting your location...</p>
            <p className="text-xs text-blue-400/70">Please allow location access if prompted</p>
          </div>
        </div>
      )}

      {locationError && (
        <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300">{locationError}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={requestCurrentLocation}
              className="text-yellow-400 hover:text-yellow-300 p-0 h-auto mt-1"
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {detectedLocation && !homeLocation && (
        <div className="p-3 bg-green-900/20 rounded-lg border border-green-700/50">
          <div className="flex items-start gap-3">
            <LocateFixed className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-300">Location detected</p>
              <p className="text-xs text-slate-400 mt-0.5">{detectedLocation.address}</p>
              <Button
                size="sm"
                onClick={useDetectedAsHome}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-7"
              >
                <Home className="h-3 w-3 mr-1" />
                Set as Home
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* City Selector */}
      {showCitySelector ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-300">Select your city</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCitySelector(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
          </div>
          <Input
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Search cities..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {filteredCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    setSelectedCity(city.name);
                    setShowCitySelector(false);
                  }}
                  className={cn(
                    "w-full p-2 rounded-lg text-left transition-all text-sm",
                    selectedCity === city.name
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  <span className="font-medium">{city.name}</span>
                  <span className="text-xs opacity-70 ml-2">{city.state}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : activeInput ? (
        /* Location Search Mode */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-300">
              {activeInput === 'home' ? 'Set Home Location' : 'Set Work Location'}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveInput(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a location..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
            )}
          </div>

          <ScrollArea className="h-40">
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-all"
                  >
                    <p className="text-sm font-medium text-white">{result.name}</p>
                    <p className="text-xs text-slate-400 truncate">{result.displayName}</p>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 && !isSearching ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                No locations found
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                Type to search
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        /* Location Buttons */
        <div className="space-y-3">
          {/* City Selection */}
          <button
            onClick={() => setShowCitySelector(true)}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">City</p>
              <p className="text-xs text-purple-400">{selectedCity}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          {/* Home Location */}
          <button
            onClick={() => setActiveInput('home')}
            className={cn(
              "w-full p-3 rounded-lg border text-left flex items-center gap-3",
              homeLocation
                ? "bg-green-500/10 border-green-500/30"
                : "bg-slate-800 border-slate-700 hover:border-slate-600"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              homeLocation ? "bg-green-500/20" : "bg-slate-700"
            )}>
              <Home className={cn("h-5 w-5", homeLocation ? "text-green-400" : "text-slate-400")} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Home</p>
              {homeLocation ? (
                <p className="text-xs text-green-400 truncate">{homeLocation.name}</p>
              ) : (
                <p className="text-xs text-slate-400">Tap to set</p>
              )}
            </div>
            {homeLocation ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {/* Work Location */}
          <button
            onClick={() => setActiveInput('work')}
            className={cn(
              "w-full p-3 rounded-lg border text-left flex items-center gap-3",
              workLocation
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-slate-800 border-slate-700 hover:border-slate-600"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              workLocation ? "bg-blue-500/20" : "bg-slate-700"
            )}>
              <Briefcase className={cn("h-5 w-5", workLocation ? "text-blue-400" : "text-slate-400")} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Work</p>
              {workLocation ? (
                <p className="text-xs text-blue-400 truncate">{workLocation.name}</p>
              ) : (
                <p className="text-xs text-slate-400">Tap to set (optional)</p>
              )}
            </div>
            {workLocation ? (
              <Check className="h-4 w-4 text-blue-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      )}

      {!activeInput && !showCitySelector && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Step 3: Transport Preferences
function PreferencesStep({
  defaultTransport,
  setDefaultTransport,
  trafficAlerts,
  setTrafficAlerts,
  onNext,
  onBack
}: {
  defaultTransport: string;
  setDefaultTransport: (mode: string) => void;
  trafficAlerts: boolean;
  setTrafficAlerts: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const transportModes = [
    { id: 'driving', icon: Car, label: 'Car' },
    { id: 'bike', icon: Bike, label: 'Bike' },
    { id: 'bus', icon: Bus, label: 'Bus' },
    { id: 'walking', icon: User, label: 'Walk' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/20 mb-2">
          <Car className="h-7 w-7 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">How do you travel?</h2>
        <p className="text-slate-400 text-sm">Select your primary transport mode</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {transportModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setDefaultTransport(mode.id)}
            className={cn(
              "p-3 rounded-lg border text-center transition-all",
              defaultTransport === mode.id
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            )}
          >
            <mode.icon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs font-medium">{mode.label}</p>
          </button>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Traffic Alerts</p>
          <p className="text-xs text-slate-400">Get notified about traffic changes</p>
        </div>
        <Switch
          checked={trafficAlerts}
          onCheckedChange={setTrafficAlerts}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Complete
function CompleteStep({
  userName,
  onComplete
}: {
  userName: string;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
        <Check className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white">You're all set, {userName}!</h2>
        <p className="text-slate-400 mt-2 text-sm">
          Start planning smarter routes now
        </p>
      </div>

      <Button
        onClick={onComplete}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5"
      >
        Start Using IndiFlow
        <Navigation className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// Main Onboarding Component
export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [homeLocation, setHomeLocation] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [workLocation, setWorkLocation] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [defaultTransport, setDefaultTransport] = useState("driving");
  const [trafficAlerts, setTrafficAlerts] = useState(true);
  const [authProvider, setAuthProvider] = useState<'google' | 'apple' | 'phone' | 'manual' | null>(null);

  // Handle social login - simulates OAuth flow
  const handleSocialLogin = (provider: 'google' | 'apple' | 'phone') => {
    setAuthProvider(provider);
    // Simulate getting user info from OAuth provider
    const mockUserInfo: Record<string, { name: string; email: string }> = {
      google: { name: 'Google User', email: 'user@gmail.com' },
      apple: { name: 'Apple User', email: 'user@icloud.com' },
      phone: { name: 'Phone User', email: '' },
    };
    const userInfo = mockUserInfo[provider];
    if (userInfo.name && !name) setName(userInfo.name);
    if (userInfo.email && !email) setEmail(userInfo.email);
    // Skip to step 2 after social login
    setStep(2);
  };

  const handleComplete = async () => {
    // Create user profile locally
    userStore.createProfile(name, email);

    // Update settings
    userStore.updateSettings({
      defaultCity: selectedCity,
      defaultTransport: defaultTransport as UserSettings['defaultTransport'],
      notifications: {
        ...userStore.getState().settings.notifications,
        trafficAlerts,
      },
    });

    // Save locations
    if (homeLocation) {
      userStore.addLocation({
        name: homeLocation.name,
        address: homeLocation.address,
        lat: homeLocation.lat,
        lng: homeLocation.lng,
        type: 'home',
      });
    }

    if (workLocation) {
      userStore.addLocation({
        name: workLocation.name,
        address: workLocation.address,
        lat: workLocation.lat,
        lng: workLocation.lng,
        type: 'work',
      });
    }

    // IMPORTANT: Register user in backend database for dev dashboard
    // This sends the account details to the developer website
    await registerUserInBackend({
      name,
      email,
      authProvider,
      defaultCity: selectedCity,
      homeLocation,
      workLocation,
    });

    // Complete onboarding
    userStore.completeOnboarding();

    onComplete();
  };

  const handleSkip = () => {
    userStore.skipOnboarding();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur border-slate-800">
        <CardContent className="pt-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="text-blue-400 border-blue-500/50 text-xs">
              Step {step} of {totalSteps}
            </Badge>
            {step < totalSteps && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-slate-400 hover:text-white text-xs"
              >
                Skip
              </Button>
            )}
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1 mb-6" />

          {/* Steps */}
          {step === 1 && (
            <WelcomeStep
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              secretCode={secretCode}
              setSecretCode={setSecretCode}
              onNext={() => setStep(2)}
              onSocialLogin={handleSocialLogin}
            />
          )}
          {step === 2 && (
            <LocationStep
              homeLocation={homeLocation}
              setHomeLocation={setHomeLocation}
              workLocation={workLocation}
              setWorkLocation={setWorkLocation}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <PreferencesStep
              defaultTransport={defaultTransport}
              setDefaultTransport={setDefaultTransport}
              trafficAlerts={trafficAlerts}
              setTrafficAlerts={setTrafficAlerts}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <CompleteStep
              userName={name || 'User'}
              onComplete={handleComplete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Onboarding;
