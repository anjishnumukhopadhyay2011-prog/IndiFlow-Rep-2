/**
 * IP Geolocation Service for IndiFlow Traffic Optimizer
 *
 * Uses ipapi.co for IP-based geolocation as a fallback/alternative to GPS.
 * This is more reliable in environments where GPS is unavailable.
 */

const IP_GEOLOCATION_API_KEY = '268b807014336acc37511ae32915bc69';
const IP_GEOLOCATION_BASE_URL = 'https://api.ipgeolocation.io/ipgeo';

export interface IPGeolocationResult {
	success: boolean;
	lat: number;
	lng: number;
	city: string;
	region: string;
	country: string;
	timezone: string;
	localTime: string;
	ip: string;
	isp?: string;
	error?: string;
}

export interface TrafficContextFromIP {
	location: IPGeolocationResult;
	estimatedTrafficLevel: 'low' | 'moderate' | 'high';
	localTimeOfDay: 'morning_rush' | 'midday' | 'evening_rush' | 'night' | 'weekend';
	weatherNote?: string;
}

/**
 * Get user's location based on their IP address
 */
export async function getIPGeolocation(): Promise<IPGeolocationResult> {
	try {
		const response = await fetch(
			`${IP_GEOLOCATION_BASE_URL}?apiKey=${IP_GEOLOCATION_API_KEY}`
		);

		if (!response.ok) {
			throw new Error(`IP Geolocation API error: ${response.status}`);
		}

		const data = await response.json();

		// Check for API error in response
		if (data.message) {
			throw new Error(data.message);
		}

		return {
			success: true,
			lat: parseFloat(data.latitude) || 0,
			lng: parseFloat(data.longitude) || 0,
			city: data.city || 'Unknown',
			region: data.state_prov || data.region || 'Unknown',
			country: data.country_name || 'Unknown',
			timezone: data.time_zone?.name || 'UTC',
			localTime: data.time_zone?.current_time || new Date().toISOString(),
			ip: data.ip || 'Unknown',
			isp: data.isp,
		};
	} catch (error) {
		console.error('IP Geolocation error:', error);
		return {
			success: false,
			lat: 0,
			lng: 0,
			city: 'Unknown',
			region: 'Unknown',
			country: 'Unknown',
			timezone: 'UTC',
			localTime: new Date().toISOString(),
			ip: 'Unknown',
			error: error instanceof Error ? error.message : 'Failed to get IP location',
		};
	}
}

/**
 * Determine time of day category for traffic estimation
 */
function getTimeOfDayCategory(localTime: string): TrafficContextFromIP['localTimeOfDay'] {
	try {
		const date = new Date(localTime);
		const hour = date.getHours();
		const day = date.getDay(); // 0 = Sunday, 6 = Saturday

		// Weekend
		if (day === 0 || day === 6) {
			return 'weekend';
		}

		// Morning rush: 7 AM - 10 AM
		if (hour >= 7 && hour < 10) {
			return 'morning_rush';
		}

		// Evening rush: 5 PM - 8 PM
		if (hour >= 17 && hour < 20) {
			return 'evening_rush';
		}

		// Night: 9 PM - 6 AM
		if (hour >= 21 || hour < 6) {
			return 'night';
		}

		// Midday
		return 'midday';
	} catch {
		return 'midday';
	}
}

/**
 * Estimate traffic level based on time of day and location context
 */
function estimateTrafficLevel(
	timeOfDay: TrafficContextFromIP['localTimeOfDay'],
	city: string
): 'low' | 'moderate' | 'high' {
	// Major Indian cities typically have heavier traffic
	const majorCities = [
		'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad',
		'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur',
		'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
		'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara'
	];

	const isMajorCity = majorCities.some(mc => city.toLowerCase().includes(mc));

	switch (timeOfDay) {
		case 'morning_rush':
		case 'evening_rush':
			return isMajorCity ? 'high' : 'moderate';
		case 'midday':
			return isMajorCity ? 'moderate' : 'low';
		case 'night':
			return 'low';
		case 'weekend':
			return isMajorCity ? 'moderate' : 'low';
		default:
			return 'moderate';
	}
}

/**
 * Get full traffic context based on IP geolocation
 */
export async function getTrafficContextFromIP(): Promise<TrafficContextFromIP> {
	const location = await getIPGeolocation();

	const localTimeOfDay = getTimeOfDayCategory(location.localTime);
	const estimatedTrafficLevel = estimateTrafficLevel(localTimeOfDay, location.city);

	return {
		location,
		estimatedTrafficLevel,
		localTimeOfDay,
	};
}

/**
 * Format location for display
 */
export function formatIPLocation(location: IPGeolocationResult): string {
	if (!location.success) {
		return 'Location unavailable';
	}

	const parts = [location.city];
	if (location.region && location.region !== location.city) {
		parts.push(location.region);
	}
	if (location.country) {
		parts.push(location.country);
	}

	return parts.join(', ');
}
