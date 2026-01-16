// Google Maps API Service
// Provides Places Autocomplete, Geocoding, and Directions functionality

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Check if Google API key is configured
export function isGoogleMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0);
}

// Types
export interface GooglePlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  types: string[];
  vicinity?: string;
}

export interface GoogleDirectionsResult {
  distance: number; // in km
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes (with live traffic)
  polyline: string; // encoded polyline
  coordinates: [number, number][]; // decoded [lat, lng] pairs
  steps: GoogleDirectionStep[];
  summary: string;
}

export interface GoogleDirectionStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  travelMode: string;
}

export interface GoogleTrafficData {
  congestionLevel: 'low' | 'moderate' | 'heavy' | 'severe';
  durationInTraffic: number;
  delayMinutes: number;
}

// Decode Google's encoded polyline
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

// Google Places Autocomplete
export async function searchPlacesAutocomplete(
  query: string,
  options?: {
    types?: string[];
    componentRestrictions?: { country: string };
    location?: { lat: number; lng: number };
    radius?: number;
  }
): Promise<GooglePlacePrediction[]> {
  if (!isGoogleMapsConfigured() || !query || query.length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
    });

    // Default to India
    if (options?.componentRestrictions?.country) {
      params.append('components', `country:${options.componentRestrictions.country}`);
    } else {
      params.append('components', 'country:in');
    }

    if (options?.types && options.types.length > 0) {
      params.append('types', options.types.join('|'));
    }

    if (options?.location) {
      params.append('location', `${options.location.lat},${options.location.lng}`);
      params.append('radius', String(options?.radius || 50000));
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Places] API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Google Places] API status:', data.status, data.error_message);
      return [];
    }

    return (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types || [],
    }));
  } catch (error) {
    console.error('[Google Places] Search error:', error);
    return [];
  }
}

// Get place details from place ID
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!isGoogleMapsConfigured() || !placeId) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,types,vicinity',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Places] Details API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[Google Places] Details status:', data.status);
      return null;
    }

    const result = data.result;
    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      types: result.types || [],
      vicinity: result.vicinity,
    };
  } catch (error) {
    console.error('[Google Places] Details error:', error);
    return null;
  }
}

// Google Geocoding (address to coordinates)
export async function geocodeAddress(address: string): Promise<GooglePlaceDetails | null> {
  if (!isGoogleMapsConfigured() || !address) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      address: address,
      key: GOOGLE_MAPS_API_KEY,
      region: 'in', // Bias to India
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Geocode] API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('[Google Geocode] Status:', data.status);
      return null;
    }

    const result = data.results[0];
    return {
      placeId: result.place_id,
      name: result.formatted_address.split(',')[0],
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      types: result.types || [],
    };
  } catch (error) {
    console.error('[Google Geocode] Error:', error);
    return null;
  }
}

// Reverse geocoding (coordinates to address)
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GooglePlaceDetails | null> {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Reverse Geocode] API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    return {
      placeId: result.place_id,
      name: result.formatted_address.split(',')[0],
      formattedAddress: result.formatted_address,
      lat: lat,
      lng: lng,
      types: result.types || [],
    };
  } catch (error) {
    console.error('[Google Reverse Geocode] Error:', error);
    return null;
  }
}

// Google Directions API
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    departureTime?: Date;
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    alternatives?: boolean;
  }
): Promise<GoogleDirectionsResult | null> {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: GOOGLE_MAPS_API_KEY,
      mode: options?.mode || 'driving',
    });

    if (options?.departureTime) {
      params.append('departure_time', String(Math.floor(options.departureTime.getTime() / 1000)));
    } else if (options?.mode === 'driving') {
      // Use current time for traffic data
      params.append('departure_time', 'now');
    }

    if (options?.avoidTolls) {
      params.append('avoid', 'tolls');
    }

    if (options?.avoidHighways) {
      const avoid = params.get('avoid');
      params.set('avoid', avoid ? `${avoid}|highways` : 'highways');
    }

    if (options?.alternatives) {
      params.append('alternatives', 'true');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Directions] API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.error('[Google Directions] Status:', data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode the polyline
    const coordinates = decodePolyline(route.overview_polyline.points);

    // Parse steps
    const steps: GoogleDirectionStep[] = (leg.steps || []).map((step: any) => ({
      instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
      distance: step.distance.value,
      duration: step.duration.value,
      startLocation: {
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      },
      endLocation: {
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      },
      travelMode: step.travel_mode,
    }));

    return {
      distance: leg.distance.value / 1000, // Convert to km
      duration: leg.duration.value / 60, // Convert to minutes
      durationInTraffic: leg.duration_in_traffic
        ? leg.duration_in_traffic.value / 60
        : undefined,
      polyline: route.overview_polyline.points,
      coordinates,
      steps,
      summary: route.summary,
    };
  } catch (error) {
    console.error('[Google Directions] Error:', error);
    return null;
  }
}

// Get traffic data for a route
export async function getTrafficInfo(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleTrafficData | null> {
  const directions = await getDirections(origin, destination, {
    mode: 'driving',
    departureTime: new Date(),
  });

  if (!directions || !directions.durationInTraffic) {
    return null;
  }

  const delay = directions.durationInTraffic - directions.duration;
  const delayRatio = delay / directions.duration;

  let congestionLevel: GoogleTrafficData['congestionLevel'];
  if (delayRatio <= 0.1) {
    congestionLevel = 'low';
  } else if (delayRatio <= 0.25) {
    congestionLevel = 'moderate';
  } else if (delayRatio <= 0.5) {
    congestionLevel = 'heavy';
  } else {
    congestionLevel = 'severe';
  }

  return {
    congestionLevel,
    durationInTraffic: directions.durationInTraffic,
    delayMinutes: Math.max(0, delay),
  };
}

// Distance Matrix API for multiple origins/destinations
export async function getDistanceMatrix(
  origins: { lat: number; lng: number }[],
  destinations: { lat: number; lng: number }[],
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    departureTime?: Date;
  }
): Promise<{
  rows: {
    elements: {
      distance: number; // in km
      duration: number; // in minutes
      durationInTraffic?: number;
      status: string;
    }[];
  }[];
} | null> {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  try {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

    const params = new URLSearchParams({
      origins: originsStr,
      destinations: destinationsStr,
      key: GOOGLE_MAPS_API_KEY,
      mode: options?.mode || 'driving',
    });

    if (options?.departureTime) {
      params.append('departure_time', String(Math.floor(options.departureTime.getTime() / 1000)));
    } else if (options?.mode === 'driving' || !options?.mode) {
      params.append('departure_time', 'now');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Google Distance Matrix] API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[Google Distance Matrix] Status:', data.status);
      return null;
    }

    return {
      rows: data.rows.map((row: any) => ({
        elements: row.elements.map((element: any) => ({
          distance: element.status === 'OK' ? element.distance.value / 1000 : 0,
          duration: element.status === 'OK' ? element.duration.value / 60 : 0,
          durationInTraffic: element.duration_in_traffic
            ? element.duration_in_traffic.value / 60
            : undefined,
          status: element.status,
        })),
      })),
    };
  } catch (error) {
    console.error('[Google Distance Matrix] Error:', error);
    return null;
  }
}

// Export the API key for components that need it (e.g., for Google Maps JavaScript API)
export function getGoogleMapsApiKey(): string {
  return GOOGLE_MAPS_API_KEY;
}

// Service status check
export async function checkGoogleMapsStatus(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
}> {
  if (!isGoogleMapsConfigured()) {
    return { configured: false, working: false, error: 'API key not configured' };
  }

  try {
    // Try a simple geocode request to verify the API key works
    const result = await geocodeAddress('Mumbai, India');
    return {
      configured: true,
      working: result !== null,
      error: result === null ? 'API key may be invalid or restricted' : undefined,
    };
  } catch (error) {
    return {
      configured: true,
      working: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  isGoogleMapsConfigured,
  searchPlacesAutocomplete,
  getPlaceDetails,
  geocodeAddress,
  reverseGeocode,
  getDirections,
  getTrafficInfo,
  getDistanceMatrix,
  getGoogleMapsApiKey,
  checkGoogleMapsStatus,
};
