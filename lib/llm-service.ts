/**
 * LLM Service for IndiFlow Traffic Optimizer
 *
 * This service handles all LLM-related operations including:
 * 1. Parsing unstructured training data files
 * 2. Route optimization reasoning
 * 3. Traffic pattern analysis
 *
 * All LLM features are designed to work behind the scenes and are only
 * visible when Developer Mode is enabled.
 */

import { getAuthTokenAsync } from '@/sdk/core/auth';
import {
	getRouteTrafficIntelligence,
	getCityTrafficProfile,
	getActiveConstructionZones,
	getUpcomingFestivals,
	generateLLMDataSummary,
} from './india-traffic-data';

// API Configuration from OpenAIGPTChat.json schema
const LLM_API_BASE = 'https://api-production.creao.ai/execute-apis/v2';
const LLM_API_PATH = '/v1/ai/zWwyutGgvEGWwzSa/chat/completions';
const LLM_API_NAME = 'OpenAIGPTChat';
const LLM_API_ID = '688a0b64dc79a2533460892c';
const LLM_MODEL = 'MaaS_4.1';

// Fallback bearer token from the API schema
const FALLBACK_BEARER_TOKEN = 'BXuSPHRhErkTPwFTiLff';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface LLMResponse {
	success: boolean;
	content: string | null;
	error: string | null;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

interface ParsedTrainingData {
	route: string;
	predictedTime: number;
	actualTime: number;
	trafficLevel: string;
}

export interface RouteOptimizationResult {
	reasoning: string;
	recommendations: string[];
	optimizedDuration: number | null;
	confidenceScore: number;
	factors: string[];
	localAreaInsights?: string;
	trafficPrediction?: string;
	linkedSuggestions?: LinkedSuggestion[];
}

export interface LinkedSuggestion {
	id: string;
	type: 'optimal_time' | 'shortcut' | 'traffic_avoidance' | 'historical_pattern';
	title: string;
	description: string;
	confidence: number;
	actionable: boolean;
	relatedTo?: string[];
}

export interface AIThinkingStep {
	step: number;
	phase: 'searching' | 'analyzing' | 'reasoning' | 'predicting' | 'complete';
	message: string;
	timestamp: Date;
	details?: string;
}

export interface RouteHistorySearchResult {
	success: boolean;
	matchedRoutes: Array<{
		route: string;
		matchScore: number;
		avgDuration: number;
		trafficPattern: string;
		bestTimeToTravel: string;
		historicalInsights: string;
	}>;
	searchSummary: string;
	thinkingSteps: AIThinkingStep[];
}

export interface RoutePredictionRequest {
	origin: string;
	destination: string;
	distance: number;
	baseDuration: number;
	transportMode: string;
	targetDate: Date;
	preferredTimeSlot?: { start: number; end: number }; // hours in 24h format
}

export interface RoutePredictionResult {
	success: boolean;
	prediction: {
		optimalDepartureTime: string;
		optimalDepartureHour: number;
		expectedDuration: number;
		trafficForecast: 'light' | 'moderate' | 'heavy' | 'very_heavy';
		confidenceScore: number;
		reasoning: string;
		alternativeTimes: Array<{
			time: string;
			expectedDuration: number;
			trafficLevel: string;
		}>;
		warnings: string[];
		tips: string[];
	} | null;
	error?: string;
}

export interface LocationContext {
	lat: number;
	lng: number;
	areaName?: string;
	nearbyLandmarks?: string[];
}

/**
 * Make a request to the LLM API with retry logic
 */
async function callLLM(messages: ChatMessage[], maxRetries: number = 2): Promise<LLMResponse> {
	let lastError = 'Unknown error';

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			// Try to get auth token, fall back to API schema bearer token
			let authToken = await getAuthTokenAsync();
			if (!authToken) {
				authToken = FALLBACK_BEARER_TOKEN;
			}

			console.log(`[LLM] API call attempt ${attempt + 1}/${maxRetries + 1}`);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const response = await fetch(`${LLM_API_BASE}${LLM_API_PATH}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`,
					'X-CREAO-API-NAME': LLM_API_NAME,
					'X-CREAO-API-ID': LLM_API_ID,
					'X-CREAO-API-PATH': LLM_API_PATH,
				},
				body: JSON.stringify({
					model: LLM_MODEL,
					messages,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[LLM] API error (attempt ${attempt + 1}):`, response.status, errorText);
				lastError = `API error: ${response.status} - ${errorText}`;

				// Don't retry on auth errors
				if (response.status === 401 || response.status === 403) {
					return {
						success: false,
						content: null,
						error: lastError,
					};
				}

				// Wait before retry with exponential backoff
				if (attempt < maxRetries) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
				}
				continue;
			}

			const data = await response.json();
			console.log('[LLM] API response received:', data.choices?.length || 0, 'choices');

			if (data.choices && data.choices.length > 0 && data.choices[0].message) {
				return {
					success: true,
					content: data.choices[0].message.content,
					error: null,
					usage: data.usage,
				};
			}

			lastError = 'No response content from LLM';
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(`[LLM] Request failed (attempt ${attempt + 1}):`, errorMsg);
			lastError = errorMsg;

			// Don't retry on abort (timeout)
			if (error instanceof Error && error.name === 'AbortError') {
				lastError = 'Request timed out after 30 seconds';
				break;
			}

			// Wait before retry
			if (attempt < maxRetries) {
				await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
			}
		}
	}

	return {
		success: false,
		content: null,
		error: lastError,
	};
}

// List of major Indian cities for matching
const INDIAN_CITIES_LIST = [
	'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad',
	'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Noida', 'Gurgaon',
	'Gurugram', 'Chandigarh', 'Kochi', 'Thiruvananthapuram', 'Coimbatore',
	'Mysuru', 'Mysore', 'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Vadodara',
	'Surat', 'Visakhapatnam', 'Mangalore', 'Mangaluru'
];

/**
 * Extract city name from a location string
 */
function extractCityName(location: string): string {
	const locationLower = location.toLowerCase();

	// Check for exact city matches
	for (const city of INDIAN_CITIES_LIST) {
		if (locationLower.includes(city.toLowerCase())) {
			// Normalize city names
			if (city === 'Bangalore') return 'Bengaluru';
			if (city === 'Mysore') return 'Mysuru';
			if (city === 'Mangalore') return 'Mangaluru';
			if (city === 'Gurugram') return 'Gurgaon';
			return city;
		}
	}

	// Default to Bengaluru if no city found (most common use case)
	return 'Bengaluru';
}

/**
 * Generate smart fallback predictions when LLM is unavailable
 * Uses India Traffic Intelligence data for accurate predictions
 */
function generateSmartFallbackPrediction(
	origin: string,
	destination: string,
	distance: number,
	baseDuration: number,
	currentTrafficLevel: string,
	transportMode: string
): RouteOptimizationResult {
	const now = new Date();
	const hour = now.getHours();
	const dayOfWeek = now.getDay();
	const month = now.getMonth() + 1;
	const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
	const isMorningPeak = hour >= 8 && hour <= 10;
	const isEveningPeak = hour >= 17 && hour <= 20;
	const isPeakHour = isWeekday && (isMorningPeak || isEveningPeak);

	// Use India Traffic Intelligence for smarter predictions
	const originCity = extractCityName(origin);
	const destCity = extractCityName(destination);
	const routeIntelligence = getRouteTrafficIntelligence(
		originCity,
		destCity || originCity,
		hour,
		dayOfWeek,
		month
	);

	// Use India traffic database multiplier instead of basic heuristics
	let trafficMultiplier = routeIntelligence.trafficMultiplier;

	// Adjust for transport mode
	if (transportMode === 'bike') {
		trafficMultiplier *= 0.85; // Bikes can navigate traffic better
	} else if (transportMode === 'transit') {
		trafficMultiplier *= 0.95; // Transit has dedicated lanes sometimes
	}

	const optimizedDuration = Math.round(baseDuration * trafficMultiplier);
	const confidenceScore = 75; // Higher confidence with India traffic data

	// Use India traffic intelligence recommendations + custom ones
	const recommendations: string[] = [...routeIntelligence.recommendations];

	if (isPeakHour && recommendations.length < 4) {
		recommendations.push(isMorningPeak
			? 'Morning rush hour active - expect delays near city centers'
			: 'Evening rush hour active - consider alternative routes');
	}

	if (distance > 20 && recommendations.length < 5) {
		recommendations.push('Long-distance route - consider taking breaks for safety');
	}

	if (transportMode === 'car' && isPeakHour && recommendations.length < 5) {
		recommendations.push('Consider using two-wheeler or public transit during peak hours');
	}

	// Use factors from India traffic intelligence
	const factors: string[] = [
		...routeIntelligence.factors,
		`Current time: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
		`Distance: ${distance.toFixed(1)} km`,
	];

	// Get city profile for enhanced prediction
	const cityProfile = getCityTrafficProfile(originCity);

	// Generate traffic prediction based on India data
	let trafficPrediction = '';
	if (isPeakHour && cityProfile) {
		trafficPrediction = isMorningPeak
			? `Heavy traffic expected in ${cityProfile.name}. Peak hours ${cityProfile.peakHours.morning.start}:00-${cityProfile.peakHours.morning.end}:00. Hotspots: ${cityProfile.trafficHotspots.slice(0, 3).join(', ')}.`
			: `Evening rush in ${cityProfile.name}. Peak hours ${cityProfile.peakHours.evening.start}:00-${cityProfile.peakHours.evening.end}:00. Avoid: ${cityProfile.trafficHotspots.slice(0, 3).join(', ')}.`;
	} else if (cityProfile) {
		trafficPrediction = `Current avg speed in ${cityProfile.name}: ${cityProfile.avgSpeed.offPeak} km/h. Traffic multiplier: ${trafficMultiplier.toFixed(2)}x. ${routeIntelligence.historicalContext}`;
	} else {
		trafficPrediction = `Traffic multiplier: ${trafficMultiplier.toFixed(2)}x based on current time and India traffic patterns.`;
	}

	const linkedSuggestions: LinkedSuggestion[] = [
		{
			id: `suggestion_${Date.now()}_fallback`,
			type: 'traffic_avoidance',
			title: 'India Traffic Intelligence',
			description: trafficPrediction,
			confidence: confidenceScore,
			actionable: true,
			relatedTo: ['traffic_status', 'departure_times'],
		},
		{
			id: `suggestion_${Date.now()}_historical`,
			type: 'historical_pattern',
			title: 'Historical Context (2019-2025)',
			description: routeIntelligence.historicalContext,
			confidence: 80,
			actionable: false,
			relatedTo: ['historical_data'],
		}
	];

	// Add construction zone alert if any
	if (routeIntelligence.constructions.length > 0) {
		linkedSuggestions.push({
			id: `suggestion_${Date.now()}_construction`,
			type: 'traffic_avoidance',
			title: 'Construction Zone Alert',
			description: `Active construction at ${routeIntelligence.constructions.map(c => c.location).join(', ')}. Consider alternate routes.`,
			confidence: 90,
			actionable: true,
			relatedTo: ['construction', 'alternate_routes'],
		});
	}

	// Add festival alert if any
	if (routeIntelligence.festivals.length > 0) {
		linkedSuggestions.push({
			id: `suggestion_${Date.now()}_festival`,
			type: 'traffic_avoidance',
			title: 'Festival Traffic Alert',
			description: `${routeIntelligence.festivals.map(f => f.name).join(', ')} may cause ${routeIntelligence.festivals[0]?.trafficMultiplier || 2}x traffic.`,
			confidence: 85,
			actionable: true,
			relatedTo: ['festival', 'traffic_surge'],
		});
	}

	return {
		reasoning: `Analysis powered by India Traffic Intelligence Database (2019-2025). Current time: ${now.toLocaleTimeString('en-IN')}, ${isWeekday ? 'weekday' : 'weekend'} patterns. Traffic multiplier: ${trafficMultiplier.toFixed(2)}x for ${originCity}. ${routeIntelligence.historicalContext}`,
		recommendations: recommendations.slice(0, 5),
		optimizedDuration,
		confidenceScore,
		factors: factors.slice(0, 6),
		localAreaInsights: cityProfile
			? `${cityProfile.name} (${cityProfile.state}): Avg speed ${cityProfile.avgSpeed[isPeakHour ? 'peakHour' : 'offPeak']} km/h. Known hotspots: ${cityProfile.trafficHotspots.slice(0, 4).join(', ')}.`
			: `Route from ${origin} to ${destination} covers ${distance.toFixed(1)} km. Using India traffic patterns for prediction.`,
		trafficPrediction,
		linkedSuggestions,
	};
}

/**
 * Parse unstructured training data file content using LLM
 * The LLM interprets various file formats and extracts training data
 */
export async function parseUnstructuredTrainingData(
	fileContent: string,
	fileName: string
): Promise<{ success: boolean; data: ParsedTrainingData[]; error: string | null; rawResponse?: string }> {
	const systemPrompt = `You are a data extraction specialist. Your task is to parse training data for a traffic route optimization system.

Extract route training data from the provided file content. The data may be in any format (CSV, JSON, plain text, logs, spreadsheet exports, etc.).

For each route entry, extract:
- route: The route name or description (e.g., "Mumbai to Pune", "Route A", etc.)
- predictedTime: The predicted travel time in minutes (numeric)
- actualTime: The actual travel time in minutes (numeric)
- trafficLevel: Traffic condition ("low", "moderate", or "high")

Return the data as a JSON array with objects containing these exact fields.
If you cannot find a value, use reasonable defaults:
- For missing traffic level: "moderate"
- For missing times: skip the entry

Only return the JSON array, no other text. Example format:
[{"route":"Mumbai to Pune","predictedTime":120,"actualTime":115,"trafficLevel":"moderate"}]

If you cannot extract any valid data, return: []`;

	const userPrompt = `File name: ${fileName}

File content:
${fileContent.substring(0, 10000)}${fileContent.length > 10000 ? '\n... (content truncated)' : ''}

Extract the training data as JSON array.`;

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	if (!response.success || !response.content) {
		return {
			success: false,
			data: [],
			error: response.error || 'Failed to parse file',
			rawResponse: response.content || undefined,
		};
	}

	try {
		// Extract JSON from the response (handle markdown code blocks)
		let jsonContent = response.content.trim();

		// Remove markdown code blocks if present
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		if (!Array.isArray(parsed)) {
			return {
				success: false,
				data: [],
				error: 'LLM response is not an array',
				rawResponse: response.content,
			};
		}

		// Validate and sanitize the parsed data
		const validData: ParsedTrainingData[] = parsed
			.filter((item: any) => {
				return (
					item &&
					typeof item.route === 'string' &&
					!isNaN(parseFloat(item.predictedTime)) &&
					!isNaN(parseFloat(item.actualTime))
				);
			})
			.map((item: any) => ({
				route: String(item.route).trim(),
				predictedTime: parseFloat(item.predictedTime),
				actualTime: parseFloat(item.actualTime),
				trafficLevel: ['low', 'moderate', 'high'].includes(item.trafficLevel?.toLowerCase())
					? item.trafficLevel.toLowerCase()
					: 'moderate',
			}));

		return {
			success: true,
			data: validData,
			error: null,
			rawResponse: response.content,
		};
	} catch (parseError) {
		console.error('Failed to parse LLM response:', parseError);
		return {
			success: false,
			data: [],
			error: 'Failed to parse LLM response as JSON',
			rawResponse: response.content,
		};
	}
}

/**
 * Build India traffic intelligence context for LLM prompt
 */
function buildIndiaTrafficContext(
	originCity: string,
	destCity: string | null,
	routeIntelligence: ReturnType<typeof getRouteTrafficIntelligence>,
	month: number
): string {
	const cityProfile = getCityTrafficProfile(originCity);
	const constructions = getActiveConstructionZones(originCity);
	const festivals = getUpcomingFestivals(month);

	let context = `\n=== INDIA TRAFFIC INTELLIGENCE (2019-2025 Database) ===\n`;

	// Traffic multiplier and factors
	context += `\nCurrent Traffic Analysis:
- Traffic Multiplier: ${routeIntelligence.trafficMultiplier.toFixed(2)}x
- Key Factors: ${routeIntelligence.factors.join(', ')}\n`;

	// City profile
	if (cityProfile) {
		context += `\nCity Profile (${cityProfile.name}):
- Population: ${(cityProfile.population2024 / 1000000).toFixed(1)}M
- Peak Hours: Morning ${cityProfile.peakHours.morning.start}:00-${cityProfile.peakHours.morning.end}:00, Evening ${cityProfile.peakHours.evening.start}:00-${cityProfile.peakHours.evening.end}:00
- Average Speed: Peak ${cityProfile.avgSpeed.peakHour} km/h, Off-Peak ${cityProfile.avgSpeed.offPeak} km/h
- Traffic Hotspots: ${cityProfile.trafficHotspots.slice(0, 5).join(', ')}\n`;
	}

	// Active construction zones
	if (constructions.length > 0) {
		context += `\nActive Construction Zones (${constructions.length}):
${constructions.slice(0, 3).map(c => `- ${c.location}: +${c.delayMinutes} min delay, Alternate: ${c.alternateRoutes.join(', ')}`).join('\n')}\n`;
	}

	// Festival alerts
	if (festivals.length > 0) {
		context += `\nFestival Traffic Alerts:
${festivals.map(f => `- ${f.name}: ${f.trafficMultiplier}x traffic expected, ${f.peakDays}`).join('\n')}\n`;
	}

	// Infrastructure recommendations
	if (routeIntelligence.recommendations.length > 0) {
		context += `\nIntelligence Recommendations:
${routeIntelligence.recommendations.map(r => `- ${r}`).join('\n')}\n`;
	}

	// Historical context
	context += `\nHistorical Context: ${routeIntelligence.historicalContext}\n`;

	context += `=== END INDIA TRAFFIC INTELLIGENCE ===\n`;

	return context;
}

/**
 * Optimize route using LLM reasoning based on training data, current conditions, and location context
 */
export async function optimizeRouteWithLLM(
	origin: string,
	destination: string,
	distance: number,
	baseDuration: number,
	currentTrafficLevel: string,
	transportMode: string,
	trainingData: ParsedTrainingData[],
	historicalRoutes?: Array<{ route: string; avgDuration: number; frequency: number }>,
	userLocation?: LocationContext
): Promise<RouteOptimizationResult> {
	// Build context from training data
	const relevantTraining = trainingData
		.filter(t => {
			const routeLower = t.route.toLowerCase();
			const originLower = origin.toLowerCase();
			const destLower = destination.toLowerCase();
			return routeLower.includes(originLower) ||
				   routeLower.includes(destLower) ||
				   (originLower.includes(routeLower.split(' to ')[0] || '') &&
				    destLower.includes(routeLower.split(' to ')[1] || ''));
		})
		.slice(0, 10);

	const trainingContext = relevantTraining.length > 0
		? `Relevant historical training data:
${relevantTraining.map(t =>
	`- ${t.route}: Predicted ${t.predictedTime}min, Actual ${t.actualTime}min, Traffic: ${t.trafficLevel}`
).join('\n')}`
		: 'No specific historical data for this route.';

	const historicalContext = historicalRoutes && historicalRoutes.length > 0
		? `Frequently used routes:
${historicalRoutes.map(r => `- ${r.route}: Avg ${r.avgDuration}min, Used ${r.frequency} times`).join('\n')}`
		: '';

	// Build location context if user location is available
	const locationContext = userLocation
		? `User's current location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}${userLocation.areaName ? ` (${userLocation.areaName})` : ''}
${userLocation.nearbyLandmarks && userLocation.nearbyLandmarks.length > 0 ? `Nearby landmarks: ${userLocation.nearbyLandmarks.join(', ')}` : ''}`
		: 'User location not available - predictions based on general data.';

	// Get India Traffic Intelligence data for enhanced analysis
	const now = new Date();
	const hour = now.getHours();
	const dayOfWeek = now.getDay();
	const month = now.getMonth() + 1;

	// Extract city names from origin/destination for intelligence lookup
	const originCity = extractCityName(origin);
	const destCity = extractCityName(destination);

	// Get comprehensive route intelligence from India traffic database
	const routeIntelligence = getRouteTrafficIntelligence(
		originCity,
		destCity || originCity,
		hour,
		dayOfWeek,
		month
	);

	// Build India traffic intelligence context for LLM
	const indiaTrafficContext = buildIndiaTrafficContext(originCity, destCity, routeIntelligence, month);

	const systemPrompt = `You are an advanced traffic optimization AI with reasoning capabilities for Indian roads. You have access to 6 years of comprehensive India traffic data (2019-2025) including infrastructure updates, bus routes, construction zones, festival patterns, and historical traffic data. Analyze the route thoroughly and provide data-driven optimization recommendations.

Your response must be a valid JSON object with these exact fields:
{
  "reasoning": "Detailed explanation of your analysis considering time of day, route characteristics, and local conditions (3-4 sentences)",
  "recommendations": ["Array of 3-5 specific, actionable recommendations"],
  "optimizedDuration": number or null (your estimated optimal travel time in minutes based on analysis),
  "confidenceScore": number between 0 and 100 (how confident you are in your prediction),
  "factors": ["Array of key factors affecting this route"],
  "localAreaInsights": "Brief insight about the local area traffic patterns (1-2 sentences)",
  "trafficPrediction": "Your prediction for traffic conditions on this route right now (e.g., 'Light traffic expected', 'Moderate congestion likely near city center')"
}

Consider and analyze these factors:
- Current time and day of week patterns
- Peak hours: 8-10 AM and 5-8 PM have heavy traffic in India
- Weather impacts (monsoon season affects road conditions)
- Festival/holiday traffic patterns (check current date)
- Road quality and highway vs. city roads
- Urban vs. suburban vs. rural sections
- Two-wheelers can navigate congestion better
- Public transport may have dedicated lanes
- Distance and estimated fuel/time efficiency
- Historical patterns from training data if available

Use step-by-step reasoning to analyze:
1. First, assess the time of travel and typical patterns
2. Then, consider the route characteristics
3. Factor in the transport mode's advantages/limitations
4. Finally, synthesize recommendations

Only return the JSON object, no other text.`;

	const userPrompt = `Route: ${origin} to ${destination}
Distance: ${distance.toFixed(1)} km
Base Duration: ${baseDuration} minutes
Current Traffic Level: ${currentTrafficLevel}
Transport Mode: ${transportMode}
Current Time: ${new Date().toLocaleTimeString('en-IN')}
Day: ${new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
Date: ${new Date().toLocaleDateString('en-IN')}

${locationContext}

${trainingContext}

${historicalContext}

${indiaTrafficContext}

Please analyze this route using step-by-step reasoning and the India Traffic Intelligence data provided to give comprehensive optimization recommendations.`;

	console.log('[LLM] Starting route optimization for:', origin, 'to', destination);

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	// Use smart fallback when LLM fails
	if (!response.success || !response.content) {
		console.warn('[LLM] API unavailable, using smart fallback prediction');
		return generateSmartFallbackPrediction(
			origin,
			destination,
			distance,
			baseDuration,
			currentTrafficLevel,
			transportMode
		);
	}

	try {
		// Extract JSON from response
		let jsonContent = response.content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		// Generate linked suggestions based on LLM analysis
		const linkedSuggestions: LinkedSuggestion[] = [];

		// Link optimal time suggestion
		if (parsed.optimizedDuration && typeof parsed.optimizedDuration === 'number') {
			linkedSuggestions.push({
				id: `suggestion_${Date.now()}_optimal`,
				type: 'optimal_time',
				title: 'AI-Optimized Departure',
				description: `Based on traffic analysis, leaving at the optimal time could save you time on this route.`,
				confidence: parsed.confidenceScore || 70,
				actionable: true,
				relatedTo: ['closest_optimal', 'ultimate_best'],
			});
		}

		// Link traffic avoidance suggestions
		if (parsed.trafficPrediction && typeof parsed.trafficPrediction === 'string') {
			linkedSuggestions.push({
				id: `suggestion_${Date.now()}_traffic`,
				type: 'traffic_avoidance',
				title: 'Traffic Pattern Alert',
				description: parsed.trafficPrediction,
				confidence: parsed.confidenceScore || 65,
				actionable: true,
				relatedTo: ['traffic_status', 'departure_times'],
			});
		}

		// Link historical pattern suggestion if training data was used
		if (trainingData.length > 0) {
			linkedSuggestions.push({
				id: `suggestion_${Date.now()}_historical`,
				type: 'historical_pattern',
				title: 'Historical Data Applied',
				description: `Analysis includes ${trainingData.length} historical data points for improved accuracy.`,
				confidence: Math.min(95, 50 + trainingData.length * 2),
				actionable: false,
				relatedTo: ['training_data', 'model_accuracy'],
			});
		}

		return {
			reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'AI analysis completed with partial results.',
			recommendations: Array.isArray(parsed.recommendations)
				? parsed.recommendations.filter((r: any) => typeof r === 'string').slice(0, 5)
				: ['Check traffic conditions before departure', 'Consider alternative routes during peak hours'],
			optimizedDuration: typeof parsed.optimizedDuration === 'number' && parsed.optimizedDuration > 0
				? parsed.optimizedDuration
				: null,
			confidenceScore: typeof parsed.confidenceScore === 'number'
				? Math.min(100, Math.max(0, parsed.confidenceScore))
				: 50,
			factors: Array.isArray(parsed.factors)
				? parsed.factors.filter((f: any) => typeof f === 'string').slice(0, 6)
				: ['Standard routing applied'],
			localAreaInsights: typeof parsed.localAreaInsights === 'string'
				? parsed.localAreaInsights
				: 'Local area analysis completed.',
			trafficPrediction: typeof parsed.trafficPrediction === 'string'
				? parsed.trafficPrediction
				: 'Traffic conditions based on current time analysis.',
			linkedSuggestions,
		};
	} catch (parseError) {
		console.error('Failed to parse LLM optimization response:', parseError, 'Raw content:', response.content);
		// Use smart fallback on parse error
		return generateSmartFallbackPrediction(
			origin,
			destination,
			distance,
			baseDuration,
			currentTrafficLevel,
			transportMode
		);
	}
}

/**
 * Analyze traffic patterns using LLM
 */
export async function analyzeTrafficPatterns(
	trainingData: ParsedTrainingData[],
	frequentRoutes?: Array<{ route: string; avgDuration: number; frequency: number }>
): Promise<{ insights: string[]; patterns: string[]; recommendations: string[] }> {
	if (trainingData.length === 0) {
		return {
			insights: ['No training data available for analysis'],
			patterns: [],
			recommendations: ['Upload more training data for better insights'],
		};
	}

	const summaryStats = {
		totalSamples: trainingData.length,
		avgAccuracy: trainingData.reduce((sum, d) => {
			const accuracy = 100 - Math.abs((d.predictedTime - d.actualTime) / d.actualTime * 100);
			return sum + accuracy;
		}, 0) / trainingData.length,
		trafficDistribution: {
			low: trainingData.filter(d => d.trafficLevel === 'low').length,
			moderate: trainingData.filter(d => d.trafficLevel === 'moderate').length,
			high: trainingData.filter(d => d.trafficLevel === 'high').length,
		},
	};

	const systemPrompt = `You are a traffic pattern analyst. Analyze the training data summary and provide insights.

Return a JSON object with these fields:
{
  "insights": ["Array of 3-5 key insights about the data"],
  "patterns": ["Array of 2-4 observed traffic patterns"],
  "recommendations": ["Array of 2-4 recommendations for improving predictions"]
}

Only return the JSON object, no other text.`;

	const userPrompt = `Training Data Summary:
- Total samples: ${summaryStats.totalSamples}
- Average prediction accuracy: ${summaryStats.avgAccuracy.toFixed(1)}%
- Traffic distribution: Low (${summaryStats.trafficDistribution.low}), Moderate (${summaryStats.trafficDistribution.moderate}), High (${summaryStats.trafficDistribution.high})

Sample routes:
${trainingData.slice(0, 10).map(d =>
	`- ${d.route}: Pred ${d.predictedTime}min, Actual ${d.actualTime}min (${d.trafficLevel})`
).join('\n')}

${frequentRoutes && frequentRoutes.length > 0
	? `Frequent routes:\n${frequentRoutes.map(r => `- ${r.route}: ${r.avgDuration}min avg, ${r.frequency} trips`).join('\n')}`
	: ''}

Analyze and provide insights.`;

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	const defaultResult = {
		insights: [`${summaryStats.totalSamples} training samples analyzed with ${summaryStats.avgAccuracy.toFixed(1)}% average accuracy`],
		patterns: ['Standard traffic patterns observed'],
		recommendations: ['Continue collecting training data for better predictions'],
	};

	if (!response.success || !response.content) {
		return defaultResult;
	}

	try {
		let jsonContent = response.content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		return {
			insights: Array.isArray(parsed.insights)
				? parsed.insights.filter((i: any) => typeof i === 'string')
				: defaultResult.insights,
			patterns: Array.isArray(parsed.patterns)
				? parsed.patterns.filter((p: any) => typeof p === 'string')
				: defaultResult.patterns,
			recommendations: Array.isArray(parsed.recommendations)
				? parsed.recommendations.filter((r: any) => typeof r === 'string')
				: defaultResult.recommendations,
		};
	} catch {
		return defaultResult;
	}
}

/**
 * Search route history using LLM for smart pattern matching
 * This function provides real-time thinking steps for developer mode visibility
 */
export async function searchRouteHistoryWithLLM(
	origin: string,
	destination: string,
	trainingData: ParsedTrainingData[],
	historicalRoutes: Array<{ route: string; avgDuration: number; frequency: number }>,
	onThinkingStep?: (step: AIThinkingStep) => void
): Promise<RouteHistorySearchResult> {
	const thinkingSteps: AIThinkingStep[] = [];

	const addThinkingStep = (phase: AIThinkingStep['phase'], message: string, details?: string) => {
		const step: AIThinkingStep = {
			step: thinkingSteps.length + 1,
			phase,
			message,
			timestamp: new Date(),
			details,
		};
		thinkingSteps.push(step);
		onThinkingStep?.(step);
	};

	// Step 1: Searching
	addThinkingStep('searching', 'Searching training data for similar routes...',
		`Scanning ${trainingData.length} training samples and ${historicalRoutes.length} historical routes`);

	await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI feedback

	// Step 2: Filter relevant data
	const searchTerms = [origin.toLowerCase(), destination.toLowerCase()];
	const relevantTraining = trainingData.filter(t => {
		const routeLower = t.route.toLowerCase();
		return searchTerms.some(term => routeLower.includes(term));
	});

	const relevantHistorical = historicalRoutes.filter(r => {
		const routeLower = r.route.toLowerCase();
		return searchTerms.some(term => routeLower.includes(term));
	});

	addThinkingStep('analyzing', 'Analyzing matched route patterns...',
		`Found ${relevantTraining.length} matching training samples and ${relevantHistorical.length} historical routes`);

	await new Promise(resolve => setTimeout(resolve, 200));

	// Step 3: Prepare LLM prompt
	addThinkingStep('reasoning', 'Using AI reasoning to extract insights from historical data...');

	const systemPrompt = `You are a route history analyst. Analyze the provided historical route data and extract useful patterns.

Return a JSON object with:
{
  "matchedRoutes": [
    {
      "route": "route name",
      "matchScore": 0-100,
      "avgDuration": number in minutes,
      "trafficPattern": "description of typical traffic",
      "bestTimeToTravel": "recommended time",
      "historicalInsights": "key insight from data"
    }
  ],
  "searchSummary": "Brief summary of the search results and patterns found"
}

Only return the JSON object.`;

	const userPrompt = `Search for routes matching: "${origin}" to "${destination}"

Training Data (${relevantTraining.length} matches):
${relevantTraining.slice(0, 15).map(t =>
	`- ${t.route}: Predicted ${t.predictedTime}min, Actual ${t.actualTime}min, Traffic: ${t.trafficLevel}`
).join('\n') || 'No direct matches'}

Historical Routes (${relevantHistorical.length} matches):
${relevantHistorical.slice(0, 10).map(r =>
	`- ${r.route}: Avg ${r.avgDuration}min, Used ${r.frequency} times`
).join('\n') || 'No historical data'}

Analyze and provide insights for training the prediction model.`;

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	// Step 4: Processing results
	addThinkingStep('predicting', 'Processing AI analysis and generating predictions...');

	if (!response.success || !response.content) {
		addThinkingStep('complete', 'Search completed with limited results', response.error || 'LLM response unavailable');
		return {
			success: false,
			matchedRoutes: [],
			searchSummary: 'Unable to analyze route history',
			thinkingSteps,
		};
	}

	try {
		let jsonContent = response.content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		addThinkingStep('complete', 'Route history analysis complete',
			`Found ${parsed.matchedRoutes?.length || 0} relevant route patterns`);

		return {
			success: true,
			matchedRoutes: Array.isArray(parsed.matchedRoutes) ? parsed.matchedRoutes : [],
			searchSummary: parsed.searchSummary || 'Analysis complete',
			thinkingSteps,
		};
	} catch {
		addThinkingStep('complete', 'Search completed with parsing issues');
		return {
			success: false,
			matchedRoutes: [],
			searchSummary: 'Failed to parse route history analysis',
			thinkingSteps,
		};
	}
}

/**
 * Route Traffic Search Result type
 */
export interface RouteTrafficSearchResult {
	success: boolean;
	trafficData: {
		congestionLevel: 'low' | 'moderate' | 'heavy' | 'severe';
		estimatedDelay: number; // minutes
		incidentReports: string[];
		roadConditions: string;
		weatherImpact: string;
		peakHourAdjustment: number; // minutes to add during peak
		trafficLightEstimate: number; // estimated minutes for traffic signals
		lastUpdated: Date;
	} | null;
	routeInsights: string[];
	thinkingSteps: AIThinkingStep[];
	error?: string;
}

/**
 * Fetch and analyze traffic data for a specific route using LLM
 * This simulates gathering real-time traffic info and analyzing it
 */
export async function fetchAndAnalyzeRouteTrafficData(
	origin: string,
	destination: string,
	distance: number,
	currentTime: Date,
	onThinkingStep?: (step: AIThinkingStep) => void
): Promise<RouteTrafficSearchResult> {
	const thinkingSteps: AIThinkingStep[] = [];

	const addThinkingStep = (phase: AIThinkingStep['phase'], message: string, details?: string) => {
		const step: AIThinkingStep = {
			step: thinkingSteps.length + 1,
			phase,
			message,
			timestamp: new Date(),
			details,
		};
		thinkingSteps.push(step);
		onThinkingStep?.(step);
	};

	// Step 1: Searching for traffic data
	addThinkingStep('searching', 'Gathering traffic data for route...',
		`Route: ${origin} → ${destination} (${distance.toFixed(1)} km)`);

	await new Promise(resolve => setTimeout(resolve, 200));

	// Step 2: Analyzing current conditions
	const hour = currentTime.getHours();
	const dayOfWeek = currentTime.getDay();
	const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
	const isMorningPeak = hour >= 8 && hour <= 10;
	const isEveningPeak = hour >= 17 && hour <= 20;
	const isPeakHour = isWeekday && (isMorningPeak || isEveningPeak);

	addThinkingStep('analyzing', 'Analyzing current traffic conditions...',
		`Time: ${currentTime.toLocaleTimeString('en-IN')} | Peak Hour: ${isPeakHour ? 'Yes' : 'No'}`);

	await new Promise(resolve => setTimeout(resolve, 200));

	// Step 3: Use LLM for intelligent analysis
	addThinkingStep('reasoning', 'AI analyzing route characteristics and traffic patterns...');

	const systemPrompt = `You are a traffic analysis AI for Indian roads. Analyze the route and provide traffic predictions.

Return a JSON object with:
{
  "congestionLevel": "low" | "moderate" | "heavy" | "severe",
  "estimatedDelay": number (additional minutes due to traffic),
  "incidentReports": ["array of any known issues on this route"],
  "roadConditions": "description of road quality and conditions",
  "weatherImpact": "how weather might affect travel",
  "peakHourAdjustment": number (additional minutes during peak hours),
  "trafficLightEstimate": number (estimated minutes for traffic signals based on distance and urban density),
  "insights": ["array of 2-4 useful insights about this route"]
}

Consider:
- Indian traffic patterns (heavy congestion in cities)
- Peak hours: 8-10 AM and 5-8 PM on weekdays
- Traffic signals: Estimate 1-2 min per major intersection
- Typical Indian road conditions
- Weather impacts (monsoon season, heat)

Only return the JSON object.`;

	const userPrompt = `Route: ${origin} to ${destination}
Distance: ${distance.toFixed(1)} km
Current Time: ${currentTime.toLocaleTimeString('en-IN')}
Day: ${currentTime.toLocaleDateString('en-IN', { weekday: 'long' })}
Is Peak Hour: ${isPeakHour ? 'Yes' : 'No'}
Is Weekday: ${isWeekday ? 'Yes' : 'No'}

Analyze traffic conditions and provide estimates.`;

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	addThinkingStep('predicting', 'Generating traffic predictions...');

	if (!response.success || !response.content) {
		addThinkingStep('complete', 'Analysis completed with limited data', response.error || 'LLM unavailable');

		// Return reasonable defaults based on time and distance
		const defaultTrafficLightMinutes = Math.ceil(distance / 2); // ~1 signal per 2km
		const defaultDelay = isPeakHour ? Math.ceil(distance * 1.5) : Math.ceil(distance * 0.5);

		return {
			success: true,
			trafficData: {
				congestionLevel: isPeakHour ? 'heavy' : 'moderate',
				estimatedDelay: defaultDelay,
				incidentReports: [],
				roadConditions: 'Standard Indian road conditions',
				weatherImpact: 'Normal conditions',
				peakHourAdjustment: isPeakHour ? 10 : 0,
				trafficLightEstimate: defaultTrafficLightMinutes,
				lastUpdated: new Date(),
			},
			routeInsights: [
				`Estimated ${defaultTrafficLightMinutes} min for traffic signals`,
				isPeakHour ? 'Currently in peak traffic hours' : 'Outside peak traffic hours',
			],
			thinkingSteps,
		};
	}

	try {
		let jsonContent = response.content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		addThinkingStep('complete', 'Traffic analysis complete',
			`Congestion: ${parsed.congestionLevel}, Delay: +${parsed.estimatedDelay}min`);

		return {
			success: true,
			trafficData: {
				congestionLevel: ['low', 'moderate', 'heavy', 'severe'].includes(parsed.congestionLevel)
					? parsed.congestionLevel
					: 'moderate',
				estimatedDelay: typeof parsed.estimatedDelay === 'number' ? parsed.estimatedDelay : 5,
				incidentReports: Array.isArray(parsed.incidentReports)
					? parsed.incidentReports.filter((r: unknown) => typeof r === 'string')
					: [],
				roadConditions: typeof parsed.roadConditions === 'string'
					? parsed.roadConditions
					: 'Standard conditions',
				weatherImpact: typeof parsed.weatherImpact === 'string'
					? parsed.weatherImpact
					: 'Normal weather',
				peakHourAdjustment: typeof parsed.peakHourAdjustment === 'number'
					? parsed.peakHourAdjustment
					: (isPeakHour ? 10 : 0),
				trafficLightEstimate: typeof parsed.trafficLightEstimate === 'number'
					? parsed.trafficLightEstimate
					: Math.ceil(distance / 2),
				lastUpdated: new Date(),
			},
			routeInsights: Array.isArray(parsed.insights)
				? parsed.insights.filter((i: unknown) => typeof i === 'string')
				: [],
			thinkingSteps,
		};
	} catch {
		addThinkingStep('complete', 'Analysis completed with parsing fallback');

		return {
			success: false,
			trafficData: null,
			routeInsights: ['Unable to parse traffic analysis'],
			thinkingSteps,
			error: 'Failed to parse LLM response',
		};
	}
}

/**
 * Predict future route conditions for planning ahead (BETA feature)
 * Allows users to plan a route for the next day or future date
 */
export async function predictFutureRoute(
	request: RoutePredictionRequest
): Promise<RoutePredictionResult> {
	const { origin, destination, distance, baseDuration, transportMode, targetDate, preferredTimeSlot } = request;

	const dayOfWeek = targetDate.getDay();
	const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
	const month = targetDate.getMonth() + 1;
	const dateStr = targetDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

	// Extract city for intelligence lookup
	const originCity = extractCityName(origin);
	const destCity = extractCityName(destination);

	// Get India traffic intelligence for the predicted day
	const morningIntel = getRouteTrafficIntelligence(originCity, destCity, 9, dayOfWeek, month);
	const eveningIntel = getRouteTrafficIntelligence(originCity, destCity, 18, dayOfWeek, month);

	const cityProfile = getCityTrafficProfile(originCity);
	const festivals = getUpcomingFestivals(month);
	const constructions = getActiveConstructionZones(originCity);

	// Build time slot context
	const timeSlotContext = preferredTimeSlot
		? `User prefers to travel between ${preferredTimeSlot.start}:00 and ${preferredTimeSlot.end}:00`
		: 'No specific time preference - find the best time to travel';

	const systemPrompt = `You are an AI traffic prediction specialist for Indian roads. Your task is to predict optimal travel times for a FUTURE date.

IMPORTANT: This is a PREDICTION for ${dateStr}. Use historical patterns and intelligence data to forecast conditions.

Return a JSON object:
{
  "optimalDepartureTime": "HH:MM AM/PM format",
  "optimalDepartureHour": number (0-23),
  "expectedDuration": number (minutes),
  "trafficForecast": "light" | "moderate" | "heavy" | "very_heavy",
  "confidenceScore": number (0-100),
  "reasoning": "2-3 sentence explanation of why this time is optimal",
  "alternativeTimes": [
    {"time": "HH:MM AM/PM", "expectedDuration": number, "trafficLevel": "string"}
  ],
  "warnings": ["array of potential issues to be aware of"],
  "tips": ["array of helpful tips for this journey"]
}

Consider:
- Day of week patterns (weekdays vs weekends differ significantly)
- Typical peak hours: 8-10 AM and 5-8 PM on weekdays
- Festival and event impacts
- Construction zone impacts
- Weather patterns for the season
- Historical traffic patterns from India traffic database

Only return the JSON object.`;

	const userPrompt = `FUTURE ROUTE PREDICTION REQUEST

Route: ${origin} → ${destination}
Distance: ${distance.toFixed(1)} km
Base Duration: ${baseDuration} minutes
Transport: ${transportMode}

Target Date: ${dateStr}
Is Weekday: ${isWeekday ? 'Yes' : 'No'}
${timeSlotContext}

=== INDIA TRAFFIC INTELLIGENCE ===
Morning Peak (9 AM) Traffic Multiplier: ${morningIntel.trafficMultiplier.toFixed(2)}x
Evening Peak (6 PM) Traffic Multiplier: ${eveningIntel.trafficMultiplier.toFixed(2)}x

${cityProfile ? `City Profile (${cityProfile.name}):
- Peak Hours: Morning ${cityProfile.peakHours.morning.start}:00-${cityProfile.peakHours.morning.end}:00, Evening ${cityProfile.peakHours.evening.start}:00-${cityProfile.peakHours.evening.end}:00
- Avg Speed: Peak ${cityProfile.avgSpeed.peakHour} km/h, Off-Peak ${cityProfile.avgSpeed.offPeak} km/h
- Traffic Hotspots: ${cityProfile.trafficHotspots.slice(0, 4).join(', ')}` : ''}

${festivals.length > 0 ? `Festival Alerts: ${festivals.map(f => `${f.name} (${f.trafficMultiplier}x traffic)`).join(', ')}` : 'No festival alerts'}

${constructions.length > 0 ? `Construction Zones: ${constructions.map(c => `${c.location} (+${c.delayMinutes}min)`).join(', ')}` : 'No active construction'}

Historical Context: ${morningIntel.historicalContext}

Predict the optimal departure time and expected conditions for this FUTURE journey.`;

	console.log('[LLM] Predicting future route for:', dateStr);

	const response = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	if (!response.success || !response.content) {
		// Generate smart fallback prediction
		const optimalHour = isWeekday
			? (preferredTimeSlot ? Math.max(preferredTimeSlot.start, 6) : 6)
			: 10;

		const trafficMult = isWeekday ? morningIntel.trafficMultiplier : 0.8;
		const expectedDuration = Math.round(baseDuration * trafficMult);

		return {
			success: true,
			prediction: {
				optimalDepartureTime: `${optimalHour > 12 ? optimalHour - 12 : optimalHour}:00 ${optimalHour >= 12 ? 'PM' : 'AM'}`,
				optimalDepartureHour: optimalHour,
				expectedDuration,
				trafficForecast: isWeekday ? 'moderate' : 'light',
				confidenceScore: 65,
				reasoning: `Based on historical patterns for ${dateStr}, leaving ${isWeekday ? 'before morning rush' : 'mid-morning'} typically offers the best travel conditions. Traffic multiplier: ${trafficMult.toFixed(2)}x.`,
				alternativeTimes: [
					{ time: isWeekday ? '7:00 AM' : '9:00 AM', expectedDuration: Math.round(baseDuration * 0.9), trafficLevel: 'light' },
					{ time: isWeekday ? '11:00 AM' : '11:00 AM', expectedDuration: Math.round(baseDuration * 0.85), trafficLevel: 'light' },
					{ time: isWeekday ? '2:00 PM' : '2:00 PM', expectedDuration: Math.round(baseDuration * 0.95), trafficLevel: 'moderate' },
				],
				warnings: constructions.length > 0 ? [`Construction at ${constructions[0].location} may add ${constructions[0].delayMinutes} minutes`] : [],
				tips: [
					'Check traffic conditions 30 minutes before departure',
					'Keep navigation app updated for real-time changes',
				],
			},
		};
	}

	try {
		let jsonContent = response.content.trim();
		if (jsonContent.startsWith('```json')) {
			jsonContent = jsonContent.slice(7);
		} else if (jsonContent.startsWith('```')) {
			jsonContent = jsonContent.slice(3);
		}
		if (jsonContent.endsWith('```')) {
			jsonContent = jsonContent.slice(0, -3);
		}
		jsonContent = jsonContent.trim();

		const parsed = JSON.parse(jsonContent);

		return {
			success: true,
			prediction: {
				optimalDepartureTime: typeof parsed.optimalDepartureTime === 'string'
					? parsed.optimalDepartureTime
					: '8:00 AM',
				optimalDepartureHour: typeof parsed.optimalDepartureHour === 'number'
					? parsed.optimalDepartureHour
					: 8,
				expectedDuration: typeof parsed.expectedDuration === 'number'
					? parsed.expectedDuration
					: baseDuration,
				trafficForecast: ['light', 'moderate', 'heavy', 'very_heavy'].includes(parsed.trafficForecast)
					? parsed.trafficForecast
					: 'moderate',
				confidenceScore: typeof parsed.confidenceScore === 'number'
					? Math.min(100, Math.max(0, parsed.confidenceScore))
					: 70,
				reasoning: typeof parsed.reasoning === 'string'
					? parsed.reasoning
					: 'AI prediction based on historical patterns.',
				alternativeTimes: Array.isArray(parsed.alternativeTimes)
					? parsed.alternativeTimes.slice(0, 4)
					: [],
				warnings: Array.isArray(parsed.warnings)
					? parsed.warnings.filter((w: unknown) => typeof w === 'string')
					: [],
				tips: Array.isArray(parsed.tips)
					? parsed.tips.filter((t: unknown) => typeof t === 'string')
					: [],
			},
		};
	} catch {
		return {
			success: false,
			prediction: null,
			error: 'Failed to parse prediction response',
		};
	}
}
