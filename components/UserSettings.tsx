import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Settings,
  Bell,
  MapPin,
  Home,
  Briefcase,
  Star,
  Trash2,
  Edit3,
  Plus,
  ChevronRight,
  Save,
  X,
  Search,
  Loader2,
  Car,
  Bus,
  Bike,
  Shield,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Globe,
  Clock,
  Ruler,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Heart,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  userStore,
  useUserStore,
  INDIAN_CITIES,
  type UserLocation,
  type SavedRoute,
  type UserSettings as UserSettingsType
} from "@/lib/user-store";

interface UserSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Location search interface
interface LocationSearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  placeType: string;
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

// Profile Tab
function ProfileTab() {
  const state = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(state.profile?.name || "");
  const [email, setEmail] = useState(state.profile?.email || "");
  const [phone, setPhone] = useState(state.profile?.phone || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    userStore.updateProfile({ name, email, phone });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    userStore.deleteProfile();
    setShowDeleteConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {(state.profile?.name || "U")[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{state.profile?.name || "User"}</h3>
          <p className="text-sm text-slate-400">
            Member since {state.profile?.createdAt ? state.profile.createdAt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'recently'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div>
            <Label className="text-sm text-slate-300">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-sm text-slate-300">Email (optional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="text-sm text-slate-300">Phone (optional)</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {state.profile?.email && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">{state.profile.email}</span>
            </div>
          )}
          {state.profile?.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Smartphone className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">{state.profile.phone}</span>
            </div>
          )}
        </div>
      )}

      <Separator className="bg-slate-700" />

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Account Actions</h4>

        <Button
          variant="outline"
          onClick={() => userStore.resetOnboarding()}
          className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4 mr-3" />
          Restart Onboarding
        </Button>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Account & Data
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Account?
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This will permanently delete your profile, saved locations, routes, and all preferences.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Locations Tab
function LocationsTab() {
  const state = useUserStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<UserLocation['type']>('favorite');
  const [locationName, setLocationName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);

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

  const handleSaveLocation = () => {
    if (selectedLocation && locationName) {
      if (editingId) {
        userStore.updateLocation(editingId, {
          name: locationName,
          address: selectedLocation.displayName,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          type: locationType,
        });
      } else {
        userStore.addLocation({
          name: locationName,
          address: selectedLocation.displayName,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          type: locationType,
        });
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setLocationName("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedLocation(null);
    setLocationType('favorite');
  };

  const handleEdit = (location: UserLocation) => {
    setEditingId(location.id);
    setLocationName(location.name);
    setLocationType(location.type);
    setSelectedLocation({
      name: location.name,
      displayName: location.address,
      lat: location.lat,
      lng: location.lng,
      placeType: 'place',
    });
    setIsAdding(true);
  };

  const getLocationIcon = (type: UserLocation['type']) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4 text-green-400" />;
      case 'work': return <Briefcase className="h-4 w-4 text-blue-400" />;
      case 'favorite': return <Star className="h-4 w-4 text-yellow-400" />;
      default: return <MapPin className="h-4 w-4 text-slate-400" />;
    }
  };

  if (isAdding) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">
            {editingId ? 'Edit Location' : 'Add New Location'}
          </h4>
          <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-400">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <Label className="text-sm text-slate-300">Location Type</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {(['home', 'work', 'favorite', 'recent'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setLocationType(type)}
                className={cn(
                  "p-2 rounded-lg border text-center text-xs capitalize",
                  locationType === type
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm text-slate-300">Label</Label>
          <Input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., My Office, Gym, Parents' Home"
            className="mt-1 bg-slate-900 border-slate-600 text-white"
          />
        </div>

        <div>
          <Label className="text-sm text-slate-300">Search Address</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a location..."
              className="pl-10 bg-slate-900 border-slate-600 text-white"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedLocation(result);
                    setSearchResults([]);
                    setSearchQuery(result.displayName);
                    if (!locationName) setLocationName(result.name);
                  }}
                  className="w-full p-2 rounded bg-slate-800 hover:bg-slate-700 text-left text-sm"
                >
                  <p className="text-white">{result.name}</p>
                  <p className="text-xs text-slate-400">{result.displayName}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {selectedLocation && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <MapPin className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              Selected: {selectedLocation.displayName}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSaveLocation}
          disabled={!selectedLocation || !locationName}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {editingId ? 'Update Location' : 'Save Location'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsAdding(true)}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Location
      </Button>

      {state.savedLocations.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No saved locations yet</p>
          <p className="text-sm">Add your frequently visited places</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {state.savedLocations.map((location) => (
              <div
                key={location.id}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  {getLocationIcon(location.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{location.name}</p>
                  <p className="text-xs text-slate-400 truncate">{location.address}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(location)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => userStore.deleteLocation(location.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Routes Tab
function RoutesTab() {
  const state = useUserStore();

  const favoriteRoutes = state.savedRoutes.filter(r => r.isFavorite);
  const recentRoutes = [...state.savedRoutes]
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, 5);

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'driving': return <Car className="h-4 w-4" />;
      case 'bus': return <Bus className="h-4 w-4" />;
      case 'bike':
      case 'cycling': return <Bike className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (state.savedRoutes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No saved routes yet</p>
        <p className="text-sm">Routes you use will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {favoriteRoutes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            Favorite Routes
          </h4>
          <div className="space-y-2">
            {favoriteRoutes.map((route) => (
              <RouteCard key={route.id} route={route} getTransportIcon={getTransportIcon} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-400" />
          Recent Routes
        </h4>
        <div className="space-y-2">
          {recentRoutes.map((route) => (
            <RouteCard key={route.id} route={route} getTransportIcon={getTransportIcon} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteCard({
  route,
  getTransportIcon
}: {
  route: SavedRoute;
  getTransportIcon: (mode: string) => React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTransportIcon(route.preferredTransport)}
          <span className="font-medium text-white">{route.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => userStore.toggleRouteFavorite(route.id)}
            className={cn(
              "p-1 h-auto",
              route.isFavorite ? "text-red-400" : "text-slate-400"
            )}
          >
            <Heart className={cn("h-4 w-4", route.isFavorite && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => userStore.deleteRoute(route.id)}
            className="p-1 h-auto text-slate-400 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-slate-400">
        <p>{route.origin.name} → {route.destination.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span>{route.distance.toFixed(1)} km</span>
          <span>~{route.estimatedDuration} min</span>
          <span>Used {route.usageCount}x</span>
        </div>
      </div>
    </div>
  );
}

// Preferences Tab
function PreferencesTab() {
  const state = useUserStore();
  const settings = state.settings;

  const transportModes = [
    { id: 'driving', icon: Car, label: 'Car' },
    { id: 'bike', icon: Bike, label: 'Motorcycle' },
    { id: 'bus', icon: Bus, label: 'Bus' },
    { id: 'cycling', icon: Bike, label: 'Bicycle' },
    { id: 'walking', icon: User, label: 'Walking' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Default City</Label>
        <Select
          value={settings.defaultCity}
          onValueChange={(value) => userStore.updateSettings({ defaultCity: value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {INDIAN_CITIES.map((city) => (
              <SelectItem key={city.name} value={city.name} className="text-white">
                {city.name}, {city.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Default Transport</Label>
        <div className="grid grid-cols-5 gap-2">
          {transportModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => userStore.updateSettings({
                defaultTransport: mode.id as UserSettingsType['defaultTransport']
              })}
              className={cn(
                "p-2 rounded-lg border text-center",
                settings.defaultTransport === mode.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              )}
            >
              <mode.icon className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs">{mode.label}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-slate-700" />

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Display</Label>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Ruler className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-white">Distance Unit</span>
          </div>
          <Select
            value={settings.distanceUnit}
            onValueChange={(value: 'km' | 'mi') => userStore.updateSettings({ distanceUnit: value })}
          >
            <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="km" className="text-white">km</SelectItem>
              <SelectItem value="mi" className="text-white">miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-white">Time Format</span>
          </div>
          <Select
            value={settings.timeFormat}
            onValueChange={(value: '12h' | '24h') => userStore.updateSettings({ timeFormat: value })}
          >
            <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="12h" className="text-white">12 hour</SelectItem>
              <SelectItem value="24h" className="text-white">24 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Navigation</Label>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-white">Voice Navigation</span>
          </div>
          <Switch
            checked={settings.voiceNavigation}
            onCheckedChange={(checked) => userStore.updateSettings({ voiceNavigation: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// Notifications Tab
function NotificationsTab() {
  const state = useUserStore();
  const notifications = state.settings.notifications;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Traffic Alerts</p>
          <p className="text-xs text-slate-400">Get notified about traffic changes on your routes</p>
        </div>
        <Switch
          checked={notifications.trafficAlerts}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ trafficAlerts: checked })}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Departure Reminders</p>
          <p className="text-xs text-slate-400">Remind me when it's time to leave</p>
        </div>
        <Switch
          checked={notifications.departureReminders}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ departureReminders: checked })}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Route Updates</p>
          <p className="text-xs text-slate-400">Updates about better routes during navigation</p>
        </div>
        <Switch
          checked={notifications.routeUpdates}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ routeUpdates: checked })}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Weekly Report</p>
          <p className="text-xs text-slate-400">Summary of your travel patterns</p>
        </div>
        <Switch
          checked={notifications.weeklyReport}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ weeklyReport: checked })}
        />
      </div>

      <Separator className="bg-slate-700" />

      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Sound</p>
          <p className="text-xs text-slate-400">Play sounds for notifications</p>
        </div>
        <Switch
          checked={notifications.soundEnabled}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ soundEnabled: checked })}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div>
          <p className="font-medium text-white">Vibration</p>
          <p className="text-xs text-slate-400">Vibrate for notifications</p>
        </div>
        <Switch
          checked={notifications.vibrationEnabled}
          onCheckedChange={(checked) => userStore.updateNotificationPreferences({ vibrationEnabled: checked })}
        />
      </div>
    </div>
  );
}

// Main Settings Panel
export function UserSettingsPanel({ isOpen, onClose }: UserSettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 p-0 max-h-[90vh]">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage your profile, locations, routes, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start px-4 bg-transparent border-b border-slate-700 rounded-none h-auto gap-0">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger
              value="routes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <Route className="h-4 w-4 mr-2" />
              Routes
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <Settings className="h-4 w-4 mr-2" />
              Prefs
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh]">
            <div className="p-4">
              <TabsContent value="profile" className="m-0">
                <ProfileTab />
              </TabsContent>
              <TabsContent value="locations" className="m-0">
                <LocationsTab />
              </TabsContent>
              <TabsContent value="routes" className="m-0">
                <RoutesTab />
              </TabsContent>
              <TabsContent value="preferences" className="m-0">
                <PreferencesTab />
              </TabsContent>
              <TabsContent value="notifications" className="m-0">
                <NotificationsTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default UserSettingsPanel;
