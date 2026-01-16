import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Clock, TrendingUp, Navigation, History, Route as RouteIcon, Zap, MessageSquare, Shield, BarChart3, Car, Bus, Bike, User, Brain, Upload, FileText, Trash2, Edit3, Save, X, Sparkles, Loader2, Lightbulb, AlertTriangle, Volume2, VolumeX, Play, Pause, LocateFixed, ChevronRight, ArrowUp, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight, RotateCcw, CircleDot, Flag, Compass, Settings, MapPinned, Check, XCircle, Home, Briefcase, Star, RefreshCw, Building2, Train, Plane, GraduationCap, Hospital, ShoppingCart, Hotel, Landmark as LandmarkIcon, Church, TreePine, Trophy, Building, Utensils, Fuel, BadgeCheck, Calendar, Target, Timer, Info, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parseUnstructuredTrainingData, optimizeRouteWithLLM, analyzeTrafficPatterns, searchRouteHistoryWithLLM, fetchAndAnalyzeRouteTrafficData, predictFutureRoute, type RouteOptimizationResult, type LocationContext, type AIThinkingStep, type LinkedSuggestion, type RouteHistorySearchResult, type RouteTrafficSearchResult, type RoutePredictionResult } from "@/lib/llm-service";
import { getRouteTrafficIntelligence, getCityTrafficProfile, getUpcomingFestivals, getActiveConstructionZones } from "@/lib/india-traffic-data";
import { searchLandmarks, searchAreas, landmarkToLocation, getNearbyLandmarks, getPopularLandmarks, type Landmark, type AreaDetails } from "@/lib/india-landmarks";
import { isGoogleMapsConfigured, searchPlacesAutocomplete, getPlaceDetails, getTrafficInfo, type GooglePlacePrediction } from "@/lib/google-maps-service";
import { TrafficDataManager } from "./TrafficDataManager";
import { userStore, useUserStore, INDIAN_CITIES, type UserLocation } from "@/lib/user-store";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";
import SearchHistoryORM from "@/sdk/database/orm/orm_search_history";
import FrequentRoutesORM from "@/sdk/database/orm/orm_frequent_routes";
import { Direction } from "@/sdk/database/orm/common";

// Fix Leaflet default marker icon issue
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Location {
	name: string;
	lat: number;
	lng: number;
	displayName?: string; // Full formatted address
	placeType?: string; // Type of place (city, neighborhood, street, etc.)
	// Enhanced fields for precise location pinpointing
	isLocalLandmark?: boolean; // True if from local landmarks database
	isLocalArea?: boolean; // True if from local areas database
	isGooglePlace?: boolean; // True if from Google Places API
	googlePlaceId?: string; // Google Place ID for additional details
	landmarkType?: string; // Type of landmark (it_park, hospital, metro_station, etc.)
	category?: string; // Category (business, healthcare, transit, etc.)
	area?: string; // Area name within city
	street?: string; // Street name
	city?: string; // City name
	state?: string; // State name
	housenumber?: string; // House/building number
	postcode?: string; // Postal code/pincode
	pincode?: string; // Alternative for postcode
	areaType?: string; // Type of area (residential, commercial, mixed, etc.)
	majorStreets?: string[]; // Major streets in the area
	avgFootfall?: number; // Average daily footfall for traffic estimation
}

interface RouteData {
	coordinates: [number, number][];
	distance: number;
	duration: number;
	steps: string[];
	directionSteps?: DirectionStep[]; // Enhanced direction steps
	isAIShortcut?: boolean;
	shortcutSavings?: number;
	transportMode?: TransportMode;
	effectiveSpeed?: number;
	adjustedDistance?: number;
	adjustedDuration?: number;
}

interface FeedbackData {
	id: string;
	routeId: string;
	origin: string;
	destination: string;
	feedbackType: "route_quality" | "traffic_accuracy" | "shortcut_suggestion" | "other";
	rating: number;
	comments: string;
	timestamp: Date;
}

interface TrafficLevel {
	level: "low" | "moderate" | "high";
	color: string;
	multiplier: number;
}

interface DepartureTime {
	time: string;
	delay: number;
	trafficLevel: TrafficLevel;
	estimatedDuration: number;
	timestamp: Date;
}

type TransportMode = "driving" | "cycling" | "walking" | "bus" | "bike";

// Transport mode configuration with realistic speeds and routing profiles
interface TransportModeConfig {
	name: string;
	icon: React.ComponentType<{ className?: string }>;
	avgSpeed: number; // km/h
	osrmProfile: string;
	canUseHighways: boolean;
	canUseNarrowStreets: boolean;
	trafficAffected: boolean;
	description: string;
	distanceMultiplier: number; // Route may be longer/shorter depending on mode
}

const TRANSPORT_CONFIGS: Record<TransportMode, TransportModeConfig> = {
	driving: {
		name: "Car",
		icon: Car,
		avgSpeed: 55, // Highway: 80-100 km/h, Normal roads: 50-60 km/h → weighted avg
		osrmProfile: "driving",
		canUseHighways: true,
		canUseNarrowStreets: false,
		trafficAffected: true,
		description: "Standard driving route via roads",
		distanceMultiplier: 1.0,
	},
	bus: {
		name: "Bus",
		icon: Bus,
		avgSpeed: 35, // Highway: 80-100 km/h, With stops: 30-40 km/h → weighted avg
		osrmProfile: "driving",
		canUseHighways: true,
		canUseNarrowStreets: false,
		trafficAffected: true,
		description: "Bus route using main roads only",
		distanceMultiplier: 1.15, // Buses often take longer routes
	},
	bike: {
		name: "Motorcycle",
		icon: Bike,
		avgSpeed: 55, // Highway: 70-80 km/h, Normal roads: 50-60 km/h → weighted avg
		osrmProfile: "driving",
		canUseHighways: true,
		canUseNarrowStreets: true,
		trafficAffected: true,
		description: "Motorcycle route with traffic filtering",
		distanceMultiplier: 0.95, // Can take shortcuts
	},
	cycling: {
		name: "Bicycle",
		icon: Bike,
		avgSpeed: 12, // Range: 5-20 km/h → average cyclist speed
		osrmProfile: "cycling",
		canUseHighways: false,
		canUseNarrowStreets: true,
		trafficAffected: false,
		description: "Bicycle-friendly route avoiding highways",
		distanceMultiplier: 0.9, // Can use cycle paths and shortcuts
	},
	walking: {
		name: "Walking",
		icon: User,
		avgSpeed: 5, // Walking speed: 5 km/h
		osrmProfile: "foot",
		canUseHighways: false,
		canUseNarrowStreets: true,
		trafficAffected: false,
		description: "Pedestrian route using footpaths",
		distanceMultiplier: 0.85, // Walking can take the most direct paths
	},
};

interface TrainingData {
	id: string;
	route: string;
	predictedTime: number;
	actualTime: number;
	trafficLevel: string;
	timestamp: Date;
	accuracy: number;
}

// Uploaded training file interface
interface UploadedTrainingFile {
	id: string;
	fileName: string;
	uploadedAt: Date;
	data: TrainingData[];
	rawContent: string;
}

// Enhanced direction step interface for clear navigation instructions
interface DirectionStep {
	instruction: string; // Human-readable instruction
	shortInstruction: string; // Concise version for voice
	distance: number; // in meters
	duration: number; // in seconds
	roadName: string;
	maneuverType: string;
	maneuverModifier?: string;
	icon: 'start' | 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'uturn' | 'roundabout' | 'arrive' | 'continue';
	coordinates: [number, number]; // lat, lng for this step
	warning?: string;
}

// Map maneuver types to clear, human-readable instructions
function formatManeuverInstruction(
	type: string,
	modifier: string | undefined,
	roadName: string,
	distance: number,
	transportMode: TransportMode
): { instruction: string; shortInstruction: string; icon: DirectionStep['icon'] } {
	const distanceText = distance >= 1000
		? `${(distance / 1000).toFixed(1)} km`
		: `${Math.round(distance)} m`;

	const roadText = roadName && roadName !== 'road' && roadName !== ''
		? ` onto ${roadName}`
		: '';

	const modeVerb = transportMode === "walking" ? "Walk" :
					 transportMode === "cycling" ? "Cycle" :
					 transportMode === "bus" ? "Continue" :
					 transportMode === "bike" ? "Ride" : "Drive";

	let instruction = '';
	let shortInstruction = '';
	let icon: DirectionStep['icon'] = 'straight';

	// Normalize type and modifier
	const normalizedType = type?.toLowerCase() || 'continue';
	const normalizedModifier = modifier?.toLowerCase();

	switch (normalizedType) {
		case 'depart':
			instruction = `${modeVerb}${roadText}`;
			shortInstruction = `${modeVerb}${roadText}`;
			icon = 'start';
			break;

		case 'arrive':
			instruction = `Arrive at your destination${roadText}`;
			shortInstruction = `Arrive at destination`;
			icon = 'arrive';
			break;

		case 'turn':
			if (normalizedModifier === 'left') {
				instruction = `Turn left${roadText} and continue for ${distanceText}`;
				shortInstruction = `Turn left${roadText}`;
				icon = 'left';
			} else if (normalizedModifier === 'right') {
				instruction = `Turn right${roadText} and continue for ${distanceText}`;
				shortInstruction = `Turn right${roadText}`;
				icon = 'right';
			} else if (normalizedModifier === 'slight left') {
				instruction = `Bear left${roadText} and continue for ${distanceText}`;
				shortInstruction = `Bear left${roadText}`;
				icon = 'slight-left';
			} else if (normalizedModifier === 'slight right') {
				instruction = `Bear right${roadText} and continue for ${distanceText}`;
				shortInstruction = `Bear right${roadText}`;
				icon = 'slight-right';
			} else if (normalizedModifier === 'sharp left') {
				instruction = `Take a sharp left${roadText} and continue for ${distanceText}`;
				shortInstruction = `Sharp left${roadText}`;
				icon = 'sharp-left';
			} else if (normalizedModifier === 'sharp right') {
				instruction = `Take a sharp right${roadText} and continue for ${distanceText}`;
				shortInstruction = `Sharp right${roadText}`;
				icon = 'sharp-right';
			} else if (normalizedModifier === 'uturn') {
				instruction = `Make a U-turn${roadText} and continue for ${distanceText}`;
				shortInstruction = `Make a U-turn`;
				icon = 'uturn';
			} else {
				instruction = `Turn${roadText} and continue for ${distanceText}`;
				shortInstruction = `Turn${roadText}`;
				icon = 'straight';
			}
			break;

		case 'new name':
		case 'continue':
			instruction = `Continue${roadText} for ${distanceText}`;
			shortInstruction = `Continue${roadText}`;
			icon = 'straight';
			break;

		case 'merge':
			instruction = `Merge${roadText} and continue for ${distanceText}`;
			shortInstruction = `Merge${roadText}`;
			icon = normalizedModifier?.includes('left') ? 'slight-left' : 'slight-right';
			break;

		case 'on ramp':
		case 'off ramp':
			const rampDirection = normalizedModifier?.includes('left') ? 'left' : 'right';
			instruction = `Take the ${normalizedType === 'on ramp' ? 'on-ramp' : 'exit'}${roadText}`;
			shortInstruction = `Take ${normalizedType === 'on ramp' ? 'on-ramp' : 'exit'}`;
			icon = rampDirection === 'left' ? 'slight-left' : 'slight-right';
			break;

		case 'fork':
			if (normalizedModifier?.includes('left')) {
				instruction = `Keep left at the fork${roadText} and continue for ${distanceText}`;
				shortInstruction = `Keep left at fork`;
				icon = 'slight-left';
			} else {
				instruction = `Keep right at the fork${roadText} and continue for ${distanceText}`;
				shortInstruction = `Keep right at fork`;
				icon = 'slight-right';
			}
			break;

		case 'end of road':
			if (normalizedModifier === 'left') {
				instruction = `At the end of the road, turn left${roadText}`;
				shortInstruction = `End of road, turn left`;
				icon = 'left';
			} else if (normalizedModifier === 'right') {
				instruction = `At the end of the road, turn right${roadText}`;
				shortInstruction = `End of road, turn right`;
				icon = 'right';
			} else {
				instruction = `At the end of the road, continue${roadText}`;
				shortInstruction = `End of road, continue`;
				icon = 'straight';
			}
			break;

		case 'roundabout':
		case 'rotary':
			instruction = `Enter the roundabout and take the exit${roadText}`;
			shortInstruction = `Enter roundabout`;
			icon = 'roundabout';
			break;

		case 'roundabout turn':
			instruction = `At the roundabout, take the exit${roadText}`;
			shortInstruction = `Take roundabout exit`;
			icon = 'roundabout';
			break;

		case 'notification':
			instruction = roadName || 'Continue on your route';
			shortInstruction = roadName || 'Continue';
			icon = 'continue';
			break;

		default:
			instruction = `Continue${roadText} for ${distanceText}`;
			shortInstruction = `Continue${roadText}`;
			icon = 'straight';
	}

	return { instruction, shortInstruction, icon };
}

// Parse OSRM steps into enhanced direction steps
function parseOSRMSteps(
	legs: any[],
	origin: Location,
	destination: Location,
	transportMode: TransportMode
): DirectionStep[] {
	const steps: DirectionStep[] = [];
	const modeVerb = transportMode === "walking" ? "Walk" :
					 transportMode === "cycling" ? "Cycle" :
					 transportMode === "bus" ? "Take bus" :
					 transportMode === "bike" ? "Ride" : "Drive";

	// Add start step
	steps.push({
		instruction: `${modeVerb} from ${origin.name}`,
		shortInstruction: `Starting from ${origin.name}`,
		distance: 0,
		duration: 0,
		roadName: origin.name,
		maneuverType: 'depart',
		icon: 'start',
		coordinates: [origin.lat, origin.lng],
	});

	if (legs && legs[0] && legs[0].steps) {
		legs[0].steps.forEach((step: any, idx: number) => {
			// Skip the last step (arrival) as we add it manually
			if (idx === legs[0].steps.length - 1) return;

			const { instruction, shortInstruction, icon } = formatManeuverInstruction(
				step.maneuver?.type,
				step.maneuver?.modifier,
				step.name || '',
				step.distance,
				transportMode
			);

			// Add mode-specific warnings
			let warning: string | undefined;
			if (transportMode === "walking" && step.name?.toLowerCase().includes("highway")) {
				warning = "⚠️ Not recommended for pedestrians";
			}
			if (transportMode === "bus" && step.distance < 100 && step.name) {
				warning = "Bus may skip this narrow section";
			}

			const coords = step.maneuver?.location || [origin.lng, origin.lat];

			steps.push({
				instruction,
				shortInstruction,
				distance: step.distance,
				duration: step.duration,
				roadName: step.name || 'unnamed road',
				maneuverType: step.maneuver?.type || 'continue',
				maneuverModifier: step.maneuver?.modifier,
				icon,
				coordinates: [coords[1], coords[0]], // Convert from [lng, lat] to [lat, lng]
				warning,
			});
		});
	}

	// Add arrival step
	steps.push({
		instruction: `Arrive at ${destination.name}`,
		shortInstruction: `You have arrived`,
		distance: 0,
		duration: 0,
		roadName: destination.name,
		maneuverType: 'arrive',
		icon: 'arrive',
		coordinates: [destination.lat, destination.lng],
	});

	return steps;
}

// Get icon component for direction step
function getDirectionIcon(iconType: DirectionStep['icon']): React.ReactNode {
	const iconClass = "h-4 w-4";
	switch (iconType) {
		case 'start':
			return <CircleDot className={cn(iconClass, "text-green-400")} />;
		case 'arrive':
			return <Flag className={cn(iconClass, "text-red-400")} />;
		case 'left':
			return <ArrowLeft className={cn(iconClass, "text-blue-400")} />;
		case 'right':
			return <ArrowRight className={cn(iconClass, "text-blue-400")} />;
		case 'slight-left':
			return <CornerUpLeft className={cn(iconClass, "text-blue-400")} />;
		case 'slight-right':
			return <CornerUpRight className={cn(iconClass, "text-blue-400")} />;
		case 'sharp-left':
			return <CornerUpLeft className={cn(iconClass, "text-orange-400")} />;
		case 'sharp-right':
			return <CornerUpRight className={cn(iconClass, "text-orange-400")} />;
		case 'uturn':
			return <RotateCcw className={cn(iconClass, "text-yellow-400")} />;
		case 'roundabout':
			return <Compass className={cn(iconClass, "text-blue-400")} />;
		case 'straight':
		case 'continue':
		default:
			return <ArrowUp className={cn(iconClass, "text-slate-400")} />;
	}
}

// Format distance for display
function formatDistance(meters: number): string {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1)} km`;
	}
	return `${Math.round(meters)} m`;
}

// Text-to-speech helper for voice navigation
class VoiceNavigator {
	private synthesis: SpeechSynthesis | null = null;
	private voice: SpeechSynthesisVoice | null = null;
	private isSpeaking = false;
	private queue: string[] = [];

	constructor() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.synthesis = window.speechSynthesis;
			this.loadVoice();
		}
	}

	private loadVoice() {
		if (!this.synthesis) return;

		const setVoice = () => {
			const voices = this.synthesis!.getVoices();
			// Prefer English voices
			this.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
						 voices.find(v => v.lang.startsWith('en')) ||
						 voices[0] || null;
		};

		setVoice();
		this.synthesis.onvoiceschanged = setVoice;
	}

	speak(text: string, priority = false): void {
		if (!this.synthesis) return;

		if (priority) {
			this.synthesis.cancel();
			this.queue = [];
		}

		const utterance = new SpeechSynthesisUtterance(text);
		if (this.voice) {
			utterance.voice = this.voice;
		}
		utterance.rate = 1.0;
		utterance.pitch = 1.0;
		utterance.volume = 1.0;

		utterance.onstart = () => {
			this.isSpeaking = true;
		};

		utterance.onend = () => {
			this.isSpeaking = false;
			if (this.queue.length > 0) {
				const next = this.queue.shift();
				if (next) this.speak(next);
			}
		};

		if (this.isSpeaking && !priority) {
			this.queue.push(text);
		} else {
			this.synthesis.speak(utterance);
		}
	}

	stop(): void {
		if (this.synthesis) {
			this.synthesis.cancel();
			this.queue = [];
			this.isSpeaking = false;
		}
	}

	isAvailable(): boolean {
		return this.synthesis !== null;
	}
}

// Global voice navigator instance
const voiceNavigator = new VoiceNavigator();

// Local storage keys
const TRAINING_FILES_STORAGE_KEY = 'indiflow_training_files';
const TRAINING_DATA_STORAGE_KEY = 'indiflow_training_data';
const SESSION_STATE_STORAGE_KEY = 'indiflow_session_state';

// Session state interface for localStorage persistence
interface SessionState {
	origin: Location | null;
	destination: Location | null;
	originInput: string;
	destinationInput: string;
	transportMode: TransportMode;
	route: RouteData | null;
	lastUpdated: number;
}

// Load session state from localStorage
function loadSessionState(): Partial<SessionState> {
	try {
		const stored = localStorage.getItem(SESSION_STATE_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Check if data is less than 24 hours old
			if (parsed.lastUpdated && Date.now() - parsed.lastUpdated < 24 * 60 * 60 * 1000) {
				return parsed;
			}
		}
	} catch (error) {
		console.error('Failed to load session state:', error);
	}
	return {};
}

// Save session state to localStorage
function saveSessionState(state: Partial<SessionState>): void {
	try {
		const currentState = loadSessionState();
		const newState: SessionState = {
			origin: state.origin ?? currentState.origin ?? null,
			destination: state.destination ?? currentState.destination ?? null,
			originInput: state.originInput ?? currentState.originInput ?? '',
			destinationInput: state.destinationInput ?? currentState.destinationInput ?? '',
			transportMode: state.transportMode ?? currentState.transportMode ?? 'driving',
			route: state.route ?? currentState.route ?? null,
			lastUpdated: Date.now(),
		};
		localStorage.setItem(SESSION_STATE_STORAGE_KEY, JSON.stringify(newState));
	} catch (error) {
		console.error('Failed to save session state:', error);
	}
}

// Helper to load training files from localStorage
function loadTrainingFilesFromStorage(): UploadedTrainingFile[] {
	try {
		const stored = localStorage.getItem(TRAINING_FILES_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.map((file: any) => ({
				...file,
				uploadedAt: new Date(file.uploadedAt),
				data: file.data.map((d: any) => ({
					...d,
					timestamp: new Date(d.timestamp),
				})),
			}));
		}
	} catch (error) {
		console.error('Failed to load training files from storage:', error);
	}
	return [];
}

// Helper to save training files to localStorage
function saveTrainingFilesToStorage(files: UploadedTrainingFile[]): void {
	try {
		localStorage.setItem(TRAINING_FILES_STORAGE_KEY, JSON.stringify(files));
	} catch (error) {
		console.error('Failed to save training files to storage:', error);
	}
}

// Helper to load training data from localStorage
function loadTrainingDataFromStorage(): TrainingData[] {
	try {
		const stored = localStorage.getItem(TRAINING_DATA_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.map((d: any) => ({
				...d,
				timestamp: new Date(d.timestamp),
			}));
		}
	} catch (error) {
		console.error('Failed to load training data from storage:', error);
	}
	return [];
}

// Helper to save training data to localStorage
function saveTrainingDataToStorage(data: TrainingData[]): void {
	try {
		localStorage.setItem(TRAINING_DATA_STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Failed to save training data to storage:', error);
	}
}

// Local storage key for route history fallback
const LOCAL_ROUTE_HISTORY_KEY = 'indiflow_local_route_history';

// Interface for local route history
interface LocalRouteHistory {
	searchHistory: Array<{
		id: string;
		origin_name: string;
		origin_lat: number;
		origin_lng: number;
		destination_name: string;
		destination_lat: number;
		destination_lng: number;
		create_time: string;
	}>;
	frequentRoutes: Array<{
		id: string;
		origin_name: string;
		origin_lat: number;
		origin_lng: number;
		destination_name: string;
		destination_lat: number;
		destination_lng: number;
		frequency_count: number;
		average_travel_time_seconds: number;
	}>;
}

// Load route history from localStorage (fallback when ORM fails)
function loadLocalRouteHistory(): LocalRouteHistory {
	try {
		const stored = localStorage.getItem(LOCAL_ROUTE_HISTORY_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Failed to load local route history:', error);
	}
	return { searchHistory: [], frequentRoutes: [] };
}

// Save route history to localStorage (fallback)
function saveLocalRouteHistory(
	origin: { name: string; lat: number; lng: number },
	destination: { name: string; lat: number; lng: number },
	durationMinutes: number
): void {
	try {
		const history = loadLocalRouteHistory();
		const now = new Date().toISOString();
		const searchId = `search_${Date.now()}`;

		// Add to search history (keep last 10)
		history.searchHistory.unshift({
			id: searchId,
			origin_name: origin.name,
			origin_lat: origin.lat,
			origin_lng: origin.lng,
			destination_name: destination.name,
			destination_lat: destination.lat,
			destination_lng: destination.lng,
			create_time: now,
		});
		history.searchHistory = history.searchHistory.slice(0, 10);

		// Update or add to frequent routes
		const existingIdx = history.frequentRoutes.findIndex(
			r => r.origin_name === origin.name && r.destination_name === destination.name
		);

		if (existingIdx >= 0) {
			history.frequentRoutes[existingIdx].frequency_count += 1;
			history.frequentRoutes[existingIdx].average_travel_time_seconds = durationMinutes * 60;
		} else {
			history.frequentRoutes.push({
				id: `route_${Date.now()}`,
				origin_name: origin.name,
				origin_lat: origin.lat,
				origin_lng: origin.lng,
				destination_name: destination.name,
				destination_lat: destination.lat,
				destination_lng: destination.lng,
				frequency_count: 1,
				average_travel_time_seconds: durationMinutes * 60,
			});
		}

		// Sort frequent routes by frequency and keep top 10
		history.frequentRoutes.sort((a, b) => b.frequency_count - a.frequency_count);
		history.frequentRoutes = history.frequentRoutes.slice(0, 10);

		localStorage.setItem(LOCAL_ROUTE_HISTORY_KEY, JSON.stringify(history));
	} catch (error) {
		console.error('Failed to save local route history:', error);
	}
}

// Parse CSV content to training data
function parseCSVToTrainingData(content: string): TrainingData[] {
	const lines = content.trim().split('\n');
	if (lines.length < 2) return [];

	const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
	const routeIdx = headers.findIndex(h => h.includes('route'));
	const predictedIdx = headers.findIndex(h => h.includes('predicted') || h.includes('pred'));
	const actualIdx = headers.findIndex(h => h.includes('actual'));
	const trafficIdx = headers.findIndex(h => h.includes('traffic'));

	if (routeIdx === -1 || predictedIdx === -1 || actualIdx === -1) {
		throw new Error('CSV must contain route, predicted time, and actual time columns');
	}

	const data: TrainingData[] = [];
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map(v => v.trim());
		if (values.length < 3) continue;

		const route = values[routeIdx] || `Route ${i}`;
		const predictedTime = parseFloat(values[predictedIdx]) || 0;
		const actualTime = parseFloat(values[actualIdx]) || 0;
		const trafficLevel = trafficIdx !== -1 ? values[trafficIdx] || 'moderate' : 'moderate';

		if (predictedTime > 0 && actualTime > 0) {
			const accuracy = 100 - Math.abs((predictedTime - actualTime) / actualTime * 100);
			data.push({
				id: `upload_${Date.now()}_${i}`,
				route,
				predictedTime,
				actualTime,
				trafficLevel,
				timestamp: new Date(),
				accuracy: Math.max(0, Math.min(100, accuracy)),
			});
		}
	}
	return data;
}

// Parse JSON content to training data
function parseJSONToTrainingData(content: string): TrainingData[] {
	const parsed = JSON.parse(content);
	const items = Array.isArray(parsed) ? parsed : parsed.data || parsed.training || [parsed];

	return items.map((item: any, idx: number) => {
		const route = item.route || item.routeName || item.name || `Route ${idx + 1}`;
		const predictedTime = parseFloat(item.predictedTime || item.predicted || item.pred || 0);
		const actualTime = parseFloat(item.actualTime || item.actual || 0);
		const trafficLevel = item.trafficLevel || item.traffic || 'moderate';

		if (predictedTime > 0 && actualTime > 0) {
			const accuracy = 100 - Math.abs((predictedTime - actualTime) / actualTime * 100);
			return {
				id: `upload_${Date.now()}_${idx}`,
				route,
				predictedTime,
				actualTime,
				trafficLevel,
				timestamp: new Date(item.timestamp || Date.now()),
				accuracy: Math.max(0, Math.min(100, accuracy)),
			};
		}
		return null;
	}).filter(Boolean) as TrainingData[];
}

// Helper function to format minutes to hours
function formatMinutesToHours(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = Math.round(minutes % 60);

	if (hours === 0) {
		return `${mins} min`;
	} else if (mins === 0) {
		return `${hours} hr`;
	} else {
		return `${hours} hr ${mins} min`;
	}
}

// Reverse geocoding to get address from coordinates
// Uses Google Maps API if configured, falls back to Photon API
async function reverseGeocode(lat: number, lng: number): Promise<Location | null> {
	// Try Google Maps first if configured
	if (isGoogleMapsConfigured()) {
		try {
			const { reverseGeocode: googleReverseGeocode } = await import('@/lib/google-maps-service');
			const result = await googleReverseGeocode(lat, lng);
			if (result) {
				return {
					name: result.name,
					displayName: result.formattedAddress,
					lat: result.lat,
					lng: result.lng,
					placeType: 'google_place',
					isGooglePlace: true,
					googlePlaceId: result.placeId,
				};
			}
		} catch (error) {
			console.error('Google reverse geocoding error:', error);
		}
	}

	// Fallback to Photon API
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

// Enhanced location search with local landmarks database + Photon API
// Provides precise building-level location for better traffic predictions
async function searchLocation(query: string, preferredCity?: string): Promise<Location[]> {
	if (!query || query.length < 2) return [];

	// First, search local landmarks database for precise building/place matches
	const localLandmarks = searchLandmarks(query, preferredCity);
	const localAreas = searchAreas(query, preferredCity);

	// Convert landmarks to Location format
	const landmarkResults: Location[] = localLandmarks.slice(0, 8).map((landmark) => {
		const loc = landmarkToLocation(landmark);
		return {
			...loc,
			isLocalLandmark: true,
			landmarkType: landmark.type,
			category: landmark.category,
			area: landmark.area,
			street: landmark.street,
			avgFootfall: landmark.avgDailyFootfall,
		};
	});

	// Convert areas to Location format
	const areaResults: Location[] = localAreas.slice(0, 4).map((area) => ({
		name: area.name,
		displayName: `${area.name}, ${area.city}`,
		lat: area.lat,
		lng: area.lng,
		placeType: 'area',
		isLocalArea: true,
		areaType: area.type,
		pincode: area.pincode,
		majorStreets: area.majorStreets,
	}));

	// If we have good local results, prioritize them
	const localResults = [...landmarkResults, ...areaResults];

	// Also fetch from Photon API for additional results
	let apiResults: Location[] = [];
	try {
		// India bounding box: [min_lon, min_lat, max_lon, max_lat]
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

		if (response.ok) {
			const data = await response.json();

			apiResults = data.features.map((item: any) => {
				const props = item.properties;
				const coords = item.geometry.coordinates;

				const placeType = props.type || props.osm_value || 'place';

				const nameParts = [
					props.name,
					props.street,
					props.city || props.county,
					props.state,
				].filter(Boolean);

				const displayName = nameParts.join(', ');
				const shortName = nameParts.slice(0, 2).join(', ').trim();

				return {
					name: shortName || props.name,
					displayName: displayName,
					lat: coords[1],
					lng: coords[0],
					placeType: placeType,
					street: props.street,
					city: props.city,
					state: props.state,
					housenumber: props.housenumber,
					postcode: props.postcode,
				};
			});
		}
	} catch (error) {
		console.error('Photon API error:', error);
	}

	// Also fetch from Google Places API if configured (premium geocoding)
	let googleResults: Location[] = [];
	if (isGoogleMapsConfigured()) {
		try {
			const predictions = await searchPlacesAutocomplete(query, {
				componentRestrictions: { country: 'in' },
			});

			// Get details for top 3 predictions
			const detailPromises = predictions.slice(0, 3).map(async (pred: GooglePlacePrediction) => {
				const details = await getPlaceDetails(pred.placeId);
				if (details) {
					return {
						name: pred.mainText || details.name,
						displayName: pred.description || details.formattedAddress,
						lat: details.lat,
						lng: details.lng,
						placeType: 'google_place',
						isGooglePlace: true,
						googlePlaceId: pred.placeId,
					} as Location;
				}
				return null;
			});

			const resolved = await Promise.all(detailPromises);
			googleResults = resolved.filter((r): r is Location => r !== null);
		} catch (error) {
			console.error('Google Places API error:', error);
		}
	}

	// Combine results - local landmarks first (most accurate), then Google Places, then Photon API
	// Remove duplicates based on coordinates proximity
	const combinedResults: Location[] = [...localResults];

	// Add Google results (higher quality than Photon)
	for (const googleResult of googleResults) {
		const isDuplicate = combinedResults.some((existing) => {
			const latDiff = Math.abs(existing.lat - googleResult.lat);
			const lngDiff = Math.abs(existing.lng - googleResult.lng);
			return latDiff < 0.001 && lngDiff < 0.001;
		});
		if (!isDuplicate) {
			combinedResults.push(googleResult);
		}
	}

	// Add Photon API results
	for (const apiResult of apiResults) {
		// Check if this is too close to an existing result
		const isDuplicate = combinedResults.some((existing) => {
			const latDiff = Math.abs(existing.lat - apiResult.lat);
			const lngDiff = Math.abs(existing.lng - apiResult.lng);
			return latDiff < 0.001 && lngDiff < 0.001; // ~100m proximity
		});

		if (!isDuplicate) {
			combinedResults.push(apiResult);
		}
	}

	return combinedResults.slice(0, 15);
}

// Get popular landmarks for quick selection (shown when input is focused but empty)
function getQuickSelectLandmarks(city?: string): Location[] {
	const popular = getPopularLandmarks(city);
	return popular.slice(0, 6).map((landmark) => {
		const loc = landmarkToLocation(landmark);
		return {
			...loc,
			isLocalLandmark: true,
			landmarkType: landmark.type,
			category: landmark.category,
			area: landmark.area,
			avgFootfall: landmark.avgDailyFootfall,
		};
	});
}

// Get icon component for landmark type
function getLandmarkIcon(landmarkType?: string, category?: string, placeType?: string): React.ReactNode {
	const iconClass = "h-4 w-4 flex-shrink-0";

	// Check landmark type first (most specific)
	switch (landmarkType) {
		case 'it_park':
		case 'tech_campus':
		case 'office_complex':
			return <Building2 className={cn(iconClass, "text-blue-400")} />;
		case 'shopping_mall':
			return <ShoppingCart className={cn(iconClass, "text-pink-400")} />;
		case 'hospital':
			return <Hospital className={cn(iconClass, "text-red-400")} />;
		case 'school':
		case 'college':
		case 'university':
			return <GraduationCap className={cn(iconClass, "text-yellow-400")} />;
		case 'metro_station':
		case 'railway_station':
		case 'bus_terminal':
			return <Train className={cn(iconClass, "text-green-400")} />;
		case 'airport':
			return <Plane className={cn(iconClass, "text-cyan-400")} />;
		case 'temple':
		case 'mosque':
		case 'church':
		case 'gurudwara':
			return <Church className={cn(iconClass, "text-orange-400")} />;
		case 'hotel':
			return <Hotel className={cn(iconClass, "text-purple-400")} />;
		case 'apartment':
			return <Home className={cn(iconClass, "text-emerald-400")} />;
		case 'monument':
			return <LandmarkIcon className={cn(iconClass, "text-amber-400")} />;
		case 'park':
			return <TreePine className={cn(iconClass, "text-green-500")} />;
		case 'stadium':
			return <Trophy className={cn(iconClass, "text-yellow-500")} />;
		case 'restaurant':
			return <Utensils className={cn(iconClass, "text-orange-400")} />;
		case 'petrol_pump':
			return <Fuel className={cn(iconClass, "text-red-500")} />;
		case 'government':
			return <LandmarkIcon className={cn(iconClass, "text-slate-400")} />;
	}

	// Check category
	switch (category) {
		case 'business':
			return <Briefcase className={cn(iconClass, "text-blue-400")} />;
		case 'shopping':
			return <ShoppingCart className={cn(iconClass, "text-pink-400")} />;
		case 'healthcare':
			return <Hospital className={cn(iconClass, "text-red-400")} />;
		case 'education':
			return <GraduationCap className={cn(iconClass, "text-yellow-400")} />;
		case 'transit':
			return <Train className={cn(iconClass, "text-green-400")} />;
		case 'religious':
			return <Church className={cn(iconClass, "text-orange-400")} />;
		case 'hospitality':
			return <Hotel className={cn(iconClass, "text-purple-400")} />;
		case 'residential':
			return <Home className={cn(iconClass, "text-emerald-400")} />;
		case 'heritage':
			return <LandmarkIcon className={cn(iconClass, "text-amber-400")} />;
		case 'entertainment':
			return <Star className={cn(iconClass, "text-yellow-400")} />;
		case 'sports':
			return <Trophy className={cn(iconClass, "text-yellow-500")} />;
	}

	// Fall back to place type
	switch (placeType) {
		case 'area':
			return <MapPinned className={cn(iconClass, "text-slate-400")} />;
		case 'city':
		case 'town':
			return <Building className={cn(iconClass, "text-slate-400")} />;
		case 'street':
		case 'road':
			return <RouteIcon className={cn(iconClass, "text-slate-400")} />;
	}

	// Default icon
	return <MapPin className={cn(iconClass, "text-slate-400")} />;
}

// Get badge color based on category/type
function getLandmarkBadgeStyle(isLocalLandmark?: boolean, isLocalArea?: boolean, category?: string): string {
	if (isLocalLandmark) {
		switch (category) {
			case 'business':
				return 'border-blue-500 text-blue-400 bg-blue-500/10';
			case 'shopping':
				return 'border-pink-500 text-pink-400 bg-pink-500/10';
			case 'healthcare':
				return 'border-red-500 text-red-400 bg-red-500/10';
			case 'education':
				return 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
			case 'transit':
				return 'border-green-500 text-green-400 bg-green-500/10';
			case 'religious':
				return 'border-orange-500 text-orange-400 bg-orange-500/10';
			case 'hospitality':
				return 'border-purple-500 text-purple-400 bg-purple-500/10';
			case 'heritage':
				return 'border-amber-500 text-amber-400 bg-amber-500/10';
			default:
				return 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
		}
	}
	if (isLocalArea) {
		return 'border-cyan-500 text-cyan-400 bg-cyan-500/10';
	}
	return 'border-slate-500 text-slate-400';
}

// Map recenter component
function MapRecenter({ center }: { center: LatLngExpression }) {
	const map = useMap();
	useEffect(() => {
		map.setView(center, map.getZoom());
	}, [center, map]);
	return null;
}

// Map bounds fitting component
function MapBoundsFitter({ coordinates }: { coordinates: [number, number][] | null }) {
	const map = useMap();
	useEffect(() => {
		if (coordinates && coordinates.length > 1) {
			const bounds = L.latLngBounds(coordinates);
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [coordinates, map]);
	return null;
}

// Map updater component for live navigation (handles both center and zoom)
function MapUpdater({ center, zoom }: { center: LatLngExpression; zoom: number }) {
	const map = useMap();
	useEffect(() => {
		map.setView(center, zoom);
	}, [center, zoom, map]);
	return null;
}

// Get transport mode for OSRM API
function getOSRMMode(mode: TransportMode): string {
	return TRANSPORT_CONFIGS[mode].osrmProfile === "foot" ? "foot" :
		   TRANSPORT_CONFIGS[mode].osrmProfile === "cycling" ? "bike" :
		   "car";
}

// Calculate adjusted duration based on transport mode and route characteristics
function calculateAdjustedDuration(
	baseDistance: number,
	baseDuration: number,
	mode: TransportMode,
	trafficMultiplier: number
): { adjustedDuration: number; adjustedDistance: number; effectiveSpeed: number; trafficLightMinutes: number; intersectionCount: number } {
	const config = TRANSPORT_CONFIGS[mode];

	// Adjust distance based on mode (some modes take different routes)
	const adjustedDistance = baseDistance * config.distanceMultiplier;

	// Calculate duration based on mode's average speed
	let adjustedDuration = (adjustedDistance / config.avgSpeed) * 60; // Convert to minutes

	// Apply traffic multiplier only for modes affected by traffic
	if (config.trafficAffected) {
		adjustedDuration *= trafficMultiplier;
	}

	// ============================================
	// TRAFFIC LIGHT & INTERSECTION ADJUSTMENTS
	// ============================================
	// Estimate number of traffic signals based on distance and urban density
	// Indian cities typically have 1 major signal every 1-2 km in urban areas
	// Estimate: ~0.8 signals per km for urban routes
	const signalsPerKm = 0.8;
	const estimatedIntersections = Math.ceil(adjustedDistance * signalsPerKm);

	// Average wait time per signal: 45-90 seconds in Indian cities
	// We use 60 seconds (1 minute) as average, accounting for:
	// - Green light catch: ~30% of time (no wait)
	// - Yellow/Red light: ~70% of time (30-120 sec wait)
	const avgWaitPerSignal = 1.0; // minutes

	// Reduce wait time for modes that can filter through traffic
	let signalWaitMultiplier = 1.0;
	if (mode === 'bike') {
		signalWaitMultiplier = 0.7; // Bikes can filter, but still stop at signals
	} else if (mode === 'cycling') {
		signalWaitMultiplier = 0.6; // Bicycles can sometimes bypass
	} else if (mode === 'walking') {
		signalWaitMultiplier = 0.3; // Pedestrians often cross during gaps
	} else if (mode === 'bus') {
		signalWaitMultiplier = 0.9; // Buses sometimes have priority lanes
	}

	const trafficLightMinutes = estimatedIntersections * avgWaitPerSignal * signalWaitMultiplier;

	// Add traffic light time to total duration
	adjustedDuration += trafficLightMinutes;

	// Add additional buffer for:
	// - Pedestrian crossings (common in Indian cities)
	// - Speed breakers/bumps (~5 seconds each, assume 1 per 2km)
	// - Congestion at intersections beyond signal time
	const speedBreakerMinutes = (adjustedDistance / 2) * (5 / 60); // 5 seconds per speed breaker
	adjustedDuration += speedBreakerMinutes;

	// Calculate effective speed considering all factors
	const effectiveSpeed = adjustedDistance / (adjustedDuration / 60);

	return {
		adjustedDuration: Math.round(adjustedDuration),
		adjustedDistance: Math.round(adjustedDistance * 10) / 10,
		effectiveSpeed: Math.round(effectiveSpeed * 10) / 10,
		trafficLightMinutes: Math.round(trafficLightMinutes),
		intersectionCount: estimatedIntersections,
	};
}

// AI-based shortcut route calculator (simulated)
async function calculateAIShortcutRoute(origin: Location, destination: Location, transportMode: TransportMode = "driving"): Promise<RouteData | null> {
	try {
		const osrmMode = getOSRMMode(transportMode);
		// Request alternative routes from OSRM
		const response = await fetch(
			`https://router.project-osrm.org/route/v1/${osrmMode}/` +
			`${origin.lng},${origin.lat};${destination.lng},${destination.lat}?` +
			`overview=full&geometries=geojson&steps=true&alternatives=true`
		);

		if (!response.ok) return null;

		const data = await response.json();

		// If we have alternative routes, use the second one as "AI shortcut"
		if (data.routes && data.routes.length > 1) {
			const route = data.routes[1]; // Take alternative route

			const coordinates: [number, number][] = route.geometry.coordinates.map(
				(coord: number[]) => [coord[1], coord[0]]
			);

			const steps: string[] = [];
			steps.push(`Start at ${origin.name}`);

			if (route.legs && route.legs[0] && route.legs[0].steps) {
				route.legs[0].steps.forEach((step: any, idx: number) => {
					if (idx === route.legs[0].steps.length - 1) return;

					const instruction = step.maneuver?.modifier
						? `${step.maneuver.type} ${step.maneuver.modifier}`
						: step.maneuver?.type || 'Continue';

					const distance = (step.distance / 1000).toFixed(1);
					const roadName = step.name || 'road';

					steps.push(`${instruction} onto ${roadName} for ${distance} km`);
				});
			}

			steps.push(`Arrive at ${destination.name}`);

			const distance = route.distance / 1000;
			const duration = route.duration / 60;

			return {
				coordinates,
				distance,
				duration,
				steps,
				isAIShortcut: true,
				shortcutSavings: 0 // Will be calculated by comparing to normal route
			};
		}

		return null;
	} catch (error) {
		console.error('AI shortcut routing error:', error);
		return null;
	}
}

// Calculate route using OSRM (Open Source Routing Machine)
async function calculateRoute(origin: Location, destination: Location, transportMode: TransportMode = "driving"): Promise<RouteData> {
	const config = TRANSPORT_CONFIGS[transportMode];
	const currentTraffic = getTrafficLevel(new Date().getHours());

	try {
		const osrmMode = getOSRMMode(transportMode);
		// Use OSRM public API for routing
		const response = await fetch(
			`https://router.project-osrm.org/route/v1/${osrmMode}/` +
			`${origin.lng},${origin.lat};${destination.lng},${destination.lat}?` +
			`overview=full&geometries=geojson&steps=true`
		);

		if (!response.ok) {
			throw new Error('Routing API failed');
		}

		const data = await response.json();

		if (!data.routes || data.routes.length === 0) {
			throw new Error('No route found');
		}

		const route = data.routes[0];

		// Extract coordinates from the route geometry
		const coordinates: [number, number][] = route.geometry.coordinates.map(
			(coord: number[]) => [coord[1], coord[0]] // OSRM returns [lng, lat], we need [lat, lng]
		);

		// Parse enhanced direction steps
		const directionSteps = parseOSRMSteps(route.legs, origin, destination, transportMode);

		// Generate legacy string steps from enhanced steps for backwards compatibility
		const steps: string[] = directionSteps.map(step => step.instruction);

		// Base distance in km, base duration in minutes from OSRM
		const baseDistance = route.distance / 1000;
		const baseDuration = route.duration / 60;

		// Calculate transport mode-adjusted values
		const adjusted = calculateAdjustedDuration(
			baseDistance,
			baseDuration,
			transportMode,
			currentTraffic.multiplier
		);

		return {
			coordinates,
			distance: baseDistance,
			duration: baseDuration,
			steps,
			directionSteps,
			transportMode,
			adjustedDistance: adjusted.adjustedDistance,
			adjustedDuration: adjusted.adjustedDuration,
			effectiveSpeed: adjusted.effectiveSpeed,
		};
	} catch (error) {
		console.error('Routing error:', error);

		// Fallback to straight line if routing fails
		const coordinates: [number, number][] = [
			[origin.lat, origin.lng],
			[destination.lat, destination.lng],
		];

		// Calculate haversine distance as fallback
		const R = 6371;
		const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
		const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((origin.lat * Math.PI) / 180) *
				Math.cos((destination.lat * Math.PI) / 180) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const baseDistance = R * c;

		// Calculate adjusted values based on transport mode
		const adjusted = calculateAdjustedDuration(
			baseDistance,
			(baseDistance / config.avgSpeed) * 60,
			transportMode,
			currentTraffic.multiplier
		);

		const steps = [
			`Start at ${origin.name}`,
			`Travel directly to destination via ${config.name.toLowerCase()}`,
			`Arrive at ${destination.name}`,
		];

		// Create fallback direction steps
		const directionSteps: DirectionStep[] = [
			{
				instruction: `Start at ${origin.name}`,
				shortInstruction: `Starting from ${origin.name}`,
				distance: 0,
				duration: 0,
				roadName: origin.name,
				maneuverType: 'depart',
				icon: 'start',
				coordinates: [origin.lat, origin.lng],
			},
			{
				instruction: `Travel directly to destination via ${config.name.toLowerCase()}`,
				shortInstruction: `Head to destination`,
				distance: baseDistance * 1000,
				duration: adjusted.adjustedDuration * 60,
				roadName: 'direct route',
				maneuverType: 'continue',
				icon: 'straight',
				coordinates: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
			},
			{
				instruction: `Arrive at ${destination.name}`,
				shortInstruction: `You have arrived`,
				distance: 0,
				duration: 0,
				roadName: destination.name,
				maneuverType: 'arrive',
				icon: 'arrive',
				coordinates: [destination.lat, destination.lng],
			},
		];

		return {
			coordinates,
			distance: baseDistance,
			duration: adjusted.adjustedDuration,
			steps,
			directionSteps,
			transportMode,
			adjustedDistance: adjusted.adjustedDistance,
			adjustedDuration: adjusted.adjustedDuration,
			effectiveSpeed: adjusted.effectiveSpeed,
		};
	}
}

// Extract city name from location string for India traffic data lookup
function extractCityFromLocation(location: string): string {
	const locationLower = location.toLowerCase();
	const cityMappings: Record<string, string> = {
		'bangalore': 'Bengaluru', 'bengaluru': 'Bengaluru',
		'mumbai': 'Mumbai', 'bombay': 'Mumbai',
		'delhi': 'Delhi', 'new delhi': 'Delhi', 'noida': 'Delhi', 'gurgaon': 'Delhi', 'gurugram': 'Delhi',
		'chennai': 'Chennai', 'madras': 'Chennai',
		'hyderabad': 'Hyderabad', 'secunderabad': 'Hyderabad',
		'kolkata': 'Kolkata', 'calcutta': 'Kolkata',
		'pune': 'Pune',
		'ahmedabad': 'Ahmedabad',
	};

	for (const [key, value] of Object.entries(cityMappings)) {
		if (locationLower.includes(key)) {
			return value;
		}
	}
	return 'Bengaluru'; // Default
}

// AI-Enhanced traffic prediction using India traffic intelligence
function getTrafficLevel(hour: number, cityName?: string): TrafficLevel {
	const city = cityName || 'Bengaluru';
	const cityProfile = getCityTrafficProfile(city);
	const now = new Date();
	const dayOfWeek = now.getDay();
	const month = now.getMonth() + 1;
	const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

	// Get route intelligence which includes festival and construction impacts
	const routeIntelligence = getRouteTrafficIntelligence(city, city, hour, dayOfWeek, month);

	// Use the intelligence multiplier which accounts for festivals, construction, etc.
	let multiplier = routeIntelligence.trafficMultiplier;

	// Determine traffic level based on multiplier
	let level: "low" | "moderate" | "high";
	let color: string;

	if (multiplier >= 1.6) {
		level = "high";
		color = "#ef4444";
	} else if (multiplier >= 1.2) {
		level = "moderate";
		color = "#f59e0b";
	} else {
		level = "low";
		color = "#22c55e";
	}

	// Apply city-specific peak hour adjustments
	if (cityProfile) {
		const isMorningPeak = hour >= cityProfile.peakHours.morning.start && hour <= cityProfile.peakHours.morning.end;
		const isEveningPeak = hour >= cityProfile.peakHours.evening.start && hour <= cityProfile.peakHours.evening.end;

		if (isWeekday && (isMorningPeak || isEveningPeak)) {
			// Use city's actual peak vs off-peak speed ratio
			const speedRatio = cityProfile.avgSpeed.peakHour / cityProfile.avgSpeed.offPeak;
			multiplier = multiplier * (1 / speedRatio); // Lower speed = higher multiplier
			level = "high";
			color = "#ef4444";
		}
	}

	return { level, color, multiplier };
}

// Legacy function for backwards compatibility (basic version)
function getBasicTrafficLevel(hour: number): TrafficLevel {
	if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
		return { level: "high", color: "#ef4444", multiplier: 1.8 };
	}
	if ((hour >= 7 && hour < 8) || (hour > 10 && hour <= 12) || (hour >= 16 && hour < 17) || (hour > 20 && hour <= 21)) {
		return { level: "moderate", color: "#f59e0b", multiplier: 1.3 };
	}
	return { level: "low", color: "#22c55e", multiplier: 1.0 };
}

// AI-Enhanced departure time recommendations using India traffic intelligence
function calculateDepartureTimes(
	baseDuration: number,
	baseDistance: number,
	transportMode: TransportMode,
	targetHour?: number,
	originCity?: string,
	destCity?: string
): DepartureTime[] {
	const times: DepartureTime[] = [];
	const now = new Date();
	const config = TRANSPORT_CONFIGS[transportMode];
	let minDuration = Infinity;

	// Use origin city for traffic predictions, default to Bengaluru
	const cityForTraffic = originCity || 'Bengaluru';
	const month = now.getMonth() + 1;

	// Get upcoming festivals and construction zones for this route
	const upcomingFestivals = getUpcomingFestivals(month);
	const constructionZones = getActiveConstructionZones(cityForTraffic);

	// Round current time to the next 30-minute interval
	const roundedNow = new Date(now);
	const minutes = roundedNow.getMinutes();
	if (minutes < 30) {
		roundedNow.setMinutes(30, 0, 0);
	} else {
		roundedNow.setHours(roundedNow.getHours() + 1, 0, 0, 0);
	}

	// Check next 12 hours in 30-minute intervals (24 slots)
	for (let i = 0; i < 24; i++) {
		const checkTime = new Date(roundedNow.getTime() + i * 30 * 60 * 1000);
		const hour = checkTime.getHours();
		const dayOfWeek = checkTime.getDay();

		// Use AI-enhanced traffic prediction with city context
		const routeIntelligence = getRouteTrafficIntelligence(
			cityForTraffic,
			destCity || cityForTraffic,
			hour,
			dayOfWeek,
			month
		);

		// Build traffic level from intelligence
		let trafficMultiplier = routeIntelligence.trafficMultiplier;

		// Adjust for transport mode
		if (transportMode === 'bike') {
			trafficMultiplier *= 0.85; // Bikes navigate traffic better
		} else if (transportMode === 'bus') {
			trafficMultiplier *= 0.95; // Buses sometimes have dedicated lanes
		} else if (transportMode === 'cycling' || transportMode === 'walking') {
			trafficMultiplier = 1.0; // Not affected by traffic
		}

		const traffic: TrafficLevel = {
			level: trafficMultiplier >= 1.6 ? "high" : trafficMultiplier >= 1.2 ? "moderate" : "low",
			color: trafficMultiplier >= 1.6 ? "#ef4444" : trafficMultiplier >= 1.2 ? "#f59e0b" : "#22c55e",
			multiplier: trafficMultiplier,
		};

		// Calculate mode-adjusted duration with AI traffic multiplier
		const adjusted = calculateAdjustedDuration(
			baseDistance,
			baseDuration,
			transportMode,
			traffic.multiplier
		);
		const estimatedDuration = adjusted.adjustedDuration;

		if (estimatedDuration < minDuration) {
			minDuration = estimatedDuration;
		}

		times.push({
			time: checkTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
			delay: 0, // Will be calculated later
			trafficLevel: config.trafficAffected ? traffic : { level: "low", color: "#22c55e", multiplier: 1.0 },
			estimatedDuration,
			timestamp: checkTime,
		});
	}

	// Calculate delays relative to optimal time
	times.forEach((time) => {
		time.delay = Math.round(time.estimatedDuration - minDuration);
	});

	// Sort by estimated duration (best times first) unless target hour specified
	if (targetHour !== undefined) {
		times.sort((a, b) => {
			const aHourDiff = Math.abs(a.timestamp.getHours() - targetHour);
			const bHourDiff = Math.abs(b.timestamp.getHours() - targetHour);
			if (aHourDiff !== bHourDiff) return aHourDiff - bHourDiff;
			return a.delay - b.delay;
		});
	}

	return times;
}

// Interactive Star Rating Component
function StarRating({
	rating,
	onRatingChange,
	size = "md",
	interactive = true,
}: {
	rating: number;
	onRatingChange?: (rating: number) => void;
	size?: "sm" | "md" | "lg";
	interactive?: boolean;
}) {
	const [hoverRating, setHoverRating] = React.useState(0);

	const sizeClasses = {
		sm: "text-lg w-6 h-6",
		md: "text-2xl w-8 h-8",
		lg: "text-3xl w-10 h-10",
	};

	const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

	return (
		<div className="space-y-1">
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						onClick={() => interactive && onRatingChange?.(star)}
						onMouseEnter={() => interactive && setHoverRating(star)}
						onMouseLeave={() => setHoverRating(0)}
						disabled={!interactive}
						className={cn(
							"transition-all duration-150 flex items-center justify-center rounded-full",
							sizeClasses[size],
							interactive && "hover:scale-125 cursor-pointer",
							!interactive && "cursor-default",
							(hoverRating || rating) >= star
								? "text-blue-500"
								: "text-slate-300"
						)}
						aria-label={`Rate ${star} out of 5`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
							stroke="currentColor"
							strokeWidth={1.5}
							className="w-full h-full"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
							/>
						</svg>
					</button>
				))}
			</div>
			{interactive && (hoverRating > 0 || rating > 0) && (
				<div className="text-xs text-blue-500 font-medium">
					{ratingLabels[hoverRating || rating]}
				</div>
			)}
		</div>
	);
}

// Feedback Form Component
function FeedbackForm({ onSubmit }: { onSubmit: (type: FeedbackData["feedbackType"], rating: number, comments: string) => void }) {
	const [feedbackType, setFeedbackType] = React.useState<FeedbackData["feedbackType"]>("route_quality");
	const [rating, setRating] = React.useState(0);
	const [comments, setComments] = React.useState("");

	const handleSubmit = () => {
		if (rating > 0) {
			onSubmit(feedbackType, rating, comments);
			setComments("");
			setRating(0);
		}
	};

	return (
		<div className="space-y-3">
			<div>
				<Label className="text-xs font-medium mb-1 block text-slate-300">Feedback Type</Label>
				<select
					value={feedbackType}
					onChange={(e) => setFeedbackType(e.target.value as FeedbackData["feedbackType"])}
					className="w-full p-2 border border-slate-600 rounded text-sm bg-slate-900 text-white"
				>
					<option value="route_quality">Route Quality</option>
					<option value="traffic_accuracy">Traffic Accuracy</option>
					<option value="shortcut_suggestion">Shortcut Suggestion</option>
					<option value="other">Other</option>
				</select>
			</div>

			<div>
				<Label className="text-xs font-medium mb-2 block text-slate-300">Your Rating</Label>
				<StarRating rating={rating} onRatingChange={setRating} size="lg" />
			</div>

			<div>
				<Label className="text-xs font-medium mb-1 block text-slate-300">Comments (Optional)</Label>
				<Textarea
					value={comments}
					onChange={(e) => setComments(e.target.value)}
					placeholder="Share your experience or suggestions to help improve AI predictions..."
					className="text-sm bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
					rows={3}
				/>
			</div>

			<Button
				onClick={handleSubmit}
				disabled={rating === 0}
				className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				size="sm"
			>
				Submit Feedback
			</Button>
		</div>
	);
}

// Training File Upload Component with LLM-based parsing
function TrainingFileUpload({
	onFileUploaded,
	uploadedFiles,
	onDeleteFile,
}: {
	onFileUploaded: (file: UploadedTrainingFile, usedLLM: boolean) => void;
	uploadedFiles: UploadedTrainingFile[];
	onDeleteFile: (fileId: string) => void;
}) {
	const [isUploading, setIsUploading] = React.useState(false);
	const [isLLMProcessing, setIsLLMProcessing] = React.useState(false);
	const [uploadError, setUploadError] = React.useState<string | null>(null);
	const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
	const [llmStatus, setLlmStatus] = React.useState<string | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);
		setUploadSuccess(null);
		setLlmStatus(null);

		try {
			const content = await file.text();
			let parsedData: TrainingData[] = [];
			let usedLLM = false;

			// First, try standard parsing for CSV and JSON
			if (file.name.endsWith('.csv')) {
				try {
					parsedData = parseCSVToTrainingData(content);
				} catch {
					// Standard parsing failed, will try LLM
				}
			} else if (file.name.endsWith('.json')) {
				try {
					parsedData = parseJSONToTrainingData(content);
				} catch {
					// Standard parsing failed, will try LLM
				}
			}

			// If standard parsing failed or returned no data, use LLM
			if (parsedData.length === 0) {
				setIsLLMProcessing(true);
				setLlmStatus('AI is interpreting file structure...');

				const llmResult = await parseUnstructuredTrainingData(content, file.name);

				setIsLLMProcessing(false);

				if (llmResult.success && llmResult.data.length > 0) {
					// Convert LLM parsed data to TrainingData format
					parsedData = llmResult.data.map((item, idx) => ({
						id: `llm_${Date.now()}_${idx}`,
						route: item.route,
						predictedTime: item.predictedTime,
						actualTime: item.actualTime,
						trafficLevel: item.trafficLevel,
						timestamp: new Date(),
						accuracy: Math.max(0, Math.min(100,
							100 - Math.abs((item.predictedTime - item.actualTime) / item.actualTime * 100)
						)),
					}));
					usedLLM = true;
					setLlmStatus('AI successfully interpreted the file');
				} else {
					throw new Error(llmResult.error || 'AI could not interpret the file format. Please check the data structure.');
				}
			}

			if (parsedData.length === 0) {
				throw new Error('No valid training data found in the file.');
			}

			const uploadedFile: UploadedTrainingFile = {
				id: `file_${Date.now()}`,
				fileName: file.name,
				uploadedAt: new Date(),
				data: parsedData,
				rawContent: content,
			};

			onFileUploaded(uploadedFile, usedLLM);
			setUploadSuccess(
				usedLLM
					? `AI interpreted and loaded ${parsedData.length} training records from ${file.name}`
					: `Successfully loaded ${parsedData.length} training records from ${file.name}`
			);

			// Clear the input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : 'Failed to parse file');
			setLlmStatus(null);
		} finally {
			setIsUploading(false);
			setIsLLMProcessing(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-800/20 hover:bg-slate-800/30 transition-colors">
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,.json,.txt,.log,.xlsx,.xls"
					onChange={handleFileSelect}
					className="hidden"
					id="training-file-input"
					disabled={isUploading || isLLMProcessing}
				/>
				<label
					htmlFor="training-file-input"
					className={cn(
						"cursor-pointer flex flex-col items-center gap-2",
						(isUploading || isLLMProcessing) && "opacity-50 cursor-not-allowed"
					)}
				>
					{isLLMProcessing ? (
						<>
							<Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
							<div className="text-sm text-center">
								<span className="font-medium text-blue-400">AI Processing...</span>
								<div className="text-xs text-slate-400 mt-1">{llmStatus}</div>
							</div>
						</>
					) : (
						<>
							<Upload className={cn("h-8 w-8", isUploading ? "animate-pulse text-blue-400" : "text-blue-500")} />
							<div className="text-sm text-center">
								<span className="font-medium text-blue-400">Click to upload training file</span>
								<div className="text-xs text-slate-400 mt-1">Any format - AI will interpret it</div>
							</div>
						</>
					)}
				</label>
			</div>

			{/* LLM Processing Indicator */}
			{isLLMProcessing && (
				<Alert className="bg-slate-800/30 border-slate-600">
					<Sparkles className="h-4 w-4 text-blue-400" />
					<AlertDescription className="text-blue-300 text-sm ml-2">
						{llmStatus || 'AI is analyzing the file...'}
					</AlertDescription>
				</Alert>
			)}

			{uploadError && (
				<Alert className="bg-red-900/30 border-red-700">
					<AlertTriangle className="h-4 w-4 text-red-400" />
					<AlertDescription className="text-red-300 text-sm ml-2">{uploadError}</AlertDescription>
				</Alert>
			)}

			{uploadSuccess && (
				<Alert className="bg-green-900/30 border-green-700">
					<AlertDescription className="text-green-300 text-sm">{uploadSuccess}</AlertDescription>
				</Alert>
			)}

			{/* Uploaded Files List */}
			{uploadedFiles.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
						<FileText className="h-4 w-4 text-blue-400" />
						Uploaded Training Files
					</h4>
					<ScrollArea className="h-32">
						<div className="space-y-2">
							{uploadedFiles.map((file) => (
								<div
									key={file.id}
									className="p-2 bg-slate-800/30 rounded border border-slate-600 flex items-center justify-between"
								>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-blue-300 truncate flex items-center gap-1">
											{file.fileName}
											{file.id.startsWith('file_') && file.data.some(d => d.id.startsWith('llm_')) && (
												<span title="AI interpreted">
													<Sparkles className="h-3 w-3 text-blue-400" />
												</span>
											)}
										</div>
										<div className="text-xs text-slate-400">
											{file.data.length} records • {file.uploadedAt.toLocaleString()}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDeleteFile(file.id)}
										className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			)}

			{/* AI-Powered Info */}
			<div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-800 rounded-lg text-xs border border-slate-600">
				<div className="font-medium text-blue-300 mb-2 flex items-center gap-2">
					<Sparkles className="h-4 w-4" />
					AI-Powered File Parsing
				</div>
				<div className="text-slate-400 space-y-1">
					<div>Upload any file format - our AI will interpret it automatically</div>
					<div className="text-blue-400">Supports: CSV, JSON, TXT, logs, and more</div>
				</div>
			</div>
		</div>
	);
}

// Training Data Editor Component - for viewing and editing training data
function TrainingDataEditor({
	trainingData,
	onUpdateData,
	onDeleteData,
}: {
	trainingData: TrainingData[];
	onUpdateData: (id: string, data: Partial<TrainingData>) => void;
	onDeleteData: (id: string) => void;
}) {
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<Partial<TrainingData>>({});

	const startEditing = (data: TrainingData) => {
		setEditingId(data.id);
		setEditForm({
			route: data.route,
			predictedTime: data.predictedTime,
			actualTime: data.actualTime,
			trafficLevel: data.trafficLevel,
		});
	};

	const saveEdit = () => {
		if (editingId && editForm.predictedTime && editForm.actualTime) {
			const accuracy = 100 - Math.abs((editForm.predictedTime - editForm.actualTime) / editForm.actualTime * 100);
			onUpdateData(editingId, {
				...editForm,
				accuracy: Math.max(0, Math.min(100, accuracy)),
			});
			setEditingId(null);
			setEditForm({});
		}
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditForm({});
	};

	if (trainingData.length === 0) {
		return (
			<div className="text-sm text-slate-400 text-center py-8">
				No training data available. Upload a file or add data manually.
			</div>
		);
	}

	return (
		<ScrollArea className="h-64">
			<div className="space-y-2">
				{trainingData.map((data) => (
					<div key={data.id} className="p-3 bg-slate-800/30 rounded border border-slate-600">
						{editingId === data.id ? (
							// Edit mode
							<div className="space-y-2">
								<Input
									value={editForm.route || ''}
									onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
									placeholder="Route name"
									className="text-sm bg-slate-800 border-slate-600 text-white"
								/>
								<div className="grid grid-cols-2 gap-2">
									<Input
										type="number"
										value={editForm.predictedTime || ''}
										onChange={(e) => setEditForm({ ...editForm, predictedTime: parseFloat(e.target.value) })}
										placeholder="Predicted (min)"
										className="text-sm bg-slate-800 border-slate-600 text-white"
									/>
									<Input
										type="number"
										value={editForm.actualTime || ''}
										onChange={(e) => setEditForm({ ...editForm, actualTime: parseFloat(e.target.value) })}
										placeholder="Actual (min)"
										className="text-sm bg-slate-800 border-slate-600 text-white"
									/>
								</div>
								<select
									value={editForm.trafficLevel || 'moderate'}
									onChange={(e) => setEditForm({ ...editForm, trafficLevel: e.target.value })}
									className="w-full p-2 border border-slate-600 rounded text-sm bg-slate-800 text-white"
								>
									<option value="low">Low</option>
									<option value="moderate">Moderate</option>
									<option value="high">High</option>
								</select>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={saveEdit}
										className="flex-1 bg-green-600 hover:bg-green-700 text-white"
									>
										<Save className="h-3 w-3 mr-1" />
										Save
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={cancelEdit}
										className="flex-1 border-slate-500 text-slate-300"
									>
										<X className="h-3 w-3 mr-1" />
										Cancel
									</Button>
								</div>
							</div>
						) : (
							// View mode
							<div>
								<div className="flex items-start justify-between">
									<div className="font-medium text-blue-300">{data.route}</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => startEditing(data)}
											className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-slate-700/50"
										>
											<Edit3 className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDeleteData(data.id)}
											className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-2 mt-1 text-xs text-slate-400">
									<div>Pred: {data.predictedTime}m</div>
									<div>Actual: {data.actualTime}m</div>
									<div className={cn(
										"font-semibold",
										data.accuracy >= 90 ? "text-green-400" :
										data.accuracy >= 70 ? "text-yellow-400" : "text-red-400"
									)}>
										{data.accuracy.toFixed(1)}%
									</div>
								</div>
								<div className="text-slate-500 text-xs mt-1">
									Traffic: {data.trafficLevel} • {data.timestamp.toLocaleString()}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</ScrollArea>
	);
}

// AI Training Window Component
function AITrainingWindow({
	trainingData,
	onAddTrainingData,
	uploadedFiles,
	onFileUploaded,
	onDeleteFile,
	onUpdateData,
	onDeleteData,
}: {
	trainingData: TrainingData[];
	onAddTrainingData: (data: Omit<TrainingData, 'id' | 'timestamp'>) => void;
	uploadedFiles: UploadedTrainingFile[];
	onFileUploaded: (file: UploadedTrainingFile, usedLLM: boolean) => void;
	onDeleteFile: (fileId: string) => void;
	onUpdateData: (id: string, data: Partial<TrainingData>) => void;
	onDeleteData: (id: string) => void;
}) {
	const [route, setRoute] = React.useState("");
	const [predictedTime, setPredictedTime] = React.useState("");
	const [actualTime, setActualTime] = React.useState("");
	const [trafficLevel, setTrafficLevel] = React.useState("moderate");

	const handleSubmit = () => {
		if (route && predictedTime && actualTime) {
			const predicted = parseFloat(predictedTime);
			const actual = parseFloat(actualTime);
			const accuracy = 100 - Math.abs((predicted - actual) / actual * 100);

			onAddTrainingData({
				route,
				predictedTime: predicted,
				actualTime: actual,
				trafficLevel,
				accuracy: Math.max(0, Math.min(100, accuracy))
			});

			setRoute("");
			setPredictedTime("");
			setActualTime("");
			setTrafficLevel("moderate");
		}
	};

	const avgAccuracy = trainingData.length > 0
		? (trainingData.reduce((sum, d) => sum + d.accuracy, 0) / trainingData.length).toFixed(1)
		: "N/A";

	return (
		<div className="space-y-4">
			{/* Model Performance Summary */}
			<div className="p-4 bg-gradient-to-r from-slate-800/80 to-slate-800 rounded-lg border border-slate-600">
				<div className="flex items-center gap-2 mb-2">
					<Brain className="h-5 w-5 text-blue-400" />
					<h4 className="font-semibold text-sm text-white">Model Performance</h4>
				</div>
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div>
						<div className="text-xs text-slate-400">Training Samples</div>
						<div className="text-lg font-bold text-blue-400">{trainingData.length}</div>
					</div>
					<div>
						<div className="text-xs text-slate-400">Avg Accuracy</div>
						<div className="text-lg font-bold text-blue-300">{avgAccuracy}%</div>
					</div>
					<div>
						<div className="text-xs text-slate-400">Files Uploaded</div>
						<div className="text-lg font-bold text-blue-300">{uploadedFiles.length}</div>
					</div>
				</div>
			</div>

			{/* Tabbed Interface for Training Data Management */}
			<Tabs defaultValue="upload" className="w-full">
				<TabsList className="grid w-full grid-cols-3 bg-slate-800">
					<TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
						<Upload className="h-3 w-3 mr-1" />
						Upload
					</TabsTrigger>
					<TabsTrigger value="manual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
						<Edit3 className="h-3 w-3 mr-1" />
						Manual
					</TabsTrigger>
					<TabsTrigger value="data" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs">
						<FileText className="h-3 w-3 mr-1" />
						Data
					</TabsTrigger>
				</TabsList>

				{/* File Upload Tab */}
				<TabsContent value="upload" className="mt-4">
					<TrainingFileUpload
						onFileUploaded={onFileUploaded}
						uploadedFiles={uploadedFiles}
						onDeleteFile={onDeleteFile}
					/>
				</TabsContent>

				{/* Manual Entry Tab */}
				<TabsContent value="manual" className="mt-4">
					<div className="space-y-3">
						<div>
							<Label className="text-xs text-slate-400">Route Name</Label>
							<Input
								value={route}
								onChange={(e) => setRoute(e.target.value)}
								placeholder="e.g., Mumbai to Pune"
								className="text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
							/>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div>
								<Label className="text-xs text-slate-400">Predicted (min)</Label>
								<Input
									type="number"
									value={predictedTime}
									onChange={(e) => setPredictedTime(e.target.value)}
									placeholder="120"
									className="text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
								/>
							</div>
							<div>
								<Label className="text-xs text-slate-400">Actual (min)</Label>
								<Input
									type="number"
									value={actualTime}
									onChange={(e) => setActualTime(e.target.value)}
									placeholder="115"
									className="text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
								/>
							</div>
						</div>

						<div>
							<Label className="text-xs text-slate-400">Traffic Level</Label>
							<select
								value={trafficLevel}
								onChange={(e) => setTrafficLevel(e.target.value)}
								className="w-full p-2 border border-slate-600 rounded text-sm bg-slate-800 text-white"
							>
								<option value="low">Low</option>
								<option value="moderate">Moderate</option>
								<option value="high">High</option>
							</select>
						</div>

						<Button
							onClick={handleSubmit}
							disabled={!route || !predictedTime || !actualTime}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
							size="sm"
						>
							Add Training Sample
						</Button>
					</div>
				</TabsContent>

				{/* Training Data View/Edit Tab */}
				<TabsContent value="data" className="mt-4">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-semibold text-slate-300">All Training Data</h4>
							<Badge variant="outline" className="text-xs border-blue-600 text-blue-400">
								{trainingData.length} records
							</Badge>
						</div>
						<TrainingDataEditor
							trainingData={trainingData}
							onUpdateData={onUpdateData}
							onDeleteData={onDeleteData}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function TrafficOptimizer() {
	// Load persisted session state on mount
	const sessionState = React.useMemo(() => loadSessionState(), []);

	const [origin, setOrigin] = useState<Location | null>(sessionState.origin ?? null);
	const [destination, setDestination] = useState<Location | null>(sessionState.destination ?? null);
	const [originInput, setOriginInput] = useState(sessionState.originInput ?? "");
	const [destinationInput, setDestinationInput] = useState(sessionState.destinationInput ?? "");
	const [originSuggestions, setOriginSuggestions] = useState<Location[]>([]);
	const [destinationSuggestions, setDestinationSuggestions] = useState<Location[]>([]);
	const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
	const [isSearchingDestination, setIsSearchingDestination] = useState(false);
	const [route, setRoute] = useState<RouteData | null>(sessionState.route ?? null);
	const [aiShortcutRoute, setAiShortcutRoute] = useState<RouteData | null>(null);
	const [displayedRouteType, setDisplayedRouteType] = useState<'main' | 'shortcut'>('main');
	const [departureTimes, setDepartureTimes] = useState<DepartureTime[]>([]);
	const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]); // India center
	const [searchHistory, setSearchHistory] = useState<any[]>([]);
	const [frequentRoutes, setFrequentRoutes] = useState<any[]>([]);
	const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
	const [showShortcutComparison, setShowShortcutComparison] = useState(false);
	const [lastInsightsRefresh, setLastInsightsRefresh] = useState<Date>(new Date());
	const [transportMode, setTransportMode] = useState<TransportMode>(sessionState.transportMode ?? "driving");

	// Track traveled path for live navigation polyline
	const [traveledPath, setTraveledPath] = useState<[number, number][]>([]);
	const [trainingData, setTrainingData] = useState<TrainingData[]>(() => loadTrainingDataFromStorage());
	const [uploadedFiles, setUploadedFiles] = useState<UploadedTrainingFile[]>(() => loadTrainingFilesFromStorage());
	// LLM optimization state - works behind the scenes, only visible in developer mode
	const [llmOptimization, setLlmOptimization] = useState<RouteOptimizationResult | null>(null);
	const [isLLMOptimizing, setIsLLMOptimizing] = useState(false);
	const [llmOptimizationError, setLlmOptimizationError] = useState<string | null>(null);

	// User store state (replaces IP geolocation)
	const userState = useUserStore();
	const [currentCity, setCurrentCity] = useState<{ name: string; lat: number; lng: number } | null>(null);

	// AI Thinking/Searching state (visible in dev mode)
	const [aiThinkingSteps, setAiThinkingSteps] = useState<AIThinkingStep[]>([]);
	const [routeHistorySearch, setRouteHistorySearch] = useState<RouteHistorySearchResult | null>(null);
	const [isSearchingHistory, setIsSearchingHistory] = useState(false);
	const [routeTrafficData, setRouteTrafficData] = useState<RouteTrafficSearchResult | null>(null);
	const [isFetchingTrafficData, setIsFetchingTrafficData] = useState(false);

	// Live Navigation state
	const [isNavigating, setIsNavigating] = useState(false);
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [voiceEnabled, setVoiceEnabled] = useState(true);
	const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
	const [locationBlockedByIframe, setLocationBlockedByIframe] = useState(false);
	const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
	const [mainTab, setMainTab] = useState<'plan' | 'navigate'>('plan');
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [isRequestingLocation, setIsRequestingLocation] = useState(false);

	// Route Prediction BETA state
	const [showPredictionPanel, setShowPredictionPanel] = useState(false);
	const [predictionResult, setPredictionResult] = useState<RoutePredictionResult | null>(null);
	const [isPredicting, setIsPredicting] = useState(false);
	const [predictionDate, setPredictionDate] = useState<'tomorrow' | 'day_after' | 'custom'>('tomorrow');
	const [customPredictionDate, setCustomPredictionDate] = useState<string>('');
	const [predictionTimeSlot, setPredictionTimeSlot] = useState<'any' | 'morning' | 'afternoon' | 'evening' | 'custom'>('any');
	const [customTimeStart, setCustomTimeStart] = useState<number>(8);
	const [customTimeEnd, setCustomTimeEnd] = useState<number>(18);

	const originSearchTimeout = React.useRef<NodeJS.Timeout | null>(null);
	const destinationSearchTimeout = React.useRef<NodeJS.Timeout | null>(null);
	const watchIdRef = React.useRef<number | null>(null);
	const lastSpokenStepRef = React.useRef<number>(-1);

	// Load search history and frequent routes
	useEffect(() => {
		loadHistory();
	}, []);

	// Restore map center from session state on mount
	useEffect(() => {
		if (sessionState.origin) {
			setMapCenter([sessionState.origin.lat, sessionState.origin.lng]);
		}
	}, [sessionState.origin]);

	// Persist session state when relevant values change
	useEffect(() => {
		saveSessionState({
			origin,
			destination,
			originInput,
			destinationInput,
			transportMode,
			route,
		});
	}, [origin, destination, originInput, destinationInput, transportMode, route]);

	// Request location permission on app start - IMPORTANT
	// This effect checks permission state and fetches location if already granted
	useEffect(() => {
		const checkAndInitLocation = async () => {
			if (!navigator.geolocation) {
				console.log('[GPS Init] Geolocation not supported');
				setLocationPermission('denied');
				return;
			}

			// Always try to get the current position first - this is the most reliable way
			// to determine if we actually have permission
			console.log('[GPS Init] Attempting to get current position...');
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// Success! We have permission
					const { latitude, longitude } = position.coords;
					console.log('[GPS Init] SUCCESS - Got position:', latitude, longitude);
					setLocationPermission('granted');
					setUserLocation({ lat: latitude, lng: longitude });
					setMapCenter([latitude, longitude]);
				},
				(err) => {
					// GeolocationPositionError codes:
					// 1 = PERMISSION_DENIED - User denied the request
					// 2 = POSITION_UNAVAILABLE - Location info unavailable
					// 3 = TIMEOUT - Request took too long
					console.log('[GPS Init] getCurrentPosition failed - code:', err.code, 'message:', err.message);

					// Only code 1 (PERMISSION_DENIED) means actually denied
					// Codes 2 and 3 mean we might have permission but couldn't get position
					if (err.code === 1) {
						console.log('[GPS Init] Permission DENIED by user');
						setLocationPermission('denied');
					} else {
						// Position unavailable or timeout - keep as prompt so user can retry
						console.log('[GPS Init] Position error (not denied) - keeping as prompt');
						setLocationPermission('prompt');
					}
				},
				{ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
			);

			// Also set up a listener for permission changes via Permissions API
			try {
				const permission = await navigator.permissions.query({ name: 'geolocation' });
				console.log('[GPS Init] Permissions API state:', permission.state);

				permission.addEventListener('change', () => {
					console.log('[GPS Init] Permission state changed to:', permission.state);
					if (permission.state === 'granted') {
						setLocationPermission('granted');
						// Try to get position again
						navigator.geolocation.getCurrentPosition(
							(position) => {
								setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
								setMapCenter([position.coords.latitude, position.coords.longitude]);
							},
							() => {},
							{ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
						);
					} else if (permission.state === 'denied') {
						setLocationPermission('denied');
					}
				});
			} catch {
				console.log('[GPS Init] Permissions API not supported');
			}
		};

		checkAndInitLocation();
	}, []);

	// Auto-set origin to current GPS location when location is available and no origin is set
	useEffect(() => {
		const autoSetOriginFromGPS = async () => {
			// Only auto-set if:
			// 1. We have user location
			// 2. No origin is currently set (neither from session nor user input)
			// 3. Location permission is granted
			if (userLocation && !origin && locationPermission === 'granted') {
				console.log('[Auto Origin] Setting origin from GPS location:', userLocation);

				// Reverse geocode to get a proper address
				const locationData = await reverseGeocode(userLocation.lat, userLocation.lng);

				if (locationData) {
					setOrigin(locationData);
					setOriginInput(locationData.name);
					console.log('[Auto Origin] Origin set to:', locationData.name);
				} else {
					// Fallback if reverse geocoding fails
					const fallbackLocation: Location = {
						name: 'Current Location',
						displayName: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
						lat: userLocation.lat,
						lng: userLocation.lng,
						placeType: 'gps',
					};
					setOrigin(fallbackLocation);
					setOriginInput('Current Location');
					console.log('[Auto Origin] Using fallback location');
				}
			}
		};

		autoSetOriginFromGPS();
	}, [userLocation, origin, locationPermission]);

	// Load user's city from settings on mount
	useEffect(() => {
		const city = INDIAN_CITIES.find(c => c.name === userState.settings.defaultCity);
		if (city) {
			setCurrentCity({ name: city.name, lat: city.lat, lng: city.lng });
			setMapCenter([city.lat, city.lng]);
		}
	}, [userState.settings.defaultCity]);

	// Save training data to localStorage whenever it changes
	useEffect(() => {
		saveTrainingDataToStorage(trainingData);
	}, [trainingData]);

	// Save uploaded files to localStorage whenever they change
	useEffect(() => {
		saveTrainingFilesToStorage(uploadedFiles);
	}, [uploadedFiles]);

	// Calculate distance between two points using Haversine formula
	const calculateDistanceBetweenPoints = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
		const R = 6371000; // Earth's radius in meters
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLng = ((lng2 - lng1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) * Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}, []);

	// Request location permission and start tracking
	// This function ALWAYS calls getCurrentPosition to ensure browser dialog appears
	const requestLocationPermission = useCallback(async (): Promise<boolean> => {
		// Check if geolocation is supported
		if (!navigator.geolocation) {
			console.error('[GPS] Geolocation API not supported in this browser');
			setLocationPermission('denied');
			return false;
		}

		// Check if running in secure context (HTTPS required for geolocation)
		if (typeof window !== 'undefined' && window.isSecureContext === false) {
			console.error('[GPS] Geolocation requires HTTPS (secure context)');
			setLocationPermission('denied');
			return false;
		}

		setIsRequestingLocation(true);
		console.log('[GPS Request] Starting location request...');
		console.log('[GPS Request] Secure context:', window.isSecureContext);
		console.log('[GPS Request] Protocol:', window.location.protocol);

		// Use the Geolocation API directly - this is the standard approach
		// navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
		return new Promise((resolve) => {
			const successCallback: PositionCallback = (position: GeolocationPosition) => {
				// Success! Browser granted permission and we have coordinates
				const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
				console.log('[GPS Request] SUCCESS - Position received:');
				console.log('[GPS Request]   Latitude:', latitude);
				console.log('[GPS Request]   Longitude:', longitude);
				console.log('[GPS Request]   Accuracy:', accuracy, 'meters');
				console.log('[GPS Request]   Altitude:', altitude);
				console.log('[GPS Request]   Heading:', heading);
				console.log('[GPS Request]   Speed:', speed);

				setLocationPermission('granted');
				setUserLocation({ lat: latitude, lng: longitude });
				setMapCenter([latitude, longitude]);
				setIsRequestingLocation(false);
				resolve(true);
			};

			const errorCallback: PositionErrorCallback = (error: GeolocationPositionError) => {
				// Handle geolocation errors
				// Error codes (from MDN):
				// 1 = PERMISSION_DENIED - User denied the request OR blocked by permissions policy
				// 2 = POSITION_UNAVAILABLE - Location information unavailable
				// 3 = TIMEOUT - Request timed out
				console.error('[GPS Request] ERROR - Code:', error.code, 'Message:', error.message);

				// Check if the error is due to Permissions Policy (iframe restriction)
				// This occurs when the app is embedded in an iframe without allow="geolocation"
				const isPermissionsPolicyError = error.message.toLowerCase().includes('permissions policy') ||
					error.message.toLowerCase().includes('permission policy') ||
					error.message.toLowerCase().includes('feature policy');

				if (isPermissionsPolicyError) {
					console.log('[GPS Request] BLOCKED by Permissions Policy (iframe restriction)');
					console.log('[GPS Request] The parent page must add allow="geolocation" to the iframe');
					setLocationBlockedByIframe(true);
					setLocationPermission('denied');
				} else {
					switch (error.code) {
						case 1: // PERMISSION_DENIED
							console.log('[GPS Request] User DENIED location permission');
							setLocationBlockedByIframe(false);
							setLocationPermission('denied');
							break;
						case 2: // POSITION_UNAVAILABLE
							console.log('[GPS Request] Position unavailable (GPS/network issue) - can retry');
							// Keep as prompt so user can retry
							break;
						case 3: // TIMEOUT
							console.log('[GPS Request] Request timed out - can retry');
							// Keep as prompt so user can retry
							break;
						default:
							console.log('[GPS Request] Unknown error code:', error.code);
					}
				}

				setIsRequestingLocation(false);
				resolve(false);
			};

			// Geolocation options
			const options: PositionOptions = {
				enableHighAccuracy: true, // Request GPS-level accuracy
				timeout: 30000, // 30 seconds - give user time to respond to permission dialog
				maximumAge: 0, // Don't use cached position, get fresh location
			};

			// Call the Geolocation API
			// This will trigger the browser's permission dialog if permission hasn't been granted
			console.log('[GPS Request] Calling navigator.geolocation.getCurrentPosition()...');
			navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
		});
	}, []);

	// Start live navigation
	const startNavigation = useCallback(async () => {
		if (!route || !route.directionSteps) return;

		const hasPermission = await requestLocationPermission();
		if (!hasPermission) {
			return;
		}

		setIsNavigating(true);
		setCurrentStepIndex(0);
		lastSpokenStepRef.current = -1;

		// Clear traveled path when starting new navigation
		setTraveledPath([]);

		// Announce the start
		if (voiceEnabled && route.directionSteps.length > 0) {
			const totalDistance = route.distance >= 1
				? `${route.distance.toFixed(1)} kilometers`
				: `${Math.round(route.distance * 1000)} meters`;
			voiceNavigator.speak(
				`Starting navigation. Your route is ${totalDistance} long. ${route.directionSteps[0].shortInstruction}`,
				true
			);
			lastSpokenStepRef.current = 0;
		}

		// Start watching position
		watchIdRef.current = navigator.geolocation.watchPosition(
			(position) => {
				const newLat = position.coords.latitude;
				const newLng = position.coords.longitude;

				setUserLocation({
					lat: newLat,
					lng: newLng,
				});
				setLocationPermission('granted');

				// Add to traveled path for polyline tracking
				setTraveledPath((prev) => {
					// Only add point if it's significantly different from the last point (> 5 meters)
					if (prev.length === 0) {
						return [[newLat, newLng]];
					}

					const lastPoint = prev[prev.length - 1];
					const distance = Math.sqrt(
						Math.pow(newLat - lastPoint[0], 2) + Math.pow(newLng - lastPoint[1], 2)
					) * 111000; // Rough conversion to meters

					if (distance > 5) {
						return [...prev, [newLat, newLng]];
					}
					return prev;
				});
			},
			(error) => {
				console.error('Geolocation error:', error);
				if (error.code === error.PERMISSION_DENIED) {
					setLocationPermission('denied');
					setIsNavigating(false);
				}
			},
			{
				enableHighAccuracy: true,
				maximumAge: 5000,
				timeout: 10000,
			}
		);
	}, [route, voiceEnabled, requestLocationPermission]);

	// Stop live navigation
	const stopNavigation = useCallback(() => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		setIsNavigating(false);
		setCurrentStepIndex(0);
		voiceNavigator.stop();
		lastSpokenStepRef.current = -1;
	}, []);

	// Enable location tracking from settings
	const enableLocationTracking = useCallback(async () => {
		if (!navigator.geolocation) {
			setLocationPermission('denied');
			return;
		}

		setIsRequestingLocation(true);

		try {
			// Request actual position to trigger browser permission prompt
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLocationPermission('granted');
					setUserLocation({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					});
					setIsRequestingLocation(false);
				},
				(error) => {
					console.error('Location error:', error);
					if (error.code === error.PERMISSION_DENIED) {
						setLocationPermission('denied');
					}
					setIsRequestingLocation(false);
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				}
			);
		} catch (error) {
			console.error('Location error:', error);
			setIsRequestingLocation(false);
		}
	}, []);

	// Disable location tracking
	const disableLocationTracking = useCallback(() => {
		if (watchIdRef.current !== null) {
			navigator.geolocation.clearWatch(watchIdRef.current);
			watchIdRef.current = null;
		}
		setUserLocation(null);
		// Note: We can't programmatically revoke permission, so we just stop tracking
		// The permission state remains as browser remembers it
	}, []);

	// Check location permission status on mount
	useEffect(() => {
		if (navigator.permissions) {
			navigator.permissions.query({ name: 'geolocation' }).then((result) => {
				setLocationPermission(result.state);
				// Listen for permission changes
				result.onchange = () => {
					setLocationPermission(result.state);
					if (result.state === 'denied') {
						disableLocationTracking();
					}
				};
			}).catch(() => {
				// Some browsers don't support this
			});
		}
	}, [disableLocationTracking]);

	// Effect to update navigation based on user location
	useEffect(() => {
		if (!isNavigating || !userLocation || !route?.directionSteps) return;

		const steps = route.directionSteps;
		if (currentStepIndex >= steps.length - 1) {
			// Arrived at destination
			if (voiceEnabled && lastSpokenStepRef.current !== steps.length - 1) {
				voiceNavigator.speak("You have arrived at your destination.", true);
				lastSpokenStepRef.current = steps.length - 1;
			}
			return;
		}

		const currentStep = steps[currentStepIndex];
		const nextStep = steps[currentStepIndex + 1];

		// Calculate distance to the current step's coordinate
		const distanceToStep = calculateDistanceBetweenPoints(
			userLocation.lat,
			userLocation.lng,
			currentStep.coordinates[0],
			currentStep.coordinates[1]
		);

		// Calculate distance to next step
		const distanceToNext = calculateDistanceBetweenPoints(
			userLocation.lat,
			userLocation.lng,
			nextStep.coordinates[0],
			nextStep.coordinates[1]
		);

		setDistanceToNextStep(distanceToNext);

		// Check if user has reached the current step (within 30 meters)
		// or is closer to the next step than the current step
		const hasReachedStep = distanceToStep < 30 || distanceToNext < distanceToStep;

		if (hasReachedStep && currentStepIndex < steps.length - 1) {
			const newIndex = currentStepIndex + 1;
			setCurrentStepIndex(newIndex);

			// Announce the next step
			if (voiceEnabled && lastSpokenStepRef.current !== newIndex) {
				const stepToAnnounce = steps[newIndex];
				let announcement = stepToAnnounce.shortInstruction;

				// Add distance info for non-arrival steps
				if (stepToAnnounce.distance > 0) {
					const distText = stepToAnnounce.distance >= 1000
						? `for ${(stepToAnnounce.distance / 1000).toFixed(1)} kilometers`
						: `for ${Math.round(stepToAnnounce.distance)} meters`;
					announcement += ` ${distText}`;
				}

				voiceNavigator.speak(announcement, true);
				lastSpokenStepRef.current = newIndex;
			}
		}

		// Announce upcoming turns when close
		if (distanceToNext <= 100 && distanceToNext > 30 && voiceEnabled) {
			const upcomingStep = steps[currentStepIndex + 1];
			if (upcomingStep.icon !== 'straight' && upcomingStep.icon !== 'start' && upcomingStep.icon !== 'continue') {
				// Only announce approaching turn once
				const approachKey = currentStepIndex + 0.5;
				if (lastSpokenStepRef.current !== approachKey) {
					voiceNavigator.speak(`In ${Math.round(distanceToNext)} meters, ${upcomingStep.shortInstruction}`, false);
					lastSpokenStepRef.current = approachKey;
				}
			}
		}
	}, [isNavigating, userLocation, route, currentStepIndex, voiceEnabled, calculateDistanceBetweenPoints]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			voiceNavigator.stop();
		};
	}, []);

	const loadHistory = async () => {
		try {
			const searchHistoryORM = SearchHistoryORM.getInstance();
			const [historyItems] = await searchHistoryORM.listSearchHistory(
				undefined,
				{ orders: [{ field: "create_time", symbol: Direction.descending }] },
				{ number: 1, size: 10 }
			);
			setSearchHistory(historyItems);

			const frequentRoutesORM = FrequentRoutesORM.getInstance();
			const [routeItems] = await frequentRoutesORM.listFrequentRoutes(
				undefined,
				{ orders: [{ field: "frequency_count", symbol: Direction.descending }] },
				{ number: 1, size: 5 }
			);
			setFrequentRoutes(routeItems);

			// If ORM returned empty, try localStorage fallback
			if (historyItems.length === 0 && routeItems.length === 0) {
				const localHistory = loadLocalRouteHistory();
				if (localHistory.searchHistory.length > 0) {
					setSearchHistory(localHistory.searchHistory);
				}
				if (localHistory.frequentRoutes.length > 0) {
					setFrequentRoutes(localHistory.frequentRoutes);
				}
			}
		} catch (error) {
			console.error("Failed to load history from ORM:", error);
			// Fallback to localStorage
			const localHistory = loadLocalRouteHistory();
			setSearchHistory(localHistory.searchHistory);
			setFrequentRoutes(localHistory.frequentRoutes);
		}
	};

	const handleOriginSearch = (value: string) => {
		setOriginInput(value);

		// Clear existing timeout
		if (originSearchTimeout.current) {
			clearTimeout(originSearchTimeout.current);
		}

		if (value.length > 2) {
			setIsSearchingOrigin(true);
			// Debounce search by 500ms
			originSearchTimeout.current = setTimeout(async () => {
				const results = await searchLocation(value);
				setOriginSuggestions(results);
				setIsSearchingOrigin(false);
			}, 500);
		} else {
			setOriginSuggestions([]);
			setIsSearchingOrigin(false);
		}
	};

	const handleDestinationSearch = (value: string) => {
		setDestinationInput(value);

		// Clear existing timeout
		if (destinationSearchTimeout.current) {
			clearTimeout(destinationSearchTimeout.current);
		}

		if (value.length > 2) {
			setIsSearchingDestination(true);
			// Debounce search by 500ms
			destinationSearchTimeout.current = setTimeout(async () => {
				const results = await searchLocation(value);
				setDestinationSuggestions(results);
				setIsSearchingDestination(false);
			}, 500);
		} else {
			setDestinationSuggestions([]);
			setIsSearchingDestination(false);
		}
	};

	const selectOrigin = (location: Location) => {
		setOrigin(location);
		setOriginInput(location.name);
		setOriginSuggestions([]);
		setMapCenter([location.lat, location.lng]);
	};

	const selectDestination = (location: Location) => {
		setDestination(location);
		setDestinationInput(location.name);
		setDestinationSuggestions([]);
	};

	// Run LLM optimization with user location context for better predictions
	const runLLMOptimization = useCallback(async (orig: Location, dest: Location, routeData: RouteData) => {
		setIsLLMOptimizing(true);
		setLlmOptimizationError(null);
		setAiThinkingSteps([]); // Reset thinking steps

		try {
			// Prepare training data for LLM
			const trainingDataForLLM = trainingData.map(d => ({
				route: d.route,
				predictedTime: d.predictedTime,
				actualTime: d.actualTime,
				trafficLevel: d.trafficLevel,
			}));

			// Prepare historical routes data
			const historicalRoutes = frequentRoutes.map((r: any) => ({
				route: `${r.origin_name} to ${r.destination_name}`,
				avgDuration: Math.round(r.average_travel_time_seconds / 60),
				frequency: r.frequency_count,
			}));

			// Use IP geolocation as fallback if GPS location is not available
			let locationCtx: LocationContext | undefined;

			if (userLocation) {
				// Use GPS location if available
				locationCtx = {
					lat: userLocation.lat,
					lng: userLocation.lng,
					areaName: orig.name,
					nearbyLandmarks: [orig.name, dest.name],
				};
			} else if (currentCity) {
				// Fall back to user's selected city
				locationCtx = {
					lat: currentCity.lat,
					lng: currentCity.lng,
					areaName: currentCity.name,
					nearbyLandmarks: [currentCity.name, orig.name, dest.name],
				};
				console.log("[LLM] Using city from settings for context:", currentCity.name);
			}

			// Get current traffic level based on time
			const currentTraffic = getTrafficLevel(new Date().getHours());

			// Call LLM optimization service with location context
			const result = await optimizeRouteWithLLM(
				orig.name,
				dest.name,
				routeData.distance,
				routeData.duration,
				currentTraffic.level,
				transportMode,
				trainingDataForLLM,
				historicalRoutes,
				locationCtx
			);

			setLlmOptimization(result);
			// Log for debugging (only visible in console)
			console.log("[LLM] Route optimization completed:", result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'LLM optimization failed';
			setLlmOptimizationError(errorMessage);
			console.error("[LLM] Optimization error:", error);
		} finally {
			setIsLLMOptimizing(false);
		}
	}, [trainingData, frequentRoutes, transportMode, userLocation, currentCity]);

	// Search route history with LLM (internal feature with thinking steps)
	const searchRouteHistory = useCallback(async (orig: string, dest: string) => {
		setIsSearchingHistory(true);
		setAiThinkingSteps([]);

		try {
			const trainingDataForLLM = trainingData.map(d => ({
				route: d.route,
				predictedTime: d.predictedTime,
				actualTime: d.actualTime,
				trafficLevel: d.trafficLevel,
			}));

			const historicalRoutes = frequentRoutes.map((r: any) => ({
				route: `${r.origin_name} to ${r.destination_name}`,
				avgDuration: Math.round(r.average_travel_time_seconds / 60),
				frequency: r.frequency_count,
			}));

			const result = await searchRouteHistoryWithLLM(
				orig,
				dest,
				trainingDataForLLM,
				historicalRoutes,
				(step) => {
					// Update thinking steps in real-time
					setAiThinkingSteps(prev => [...prev, step]);
				}
			);

			setRouteHistorySearch(result);
			console.log("[LLM] Route history search completed:", result);
		} catch (error) {
			console.error("[LLM] Route history search error:", error);
		} finally {
			setIsSearchingHistory(false);
		}
	}, [trainingData, frequentRoutes]);

	// Fetch real-time traffic data using LLM analysis
	const fetchRouteTrafficData = useCallback(async (
		originName: string,
		destName: string,
		distance: number
	) => {
		setIsFetchingTrafficData(true);
		setRouteTrafficData(null);

		try {
			console.log("[LLM] Fetching traffic data for route...");

			const result = await fetchAndAnalyzeRouteTrafficData(
				originName,
				destName,
				distance,
				new Date(),
				(step) => {
					// Add to thinking steps in real-time
					setAiThinkingSteps(prev => [...prev, step]);
				}
			);

			setRouteTrafficData(result);
			console.log("[LLM] Traffic data fetch completed:", result);
		} catch (error) {
			console.error("[LLM] Traffic data fetch error:", error);
		} finally {
			setIsFetchingTrafficData(false);
		}
	}, []);

	const calculateRouteAndTraffic = async () => {
		if (!origin || !destination) return;

		// Reset LLM state
		setLlmOptimization(null);
		setLlmOptimizationError(null);
		setRouteTrafficData(null);
		setAiThinkingSteps([]);

		const routeData = await calculateRoute(origin, destination, transportMode);
		setRoute(routeData);

		// Try to calculate AI shortcut route
		const aiRoute = await calculateAIShortcutRoute(origin, destination, transportMode);
		if (aiRoute) {
			// Calculate savings
			aiRoute.shortcutSavings = routeData.duration - aiRoute.duration;
			setAiShortcutRoute(aiRoute);
			setShowShortcutComparison(true);
		} else {
			setAiShortcutRoute(null);
			setShowShortcutComparison(false);
		}

		// Extract city names for AI-enhanced departure time predictions
		const originCity = extractCityFromLocation(origin.name);
		const destCity = extractCityFromLocation(destination.name);

		// Calculate departure times with AI-enhanced India traffic intelligence
		const times = calculateDepartureTimes(
			routeData.duration,
			routeData.distance,
			transportMode,
			undefined, // no target hour
			originCity,
			destCity
		);
		setDepartureTimes(times);

		// Run LLM optimization in the background (works silently, results only visible in developer mode)
		runLLMOptimization(origin, destination, routeData);

		// Fetch real-time traffic data using LLM (runs for all users, visible data in dev mode)
		fetchRouteTrafficData(origin.name, destination.name, routeData.distance);

		// Search route history for training insights (runs in background)
		searchRouteHistory(origin.name, destination.name);

		// Always save to localStorage as fallback
		saveLocalRouteHistory(origin, destination, routeData.duration);

		// Save to database (ORM)
		try {
			const searchHistoryORM = SearchHistoryORM.getInstance();
			const frequentRoutesORM = FrequentRoutesORM.getInstance();

			// Save search history
			await searchHistoryORM.insertSearchHistory([{
				origin_name: origin.name,
				origin_lat: origin.lat,
				origin_lng: origin.lng,
				destination_name: destination.name,
				destination_lat: destination.lat,
				destination_lng: destination.lng,
			} as any]);

			// Update or create frequent route
			const existingRoute = frequentRoutes.find(
				(r) =>
					r.origin_name === origin.name &&
					r.destination_name === destination.name
			);

			if (existingRoute) {
				await frequentRoutesORM.setFrequentRoutesById(existingRoute.id, {
					...existingRoute,
					frequency_count: existingRoute.frequency_count + 1,
					average_travel_time_seconds: routeData.duration * 60,
				});
			} else {
				await frequentRoutesORM.insertFrequentRoutes([{
					origin_name: origin.name,
					origin_lat: origin.lat,
					origin_lng: origin.lng,
					destination_name: destination.name,
					destination_lat: destination.lat,
					destination_lng: destination.lng,
					route_polyline: JSON.stringify(routeData.coordinates),
					frequency_count: 1,
					average_travel_time_seconds: routeData.duration * 60,
				} as any]);
			}

			// Reload history
			await loadHistory();
		} catch (error) {
			console.error("Failed to save to database:", error);
			// Reload from localStorage fallback
			const localHistory = loadLocalRouteHistory();
			setSearchHistory(localHistory.searchHistory);
			setFrequentRoutes(localHistory.frequentRoutes);
		}

		// Center map to show both points
		const centerLat = (origin.lat + destination.lat) / 2;
		const centerLng = (origin.lng + destination.lng) / 2;
		setMapCenter([centerLat, centerLng]);
	};

	const loadFrequentRoute = (routeItem: any) => {
		const orig: Location = {
			name: routeItem.origin_name,
			lat: routeItem.origin_lat,
			lng: routeItem.origin_lng,
		};
		const dest: Location = {
			name: routeItem.destination_name,
			lat: routeItem.destination_lat,
			lng: routeItem.destination_lng,
		};
		selectOrigin(orig);
		selectDestination(dest);
	};

	// Route Prediction BETA - Predict future route conditions
	const handleRoutePrediction = useCallback(async () => {
		if (!origin || !destination || !route) return;

		setIsPredicting(true);
		setPredictionResult(null);

		try {
			// Calculate target date
			let targetDate: Date;
			const today = new Date();

			if (predictionDate === 'tomorrow') {
				targetDate = new Date(today);
				targetDate.setDate(today.getDate() + 1);
			} else if (predictionDate === 'day_after') {
				targetDate = new Date(today);
				targetDate.setDate(today.getDate() + 2);
			} else if (predictionDate === 'custom' && customPredictionDate) {
				targetDate = new Date(customPredictionDate);
			} else {
				targetDate = new Date(today);
				targetDate.setDate(today.getDate() + 1);
			}

			// Calculate time slot
			let timeSlot: { start: number; end: number } | undefined;
			if (predictionTimeSlot === 'morning') {
				timeSlot = { start: 6, end: 10 };
			} else if (predictionTimeSlot === 'afternoon') {
				timeSlot = { start: 11, end: 15 };
			} else if (predictionTimeSlot === 'evening') {
				timeSlot = { start: 16, end: 20 };
			} else if (predictionTimeSlot === 'custom') {
				timeSlot = { start: customTimeStart, end: customTimeEnd };
			}

			const result = await predictFutureRoute({
				origin: origin.name,
				destination: destination.name,
				distance: route.distance,
				baseDuration: route.duration,
				transportMode,
				targetDate,
				preferredTimeSlot: timeSlot,
			});

			setPredictionResult(result);
			console.log('[Prediction] Future route prediction:', result);
		} catch (error) {
			console.error('[Prediction] Error:', error);
			setPredictionResult({
				success: false,
				prediction: null,
				error: 'Failed to generate prediction',
			});
		} finally {
			setIsPredicting(false);
		}
	}, [origin, destination, route, transportMode, predictionDate, customPredictionDate, predictionTimeSlot, customTimeStart, customTimeEnd]);

	const submitFeedback = (feedbackType: FeedbackData["feedbackType"], rating: number, comments: string) => {
		if (!origin || !destination) return;

		const feedback: FeedbackData = {
			id: `fb_${Date.now()}`,
			routeId: `route_${origin.name}_${destination.name}`,
			origin: origin.name,
			destination: destination.name,
			feedbackType,
			rating,
			comments,
			timestamp: new Date(),
		};

		setFeedbackList((prev) => [feedback, ...prev]);

		// In a real app, this would be sent to a backend API for AI training
		console.log("Feedback submitted for AI training:", feedback);
	};

	const addTrainingData = (data: Omit<TrainingData, 'id' | 'timestamp'>) => {
		const newData: TrainingData = {
			...data,
			id: `train_${Date.now()}`,
			timestamp: new Date(),
		};

		setTrainingData((prev) => [newData, ...prev]);
		console.log("Training data added:", newData);
	};

	// Handle file upload - merge file data into training data
	const handleFileUploaded = (file: UploadedTrainingFile, usedLLM: boolean) => {
		setUploadedFiles((prev) => [file, ...prev]);
		// Add the file's training data to the main training data
		setTrainingData((prev) => [...file.data, ...prev]);
		// Log differently based on whether LLM was used (only visible in console for developers)
		if (usedLLM) {
			console.log("[LLM] AI interpreted and uploaded:", file.fileName, "with", file.data.length, "records");
		} else {
			console.log("Training file uploaded:", file.fileName, "with", file.data.length, "records");
		}
	};

	// Handle file deletion
	const handleDeleteFile = (fileId: string) => {
		const file = uploadedFiles.find(f => f.id === fileId);
		if (file) {
			// Remove the file's data from training data
			const fileDataIds = new Set(file.data.map(d => d.id));
			setTrainingData((prev) => prev.filter(d => !fileDataIds.has(d.id)));
		}
		setUploadedFiles((prev) => prev.filter(f => f.id !== fileId));
	};

	// Handle training data update
	const handleUpdateTrainingData = (id: string, data: Partial<TrainingData>) => {
		setTrainingData((prev) => prev.map(d =>
			d.id === id ? { ...d, ...data } : d
		));
	};

	// Handle training data deletion
	const handleDeleteTrainingData = (id: string) => {
		setTrainingData((prev) => prev.filter(d => d.id !== id));
	};

	const currentTraffic = getTrafficLevel(new Date().getHours());
	const optimalDeparture = departureTimes.find((t) => t.delay === 0);

	// Find closest optimal time (nearest time with minimal delay, within next 6 hours)
	const now = new Date();
	const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
	const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

	// Check if there's a good time to leave within the next 15 minutes
	const immediateOptimal = departureTimes
		.filter(t => t.timestamp <= fifteenMinutesLater)
		.reduce((best, current) => {
			if (!best || current.delay < best.delay) return current;
			return best;
		}, null as DepartureTime | null);

	const closestOptimal = departureTimes
		.filter(t => t.timestamp <= sixHoursLater)
		.reduce((best, current) => {
			if (!best || current.delay < best.delay) return current;
			return best;
		}, null as DepartureTime | null);

	// Ultimate best time (absolute best time in next 24 hours)
	const ultimateBest = departureTimes.reduce((best, current) => {
		if (!best || current.estimatedDuration < best.estimatedDuration) return current;
		return best;
	}, null as DepartureTime | null);

	// Check if now is a good time to leave (within 5 min of optimal)
	const isGoodToLeaveNow = immediateOptimal && immediateOptimal.delay < 5;

	return (
		<div className="p-4 pb-8">
			<div className="max-w-7xl mx-auto space-y-4">
				{/* GPS Location Permission Banner - Show when not granted */}
				{locationPermission !== 'granted' && (
					<div className={cn(
						"p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
						locationBlockedByIframe
							? "bg-yellow-900/20 border-yellow-700/50"
							: locationPermission === 'denied'
							? "bg-red-900/20 border-red-700/50"
							: "bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/50 shadow-lg shadow-blue-500/10"
					)}>
						<div className="flex items-center gap-3">
							<div className={cn(
								"p-3 rounded-full",
								locationBlockedByIframe
									? "bg-yellow-500/20"
									: locationPermission === 'denied'
									? "bg-red-500/20"
									: "bg-blue-500/20"
							)}>
								{locationBlockedByIframe ? (
									<Shield className="h-7 w-7 text-yellow-400" />
								) : locationPermission === 'denied' ? (
									<XCircle className="h-7 w-7 text-red-400" />
								) : (
									<MapPinned className="h-7 w-7 text-blue-400 animate-pulse" />
								)}
							</div>
							<div>
								<h3 className={cn(
									"font-semibold",
									locationBlockedByIframe
										? "text-yellow-300"
										: locationPermission === 'denied'
										? "text-red-300"
										: "text-white"
								)}>
									{locationBlockedByIframe
										? "Location Blocked by Embedding"
										: locationPermission === 'denied'
										? "Location Access Blocked"
										: "📍 Enable GPS Location"}
								</h3>
								<p className="text-sm text-slate-400 mt-0.5">
									{locationBlockedByIframe
										? "This app is embedded in a frame that doesn't allow location access. Please open in a new tab or contact the site owner."
										: locationPermission === 'denied'
										? "Click the lock icon in your browser's address bar → Site Settings → Allow Location"
										: "Click the button and allow location access when your browser asks"}
								</p>
								{locationBlockedByIframe && (
									<p className="text-xs text-yellow-400/80 mt-1">
										Technical: The parent page needs to add allow="geolocation" to the iframe tag
									</p>
								)}
								{isRequestingLocation && (
									<p className="text-xs text-blue-400 mt-1 animate-pulse">
										⏳ Waiting for browser permission dialog... Look for a popup near your address bar!
									</p>
								)}
							</div>
						</div>
						{!locationBlockedByIframe && (
							<Button
								onClick={() => {
									console.log('[GPS Button] User clicked location button');
									// Reset permission state to prompt so we can try again
									if (locationPermission === 'denied') {
										setLocationPermission('prompt');
									}
									requestLocationPermission();
								}}
								disabled={isRequestingLocation}
								size="lg"
								className={cn(
									"font-semibold px-6 w-full sm:w-auto",
									locationPermission === 'denied'
										? "bg-orange-600 hover:bg-orange-700 text-white"
										: "bg-blue-600 hover:bg-blue-700 text-white"
								)}
							>
								{isRequestingLocation ? (
									<>
										<Loader2 className="h-5 w-5 mr-2 animate-spin" />
										Check Browser...
									</>
								) : locationPermission === 'denied' ? (
									<>
										<RefreshCw className="h-5 w-5 mr-2" />
										Try Again
									</>
								) : (
									<>
										<LocateFixed className="h-5 w-5 mr-2" />
										Enable GPS Now
									</>
								)}
							</Button>
						)}
						{locationBlockedByIframe && (
							<Button
								onClick={() => {
									// Open in new tab
									window.open(window.location.href, '_blank');
								}}
								size="lg"
								className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 w-full sm:w-auto"
							>
								<Navigation className="h-5 w-5 mr-2" />
								Open in New Tab
							</Button>
						)}
					</div>
				)}

				{/* Compact Control Bar */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">

								{/* Settings Button */}
								<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 relative"
										>
											<Settings className="h-5 w-5 text-slate-300" />
											{locationPermission === 'granted' && (
												<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-800" />
											)}
										</Button>
									</DialogTrigger>
									<DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
										<DialogHeader>
											<DialogTitle className="text-slate-200 flex items-center gap-2">
												<Settings className="h-5 w-5 text-blue-500" />
												Settings
											</DialogTitle>
											<DialogDescription className="text-slate-400">
												Configure app permissions and preferences
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-6 py-4">
											{/* Location Permission Section */}
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className={cn(
															"p-2 rounded-lg",
															locationPermission === 'granted'
																? "bg-green-500/20"
																: locationPermission === 'denied'
																? "bg-red-500/20"
																: "bg-slate-700"
														)}>
															<MapPinned className={cn(
																"h-5 w-5",
																locationPermission === 'granted'
																	? "text-green-400"
																	: locationPermission === 'denied'
																	? "text-red-400"
																	: "text-slate-400"
															)} />
														</div>
														<div>
															<Label className="text-sm font-medium text-white">
																Location Access
															</Label>
															<p className="text-xs text-slate-400">
																Enable GPS for live navigation
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2">
														{locationPermission === 'granted' ? (
															<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
																<Check className="h-3 w-3 mr-1" />
																Enabled
															</Badge>
														) : locationPermission === 'denied' ? (
															<Badge className="bg-red-500/20 text-red-400 border-red-500/30">
																<XCircle className="h-3 w-3 mr-1" />
																Denied
															</Badge>
														) : (
															<Badge className="bg-gray-500/20 text-slate-400 border-gray-500/30">
																Not Set
															</Badge>
														)}
													</div>
												</div>

												{/* Location Permission Actions */}
												<div className="pl-12 space-y-3">
													{locationPermission === 'denied' ? (
														<Alert className="bg-red-900/20 border-red-800">
															<AlertTriangle className="h-4 w-4 text-red-400" />
															<AlertDescription className="text-red-300 text-sm">
																Location access was denied. Please enable it in your browser settings to use live navigation.
															</AlertDescription>
														</Alert>
													) : locationPermission === 'granted' ? (
														<>
															<div className="flex items-center gap-2 text-sm text-slate-400">
																<LocateFixed className="h-4 w-4 text-green-400" />
																{userLocation ? (
																	<span>
																		Current location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
																	</span>
																) : (
																	<span>Location tracking is enabled</span>
																)}
															</div>
															<Button
																variant="outline"
																size="sm"
																onClick={disableLocationTracking}
																className="border-slate-500 hover:bg-slate-800"
															>
																Stop Tracking
															</Button>
														</>
													) : (
														<Button
															onClick={enableLocationTracking}
															disabled={isRequestingLocation}
															className="bg-blue-600 hover:bg-blue-700 text-white"
														>
															{isRequestingLocation ? (
																<>
																	<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																	Requesting...
																</>
															) : (
																<>
																	<MapPinned className="h-4 w-4 mr-2" />
																	Enable Location
																</>
															)}
														</Button>
													)}
												</div>
											</div>

											<Separator className="bg-slate-700" />

											{/* Voice Navigation Setting */}
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className={cn(
														"p-2 rounded-lg",
														voiceEnabled ? "bg-blue-500/20" : "bg-slate-700"
													)}>
														{voiceEnabled ? (
															<Volume2 className="h-5 w-5 text-blue-400" />
														) : (
															<VolumeX className="h-5 w-5 text-slate-400" />
														)}
													</div>
													<div>
														<Label className="text-sm font-medium text-white">
															Voice Navigation
														</Label>
														<p className="text-xs text-slate-400">
															Spoken turn-by-turn directions
														</p>
													</div>
												</div>
												<Switch
													checked={voiceEnabled}
													onCheckedChange={setVoiceEnabled}
												/>
											</div>

											<Separator className="bg-slate-700" />

											{/* AI Model Info */}
											<div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50">
												<div className="flex items-center gap-2 mb-2">
													<Brain className="h-4 w-4 text-blue-400" />
													<span className="text-sm font-medium text-white">AI Model</span>
												</div>
												<div className="space-y-1 text-xs">
													<div className="flex justify-between">
														<span className="text-slate-400">Model:</span>
														<span className="text-blue-300">IndiFlow Traffic AI v2.0</span>
													</div>
													<div className="flex justify-between">
														<span className="text-slate-400">Type:</span>
														<span className="text-blue-300">LLM-Enhanced Routing</span>
													</div>
													<div className="flex justify-between">
														<span className="text-slate-400">Training Data:</span>
														<span className="text-blue-300">{trainingData.length} samples</span>
													</div>
													<div className="flex justify-between">
														<span className="text-slate-400">Region:</span>
														<span className="text-blue-300">India Optimized</span>
													</div>
												</div>
											</div>
										</div>
									</DialogContent>
								</Dialog>
					</div>
				</div>

				{/* Main Navigation Tabs */}
				<Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'plan' | 'navigate')} className="w-full">
					<TabsList className="grid w-full grid-cols-2 bg-slate-800 mb-4">
						<TabsTrigger value="plan" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
							<RouteIcon className="h-4 w-4" />
							Plan Route
						</TabsTrigger>
						<TabsTrigger
							value="navigate"
							className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
							disabled={!route}
						>
							<Navigation className="h-4 w-4" />
							Live Navigation
							{isNavigating && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
						</TabsTrigger>
					</TabsList>

					{/* Plan Route Tab */}
					<TabsContent value="plan">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					{/* Left Panel - Search and Controls */}
					<div className="lg:col-span-1 space-y-4">
						{/* Search Card */}
						<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-blue-400">
									<Search className="h-5 w-5" />
									Route Search
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Origin */}
								<div className="relative">
									<label className="text-sm font-medium mb-1 block text-slate-300">Origin</label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-4 w-4 text-green-500" />
										<Input
											value={originInput}
											onChange={(e) => handleOriginSearch(e.target.value)}
											placeholder="Search streets, landmarks, areas, cities..."
											className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
										/>
										{isSearchingOrigin && (
											<div className="absolute right-3 top-3">
												<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-blue-300 rounded-full"></div>
											</div>
										)}
									</div>
									{originSuggestions.length > 0 && (
										<Card className="absolute z-50 w-full mt-1 max-h-80 overflow-auto shadow-lg bg-slate-800 border-slate-600">
											<CardContent className="p-2">
												{originSuggestions.map((location, idx) => (
													<button
														key={`${location.lat}-${location.lng}-${idx}`}
														onClick={() => selectOrigin(location)}
														className="w-full text-left px-3 py-2.5 hover:bg-slate-700/50 rounded text-sm border-b border-slate-700/50 last:border-b-0 flex items-start gap-3 transition-colors"
													>
														<div className="mt-0.5">
															{getLandmarkIcon(location.landmarkType, location.category, location.placeType)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="font-medium text-white flex items-center gap-2">
																<span className="truncate">{location.name}</span>
																{location.isLocalLandmark && (
																	<BadgeCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
																)}
															</div>
															{location.area && (
																<div className="text-xs text-slate-400 mt-0.5">
																	{location.area}{location.street ? `, ${location.street}` : ''}
																</div>
															)}
															{!location.area && location.displayName && (
																<div className="text-xs text-slate-400 mt-0.5 truncate">
																	{location.displayName}
																</div>
															)}
															<div className="flex items-center gap-2 mt-1.5 flex-wrap">
																{(location.landmarkType || location.placeType) && (
																	<Badge
																		variant="outline"
																		className={cn(
																			"text-xs capitalize",
																			getLandmarkBadgeStyle(location.isLocalLandmark, location.isLocalArea, location.category)
																		)}
																	>
																		{location.landmarkType?.replace(/_/g, ' ') || location.placeType}
																	</Badge>
																)}
																{location.avgFootfall && location.avgFootfall > 30000 && (
																	<Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
																		High Traffic
																	</Badge>
																)}
															</div>
														</div>
													</button>
												))}
											</CardContent>
										</Card>
									)}
								</div>

								{/* Destination */}
								<div className="relative">
									<label className="text-sm font-medium mb-1 block text-slate-300">Destination</label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-4 w-4 text-red-500" />
										<Input
											value={destinationInput}
											onChange={(e) => handleDestinationSearch(e.target.value)}
											placeholder="Search streets, landmarks, areas, cities..."
											className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
										/>
										{isSearchingDestination && (
											<div className="absolute right-3 top-3">
												<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-blue-300 rounded-full"></div>
											</div>
										)}
									</div>
									{destinationSuggestions.length > 0 && (
										<Card className="absolute z-50 w-full mt-1 max-h-80 overflow-auto shadow-lg bg-slate-800 border-slate-600">
											<CardContent className="p-2">
												{destinationSuggestions.map((location, idx) => (
													<button
														key={`${location.lat}-${location.lng}-${idx}`}
														onClick={() => selectDestination(location)}
														className="w-full text-left px-3 py-2.5 hover:bg-slate-700/50 rounded text-sm border-b border-slate-700/50 last:border-b-0 flex items-start gap-3 transition-colors"
													>
														<div className="mt-0.5">
															{getLandmarkIcon(location.landmarkType, location.category, location.placeType)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="font-medium text-white flex items-center gap-2">
																<span className="truncate">{location.name}</span>
																{location.isLocalLandmark && (
																	<BadgeCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
																)}
															</div>
															{location.area && (
																<div className="text-xs text-slate-400 mt-0.5">
																	{location.area}{location.street ? `, ${location.street}` : ''}
																</div>
															)}
															{!location.area && location.displayName && (
																<div className="text-xs text-slate-400 mt-0.5 truncate">
																	{location.displayName}
																</div>
															)}
															<div className="flex items-center gap-2 mt-1.5 flex-wrap">
																{(location.landmarkType || location.placeType) && (
																	<Badge
																		variant="outline"
																		className={cn(
																			"text-xs capitalize",
																			getLandmarkBadgeStyle(location.isLocalLandmark, location.isLocalArea, location.category)
																		)}
																	>
																		{location.landmarkType?.replace(/_/g, ' ') || location.placeType}
																	</Badge>
																)}
																{location.avgFootfall && location.avgFootfall > 30000 && (
																	<Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
																		High Traffic
																	</Badge>
																)}
															</div>
														</div>
													</button>
												))}
											</CardContent>
										</Card>
									)}
								</div>

								{/* Transport Mode Selector */}
								<div>
									<label className="text-sm font-medium mb-2 block text-slate-300">Transport Mode</label>
									<Select value={transportMode} onValueChange={(value) => setTransportMode(value as TransportMode)}>
										<SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-slate-800 border-slate-600">
											<SelectItem value="driving" className="text-white hover:bg-slate-700/50 focus:bg-slate-800/50">
												<div className="flex items-center gap-2">
													<Car className="h-4 w-4" />
													<span>Car</span>
												</div>
											</SelectItem>
											<SelectItem value="bus" className="text-white hover:bg-slate-700/50 focus:bg-slate-800/50">
												<div className="flex items-center gap-2">
													<Bus className="h-4 w-4" />
													<span>Bus</span>
												</div>
											</SelectItem>
											<SelectItem value="bike" className="text-white hover:bg-slate-700/50 focus:bg-slate-800/50">
												<div className="flex items-center gap-2">
													<Bike className="h-4 w-4" />
													<span>Bike/Motorcycle</span>
												</div>
											</SelectItem>
											<SelectItem value="cycling" className="text-white hover:bg-slate-700/50 focus:bg-slate-800/50">
												<div className="flex items-center gap-2">
													<Bike className="h-4 w-4" />
													<span>Bicycle</span>
												</div>
											</SelectItem>
											<SelectItem value="walking" className="text-white hover:bg-slate-700/50 focus:bg-slate-800/50">
												<div className="flex items-center gap-2">
													<User className="h-4 w-4" />
													<span>Walking</span>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Button onClick={calculateRouteAndTraffic} disabled={!origin || !destination} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
									<RouteIcon className="h-4 w-4 mr-2" />
									Calculate Route
								</Button>
							</CardContent>
						</Card>

						{/* Current Traffic Status - Enhanced with IP Geolocation */}
						{route && (
							<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg text-blue-400 flex items-center gap-2">
										Current Traffic Status
										{currentCity && (
											<Badge variant="outline" className="text-xs border-green-600 text-green-400">
												<MapPin className="h-3 w-3 mr-1" />
												{currentCity.name}
											</Badge>
										)}
									</CardTitle>
									<CardDescription className="flex items-center gap-1 text-slate-400">
										{React.createElement(TRANSPORT_CONFIGS[transportMode].icon, { className: "h-4 w-4" })}
										{TRANSPORT_CONFIGS[transportMode].name} • {TRANSPORT_CONFIGS[transportMode].description}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									{/* City Location Info */}
									{currentCity && (
										<div className="p-2 bg-slate-800/50 rounded-lg border border-slate-600 text-xs">
											<div className="flex items-center gap-2 text-slate-300">
												<LocateFixed className="h-3 w-3 text-green-400" />
												<span>{currentCity.name}, India</span>
											</div>
											<div className="text-slate-500 mt-1">
												Local time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} •
												{' '}{new Date().getHours() >= 8 && new Date().getHours() <= 10 ? 'morning rush' :
													new Date().getHours() >= 17 && new Date().getHours() <= 20 ? 'evening rush' :
													new Date().getHours() >= 11 && new Date().getHours() <= 16 ? 'midday' : 'off-peak'}
											</div>
										</div>
									)}

									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-300">Traffic Level:</span>
										<Badge
											style={{
												backgroundColor: TRANSPORT_CONFIGS[transportMode].trafficAffected
													? currentTraffic.color
													: "#22c55e"
											}}
											className="text-white capitalize"
										>
											{TRANSPORT_CONFIGS[transportMode].trafficAffected
												? currentTraffic.level
												: "N/A (not affected)"}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-300">Est. Duration:</span>
										<span className="text-lg font-bold text-white">
											{formatMinutesToHours(route.adjustedDuration ?? route.duration)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-300">Distance:</span>
										<span className="text-lg font-bold text-white">{(route.adjustedDistance ?? route.distance).toFixed(1)} km</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-slate-300">Avg. Speed:</span>
										<span className="text-lg font-bold text-white">{route.effectiveSpeed ?? TRANSPORT_CONFIGS[transportMode].avgSpeed} km/h</span>
									</div>

									{/* AI Linked Suggestions - Link predictions with other suggestions */}
									{llmOptimization?.linkedSuggestions && llmOptimization.linkedSuggestions.length > 0 && (
										<div className="mt-3 pt-3 border-t border-slate-700">
											<div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
												<Sparkles className="h-3 w-3 text-blue-400" />
												AI-Linked Insights
											</div>
											<div className="space-y-2">
												{llmOptimization.linkedSuggestions.map((suggestion) => (
													<div
														key={suggestion.id}
														className={cn(
															"p-2 rounded-lg border text-xs",
															suggestion.type === 'optimal_time' && "bg-blue-900/20 border-blue-700/50",
															suggestion.type === 'traffic_avoidance' && "bg-yellow-900/20 border-yellow-700/50",
															suggestion.type === 'historical_pattern' && "bg-slate-800/50 border-slate-600",
															suggestion.type === 'shortcut' && "bg-green-900/20 border-green-700/50"
														)}
													>
														<div className="flex items-center justify-between mb-1">
															<span className={cn(
																"font-medium",
																suggestion.type === 'optimal_time' && "text-blue-300",
																suggestion.type === 'traffic_avoidance' && "text-yellow-300",
																suggestion.type === 'historical_pattern' && "text-slate-300",
																suggestion.type === 'shortcut' && "text-green-300"
															)}>
																{suggestion.title}
															</span>
															<Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
																{suggestion.confidence}%
															</Badge>
														</div>
														<p className="text-slate-400">{suggestion.description}</p>
														{suggestion.relatedTo && suggestion.relatedTo.length > 0 && (
															<div className="flex gap-1 mt-1 flex-wrap">
																{suggestion.relatedTo.map((rel, idx) => (
																	<Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-500">
																		{rel.replace('_', ' ')}
																	</Badge>
																))}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Best Time to Leave - Prominent Display */}
						{route && (
							<Card className={cn(
								"bg-slate-900/95 backdrop-blur border-2",
								isGoodToLeaveNow ? "border-green-500" : "border-slate-700"
							)}>
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2 text-blue-400">
										<Clock className="h-5 w-5 text-blue-500" />
										Best Time to Leave
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{/* Immediate Action - Leave Now Banner */}
									{isGoodToLeaveNow && immediateOptimal && (
										<div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white">
											<div className="flex items-center gap-2 mb-2">
												<Zap className="h-5 w-5 animate-pulse" />
												<span className="font-bold text-lg">LEAVE NOW!</span>
											</div>
											<p className="text-sm opacity-90">
												Optimal conditions within the next 15 minutes
											</p>
											<div className="mt-2 text-sm">
												<span className="font-medium">Duration: </span>
												{formatMinutesToHours(immediateOptimal.estimatedDuration)}
											</div>
											{immediateOptimal.delay > 0 && (
												<div className="text-xs mt-1 opacity-80">
													Only +{immediateOptimal.delay} min vs absolute best
												</div>
											)}
										</div>
									)}

									{/* Not optimal to leave now */}
									{!isGoodToLeaveNow && immediateOptimal && (
										<div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-600/50">
											<div className="flex items-center gap-2 text-yellow-400 mb-1">
												<AlertTriangle className="h-4 w-4" />
												<span className="text-sm font-medium">Not optimal right now</span>
											</div>
											<p className="text-xs text-yellow-300/80">
												If you leave now: +{immediateOptimal.delay} min extra travel time
											</p>
										</div>
									)}

									{/* Next Best Time */}
									{closestOptimal && (!isGoodToLeaveNow || closestOptimal.time !== immediateOptimal?.time) && (
										<div className="p-3 bg-slate-800/50 rounded-lg border-2 border-blue-600">
											<div className="text-xs text-blue-400 font-medium mb-1">NEXT OPTIMAL TIME</div>
											<div className="text-2xl font-bold text-blue-300">{closestOptimal.time}</div>
											<div className="text-sm text-blue-400 mt-1">
												Duration: {formatMinutesToHours(closestOptimal.estimatedDuration)}
											</div>
											<Badge
												style={{ backgroundColor: closestOptimal.trafficLevel.color }}
												className="text-white text-xs mt-2"
											>
												{closestOptimal.trafficLevel.level} traffic
											</Badge>
										</div>
									)}

									{/* Ultimate Best Time */}
									{ultimateBest && ultimateBest.time !== closestOptimal?.time && (
										<div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
											<div className="text-xs text-green-400 font-medium mb-1">ABSOLUTE BEST (24 hrs)</div>
											<div className="text-xl font-bold text-green-300">{ultimateBest.time}</div>
											<div className="text-sm text-green-400 mt-1">
												Duration: {formatMinutesToHours(ultimateBest.estimatedDuration)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Frequent Routes */}
						{frequentRoutes.length > 0 && (
							<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
								<CardHeader>
									<CardTitle className="text-lg flex items-center gap-2 text-blue-400">
										<TrendingUp className="h-5 w-5" />
										Frequent Routes
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ScrollArea className="h-32">
										<div className="space-y-2">
											{frequentRoutes.map((routeItem) => (
												<button
													key={routeItem.id}
													onClick={() => loadFrequentRoute(routeItem)}
													className="w-full text-left p-2 hover:bg-slate-700/50 rounded text-sm border border-slate-600"
												>
													<div className="font-medium text-xs text-white">
														{routeItem.origin_name} → {routeItem.destination_name}
													</div>
													<div className="text-xs text-slate-400">
														Used {routeItem.frequency_count} times
													</div>
												</button>
											))}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Center Panel - Map */}
					<div className="lg:col-span-1">
						<Card className="bg-slate-900/95 backdrop-blur border-slate-700 h-[600px]">
							{/* Route Toggle Header - shows when both routes exist */}
							{route && aiShortcutRoute && (
								<div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
									<div className="flex items-center gap-2">
										<RouteIcon className="h-4 w-4 text-blue-400" />
										<span className="text-sm font-medium text-slate-300">Route View</span>
									</div>
									<div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-lg">
										<button
											onClick={() => setDisplayedRouteType('main')}
											className={cn(
												"px-3 py-1.5 rounded-md text-xs font-medium transition-all",
												displayedRouteType === 'main'
													? "bg-blue-600 text-white shadow-md"
													: "text-slate-400 hover:text-white hover:bg-slate-600"
											)}
										>
											<span className="flex items-center gap-1.5">
												<RouteIcon className="h-3 w-3" />
												Main
											</span>
										</button>
										<button
											onClick={() => setDisplayedRouteType('shortcut')}
											className={cn(
												"px-3 py-1.5 rounded-md text-xs font-medium transition-all",
												displayedRouteType === 'shortcut'
													? "bg-green-600 text-white shadow-md"
													: "text-slate-400 hover:text-white hover:bg-slate-600"
											)}
										>
											<span className="flex items-center gap-1.5">
												<Zap className="h-3 w-3" />
												AI Shortcut
											</span>
										</button>
									</div>
								</div>
							)}
							<CardContent className={cn("p-0", route && aiShortcutRoute ? "h-[calc(100%-52px)]" : "h-full")}>
								<MapContainer
									center={mapCenter}
									zoom={5}
									style={{ height: "100%", width: "100%" }}
									className="rounded-lg"
								>
									<TileLayer
										attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
										url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
									/>
									{!route && <MapRecenter center={mapCenter} />}
									{route && <MapBoundsFitter coordinates={displayedRouteType === 'shortcut' && aiShortcutRoute ? aiShortcutRoute.coordinates : route.coordinates} />}

									{origin && (
										<Marker position={[origin.lat, origin.lng]}>
											<Popup>
												<strong>Origin:</strong> {origin.name}
											</Popup>
										</Marker>
									)}

									{destination && (
										<Marker position={[destination.lat, destination.lng]}>
											<Popup>
												<strong>Destination:</strong> {destination.name}
											</Popup>
										</Marker>
									)}

									{/* Show main route (blue) or shortcut route (green) based on toggle */}
									{route && displayedRouteType === 'main' && (
										<>
											<Polyline
												positions={route.coordinates}
												color="#3b82f6"
												weight={6}
												opacity={0.9}
											/>
											<Polyline
												positions={route.coordinates}
												color="#1e40af"
												weight={10}
												opacity={0.5}
											/>
										</>
									)}

									{aiShortcutRoute && displayedRouteType === 'shortcut' && (
										<>
											<Polyline
												positions={aiShortcutRoute.coordinates}
												color="#22c55e"
												weight={6}
												opacity={0.9}
											/>
											<Polyline
												positions={aiShortcutRoute.coordinates}
												color="#15803d"
												weight={10}
												opacity={0.5}
											/>
										</>
									)}

									{/* Show both routes faded when one is selected (for comparison) */}
									{route && aiShortcutRoute && displayedRouteType === 'shortcut' && (
										<Polyline
											positions={route.coordinates}
											color="#3b82f6"
											weight={4}
											opacity={0.3}
											dashArray="5, 10"
										/>
									)}
									{route && aiShortcutRoute && displayedRouteType === 'main' && (
										<Polyline
											positions={aiShortcutRoute.coordinates}
											color="#22c55e"
											weight={4}
											opacity={0.3}
											dashArray="5, 10"
										/>
									)}

									{/* User's current location marker */}
									{userLocation && locationPermission === 'granted' && (
										<Marker position={[userLocation.lat, userLocation.lng]}>
											<Popup>
												<strong className="text-green-600">Your Location</strong>
											</Popup>
										</Marker>
									)}
								</MapContainer>
							</CardContent>
						</Card>
					</div>

					{/* Right Panel - Route Details and Times */}
					<div className="lg:col-span-1 space-y-4">
						{route ? (
							<>
								{/* AI Smart Insights - FIRST - Available to all users */}
								<Card className="bg-gradient-to-br from-slate-900/95 to-blue-900/30 backdrop-blur border-blue-600">
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg flex items-center gap-2 text-blue-300">
												<Brain className="h-5 w-5 text-blue-400" />
												AI Smart Insights
												{isLLMOptimizing && (
													<Loader2 className="h-4 w-4 animate-spin text-blue-400" />
												)}
											</CardTitle>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													if (origin && destination && route) {
														setLastInsightsRefresh(new Date());
														runLLMOptimization(origin, destination, route);
													}
												}}
												disabled={isLLMOptimizing || !route}
												className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
											>
												<RefreshCw className={cn("h-4 w-4", isLLMOptimizing && "animate-spin")} />
											</Button>
										</div>
										<div className="flex items-center justify-between">
											<CardDescription className="text-slate-400">
												AI-powered route analysis and recommendations
											</CardDescription>
											{llmOptimization && (
												<span className="text-xs text-slate-500 flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{lastInsightsRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
												</span>
											)}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										{isLLMOptimizing && (
											<div className="flex items-center gap-2 text-blue-300 text-sm p-3 bg-blue-900/20 rounded-lg border border-blue-800">
												<Loader2 className="h-4 w-4 animate-spin" />
												Analyzing your route with AI...
											</div>
										)}

										{llmOptimizationError && (
											<Alert className="bg-red-900/30 border-red-700">
												<AlertTriangle className="h-4 w-4 text-red-400" />
												<AlertDescription className="text-red-300 text-sm ml-2">
													{llmOptimizationError}
												</AlertDescription>
											</Alert>
										)}

										{llmOptimization && !isLLMOptimizing && (
											<>
												{/* AI Confidence Score */}
												<div className="p-3 bg-gradient-to-r from-slate-800/80 to-slate-800/50 rounded-lg border border-slate-600">
													<div className="flex items-center justify-between mb-2">
														<span className="text-xs text-slate-400">AI Confidence</span>
														<Badge
															className={cn(
																"text-xs",
																llmOptimization.confidenceScore >= 80 ? "bg-green-600" :
																llmOptimization.confidenceScore >= 60 ? "bg-yellow-600" : "bg-red-600"
															)}
														>
															{llmOptimization.confidenceScore}%
														</Badge>
													</div>
													<div className="w-full bg-slate-700 rounded-full h-2">
														<div
															className={cn(
																"h-2 rounded-full transition-all",
																llmOptimization.confidenceScore >= 80 ? "bg-green-500" :
																llmOptimization.confidenceScore >= 60 ? "bg-yellow-500" : "bg-red-500"
															)}
															style={{ width: `${llmOptimization.confidenceScore}%` }}
														/>
													</div>
												</div>

												{/* AI Reasoning */}
												<div>
													<div className="text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
														<Lightbulb className="h-4 w-4 text-yellow-400" />
														Route Analysis
													</div>
													<p className="text-sm text-slate-300 bg-slate-800 p-3 rounded-lg border border-slate-600">
														{llmOptimization.reasoning}
													</p>
												</div>

												{/* Optimized Duration */}
												{llmOptimization.optimizedDuration && (
													<div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
														<div className="text-xs text-green-400 mb-1">AI Predicted Optimal Duration</div>
														<div className="text-xl font-bold text-green-300">
															{formatMinutesToHours(llmOptimization.optimizedDuration)}
														</div>
														{llmOptimization.optimizedDuration < route.duration && (
															<div className="text-xs text-green-400 mt-1">
																Potential savings: {formatMinutesToHours(route.duration - llmOptimization.optimizedDuration)}
															</div>
														)}
													</div>
												)}

												{/* Recommendations - Top 2 */}
												{llmOptimization.recommendations.length > 0 && (
													<div>
														<div className="text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
															<Lightbulb className="h-4 w-4 text-yellow-400" />
															Top Recommendations
														</div>
														<div className="space-y-2">
															{llmOptimization.recommendations.slice(0, 2).map((rec, idx) => (
																<div key={idx} className="flex gap-2 text-xs p-2 bg-slate-800/30 rounded border border-slate-600">
																	<div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
																		{idx + 1}
																	</div>
																	<div className="flex-1 text-slate-300">{rec}</div>
																</div>
															))}
														</div>
													</div>
												)}

												{/* Traffic Prediction */}
												{llmOptimization.trafficPrediction && (
													<div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
														<div className="flex items-center gap-2 mb-1">
															<TrendingUp className="h-4 w-4 text-blue-400" />
															<span className="text-xs font-medium text-blue-300">Traffic Prediction</span>
														</div>
														<p className="text-sm text-slate-300">{llmOptimization.trafficPrediction}</p>
													</div>
												)}

												{/* Key Factors */}
												{llmOptimization.factors.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{llmOptimization.factors.slice(0, 4).map((factor, idx) => (
															<Badge
																key={idx}
																variant="outline"
																className="text-xs border-blue-600 text-blue-400"
															>
																{factor}
															</Badge>
														))}
													</div>
												)}
											</>
										)}

										{!llmOptimization && !isLLMOptimizing && !llmOptimizationError && (
											<div className="text-sm text-slate-400 text-center py-4">
												AI analysis will appear when you calculate a route
											</div>
										)}
									</CardContent>
								</Card>

								{/* Departure Times */}
								<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg text-blue-400">Alternative Departure Times</CardTitle>
										<CardDescription className="text-slate-400">Next 24 hours with estimated delays</CardDescription>
									</CardHeader>
									<CardContent>
										<ScrollArea className="h-64">
											<div className="space-y-2">
												{departureTimes.slice(0, 12).map((timeSlot, idx) => (
													<div
														key={idx}
														className={cn(
															"p-3 rounded-lg border",
															timeSlot.delay === 0
																? "bg-slate-800/50 border-blue-600"
																: "bg-slate-800 border-slate-600"
														)}
													>
														<div className="flex items-center justify-between">
															<div>
																<div className="font-semibold text-white">{timeSlot.time}</div>
																<div className="text-xs text-slate-400">
																	{formatMinutesToHours(timeSlot.estimatedDuration)}
																</div>
															</div>
															<div className="text-right">
																{timeSlot.delay === 0 ? (
																	<Badge className="bg-blue-600">Optimal</Badge>
																) : (
																	<div className="text-sm text-red-400 font-medium">
																		+{formatMinutesToHours(timeSlot.delay)}
																	</div>
																)}
																<Badge
																	style={{
																		backgroundColor: timeSlot.trafficLevel.color,
																		marginTop: "4px",
																	}}
																	className="text-white text-xs capitalize mt-1"
																>
																	{timeSlot.trafficLevel.level}
																</Badge>
															</div>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									</CardContent>
								</Card>

								{/* Route Prediction BETA */}
								<Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/95 backdrop-blur border-purple-600/50">
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg flex items-center gap-2 text-purple-300">
												<Rocket className="h-5 w-5 text-purple-400" />
												Plan Ahead
												<Badge className="bg-purple-600/50 text-purple-200 text-xs ml-2">BETA</Badge>
											</CardTitle>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowPredictionPanel(!showPredictionPanel)}
												className="text-purple-300 hover:text-purple-100"
											>
												{showPredictionPanel ? 'Hide' : 'Expand'}
											</Button>
										</div>
										<CardDescription className="text-slate-400">
											Predict traffic conditions for future trips
										</CardDescription>
									</CardHeader>

									{showPredictionPanel && (
										<CardContent className="space-y-4">
											{/* Date Selection */}
											<div className="space-y-2">
												<Label className="text-sm text-slate-300 flex items-center gap-2">
													<Calendar className="h-4 w-4 text-purple-400" />
													When do you want to travel?
												</Label>
												<div className="grid grid-cols-3 gap-2">
													<Button
														variant={predictionDate === 'tomorrow' ? 'default' : 'outline'}
														size="sm"
														onClick={() => setPredictionDate('tomorrow')}
														className={cn(
															predictionDate === 'tomorrow'
																? "bg-purple-600 hover:bg-purple-700"
																: "border-slate-600 text-slate-300"
														)}
													>
														Tomorrow
													</Button>
													<Button
														variant={predictionDate === 'day_after' ? 'default' : 'outline'}
														size="sm"
														onClick={() => setPredictionDate('day_after')}
														className={cn(
															predictionDate === 'day_after'
																? "bg-purple-600 hover:bg-purple-700"
																: "border-slate-600 text-slate-300"
														)}
													>
														Day After
													</Button>
													<Button
														variant={predictionDate === 'custom' ? 'default' : 'outline'}
														size="sm"
														onClick={() => setPredictionDate('custom')}
														className={cn(
															predictionDate === 'custom'
																? "bg-purple-600 hover:bg-purple-700"
																: "border-slate-600 text-slate-300"
														)}
													>
														Custom
													</Button>
												</div>
												{predictionDate === 'custom' && (
													<Input
														type="date"
														value={customPredictionDate}
														onChange={(e) => setCustomPredictionDate(e.target.value)}
														min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
														className="bg-slate-800 border-slate-600 text-white"
													/>
												)}
											</div>

											{/* Time Slot Selection */}
											<div className="space-y-2">
												<Label className="text-sm text-slate-300 flex items-center gap-2">
													<Timer className="h-4 w-4 text-purple-400" />
													Preferred time window
												</Label>
												<Select
													value={predictionTimeSlot}
													onValueChange={(v: 'any' | 'morning' | 'afternoon' | 'evening' | 'custom') => setPredictionTimeSlot(v)}
												>
													<SelectTrigger className="bg-slate-800 border-slate-600 text-white">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="bg-slate-800 border-slate-600">
														<SelectItem value="any" className="text-white">Any time - find best</SelectItem>
														<SelectItem value="morning" className="text-white">Morning (6 AM - 10 AM)</SelectItem>
														<SelectItem value="afternoon" className="text-white">Afternoon (11 AM - 3 PM)</SelectItem>
														<SelectItem value="evening" className="text-white">Evening (4 PM - 8 PM)</SelectItem>
														<SelectItem value="custom" className="text-white">Custom time range</SelectItem>
													</SelectContent>
												</Select>

												{predictionTimeSlot === 'custom' && (
													<div className="flex items-center gap-2">
														<Select
															value={customTimeStart.toString()}
															onValueChange={(v) => setCustomTimeStart(parseInt(v))}
														>
															<SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
																<SelectValue />
															</SelectTrigger>
															<SelectContent className="bg-slate-800 border-slate-600">
																{Array.from({ length: 24 }, (_, i) => (
																	<SelectItem key={i} value={i.toString()} className="text-white">
																		{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<span className="text-slate-400">to</span>
														<Select
															value={customTimeEnd.toString()}
															onValueChange={(v) => setCustomTimeEnd(parseInt(v))}
														>
															<SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1">
																<SelectValue />
															</SelectTrigger>
															<SelectContent className="bg-slate-800 border-slate-600">
																{Array.from({ length: 24 }, (_, i) => (
																	<SelectItem key={i} value={i.toString()} className="text-white">
																		{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												)}
											</div>

											{/* Predict Button */}
											<Button
												onClick={handleRoutePrediction}
												disabled={isPredicting || !route}
												className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
											>
												{isPredicting ? (
													<>
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														Predicting...
													</>
												) : (
													<>
														<Target className="h-4 w-4 mr-2" />
														Get AI Prediction
													</>
												)}
											</Button>

											{/* Prediction Results */}
											{predictionResult?.success && predictionResult.prediction && (
												<div className="space-y-3 pt-2">
													<Separator className="bg-purple-700/50" />

													{/* Optimal Time */}
													<div className="p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-600/50">
														<div className="flex items-center justify-between mb-2">
															<div className="flex items-center gap-2">
																<Target className="h-5 w-5 text-purple-400" />
																<span className="text-sm font-medium text-purple-200">Best Departure Time</span>
															</div>
															<Badge className={cn(
																"text-xs",
																predictionResult.prediction.confidenceScore >= 75 ? "bg-green-600" :
																predictionResult.prediction.confidenceScore >= 50 ? "bg-yellow-600" : "bg-orange-600"
															)}>
																{predictionResult.prediction.confidenceScore}% confidence
															</Badge>
														</div>
														<div className="text-2xl font-bold text-white mb-1">
															{predictionResult.prediction.optimalDepartureTime}
														</div>
														<div className="text-sm text-slate-300">
															Expected duration: {formatMinutesToHours(predictionResult.prediction.expectedDuration)}
														</div>
														<Badge className={cn(
															"mt-2 text-xs",
															predictionResult.prediction.trafficForecast === 'light' ? "bg-green-600" :
															predictionResult.prediction.trafficForecast === 'moderate' ? "bg-yellow-600" :
															predictionResult.prediction.trafficForecast === 'heavy' ? "bg-orange-600" : "bg-red-600"
														)}>
															{predictionResult.prediction.trafficForecast.replace('_', ' ')} traffic expected
														</Badge>
													</div>

													{/* AI Reasoning */}
													<div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
														<div className="flex items-center gap-2 mb-2">
															<Brain className="h-4 w-4 text-purple-400" />
															<span className="text-sm font-medium text-slate-300">AI Analysis</span>
														</div>
														<p className="text-sm text-slate-400">
															{predictionResult.prediction.reasoning}
														</p>
													</div>

													{/* Alternative Times */}
													{predictionResult.prediction.alternativeTimes.length > 0 && (
														<div className="space-y-2">
															<div className="text-sm font-medium text-slate-300 flex items-center gap-2">
																<Clock className="h-4 w-4 text-purple-400" />
																Alternative Times
															</div>
															<div className="space-y-1">
																{predictionResult.prediction.alternativeTimes.map((alt, idx) => (
																	<div key={idx} className="flex items-center justify-between p-2 bg-slate-800/30 rounded border border-slate-700">
																		<span className="text-sm text-white">{alt.time}</span>
																		<div className="flex items-center gap-2">
																			<span className="text-xs text-slate-400">{formatMinutesToHours(alt.expectedDuration)}</span>
																			<Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
																				{alt.trafficLevel}
																			</Badge>
																		</div>
																	</div>
																))}
															</div>
														</div>
													)}

													{/* Warnings */}
													{predictionResult.prediction.warnings.length > 0 && (
														<div className="space-y-1">
															{predictionResult.prediction.warnings.map((warning, idx) => (
																<div key={idx} className="flex items-start gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-700/50">
																	<AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
																	<span className="text-xs text-yellow-300">{warning}</span>
																</div>
															))}
														</div>
													)}

													{/* Tips */}
													{predictionResult.prediction.tips.length > 0 && (
														<div className="space-y-1">
															{predictionResult.prediction.tips.map((tip, idx) => (
																<div key={idx} className="flex items-start gap-2 p-2 bg-blue-900/20 rounded border border-blue-700/50">
																	<Lightbulb className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
																	<span className="text-xs text-blue-300">{tip}</span>
																</div>
															))}
														</div>
													)}
												</div>
											)}

											{predictionResult && !predictionResult.success && (
												<Alert className="bg-red-900/30 border-red-700">
													<AlertTriangle className="h-4 w-4 text-red-400" />
													<AlertDescription className="text-red-300 text-sm ml-2">
														{predictionResult.error || 'Failed to generate prediction'}
													</AlertDescription>
												</Alert>
											)}

											{!predictionResult && !isPredicting && (
												<div className="text-center text-sm text-slate-500 py-2">
													<Info className="h-5 w-5 mx-auto mb-1 opacity-50" />
													Select a date and get AI prediction for your planned trip
												</div>
											)}
										</CardContent>
									)}

									{!showPredictionPanel && (
										<CardContent className="pt-0">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowPredictionPanel(true)}
												className="w-full border-purple-600/50 text-purple-300 hover:bg-purple-900/30"
											>
												<Calendar className="h-4 w-4 mr-2" />
												Plan a future trip
											</Button>
										</CardContent>
									)}
								</Card>

								{/* Route Details */}
								<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
									<CardHeader>
										<CardTitle className="text-lg text-blue-400">Route Details</CardTitle>
									</CardHeader>
									<CardContent>
										<Tabs defaultValue="steps">
											<TabsList className="grid w-full grid-cols-2 bg-slate-800">
												<TabsTrigger value="steps" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
													Directions
												</TabsTrigger>
												<TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
													History
												</TabsTrigger>
											</TabsList>
											<TabsContent value="steps">
												<ScrollArea className="h-64">
													<div className="space-y-2">
														{(route.directionSteps || []).length > 0 ? (
															route.directionSteps!.map((step, idx) => (
																<div
																	key={idx}
																	className="flex gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700/50 transition-colors"
																>
																	<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white">
																		{getDirectionIcon(step.icon)}
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="text-sm leading-relaxed text-slate-300">
																			{step.instruction}
																		</div>
																		{step.distance > 0 && (
																			<div className="text-xs text-slate-500 mt-0.5">
																				{formatDistance(step.distance)}
																			</div>
																		)}
																		{step.warning && (
																			<div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
																				<AlertTriangle className="h-3 w-3" />
																				{step.warning}
																			</div>
																		)}
																	</div>
																	<div className="flex-shrink-0 text-xs text-slate-500">
																		{idx + 1}
																	</div>
																</div>
															))
														) : (
															route.steps.map((step, idx) => (
																<div
																	key={idx}
																	className="flex gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700/50 transition-colors"
																>
																	<div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
																		{idx + 1}
																	</div>
																	<div className="flex-1 text-sm leading-relaxed text-slate-300">
																		{step}
																	</div>
																</div>
															))
														)}
													</div>
												</ScrollArea>
											</TabsContent>
											<TabsContent value="history">
												<ScrollArea className="h-48">
													{searchHistory.length > 0 ? (
														<div className="space-y-2 text-sm">
															{searchHistory.map((item) => (
																<div key={item.id} className="p-2 border border-slate-600 rounded bg-slate-800">
																	<div className="font-medium text-xs text-white">
																		{item.origin_name} → {item.destination_name}
																	</div>
																	<div className="text-xs text-slate-400">
																		{new Date(item.create_time).toLocaleString("en-IN")}
																	</div>
																</div>
															))}
														</div>
													) : (
														<div className="text-sm text-slate-400 text-center py-8">
															No search history yet
														</div>
													)}
												</ScrollArea>
											</TabsContent>
										</Tabs>
									</CardContent>
								</Card>

								{/* AI Shortcut Comparison - Shown when alternative route available */}
								{showShortcutComparison && aiShortcutRoute && (
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2 text-blue-400">
												<Zap className="h-5 w-5 text-blue-500" />
												AI Shortcut Route Comparison
											</CardTitle>
											<CardDescription className="text-slate-400">
												AI found an alternative route
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<div className="p-3 bg-slate-800 rounded-lg">
													<div className="text-xs text-slate-400 mb-1">Normal Route</div>
													<div className="text-lg font-bold text-white">{formatMinutesToHours(route.duration)}</div>
													<div className="text-xs text-slate-400">{route.distance.toFixed(1)} km</div>
												</div>
												<div className="p-3 bg-slate-800/50 rounded-lg border-2 border-blue-600">
													<div className="text-xs text-blue-400 mb-1 flex items-center gap-1">
														<Zap className="h-3 w-3" />
														AI Shortcut
													</div>
													<div className="text-lg font-bold text-blue-300">
														{formatMinutesToHours(aiShortcutRoute.duration)}
													</div>
													<div className="text-xs text-blue-400">
														{aiShortcutRoute.distance.toFixed(1)} km
													</div>
												</div>
											</div>
											{aiShortcutRoute.shortcutSavings !== undefined && aiShortcutRoute.shortcutSavings > 0 && (
												<Alert className="bg-green-900/30 border-green-700">
													<AlertDescription className="text-sm">
														<strong className="text-green-400">Time Saved: </strong>
														<span className="text-green-300">
															{formatMinutesToHours(aiShortcutRoute.shortcutSavings)}
														</span>
													</AlertDescription>
												</Alert>
											)}
											<div>
												<div className="text-sm font-medium mb-2 text-slate-300">AI Shortcut Directions:</div>
												<ScrollArea className="h-40">
													<div className="space-y-2">
														{aiShortcutRoute.steps.map((step, idx) => (
															<div key={idx} className="flex gap-2 text-xs p-2 bg-slate-800/30 rounded">
																<div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
																	{idx + 1}
																</div>
																<div className="flex-1 text-slate-300">{step}</div>
															</div>
														))}
													</div>
												</ScrollArea>
											</div>
										</CardContent>
									</Card>
								)}

								{/* User Feedback Panel - Always shown when route exists */}
								{route && (
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2 text-blue-400">
												<MessageSquare className="h-5 w-5 text-blue-500" />
												Share Feedback
											</CardTitle>
											<CardDescription className="text-slate-400">
												Help us improve route predictions and traffic accuracy
											</CardDescription>
										</CardHeader>
										<CardContent>
											<FeedbackForm onSubmit={submitFeedback} />

											<Separator className="my-4 bg-slate-700" />

											<div>
												<div className="text-sm font-medium mb-2 flex items-center gap-2 text-slate-300">
													<BarChart3 className="h-4 w-4" />
													Your Feedback
												</div>
												<ScrollArea className="h-40">
													{feedbackList.length > 0 ? (
														<div className="space-y-2">
															{feedbackList.map((fb) => (
																<div key={fb.id} className="p-2 bg-slate-800/30 rounded border border-slate-600 text-xs">
																	<div className="flex items-center justify-between mb-1">
																		<Badge variant="outline" className="text-xs capitalize border-blue-600 text-blue-400">
																			{fb.feedbackType.replace('_', ' ')}
																		</Badge>
																		<div className="text-blue-400 font-bold flex items-center gap-1">
																			<StarRating rating={fb.rating} size="sm" interactive={false} />
																		</div>
																	</div>
																	{fb.comments && <div className="text-slate-300 mb-1">{fb.comments}</div>}
																	<div className="text-slate-400">
																		{fb.origin} → {fb.destination}
																	</div>
																	<div className="text-slate-500 text-xs mt-1">
																		{fb.timestamp.toLocaleString()}
																	</div>
																</div>
															))}
														</div>
													) : (
														<div className="text-sm text-slate-400 text-center py-8">
															No feedback submitted yet
														</div>
													)}
												</ScrollArea>
											</div>
										</CardContent>
									</Card>
								)}

							</>
						) : (
							<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
								<CardContent className="pt-6">
									<div className="text-center text-slate-400 py-12">
										<RouteIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-blue-500" />
										<p>Enter origin and destination to calculate route</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
					</TabsContent>

					{/* Live Navigation Tab */}
					<TabsContent value="navigate">
						{route && route.directionSteps ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{/* Left Panel - Directions */}
								<div className="space-y-4">
									{/* Navigation Controls */}
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
										<CardHeader>
											<CardTitle className="flex items-center justify-between text-blue-400">
												<div className="flex items-center gap-2">
													<Navigation className="h-5 w-5" />
													Live Navigation
													{isNavigating && (
														<Badge className="bg-green-600 text-white text-xs">Active</Badge>
													)}
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setVoiceEnabled(!voiceEnabled)}
														className={cn(
															"text-slate-400 hover:text-white",
															voiceEnabled && "text-blue-400"
														)}
													>
														{voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
													</Button>
												</div>
											</CardTitle>
											<CardDescription className="text-slate-400">
												{origin?.name} → {destination?.name}
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											{/* Permission Requesting Alert */}
											{isRequestingLocation && (
												<Alert className="bg-slate-800/30 border-slate-600">
													<Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
													<AlertDescription className="text-blue-300 text-sm ml-2">
														Please allow location access in your browser to enable live navigation.
													</AlertDescription>
												</Alert>
											)}

											{/* Permission Warning */}
											{locationPermission === 'denied' && !isRequestingLocation && (
												<Alert className="bg-red-900/30 border-red-700">
													<AlertTriangle className="h-4 w-4 text-red-400" />
													<AlertDescription className="text-red-300 text-sm ml-2">
														Location permission denied. Please enable location access in your browser settings.
													</AlertDescription>
												</Alert>
											)}

											{/* Location Ready Indicator */}
											{locationPermission === 'granted' && !isNavigating && !isRequestingLocation && (
												<div className="p-2 bg-green-900/20 rounded-lg border border-green-700/50 flex items-center gap-2">
													<Check className="h-4 w-4 text-green-400" />
													<span className="text-green-300 text-sm">Location access enabled - ready to navigate</span>
												</div>
											)}

											{/* User Location Info */}
											{userLocation && isNavigating && (
												<div className="p-3 bg-slate-800 rounded-lg border border-slate-600">
													<div className="flex items-center gap-2 text-sm text-slate-300">
														<LocateFixed className="h-4 w-4 text-green-400" />
														<span>Current Location:</span>
														<span className="text-green-400">
															{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
														</span>
													</div>
													{distanceToNextStep !== null && (
														<div className="text-xs text-slate-400 mt-1">
															Distance to next step: {formatDistance(distanceToNextStep)}
														</div>
													)}
												</div>
											)}

											{/* Navigation Buttons */}
											<div className="flex gap-2">
												{!isNavigating ? (
													<Button
														onClick={startNavigation}
														disabled={isRequestingLocation || locationPermission === 'denied'}
														className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
													>
														{isRequestingLocation ? (
															<>
																<Loader2 className="h-4 w-4 mr-2 animate-spin" />
																Requesting Location...
															</>
														) : (
															<>
																<Play className="h-4 w-4 mr-2" />
																Start Navigation
															</>
														)}
													</Button>
												) : (
													<Button
														onClick={stopNavigation}
														variant="destructive"
														className="flex-1"
													>
														<Pause className="h-4 w-4 mr-2" />
														Stop Navigation
													</Button>
												)}
											</div>

											{/* Voice Status */}
											<div className="flex items-center gap-2 text-xs text-slate-400">
												{voiceEnabled ? (
													<>
														<Volume2 className="h-3 w-3 text-blue-400" />
														Voice navigation enabled
													</>
												) : (
													<>
														<VolumeX className="h-3 w-3" />
														Voice navigation disabled
													</>
												)}
											</div>
										</CardContent>
									</Card>

									{/* Current Step Highlight */}
									{isNavigating && route.directionSteps[currentStepIndex] && (
										<Card className="bg-gradient-to-r from-slate-800 to-slate-800/80 border-blue-600">
											<CardContent className="pt-6">
												<div className="flex items-start gap-4">
													<div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white">
														{getDirectionIcon(route.directionSteps[currentStepIndex].icon)}
													</div>
													<div className="flex-1">
														<div className="text-xs text-blue-300 mb-1">
															Step {currentStepIndex + 1} of {route.directionSteps.length}
														</div>
														<div className="text-lg font-medium text-white">
															{route.directionSteps[currentStepIndex].instruction}
														</div>
														{route.directionSteps[currentStepIndex].distance > 0 && (
															<div className="text-sm text-slate-400 mt-1">
																{formatDistance(route.directionSteps[currentStepIndex].distance)}
															</div>
														)}
														{route.directionSteps[currentStepIndex].warning && (
															<div className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
																<AlertTriangle className="h-3 w-3" />
																{route.directionSteps[currentStepIndex].warning}
															</div>
														)}
													</div>
												</div>

												{/* Next Step Preview */}
												{currentStepIndex < route.directionSteps.length - 1 && (
													<div className="mt-4 pt-4 border-t border-slate-600">
														<div className="flex items-center gap-2 text-sm text-slate-400">
															<ChevronRight className="h-4 w-4" />
															<span>Next:</span>
															<span className="text-slate-300">
																{route.directionSteps[currentStepIndex + 1].shortInstruction}
															</span>
														</div>
													</div>
												)}
											</CardContent>
										</Card>
									)}

									{/* All Directions List */}
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
										<CardHeader>
											<CardTitle className="text-lg text-blue-400 flex items-center gap-2">
												<RouteIcon className="h-5 w-5" />
												All Directions
											</CardTitle>
											<CardDescription className="text-slate-400">
												{route.directionSteps.length} steps • {route.distance.toFixed(1)} km
											</CardDescription>
										</CardHeader>
										<CardContent>
											<ScrollArea className="h-80">
												<div className="space-y-2">
													{route.directionSteps.map((step, idx) => (
														<div
															key={idx}
															className={cn(
																"flex gap-3 p-3 rounded-lg transition-colors",
																idx === currentStepIndex && isNavigating
																	? "bg-blue-600/30 border border-blue-500"
																	: idx < currentStepIndex && isNavigating
																	? "bg-slate-800/50 opacity-60"
																	: "bg-slate-800 hover:bg-slate-800/30"
															)}
														>
															<div className={cn(
																"flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full",
																idx === currentStepIndex && isNavigating
																	? "bg-blue-600 text-white"
																	: idx < currentStepIndex && isNavigating
																	? "bg-slate-600 text-slate-400"
																	: "bg-slate-700 text-slate-300"
															)}>
																{getDirectionIcon(step.icon)}
															</div>
															<div className="flex-1 min-w-0">
																<div className={cn(
																	"text-sm leading-relaxed",
																	idx === currentStepIndex && isNavigating
																		? "text-white font-medium"
																		: "text-slate-300"
																)}>
																	{step.instruction}
																</div>
																{step.distance > 0 && (
																	<div className="text-xs text-slate-500 mt-0.5">
																		{formatDistance(step.distance)}
																	</div>
																)}
																{step.warning && (
																	<div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
																		<AlertTriangle className="h-3 w-3" />
																		{step.warning}
																	</div>
																)}
															</div>
															<div className="flex-shrink-0 text-xs text-slate-500">
																{idx + 1}
															</div>
														</div>
													))}
												</div>
											</ScrollArea>
										</CardContent>
									</Card>
								</div>

								{/* Right Panel - Map */}
								<div className="space-y-4">
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700 h-[600px]">
										<CardHeader className="pb-2">
											<CardTitle className="text-lg text-blue-400 flex items-center gap-2">
												<MapPin className="h-5 w-5" />
												Live Map
												{userLocation && (
													<Badge className="bg-green-600 text-white text-xs">GPS Active</Badge>
												)}
											</CardTitle>
										</CardHeader>
										<CardContent className="h-[520px] p-2">
											<MapContainer
												center={userLocation ? [userLocation.lat, userLocation.lng] : mapCenter}
												zoom={15}
												className="h-full w-full rounded-lg"
												scrollWheelZoom={true}
											>
												<TileLayer
													attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
													url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
												/>

												{/* Route Polyline */}
												<Polyline
													positions={route.coordinates}
													color="#9333ea"
													weight={5}
													opacity={0.8}
												/>

												{/* Traveled Path Polyline - shows where user has been */}
												{traveledPath.length > 1 && (
													<Polyline
														positions={traveledPath}
														color="#22c55e"
														weight={6}
														opacity={0.9}
													/>
												)}

												{/* Origin Marker */}
												{origin && (
													<Marker position={[origin.lat, origin.lng]}>
														<Popup>
															<div className="font-medium">Start: {origin.name}</div>
														</Popup>
													</Marker>
												)}

												{/* Destination Marker */}
												{destination && (
													<Marker position={[destination.lat, destination.lng]}>
														<Popup>
															<div className="font-medium">End: {destination.name}</div>
														</Popup>
													</Marker>
												)}

												{/* User Location Marker */}
												{userLocation && (
													<Marker position={[userLocation.lat, userLocation.lng]}>
														<Popup>
															<div className="font-medium text-green-600">Your Location</div>
														</Popup>
													</Marker>
												)}

												{/* Map updater component */}
												<MapUpdater
													center={userLocation ? [userLocation.lat, userLocation.lng] : (origin ? [origin.lat, origin.lng] : mapCenter)}
													zoom={isNavigating && userLocation ? 17 : 13}
												/>
											</MapContainer>
										</CardContent>
									</Card>

									{/* Route Summary */}
									<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
										<CardContent className="pt-6">
											<div className="grid grid-cols-3 gap-4 text-center">
												<div>
													<div className="text-2xl font-bold text-blue-400">
														{route.distance.toFixed(1)}
													</div>
													<div className="text-xs text-slate-400">km</div>
												</div>
												<div>
													<div className="text-2xl font-bold text-blue-400">
														{formatMinutesToHours(route.adjustedDuration || route.duration)}
													</div>
													<div className="text-xs text-slate-400">duration</div>
												</div>
												<div>
													<div className="text-2xl font-bold text-blue-400">
														{route.directionSteps.length}
													</div>
													<div className="text-xs text-slate-400">steps</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						) : (
							<Card className="bg-slate-900/95 backdrop-blur border-slate-700">
								<CardContent className="pt-6">
									<div className="text-center text-slate-400 py-12">
										<Navigation className="h-12 w-12 mx-auto mb-4 opacity-50 text-blue-500" />
										<p>Calculate a route first to use live navigation</p>
										<Button
											onClick={() => setMainTab('plan')}
											className="mt-4 bg-blue-600 hover:bg-blue-700"
										>
											Plan a Route
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
