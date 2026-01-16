/**
 * Traffic Intelligence Service
 *
 * This service integrates the India Traffic Data module with LLM interpretation
 * to provide intelligent, data-driven traffic analysis and predictions.
 *
 * Features:
 * - Uses 6 years of historical India traffic data
 * - LLM interprets data for contextual recommendations
 * - Considers infrastructure updates, bus timings, new developments
 * - Festival and weather pattern analysis
 * - Only visible in Developer Mode
 */

import { getAuthTokenAsync } from '@/sdk/core/auth';
import {
	type CityTrafficProfile,
	type InfrastructureUpdate,
	type BusRoute,
	type DevelopmentZone,
	type FestivalTrafficPattern,
	type ConstructionZone,
	getCityTrafficProfile,
	getInfrastructureUpdates,
	getBusRoutes,
	getDevelopmentZones,
	getActiveConstructionZones,
	getUpcomingFestivals,
	getHistoricalTrafficData,
	getRouteTrafficIntelligence,
	calculateTrafficMultiplier,
	generateLLMDataSummary,
	exportAllTrafficData,
	CITY_TRAFFIC_PROFILES,
	INFRASTRUCTURE_UPDATES,
	WEATHER_TRAFFIC_IMPACT,
} from './india-traffic-data';

// Re-export types for use in components
export type {
	CityTrafficProfile,
	InfrastructureUpdate,
	BusRoute,
	DevelopmentZone,
	FestivalTrafficPattern,
	ConstructionZone,
};

// API Configuration (same as llm-service.ts)
const LLM_API_BASE = 'https://api-production.creao.ai/execute-apis/v2';
const LLM_API_PATH = '/v1/ai/zWwyutGgvEGWwzSa/chat/completions';
const LLM_API_NAME = 'OpenAIGPTChat';
const LLM_API_ID = '688a0b64dc79a2533460892c';
const LLM_MODEL = 'MaaS_4.1';
const FALLBACK_BEARER_TOKEN = 'BXuSPHRhErkTPwFTiLff';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface LLMResponse {
	success: boolean;
	content: string | null;
	error: string | null;
}

// ============================================================================
// INTELLIGENCE RESULT TYPES
// ============================================================================

export interface TrafficIntelligenceResult {
	success: boolean;
	analysis: {
		overallRating: 'excellent' | 'good' | 'moderate' | 'poor' | 'avoid';
		confidenceScore: number;
		estimatedTravelTime: number;
		trafficMultiplier: number;
	};
	cityInsights: {
		name: string;
		peakHourStatus: 'in_peak' | 'approaching_peak' | 'off_peak' | 'night';
		currentAvgSpeed: number;
		congestionHotspots: string[];
	};
	infrastructureFactors: {
		recentImprovements: InfrastructureUpdate[];
		activeConstructions: ConstructionZone[];
		impactSummary: string;
	};
	transitOptions: {
		recommendedBusRoutes: BusRoute[];
		transitAdvice: string;
	};
	developmentImpact: {
		nearbyZones: DevelopmentZone[];
		trafficImpact: string;
	};
	festivalAlert: {
		upcomingFestivals: FestivalTrafficPattern[];
		advisories: string[];
	};
	weatherConsideration: {
		currentImpact: string;
		recommendations: string[];
	};
	llmReasoning: {
		summary: string;
		recommendations: string[];
		optimalDepartureWindow: string;
		alternativeRoutes: string[];
		historicalContext: string;
	};
	dataSourceSummary: string;
	timestamp: Date;
}

export interface IntelligenceThinkingStep {
	step: number;
	phase: 'gathering' | 'analyzing' | 'interpreting' | 'synthesizing' | 'complete';
	message: string;
	timestamp: Date;
	dataPoints?: number;
}

// ============================================================================
// LLM API HELPER
// ============================================================================

async function callLLM(messages: ChatMessage[]): Promise<LLMResponse> {
	try {
		let authToken = await getAuthTokenAsync();
		if (!authToken) {
			authToken = FALLBACK_BEARER_TOKEN;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);

		const response = await fetch(`${LLM_API_BASE}${LLM_API_PATH}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${authToken}`,
				'X-CREAO-API-NAME': LLM_API_NAME,
				'X-CREAO-API-ID': LLM_API_ID,
				'X-CREAO-API-PATH': LLM_API_PATH,
			},
			body: JSON.stringify({ model: LLM_MODEL, messages }),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			return { success: false, content: null, error: `API error: ${response.status}` };
		}

		const data = await response.json();
		if (data.choices?.[0]?.message?.content) {
			return { success: true, content: data.choices[0].message.content, error: null };
		}

		return { success: false, content: null, error: 'No content in response' };
	} catch (error) {
		return { success: false, content: null, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

// ============================================================================
// MAIN INTELLIGENCE SERVICE
// ============================================================================

/**
 * Get comprehensive traffic intelligence for a route
 * Uses India traffic data + LLM interpretation
 */
export async function getComprehensiveTrafficIntelligence(
	originCity: string,
	destinationCity: string,
	originName: string,
	destinationName: string,
	distance: number,
	baseDuration: number,
	transportMode: string,
	onThinkingStep?: (step: IntelligenceThinkingStep) => void
): Promise<TrafficIntelligenceResult> {
	const steps: IntelligenceThinkingStep[] = [];
	const now = new Date();
	const hour = now.getHours();
	const dayOfWeek = now.getDay();
	const month = now.getMonth() + 1;

	const addStep = (phase: IntelligenceThinkingStep['phase'], message: string, dataPoints?: number) => {
		const step: IntelligenceThinkingStep = {
			step: steps.length + 1,
			phase,
			message,
			timestamp: new Date(),
			dataPoints,
		};
		steps.push(step);
		onThinkingStep?.(step);
	};

	// Step 1: Gather city data
	addStep('gathering', `Loading traffic profiles for ${originCity}...`);
	await new Promise(r => setTimeout(r, 100));

	const cityProfile = getCityTrafficProfile(originCity);
	const destCityProfile = getCityTrafficProfile(destinationCity);

	// Step 2: Get infrastructure updates
	addStep('gathering', 'Checking recent infrastructure updates (2019-2025)...');
	const infrastructure = getInfrastructureUpdates(originCity, 2019);
	const destInfrastructure = destinationCity !== originCity
		? getInfrastructureUpdates(destinationCity, 2019)
		: [];

	// Step 3: Get active constructions
	addStep('gathering', 'Identifying active construction zones...');
	const constructions = getActiveConstructionZones(originCity);

	// Step 4: Get bus routes
	addStep('gathering', 'Loading public transit options...');
	const busRoutes = getBusRoutes(originCity);

	// Step 5: Get development zones
	addStep('gathering', 'Analyzing nearby development impact...');
	const developmentZones = getDevelopmentZones(originCity);

	// Step 6: Get festival patterns
	addStep('gathering', 'Checking festival traffic patterns...');
	const festivals = getUpcomingFestivals(month);

	// Step 7: Get historical data
	addStep('gathering', 'Loading 6 years of historical traffic data...');
	const historicalData = getHistoricalTrafficData(originCity, 2019, 2024);

	// Step 8: Calculate traffic multiplier
	addStep('analyzing', 'Calculating current traffic conditions...');
	const { multiplier, factors } = calculateTrafficMultiplier(originCity, hour, dayOfWeek, month);

	// Step 9: Get comprehensive route intelligence
	addStep('analyzing', 'Synthesizing route intelligence...');
	const routeIntelligence = getRouteTrafficIntelligence(
		originCity,
		destinationCity,
		hour,
		dayOfWeek,
		month
	);

	// Determine peak hour status
	let peakHourStatus: 'in_peak' | 'approaching_peak' | 'off_peak' | 'night' = 'off_peak';
	if (cityProfile) {
		const { morning, evening } = cityProfile.peakHours;
		if ((hour >= morning.start && hour <= morning.end) || (hour >= evening.start && hour <= evening.end)) {
			peakHourStatus = 'in_peak';
		} else if ((hour >= morning.start - 1 && hour < morning.start) || (hour >= evening.start - 1 && hour < evening.start)) {
			peakHourStatus = 'approaching_peak';
		} else if (hour >= 22 || hour <= 5) {
			peakHourStatus = 'night';
		}
	}

	// Calculate estimated travel time
	const estimatedTravelTime = Math.round(baseDuration * multiplier);

	// Determine overall rating
	let overallRating: TrafficIntelligenceResult['analysis']['overallRating'] = 'good';
	if (multiplier >= 2.0) overallRating = 'avoid';
	else if (multiplier >= 1.6) overallRating = 'poor';
	else if (multiplier >= 1.3) overallRating = 'moderate';
	else if (multiplier <= 0.9) overallRating = 'excellent';

	// Step 10: LLM Interpretation
	addStep('interpreting', 'AI interpreting comprehensive traffic data...');

	// Build data summary for LLM
	const dataSummary = generateLLMDataSummary();

	const systemPrompt = `You are an expert traffic analyst for India with access to 6 years of comprehensive traffic data. Analyze the provided data and give actionable recommendations.

Your response must be a valid JSON object with:
{
  "summary": "2-3 sentence summary of current conditions",
  "recommendations": ["Array of 4-6 specific recommendations"],
  "optimalDepartureWindow": "e.g., 'Between 6:30-7:30 AM' or 'After 9:00 PM'",
  "alternativeRoutes": ["Array of 2-3 alternative route suggestions"],
  "historicalContext": "How current conditions compare to historical patterns"
}

Consider all provided data: infrastructure updates, construction zones, bus timings, development zones, festivals, weather patterns, and historical traffic data.

Only return the JSON object.`;

	const userPrompt = `ROUTE ANALYSIS REQUEST
=====================
Route: ${originName} → ${destinationName}
Cities: ${originCity} → ${destinationCity}
Distance: ${distance.toFixed(1)} km
Base Duration: ${baseDuration} min
Transport Mode: ${transportMode}
Current Time: ${now.toLocaleTimeString('en-IN')} (${now.toLocaleDateString('en-IN', { weekday: 'long' })})

CURRENT CONDITIONS
==================
Traffic Multiplier: ${multiplier.toFixed(2)}x
Peak Hour Status: ${peakHourStatus}
Factors: ${factors.join(', ')}

CITY PROFILE (${originCity})
============================
${cityProfile ? `
- Peak Hours: Morning ${cityProfile.peakHours.morning.start}:00-${cityProfile.peakHours.morning.end}:00, Evening ${cityProfile.peakHours.evening.start}:00-${cityProfile.peakHours.evening.end}:00
- Avg Speed: Peak ${cityProfile.avgSpeed.peakHour} km/h, Off-Peak ${cityProfile.avgSpeed.offPeak} km/h
- Hot Spots: ${cityProfile.trafficHotspots.slice(0, 5).join(', ')}
- Major Roads: ${cityProfile.majorRoads.slice(0, 4).join(', ')}
` : 'City profile not available'}

INFRASTRUCTURE UPDATES (${infrastructure.length} total)
=======================================================
${infrastructure.slice(0, 5).map(i =>
	`- ${i.name} (${i.type}, ${i.completionDate}): ${i.trafficImpact}`
).join('\n') || 'No major updates'}

ACTIVE CONSTRUCTIONS (${constructions.length} zones)
=====================================================
${constructions.map(c =>
	`- ${c.location}: ${c.type}, Delay +${c.delayMinutes}min, Alt: ${c.alternateRoutes.join(', ')}`
).join('\n') || 'No active construction'}

BUS ROUTES AVAILABLE: ${busRoutes.length}
${busRoutes.slice(0, 3).map(b =>
	`- ${b.routeNumber}: ${b.startPoint} → ${b.endPoint} (every ${b.frequency.peakMinutes} min peak)`
).join('\n')}

NEARBY DEVELOPMENTS (${developmentZones.length})
================================================
${developmentZones.slice(0, 3).map(d =>
	`- ${d.name} (${d.type}): ~${d.estimatedDailyCommuters.toLocaleString()} daily commuters`
).join('\n') || 'No major developments'}

FESTIVAL ALERTS
===============
${festivals.length > 0 ? festivals.map(f =>
	`- ${f.name}: Traffic ${f.trafficMultiplier}x, ${f.peakDays}`
).join('\n') : 'No upcoming festivals affecting traffic'}

HISTORICAL CONTEXT
==================
${routeIntelligence.historicalContext}

DATA SUMMARY
============
${dataSummary.split('\n').slice(0, 10).join('\n')}

Provide comprehensive analysis and recommendations.`;

	const llmResponse = await callLLM([
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	]);

	// Step 11: Synthesize results
	addStep('synthesizing', 'Compiling final intelligence report...');

	let llmReasoning = {
		summary: `Route from ${originName} to ${destinationName} analyzed. Current traffic multiplier: ${multiplier.toFixed(2)}x. ${peakHourStatus === 'in_peak' ? 'Peak hour traffic active.' : 'Off-peak conditions.'}`,
		recommendations: routeIntelligence.recommendations,
		optimalDepartureWindow: peakHourStatus === 'in_peak' ? 'After 9:00 PM or before 7:00 AM' : 'Current time is suitable for travel',
		alternativeRoutes: constructions.flatMap(c => c.alternateRoutes).slice(0, 3),
		historicalContext: routeIntelligence.historicalContext,
	};

	if (llmResponse.success && llmResponse.content) {
		try {
			let jsonContent = llmResponse.content.trim();
			if (jsonContent.startsWith('```json')) jsonContent = jsonContent.slice(7);
			else if (jsonContent.startsWith('```')) jsonContent = jsonContent.slice(3);
			if (jsonContent.endsWith('```')) jsonContent = jsonContent.slice(0, -3);

			const parsed = JSON.parse(jsonContent.trim());

			llmReasoning = {
				summary: parsed.summary || llmReasoning.summary,
				recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : llmReasoning.recommendations,
				optimalDepartureWindow: parsed.optimalDepartureWindow || llmReasoning.optimalDepartureWindow,
				alternativeRoutes: Array.isArray(parsed.alternativeRoutes) ? parsed.alternativeRoutes : llmReasoning.alternativeRoutes,
				historicalContext: parsed.historicalContext || llmReasoning.historicalContext,
			};
		} catch (e) {
			console.error('[TrafficIntelligence] Failed to parse LLM response:', e);
		}
	}

	addStep('complete', 'Intelligence report ready', historicalData.length + infrastructure.length + busRoutes.length);

	// Build transit advice
	let transitAdvice = 'No public transit data available for this route.';
	if (busRoutes.length > 0) {
		const relevantBus = busRoutes[0];
		transitAdvice = `Consider ${relevantBus.routeNumber} (${relevantBus.type.toUpperCase()}) running every ${relevantBus.frequency.peakMinutes} min during peak hours. Route: ${relevantBus.startPoint} → ${relevantBus.endPoint}.`;
	}

	// Build development impact
	let developmentImpact = 'No major development zones affecting this route.';
	if (developmentZones.length > 0) {
		const totalCommuters = developmentZones.reduce((sum, d) => sum + d.estimatedDailyCommuters, 0);
		developmentImpact = `${developmentZones.length} major development zones nearby with ~${totalCommuters.toLocaleString()} daily commuters. Peak impact during ${developmentZones[0]?.peakTrafficTimes?.join(', ') || 'office hours'}.`;
	}

	// Build weather consideration
	const currentMonth = month;
	let weatherImpact = 'Normal weather conditions expected.';
	const weatherRecs: string[] = [];
	if (currentMonth >= 6 && currentMonth <= 9) {
		weatherImpact = 'Monsoon season - expect waterlogging in low-lying areas and reduced visibility during rain.';
		weatherRecs.push('Check weather forecast before travel', 'Avoid known waterlogging spots', 'Allow extra travel time');
	} else if (currentMonth >= 11 || currentMonth <= 2) {
		if (['Delhi', 'Noida', 'Gurgaon', 'Lucknow'].some(c => originCity.includes(c) || destinationCity.includes(c))) {
			weatherImpact = 'Winter fog season - morning visibility may be severely reduced. Check for fog warnings.';
			weatherRecs.push('Avoid early morning travel (6-9 AM) during fog', 'Use fog lights', 'Check flight/train status');
		}
	}

	// Build festival advisories
	const festivalAdvisories: string[] = [];
	if (festivals.length > 0) {
		festivals.forEach(f => {
			festivalAdvisories.push(`${f.name}: Traffic may be ${f.trafficMultiplier}x normal. ${f.peakDays}`);
			festivalAdvisories.push(...f.recommendations.slice(0, 2));
		});
	}

	// Build infrastructure impact summary
	let infraSummary = 'No significant infrastructure changes affecting this route.';
	const recentImprovements = infrastructure.filter(i =>
		i.trafficImpact === 'major_improvement' || i.trafficImpact === 'moderate_improvement'
	);
	if (recentImprovements.length > 0) {
		infraSummary = `${recentImprovements.length} recent infrastructure improvements: ${recentImprovements.slice(0, 2).map(i => i.name).join(', ')}. These may provide faster route options.`;
	}
	if (constructions.length > 0) {
		infraSummary += ` Active construction at ${constructions.map(c => c.location).join(', ')} - expect delays.`;
	}

	return {
		success: true,
		analysis: {
			overallRating,
			confidenceScore: llmResponse.success ? 85 : 70,
			estimatedTravelTime,
			trafficMultiplier: multiplier,
		},
		cityInsights: {
			name: cityProfile?.name || originCity,
			peakHourStatus,
			currentAvgSpeed: cityProfile?.avgSpeed[peakHourStatus === 'in_peak' ? 'peakHour' : peakHourStatus === 'night' ? 'night' : 'offPeak'] || 25,
			congestionHotspots: cityProfile?.trafficHotspots.slice(0, 5) || [],
		},
		infrastructureFactors: {
			recentImprovements: recentImprovements.slice(0, 5),
			activeConstructions: constructions,
			impactSummary: infraSummary,
		},
		transitOptions: {
			recommendedBusRoutes: busRoutes.slice(0, 3),
			transitAdvice,
		},
		developmentImpact: {
			nearbyZones: developmentZones.slice(0, 3),
			trafficImpact: developmentImpact,
		},
		festivalAlert: {
			upcomingFestivals: festivals,
			advisories: festivalAdvisories,
		},
		weatherConsideration: {
			currentImpact: weatherImpact,
			recommendations: weatherRecs,
		},
		llmReasoning,
		dataSourceSummary: `Analysis based on ${CITY_TRAFFIC_PROFILES.length} city profiles, ${INFRASTRUCTURE_UPDATES.length} infrastructure updates, ${historicalData.length} historical data points, and ${festivals.length} festival patterns.`,
		timestamp: new Date(),
	};
}

// ============================================================================
// DATA EXPORT FOR DEVELOPER MODE
// ============================================================================

/**
 * Export all traffic intelligence data for developer inspection
 */
export function exportTrafficIntelligenceData() {
	return {
		...exportAllTrafficData(),
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
		dataRange: '2019-2025',
		totalDataPoints: {
			cities: CITY_TRAFFIC_PROFILES.length,
			infrastructure: INFRASTRUCTURE_UPDATES.length,
			weatherPatterns: WEATHER_TRAFFIC_IMPACT.length,
		},
	};
}

/**
 * Get summary statistics for developer dashboard
 */
export function getTrafficDataStats() {
	const allData = exportAllTrafficData();

	return {
		totalCities: allData.cityProfiles.length,
		totalInfrastructureProjects: allData.infrastructureUpdates.length,
		metroProjects: allData.infrastructureUpdates.filter(i => i.type === 'metro_line').length,
		flyovers: allData.infrastructureUpdates.filter(i => i.type === 'flyover').length,
		expressways: allData.infrastructureUpdates.filter(i => i.type === 'expressway').length,
		totalBusRoutes: allData.busRoutes.length,
		totalDevelopmentZones: allData.developmentZones.length,
		totalFestivalPatterns: allData.festivalPatterns.length,
		activeConstructionZones: allData.constructionZones.filter(c => c.status === 'active' || c.status === 'delayed').length,
		historicalDataPoints: allData.historicalData.length,
		weatherPatterns: allData.weatherImpact.length,
		dataYearsRange: '2019-2025',
		lastUpdated: new Date().toISOString(),
	};
}

/**
 * Search for specific data in the traffic intelligence database
 */
export function searchTrafficData(query: string): {
	cities: CityTrafficProfile[];
	infrastructure: InfrastructureUpdate[];
	busRoutes: BusRoute[];
	developments: DevelopmentZone[];
} {
	const queryLower = query.toLowerCase();
	const allData = exportAllTrafficData();

	return {
		cities: allData.cityProfiles.filter(c =>
			c.name.toLowerCase().includes(queryLower) ||
			c.state.toLowerCase().includes(queryLower)
		),
		infrastructure: allData.infrastructureUpdates.filter(i =>
			i.name.toLowerCase().includes(queryLower) ||
			i.city.toLowerCase().includes(queryLower) ||
			i.description.toLowerCase().includes(queryLower)
		),
		busRoutes: allData.busRoutes.filter(b =>
			b.routeName.toLowerCase().includes(queryLower) ||
			b.city.toLowerCase().includes(queryLower) ||
			b.startPoint.toLowerCase().includes(queryLower) ||
			b.endPoint.toLowerCase().includes(queryLower)
		),
		developments: allData.developmentZones.filter(d =>
			d.name.toLowerCase().includes(queryLower) ||
			d.city.toLowerCase().includes(queryLower) ||
			d.description.toLowerCase().includes(queryLower)
		),
	};
}
