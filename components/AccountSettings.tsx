// Account Settings - Polished commercial account management UI
import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Save,
  X,
  Search,
  Loader2,
  Car,
  Bus,
  Bike,
  Moon,
  Volume2,
  Smartphone,
  Globe,
  Clock,
  Ruler,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Heart,
  Route,
  Shield,
  Key,
  CheckCircle2,
  ChevronRight,
  Mail,
  Lock,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  userStore,
  useUserStore,
  INDIAN_CITIES,
  type UserLocation,
  type SavedRoute,
  type UserSettings as UserSettingsType
} from "@/lib/user-store";
import { useIsMobile } from "@/hooks/use-mobile";

interface AccountSettingsProps {
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

// Account Tab - Profile & Security
function AccountTab() {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Delete confirmation
  const [deletePassword, setDeletePassword] = useState("");

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSaveProfile = async () => {
    clearMessages();
    setIsLoading(true);
    const success = await updateProfile({ name, phone: phone || undefined });
    setIsLoading(false);

    if (success) {
      setSuccessMessage("Profile updated successfully");
      setIsEditingProfile(false);
    } else {
      setErrorMessage("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    clearMessages();

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    const success = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (success) {
      setSuccessMessage("Password changed successfully");
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } else {
      setErrorMessage("Failed to change password. Check your current password.");
    }
  };

  const handleDeleteAccount = async () => {
    clearMessages();
    setIsLoading(true);
    const success = await deleteAccount(deletePassword);
    setIsLoading(false);

    if (!success) {
      setErrorMessage("Failed to delete account. Check your password.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="bg-green-900/20 border-green-700/50">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300 ml-2">{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert className="bg-red-900/20 border-red-700/50">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 ml-2">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Profile Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(user?.name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center hover:bg-slate-600 transition-colors">
                  <Camera className="h-3.5 w-3.5 text-slate-300" />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{user?.name || "User"}</h3>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-400">{user?.email}</span>
                </div>
              </div>
            </div>
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(user?.name || "");
                  setPhone(user?.phone || "");
                  setIsEditingProfile(true);
                  clearMessages();
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        {isEditingProfile && (
          <CardContent className="space-y-4 pt-2">
            <Separator className="bg-slate-700" />
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 border-slate-600 text-slate-300"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Details */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <span className="text-sm text-slate-300">Account Status</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Member since</span>
            </div>
            <span className="text-sm text-slate-400">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isChangingPassword ? (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                clearMessages();
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Change Password</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
            </button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg bg-slate-900/50">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="flex-1 border-slate-600 text-slate-300"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !currentPassword || !newPassword || !confirmNewPassword}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-950/20 border-red-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </Button>

          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeletePassword("");
                clearMessages();
              }}
              className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Account
            </Button>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete Account?
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  This will permanently delete your account and all associated data.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label className="text-sm text-slate-300">Enter your password to confirm</Label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-slate-600 text-slate-300"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading || !deletePassword}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete Forever
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
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
                  "p-3 rounded-xl border text-center text-xs capitalize transition-all",
                  locationType === type
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <div className="mb-1">{getLocationIcon(type)}</div>
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
                  className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors"
                >
                  <p className="text-sm text-white">{result.name}</p>
                  <p className="text-xs text-slate-400">{result.displayName}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {selectedLocation && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 ml-2">
              {selectedLocation.displayName}
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
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Location
      </Button>

      {state.savedLocations.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-300">No saved locations</p>
          <p className="text-sm mt-1">Add your frequently visited places for quick access</p>
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          <div className="space-y-2">
            {state.savedLocations.map((location) => (
              <div
                key={location.id}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center gap-3 hover:bg-slate-800/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
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
                    className="text-slate-400 hover:text-white h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => userStore.deleteLocation(location.id)}
                    className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
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
      case 'driving': return <Car className="h-4 w-4 text-blue-400" />;
      case 'bus': return <Bus className="h-4 w-4 text-green-400" />;
      case 'bike':
      case 'cycling': return <Bike className="h-4 w-4 text-orange-400" />;
      default: return <User className="h-4 w-4 text-slate-400" />;
    }
  };

  if (state.savedRoutes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Route className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium text-slate-300">No saved routes</p>
        <p className="text-sm mt-1">Routes you use will appear here</p>
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
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800/80 transition-colors">
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
              "h-8 w-8 p-0",
              route.isFavorite ? "text-red-400" : "text-slate-400"
            )}
          >
            <Heart className={cn("h-4 w-4", route.isFavorite && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => userStore.deleteRoute(route.id)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-slate-400">
        <p>{route.origin.name} → {route.destination.name}</p>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
            {route.distance.toFixed(1)} km
          </Badge>
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
            ~{route.estimatedDuration} min
          </Badge>
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
            Used {route.usageCount}x
          </Badge>
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
    { id: 'driving', icon: Car, label: 'Car', color: 'from-blue-500 to-blue-600' },
    { id: 'bike', icon: Bike, label: 'Bike', color: 'from-orange-500 to-orange-600' },
    { id: 'bus', icon: Bus, label: 'Bus', color: 'from-green-500 to-green-600' },
    { id: 'cycling', icon: Bike, label: 'Cycle', color: 'from-purple-500 to-purple-600' },
    { id: 'walking', icon: User, label: 'Walk', color: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Default City</Label>
        <Select
          value={settings.defaultCity}
          onValueChange={(value) => userStore.updateSettings({ defaultCity: value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-12">
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
                "p-3 rounded-xl border text-center transition-all",
                settings.defaultTransport === mode.id
                  ? `bg-gradient-to-br ${mode.color} border-transparent text-white shadow-lg`
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
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
        <Label className="text-sm font-medium text-slate-300">Display Settings</Label>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <Ruler className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-white">Distance Unit</span>
          </div>
          <Select
            value={settings.distanceUnit}
            onValueChange={(value: 'km' | 'mi') => userStore.updateSettings({ distanceUnit: value })}
          >
            <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="km" className="text-white">Kilometers</SelectItem>
              <SelectItem value="mi" className="text-white">Miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-white">Time Format</span>
          </div>
          <Select
            value={settings.timeFormat}
            onValueChange={(value: '12h' | '24h') => userStore.updateSettings({ timeFormat: value })}
          >
            <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="12h" className="text-white">12 Hour</SelectItem>
              <SelectItem value="24h" className="text-white">24 Hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Navigation</Label>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-slate-400" />
            <div>
              <span className="text-sm text-white">Voice Navigation</span>
              <p className="text-xs text-slate-500">Audio turn-by-turn directions</p>
            </div>
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
    <div className="space-y-3">
      {[
        { key: 'trafficAlerts', title: 'Traffic Alerts', desc: 'Get notified about traffic changes on your routes', icon: AlertTriangle },
        { key: 'departureReminders', title: 'Departure Reminders', desc: 'Remind me when it\'s time to leave', icon: Clock },
        { key: 'routeUpdates', title: 'Route Updates', desc: 'Updates about better routes during navigation', icon: Route },
        { key: 'weeklyReport', title: 'Weekly Report', desc: 'Summary of your travel patterns', icon: Mail },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </div>
          <Switch
            checked={notifications[item.key as keyof typeof notifications]}
            onCheckedChange={(checked) => userStore.updateNotificationPreferences({ [item.key]: checked })}
          />
        </div>
      ))}

      <Separator className="bg-slate-700 my-4" />

      {[
        { key: 'soundEnabled', title: 'Sound', desc: 'Play sounds for notifications', icon: Volume2 },
        { key: 'vibrationEnabled', title: 'Vibration', desc: 'Vibrate for notifications', icon: Smartphone },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </div>
          <Switch
            checked={notifications[item.key as keyof typeof notifications]}
            onCheckedChange={(checked) => userStore.updateNotificationPreferences({ [item.key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}

// Main Settings Component
export function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const isMobile = useIsMobile();

  const content = (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b border-slate-700 rounded-none h-auto gap-0 px-1 overflow-x-auto flex-nowrap">
        {[
          { value: 'account', icon: User, label: 'Account' },
          { value: 'locations', icon: MapPin, label: 'Places' },
          { value: 'routes', icon: Route, label: 'Routes' },
          { value: 'preferences', icon: Settings, label: 'Prefs' },
          { value: 'notifications', icon: Bell, label: 'Alerts' },
        ].map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-3 py-3"
          >
            <tab.icon className="h-4 w-4 mr-1.5" />
            <span className="text-xs sm:text-sm">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <ScrollArea className="h-[60vh] sm:h-[65vh]">
        <div className="p-4">
          <TabsContent value="account" className="m-0">
            <AccountTab />
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
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-slate-900 border-slate-700 max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DrawerTitle>
            <DrawerDescription className="text-slate-400">
              Manage your account and preferences
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 p-0 max-h-[90vh]">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Manage your account and preferences
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default AccountSettings;
