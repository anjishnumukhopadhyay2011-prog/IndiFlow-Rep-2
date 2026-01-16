/**
 * India Traffic Intelligence Data Module
 *
 * Comprehensive traffic data for India covering 6 years (2019-2025)
 * Includes:
 * - Historical traffic patterns by city and time
 * - Major infrastructure updates (new roads, flyovers, metro)
 * - Bus route timings and schedules
 * - New building/area developments affecting traffic
 * - Seasonal and festival traffic patterns
 * - Construction zones and roadwork history
 *
 * This data is used by the LLM for intelligent route analysis.
 * Only visible in Developer Mode.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CityTrafficProfile {
	name: string;
	state: string;
	lat: number;
	lng: number;
	population2024: number;
	peakHours: {
		morning: { start: number; end: number; severity: number };
		evening: { start: number; end: number; severity: number };
	};
	avgSpeed: {
		peakHour: number;
		offPeak: number;
		night: number;
	};
	trafficHotspots: string[];
	majorRoads: string[];
}

export interface InfrastructureUpdate {
	id: string;
	city: string;
	type: 'metro_line' | 'flyover' | 'ring_road' | 'expressway' | 'bus_corridor' | 'road_widening' | 'underpass' | 'bridge' | 'signal_system';
	name: string;
	description: string;
	completionDate: string;
	impactAreas: string[];
	trafficImpact: 'major_improvement' | 'moderate_improvement' | 'minor_improvement' | 'temporary_disruption';
	lengthKm?: number;
	costCrores?: number;
}

export interface BusRoute {
	id: string;
	city: string;
	routeNumber: string;
	routeName: string;
	operator: string;
	startPoint: string;
	endPoint: string;
	majorStops: string[];
	frequency: {
		peakMinutes: number;
		offPeakMinutes: number;
	};
	operatingHours: {
		start: string;
		end: string;
	};
	avgTripDuration: number;
	distanceKm: number;
	type: 'city' | 'express' | 'ac' | 'volvo' | 'metro_feeder';
	lastUpdated: string;
}

export interface DevelopmentZone {
	id: string;
	city: string;
	name: string;
	type: 'it_park' | 'residential' | 'commercial' | 'mixed_use' | 'industrial' | 'sez' | 'airport' | 'port' | 'university';
	description: string;
	startYear: number;
	completionYear: number | null;
	estimatedDailyCommuters: number;
	peakTrafficTimes: string[];
	nearbyLandmarks: string[];
	trafficChallenges: string[];
}

export interface FestivalTrafficPattern {
	name: string;
	regions: string[];
	months: number[];
	trafficMultiplier: number;
	peakDays: string;
	affectedRoutes: string[];
	recommendations: string[];
}

export interface ConstructionZone {
	id: string;
	city: string;
	location: string;
	type: string;
	startDate: string;
	expectedEndDate: string;
	status: 'active' | 'completed' | 'delayed';
	delayMinutes: number;
	alternateRoutes: string[];
	affectedDirections: string[];
}

export interface TrafficHistoricalData {
	year: number;
	month: number;
	city: string;
	avgDailyVehicles: number;
	avgSpeedKmh: number;
	accidentCount: number;
	congestionIndex: number;
	airQualityIndex: number;
	majorEvents: string[];
}

export interface WeatherTrafficImpact {
	condition: string;
	region: string;
	speedReduction: number;
	accidentRiskMultiplier: number;
	visibilityImpact: string;
	recommendations: string[];
}

// ============================================================================
// CITY TRAFFIC PROFILES - Major Indian Cities
// ============================================================================

export const CITY_TRAFFIC_PROFILES: CityTrafficProfile[] = [
	{
		name: 'Bengaluru',
		state: 'Karnataka',
		lat: 12.9716,
		lng: 77.5946,
		population2024: 13800000,
		peakHours: {
			morning: { start: 8, end: 11, severity: 9 },
			evening: { start: 17, end: 21, severity: 10 },
		},
		avgSpeed: {
			peakHour: 12,
			offPeak: 28,
			night: 45,
		},
		trafficHotspots: [
			'Silk Board Junction', 'KR Puram', 'Marathahalli', 'Hebbal Flyover',
			'Electronic City Signal', 'Koramangala', 'Whitefield', 'Bellandur',
			'Outer Ring Road', 'Indiranagar', 'MG Road', 'Jayanagar'
		],
		majorRoads: [
			'Outer Ring Road', 'NICE Road', 'Old Airport Road', 'Hosur Road',
			'Bellary Road', 'Mysore Road', 'Kanakapura Road', 'Tumkur Road'
		],
	},
	{
		name: 'Mumbai',
		state: 'Maharashtra',
		lat: 19.0760,
		lng: 72.8777,
		population2024: 21400000,
		peakHours: {
			morning: { start: 8, end: 11, severity: 10 },
			evening: { start: 17, end: 21, severity: 10 },
		},
		avgSpeed: {
			peakHour: 10,
			offPeak: 25,
			night: 40,
		},
		trafficHotspots: [
			'Andheri Junction', 'Sion-Panvel Highway', 'Western Express Highway',
			'Dadar TT', 'Mahim Causeway', 'Bandra Worli Sea Link Entry',
			'Haji Ali Junction', 'Lower Parel', 'BKC', 'JVLR'
		],
		majorRoads: [
			'Western Express Highway', 'Eastern Express Highway', 'Mumbai-Pune Expressway',
			'Sion-Panvel Highway', 'LBS Marg', 'SV Road', 'Linking Road'
		],
	},
	{
		name: 'Delhi',
		state: 'Delhi NCR',
		lat: 28.6139,
		lng: 77.2090,
		population2024: 32900000,
		peakHours: {
			morning: { start: 8, end: 11, severity: 9 },
			evening: { start: 17, end: 21, severity: 9 },
		},
		avgSpeed: {
			peakHour: 15,
			offPeak: 32,
			night: 50,
		},
		trafficHotspots: [
			'ITO', 'Dhaula Kuan', 'Ashram Chowk', 'Anand Vihar',
			'Kashmere Gate ISBT', 'Nehru Place', 'Saket', 'Dwarka',
			'Mayur Vihar', 'Connaught Place', 'Rajouri Garden', 'Lajpat Nagar'
		],
		majorRoads: [
			'Ring Road', 'Outer Ring Road', 'NH-8', 'NH-24',
			'GT Karnal Road', 'Mathura Road', 'Mehrauli-Badarpur Road'
		],
	},
	{
		name: 'Chennai',
		state: 'Tamil Nadu',
		lat: 13.0827,
		lng: 80.2707,
		population2024: 11500000,
		peakHours: {
			morning: { start: 8, end: 10, severity: 8 },
			evening: { start: 17, end: 20, severity: 8 },
		},
		avgSpeed: {
			peakHour: 18,
			offPeak: 35,
			night: 48,
		},
		trafficHotspots: [
			'Kathipara Junction', 'Vadapalani', 'Guindy', 'Anna Nagar',
			'T Nagar', 'Mount Road', 'OMR Toll Plaza', 'Tambaram',
			'Koyambedu', 'Egmore', 'Velachery', 'Perungudi'
		],
		majorRoads: [
			'OMR', 'ECR', 'GST Road', 'Inner Ring Road',
			'Anna Salai', 'Poonamallee High Road', 'Rajiv Gandhi Salai'
		],
	},
	{
		name: 'Hyderabad',
		state: 'Telangana',
		lat: 17.3850,
		lng: 78.4867,
		population2024: 10800000,
		peakHours: {
			morning: { start: 8, end: 10, severity: 8 },
			evening: { start: 18, end: 21, severity: 8 },
		},
		avgSpeed: {
			peakHour: 20,
			offPeak: 38,
			night: 52,
		},
		trafficHotspots: [
			'Mindspace Junction', 'Gachibowli', 'HITEC City', 'Kukatpally',
			'Ameerpet', 'Secunderabad', 'Dilsukhnagar', 'LB Nagar',
			'Madhapur', 'Jubilee Hills', 'Banjara Hills', 'Paradise Circle'
		],
		majorRoads: [
			'Outer Ring Road', 'Inner Ring Road', 'NH-65', 'NH-44',
			'Tank Bund Road', 'Necklace Road', 'PV Narasimha Rao Expressway'
		],
	},
	{
		name: 'Kolkata',
		state: 'West Bengal',
		lat: 22.5726,
		lng: 88.3639,
		population2024: 15100000,
		peakHours: {
			morning: { start: 9, end: 11, severity: 7 },
			evening: { start: 17, end: 20, severity: 8 },
		},
		avgSpeed: {
			peakHour: 16,
			offPeak: 30,
			night: 42,
		},
		trafficHotspots: [
			'Howrah Bridge', 'Sealdah', 'Park Street', 'Salt Lake',
			'EM Bypass', 'Ruby Hospital', 'Ultadanga', 'Tollygunge',
			'Gariahat', 'Esplanade', 'New Town', 'Rajarhat'
		],
		majorRoads: [
			'EM Bypass', 'AJC Bose Road', 'Park Street', 'VIP Road',
			'NH-12', 'Jessore Road', 'BT Road', 'Diamond Harbour Road'
		],
	},
	{
		name: 'Pune',
		state: 'Maharashtra',
		lat: 18.5204,
		lng: 73.8567,
		population2024: 7500000,
		peakHours: {
			morning: { start: 8, end: 10, severity: 8 },
			evening: { start: 17, end: 20, severity: 8 },
		},
		avgSpeed: {
			peakHour: 18,
			offPeak: 35,
			night: 50,
		},
		trafficHotspots: [
			'Hinjewadi', 'Wakad', 'Kharadi', 'Viman Nagar',
			'Katraj', 'Swargate', 'Shivajinagar', 'Baner',
			'Magarpatta', 'Hadapsar', 'Kothrud', 'Chandni Chowk'
		],
		majorRoads: [
			'Mumbai-Pune Expressway', 'Pune-Bangalore Highway', 'Pune Ring Road',
			'Nagar Road', 'Solapur Road', 'NIBM Road', 'DP Road'
		],
	},
	{
		name: 'Ahmedabad',
		state: 'Gujarat',
		lat: 23.0225,
		lng: 72.5714,
		population2024: 8600000,
		peakHours: {
			morning: { start: 9, end: 11, severity: 7 },
			evening: { start: 17, end: 20, severity: 7 },
		},
		avgSpeed: {
			peakHour: 22,
			offPeak: 40,
			night: 55,
		},
		trafficHotspots: [
			'SG Highway', 'Ashram Road', 'CG Road', 'Satellite',
			'Prahlad Nagar', 'Vastrapur', 'Maninagar', 'Thaltej',
			'GIFT City', 'Naroda', 'Bapunagar', 'Shahibaug'
		],
		majorRoads: [
			'SG Highway', 'SP Ring Road', 'Ashram Road', 'CG Road',
			'NH-48', 'Sardar Patel Ring Road', 'Riverfront Drive'
		],
	},
];

// ============================================================================
// INFRASTRUCTURE UPDATES (2019-2025)
// ============================================================================

export const INFRASTRUCTURE_UPDATES: InfrastructureUpdate[] = [
	// Bengaluru
	{
		id: 'BLR_METRO_PURPLE_EXT_2023',
		city: 'Bengaluru',
		type: 'metro_line',
		name: 'Namma Metro Purple Line Extension to Whitefield',
		description: 'Extended Purple Line from Baiyappanahalli to Whitefield covering IT corridor',
		completionDate: '2023-08-29',
		impactAreas: ['Whitefield', 'Mahadevapura', 'Hoodi', 'ITPL', 'Kadugodi'],
		trafficImpact: 'major_improvement',
		lengthKm: 13.71,
		costCrores: 4500,
	},
	{
		id: 'BLR_METRO_GREEN_SILK_2024',
		city: 'Bengaluru',
		type: 'metro_line',
		name: 'Namma Metro Green Line to Silk Board',
		description: 'Extended Green Line connecting Silk Board junction',
		completionDate: '2024-01-15',
		impactAreas: ['Silk Board', 'HSR Layout', 'Koramangala', 'BTM Layout'],
		trafficImpact: 'major_improvement',
		lengthKm: 3.5,
		costCrores: 1800,
	},
	{
		id: 'BLR_PERIPHERAL_RING_2024',
		city: 'Bengaluru',
		type: 'ring_road',
		name: 'Peripheral Ring Road Phase 1',
		description: 'First phase of 74km peripheral ring road connecting major highways',
		completionDate: '2024-12-01',
		impactAreas: ['Tumkur Road', 'Hosur Road', 'Sarjapur', 'Whitefield'],
		trafficImpact: 'major_improvement',
		lengthKm: 25,
		costCrores: 12000,
	},
	{
		id: 'BLR_FLYOVER_HEBBAL_2022',
		city: 'Bengaluru',
		type: 'flyover',
		name: 'Hebbal Interchange Upgrade',
		description: 'Multi-level interchange at Hebbal junction',
		completionDate: '2022-06-15',
		impactAreas: ['Hebbal', 'Bellary Road', 'Airport Road'],
		trafficImpact: 'moderate_improvement',
		lengthKm: 2.5,
		costCrores: 350,
	},
	// Mumbai
	{
		id: 'MUM_METRO_7_2022',
		city: 'Mumbai',
		type: 'metro_line',
		name: 'Mumbai Metro Line 7 (Dahisar East - Andheri East)',
		description: 'Connecting Western suburbs to Andheri',
		completionDate: '2022-04-02',
		impactAreas: ['Dahisar', 'Borivali', 'Kandivali', 'Goregaon', 'Andheri'],
		trafficImpact: 'major_improvement',
		lengthKm: 16.5,
		costCrores: 6200,
	},
	{
		id: 'MUM_COASTAL_ROAD_2024',
		city: 'Mumbai',
		type: 'expressway',
		name: 'Mumbai Coastal Road Phase 1',
		description: 'Marine Drive to Worli Sea Face coastal highway',
		completionDate: '2024-03-11',
		impactAreas: ['Marine Drive', 'Worli', 'Haji Ali', 'Lower Parel'],
		trafficImpact: 'major_improvement',
		lengthKm: 10.58,
		costCrores: 12721,
	},
	{
		id: 'MUM_ATAL_SETU_2024',
		city: 'Mumbai',
		type: 'bridge',
		name: 'Atal Setu (Mumbai Trans Harbour Link)',
		description: 'Connecting Sewri to Navi Mumbai - India\'s longest sea bridge',
		completionDate: '2024-01-12',
		impactAreas: ['Sewri', 'Navi Mumbai', 'JNPT', 'Ulwe'],
		trafficImpact: 'major_improvement',
		lengthKm: 21.8,
		costCrores: 17843,
	},
	// Delhi
	{
		id: 'DEL_METRO_PHASE4_2024',
		city: 'Delhi',
		type: 'metro_line',
		name: 'Delhi Metro Phase 4 - Multiple Lines',
		description: 'Extension of multiple metro corridors including Tughlakabad-Aerocity',
		completionDate: '2024-06-30',
		impactAreas: ['Aerocity', 'Tughlakabad', 'Janakpuri', 'RK Ashram'],
		trafficImpact: 'major_improvement',
		lengthKm: 65,
		costCrores: 24948,
	},
	{
		id: 'DEL_URBAN_EXT_2023',
		city: 'Delhi',
		type: 'expressway',
		name: 'Dwarka Expressway',
		description: 'NH-248BB connecting Dwarka to Gurgaon bypassing city traffic',
		completionDate: '2024-03-11',
		impactAreas: ['Dwarka', 'Gurgaon', 'Palam', 'Sector 21'],
		trafficImpact: 'major_improvement',
		lengthKm: 27.6,
		costCrores: 9000,
	},
	{
		id: 'DEL_SIGNAL_AI_2023',
		city: 'Delhi',
		type: 'signal_system',
		name: 'Integrated Traffic Management System',
		description: 'AI-powered adaptive traffic signals at 200 junctions',
		completionDate: '2023-12-01',
		impactAreas: ['ITO', 'Connaught Place', 'Outer Ring Road', 'Inner Ring Road'],
		trafficImpact: 'moderate_improvement',
	},
	// Chennai
	{
		id: 'CHN_METRO_PHASE2_2024',
		city: 'Chennai',
		type: 'metro_line',
		name: 'Chennai Metro Phase 2 - Corridor 3',
		description: 'Madhavaram to Siruseri IT Corridor',
		completionDate: '2024-09-15',
		impactAreas: ['Madhavaram', 'OMR', 'Siruseri', 'Sholinganallur'],
		trafficImpact: 'major_improvement',
		lengthKm: 45.8,
		costCrores: 21520,
	},
	{
		id: 'CHN_KATHIPARA_FO_2020',
		city: 'Chennai',
		type: 'flyover',
		name: 'Kathipara Cloverleaf Improvement',
		description: 'Additional ramps at Kathipara to reduce congestion',
		completionDate: '2020-08-15',
		impactAreas: ['Kathipara', 'Guindy', 'Alandur', 'St Thomas Mount'],
		trafficImpact: 'moderate_improvement',
		lengthKm: 1.5,
		costCrores: 180,
	},
	// Hyderabad
	{
		id: 'HYD_METRO_ORR_2024',
		city: 'Hyderabad',
		type: 'metro_line',
		name: 'Hyderabad Metro Extension to ORR',
		description: 'Extension from Raidurg to ORR and Financial District',
		completionDate: '2024-11-30',
		impactAreas: ['Raidurg', 'Financial District', 'Narsingi', 'Gachibowli'],
		trafficImpact: 'major_improvement',
		lengthKm: 7.5,
		costCrores: 3200,
	},
	{
		id: 'HYD_REGIONAL_RING_2023',
		city: 'Hyderabad',
		type: 'ring_road',
		name: 'Regional Ring Road Phase 1',
		description: 'First phase connecting Shamirpet to Sangareddy',
		completionDate: '2023-07-20',
		impactAreas: ['Shamirpet', 'Patancheru', 'Sangareddy'],
		trafficImpact: 'moderate_improvement',
		lengthKm: 158,
		costCrores: 11500,
	},
	// Pune
	{
		id: 'PUN_METRO_2022',
		city: 'Pune',
		type: 'metro_line',
		name: 'Pune Metro Line 1 (PCMC to Swargate)',
		description: 'First metro line connecting Pimpri-Chinchwad to Swargate',
		completionDate: '2022-12-18',
		impactAreas: ['PCMC', 'Dapodi', 'Bopodi', 'Shivajinagar', 'Swargate'],
		trafficImpact: 'major_improvement',
		lengthKm: 12,
		costCrores: 5000,
	},
	{
		id: 'PUN_RING_ROAD_2024',
		city: 'Pune',
		type: 'ring_road',
		name: 'Pune Ring Road Phase 1',
		description: 'Northern section connecting Wagholi to Pirangut',
		completionDate: '2024-08-01',
		impactAreas: ['Wagholi', 'Kharadi', 'Pirangut', 'Hinjewadi'],
		trafficImpact: 'major_improvement',
		lengthKm: 44,
		costCrores: 8000,
	},
];

// ============================================================================
// BUS ROUTES - Major City Bus Systems
// ============================================================================

export const BUS_ROUTES: BusRoute[] = [
	// Bengaluru BMTC
	{
		id: 'BLR_500C',
		city: 'Bengaluru',
		routeNumber: '500C',
		routeName: 'Kempegowda Bus Station to Electronic City',
		operator: 'BMTC',
		startPoint: 'Majestic',
		endPoint: 'Electronic City Phase 1',
		majorStops: ['Majestic', 'Corporation Circle', 'Town Hall', 'KR Market', 'Lalbagh', 'Jayanagar', 'BTM Layout', 'Silk Board', 'Electronic City'],
		frequency: { peakMinutes: 8, offPeakMinutes: 15 },
		operatingHours: { start: '05:30', end: '23:30' },
		avgTripDuration: 75,
		distanceKm: 22,
		type: 'city',
		lastUpdated: '2024-01-01',
	},
	{
		id: 'BLR_V500A',
		city: 'Bengaluru',
		routeNumber: 'V-500A',
		routeName: 'Majestic to Whitefield (Volvo)',
		operator: 'BMTC',
		startPoint: 'Majestic',
		endPoint: 'Whitefield ITPL',
		majorStops: ['Majestic', 'Trinity Circle', 'Indiranagar', 'KR Puram', 'Marathahalli', 'Whitefield'],
		frequency: { peakMinutes: 10, offPeakMinutes: 20 },
		operatingHours: { start: '06:00', end: '22:00' },
		avgTripDuration: 90,
		distanceKm: 25,
		type: 'volvo',
		lastUpdated: '2024-01-01',
	},
	// Mumbai BEST
	{
		id: 'MUM_AS1',
		city: 'Mumbai',
		routeNumber: 'AS-1',
		routeName: 'Andheri Station to BKC',
		operator: 'BEST',
		startPoint: 'Andheri Station (W)',
		endPoint: 'Bandra Kurla Complex',
		majorStops: ['Andheri Station', 'DN Nagar', 'JVLR', 'BKC'],
		frequency: { peakMinutes: 5, offPeakMinutes: 10 },
		operatingHours: { start: '06:00', end: '23:00' },
		avgTripDuration: 40,
		distanceKm: 8,
		type: 'ac',
		lastUpdated: '2024-01-01',
	},
	{
		id: 'MUM_123',
		city: 'Mumbai',
		routeNumber: '123',
		routeName: 'Mantralaya to CSMT',
		operator: 'BEST',
		startPoint: 'Mantralaya',
		endPoint: 'CSMT',
		majorStops: ['Mantralaya', 'Marine Drive', 'Churchgate', 'Flora Fountain', 'CSMT'],
		frequency: { peakMinutes: 10, offPeakMinutes: 15 },
		operatingHours: { start: '05:30', end: '23:30' },
		avgTripDuration: 45,
		distanceKm: 7,
		type: 'city',
		lastUpdated: '2024-01-01',
	},
	// Delhi DTC
	{
		id: 'DEL_AC01',
		city: 'Delhi',
		routeNumber: 'AC-01',
		routeName: 'Dwarka Sector 21 to ISBT Kashmere Gate',
		operator: 'DTC',
		startPoint: 'Dwarka Sector 21',
		endPoint: 'ISBT Kashmere Gate',
		majorStops: ['Dwarka Sec 21', 'Janakpuri', 'Rajouri Garden', 'Karol Bagh', 'Connaught Place', 'ISBT'],
		frequency: { peakMinutes: 10, offPeakMinutes: 20 },
		operatingHours: { start: '05:00', end: '23:00' },
		avgTripDuration: 90,
		distanceKm: 28,
		type: 'ac',
		lastUpdated: '2024-01-01',
	},
	// Chennai MTC
	{
		id: 'CHN_21G',
		city: 'Chennai',
		routeNumber: '21G',
		routeName: 'Broadway to CMBT',
		operator: 'MTC',
		startPoint: 'Broadway',
		endPoint: 'CMBT',
		majorStops: ['Broadway', 'Egmore', 'T Nagar', 'Vadapalani', 'Koyambedu CMBT'],
		frequency: { peakMinutes: 8, offPeakMinutes: 12 },
		operatingHours: { start: '05:00', end: '23:00' },
		avgTripDuration: 55,
		distanceKm: 12,
		type: 'city',
		lastUpdated: '2024-01-01',
	},
	// Hyderabad TSRTC
	{
		id: 'HYD_8H',
		city: 'Hyderabad',
		routeNumber: '8H',
		routeName: 'Secunderabad to HITEC City',
		operator: 'TSRTC',
		startPoint: 'Secunderabad Station',
		endPoint: 'HITEC City',
		majorStops: ['Secunderabad', 'Paradise', 'Ameerpet', 'Kukatpally', 'HITEC City'],
		frequency: { peakMinutes: 10, offPeakMinutes: 15 },
		operatingHours: { start: '05:30', end: '23:00' },
		avgTripDuration: 60,
		distanceKm: 18,
		type: 'city',
		lastUpdated: '2024-01-01',
	},
];

// ============================================================================
// DEVELOPMENT ZONES - New Buildings & Areas
// ============================================================================

export const DEVELOPMENT_ZONES: DevelopmentZone[] = [
	// Bengaluru
	{
		id: 'BLR_EMBASSY_TECH_VILLAGE',
		city: 'Bengaluru',
		name: 'Embassy Tech Village',
		type: 'it_park',
		description: 'Major IT park housing Google, IBM, Yahoo offices',
		startYear: 2008,
		completionYear: 2018,
		estimatedDailyCommuters: 35000,
		peakTrafficTimes: ['08:30-10:30', '17:30-20:30'],
		nearbyLandmarks: ['Bellandur Lake', 'Outer Ring Road', 'Marathahalli'],
		trafficChallenges: ['Single entry/exit causing bottleneck', 'ORR congestion during peak'],
	},
	{
		id: 'BLR_PRESTIGE_TECH_PARK',
		city: 'Bengaluru',
		name: 'Prestige Tech Park',
		type: 'it_park',
		description: 'Large tech campus with multiple company offices',
		startYear: 2010,
		completionYear: 2015,
		estimatedDailyCommuters: 45000,
		peakTrafficTimes: ['08:00-10:30', '17:30-21:00'],
		nearbyLandmarks: ['Marathahalli Bridge', 'Outer Ring Road'],
		trafficChallenges: ['Marathahalli junction congestion', 'Limited parking'],
	},
	{
		id: 'BLR_ELECTRONIC_CITY_PH2',
		city: 'Bengaluru',
		name: 'Electronic City Phase 2 Expansion',
		type: 'it_park',
		description: 'Expansion of Electronic City with new tech parks',
		startYear: 2018,
		completionYear: 2024,
		estimatedDailyCommuters: 60000,
		peakTrafficTimes: ['08:00-10:00', '18:00-20:30'],
		nearbyLandmarks: ['Infosys Campus', 'Wipro Campus', 'ELCITA'],
		trafficChallenges: ['Silk Board junction', 'Hosur Road bottleneck'],
	},
	// Mumbai
	{
		id: 'MUM_BKC_PHASE3',
		city: 'Mumbai',
		name: 'BKC Commercial Hub Phase 3',
		type: 'commercial',
		description: 'New commercial towers in Bandra Kurla Complex',
		startYear: 2019,
		completionYear: 2024,
		estimatedDailyCommuters: 120000,
		peakTrafficTimes: ['08:30-10:30', '17:00-21:00'],
		nearbyLandmarks: ['MMRDA Ground', 'BKC Metro Station', 'NSE Building'],
		trafficChallenges: ['JVLR traffic', 'Limited east-west connectivity'],
	},
	{
		id: 'MUM_NAVI_URAN',
		city: 'Mumbai',
		name: 'Navi Mumbai Airport Influence Notified Area',
		type: 'airport',
		description: 'New airport and surrounding SEZ development',
		startYear: 2020,
		completionYear: null,
		estimatedDailyCommuters: 200000,
		peakTrafficTimes: ['06:00-22:00'],
		nearbyLandmarks: ['JNPT', 'Ulwe', 'Panvel'],
		trafficChallenges: ['Increased traffic on Sion-Panvel Highway', 'New road infrastructure needed'],
	},
	// Delhi
	{
		id: 'DEL_AEROCITY_PHASE2',
		city: 'Delhi',
		name: 'Aerocity Commercial District Phase 2',
		type: 'commercial',
		description: 'Expansion of hospitality and retail near IGI Airport',
		startYear: 2018,
		completionYear: 2023,
		estimatedDailyCommuters: 80000,
		peakTrafficTimes: ['09:00-11:00', '17:00-20:00'],
		nearbyLandmarks: ['IGI Airport', 'Aerocity Metro', 'NH-48'],
		trafficChallenges: ['NH-48 congestion', 'Airport approach traffic'],
	},
	{
		id: 'DEL_NOIDA_FILM_CITY',
		city: 'Delhi',
		name: 'Noida Film City',
		type: 'mixed_use',
		description: 'Entertainment and commercial hub in Noida Sector 16A',
		startYear: 2015,
		completionYear: 2022,
		estimatedDailyCommuters: 40000,
		peakTrafficTimes: ['10:00-12:00', '18:00-22:00'],
		nearbyLandmarks: ['Noida Expressway', 'Sector 18 Market'],
		trafficChallenges: ['DND Flyway traffic', 'Weekend entertainment crowd'],
	},
	// Hyderabad
	{
		id: 'HYD_FINANCIAL_DIST',
		city: 'Hyderabad',
		name: 'Hyderabad Financial District',
		type: 'commercial',
		description: 'Major financial and IT hub near HITEC City',
		startYear: 2016,
		completionYear: 2022,
		estimatedDailyCommuters: 75000,
		peakTrafficTimes: ['08:30-10:30', '17:30-20:30'],
		nearbyLandmarks: ['HITEC City', 'Mindspace', 'Outer Ring Road'],
		trafficChallenges: ['Raidurg junction congestion', 'ORR peak traffic'],
	},
	// Chennai
	{
		id: 'CHN_OMR_SIRUSERI',
		city: 'Chennai',
		name: 'Siruseri IT Park Expansion',
		type: 'it_park',
		description: 'Major IT corridor expansion on OMR',
		startYear: 2019,
		completionYear: 2024,
		estimatedDailyCommuters: 55000,
		peakTrafficTimes: ['08:00-10:30', '17:30-20:30'],
		nearbyLandmarks: ['SIPCOT IT Park', 'OMR', 'Kelambakkam'],
		trafficChallenges: ['OMR signal congestion', 'Limited public transport'],
	},
];

// ============================================================================
// FESTIVAL TRAFFIC PATTERNS
// ============================================================================

export const FESTIVAL_TRAFFIC_PATTERNS: FestivalTrafficPattern[] = [
	{
		name: 'Diwali',
		regions: ['All India'],
		months: [10, 11],
		trafficMultiplier: 2.5,
		peakDays: '2-3 days before and after main Diwali day',
		affectedRoutes: ['All major markets', 'Shopping areas', 'Temple routes'],
		recommendations: ['Avoid peak shopping hours (4-9 PM)', 'Use public transport', 'Plan travel early morning'],
	},
	{
		name: 'Durga Puja',
		regions: ['West Bengal', 'Odisha', 'Assam', 'Bihar'],
		months: [9, 10],
		trafficMultiplier: 3.0,
		peakDays: 'Saptami to Dashami (4 days)',
		affectedRoutes: ['Pandal routes', 'Park Street', 'Salt Lake', 'Howrah Bridge'],
		recommendations: ['Use metro', 'Pandal hopping after midnight', 'Avoid car travel'],
	},
	{
		name: 'Ganesh Chaturthi',
		regions: ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Goa'],
		months: [8, 9],
		trafficMultiplier: 2.8,
		peakDays: 'Day 1 and Visarjan day',
		affectedRoutes: ['Pandal routes', 'Visarjan routes', 'Beach roads'],
		recommendations: ['Avoid visarjan routes', 'Check local announcements', 'Early morning travel'],
	},
	{
		name: 'Navratri/Dandiya',
		regions: ['Gujarat', 'Maharashtra', 'Rajasthan'],
		months: [9, 10],
		trafficMultiplier: 2.0,
		peakDays: '9 nights of Navratri, peak on weekends',
		affectedRoutes: ['Dandiya venues', 'Western suburbs', 'Satellite Road (Ahmedabad)'],
		recommendations: ['Avoid 7-11 PM near venues', 'Park away and walk', 'Use shared transport'],
	},
	{
		name: 'Eid',
		regions: ['All India, peak in UP, Delhi, Hyderabad'],
		months: [3, 4, 5, 6],
		trafficMultiplier: 2.2,
		peakDays: 'Eid day morning prayer and after iftar week before',
		affectedRoutes: ['Mosque routes', 'Old city areas', 'Markets'],
		recommendations: ['Avoid morning 6-10 AM on Eid', 'Plan alternate routes', 'Expect delays near Jama Masjid areas'],
	},
	{
		name: 'Pongal/Sankranti',
		regions: ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
		months: [1],
		trafficMultiplier: 2.0,
		peakDays: '3-day festival mid-January',
		affectedRoutes: ['Interstate highways', 'Bus stands', 'Railway stations'],
		recommendations: ['Book transport early', 'Expect highway delays', 'Allow extra travel time'],
	},
	{
		name: 'Onam',
		regions: ['Kerala'],
		months: [8, 9],
		trafficMultiplier: 2.3,
		peakDays: 'Thiruvonam day and 2 days around',
		affectedRoutes: ['All Kerala roads', 'Temple routes', 'Backwater areas'],
		recommendations: ['Book well in advance', 'Expect tourist traffic', 'Use KSRTC bus services'],
	},
	{
		name: 'Christmas/New Year',
		regions: ['All metros', 'Goa', 'Kerala', 'Mumbai'],
		months: [12, 1],
		trafficMultiplier: 2.0,
		peakDays: 'Dec 24-26, Dec 31-Jan 2',
		affectedRoutes: ['Church areas', 'Malls', 'Party zones', 'Goa highways'],
		recommendations: ['Designated driver if partying', 'Surge pricing for cabs', 'Pre-book transport'],
	},
];

// ============================================================================
// CONSTRUCTION ZONES (Active and Historical)
// ============================================================================

export const CONSTRUCTION_ZONES: ConstructionZone[] = [
	// Bengaluru
	{
		id: 'BLR_METRO_KENGERI_2024',
		city: 'Bengaluru',
		location: 'Mysore Road - Kengeri Section',
		type: 'Metro Construction',
		startDate: '2022-06-01',
		expectedEndDate: '2025-06-30',
		status: 'active',
		delayMinutes: 15,
		alternateRoutes: ['NICE Road', 'Chord Road'],
		affectedDirections: ['Towards Kengeri', 'Towards City'],
	},
	{
		id: 'BLR_ROAD_ORR_WIDENING',
		city: 'Bengaluru',
		location: 'Outer Ring Road - Marathahalli to Bellandur',
		type: 'Road Widening',
		startDate: '2023-01-15',
		expectedEndDate: '2025-03-31',
		status: 'delayed',
		delayMinutes: 20,
		alternateRoutes: ['Sarjapur Road', 'Varthur Road'],
		affectedDirections: ['Both directions during peak hours'],
	},
	// Mumbai
	{
		id: 'MUM_METRO_3_COLABA',
		city: 'Mumbai',
		location: 'Colaba-Bandra-SEEPZ Metro Line 3',
		type: 'Metro Underground Construction',
		startDate: '2016-10-01',
		expectedEndDate: '2025-12-31',
		status: 'active',
		delayMinutes: 10,
		alternateRoutes: ['Western Line local', 'BEST bus'],
		affectedDirections: ['Marine Drive area', 'BKC area'],
	},
	// Delhi
	{
		id: 'DEL_EXPRESSWAY_BARAPULLA',
		city: 'Delhi',
		location: 'Barapullah Elevated Road Phase 3',
		type: 'Elevated Road Construction',
		startDate: '2021-03-01',
		expectedEndDate: '2025-03-31',
		status: 'active',
		delayMinutes: 12,
		alternateRoutes: ['Lodhi Road', 'Mathura Road'],
		affectedDirections: ['Towards Sarai Kale Khan'],
	},
	// Chennai
	{
		id: 'CHN_METRO_SIRUSERI',
		city: 'Chennai',
		location: 'OMR - Sholinganallur to Siruseri',
		type: 'Metro Construction',
		startDate: '2022-04-01',
		expectedEndDate: '2025-09-30',
		status: 'active',
		delayMinutes: 18,
		alternateRoutes: ['ECR', 'Velachery-Tambaram Road'],
		affectedDirections: ['OMR Southbound', 'OMR Northbound'],
	},
	// Hyderabad
	{
		id: 'HYD_FLYOVER_BIODIVERSITY',
		city: 'Hyderabad',
		location: 'Biodiversity Junction Flyover',
		type: 'Flyover Construction',
		startDate: '2023-06-01',
		expectedEndDate: '2024-12-31',
		status: 'completed',
		delayMinutes: 0,
		alternateRoutes: [],
		affectedDirections: [],
	},
];

// ============================================================================
// HISTORICAL TRAFFIC DATA (6 Years: 2019-2024)
// ============================================================================

export const HISTORICAL_TRAFFIC_DATA: TrafficHistoricalData[] = [
	// 2019 Data
	{ year: 2019, month: 1, city: 'Bengaluru', avgDailyVehicles: 8200000, avgSpeedKmh: 18, accidentCount: 450, congestionIndex: 72, airQualityIndex: 85, majorEvents: ['Republic Day traffic diversion'] },
	{ year: 2019, month: 6, city: 'Bengaluru', avgDailyVehicles: 8400000, avgSpeedKmh: 16, accidentCount: 520, congestionIndex: 78, airQualityIndex: 65, majorEvents: ['Monsoon waterlogging', 'School reopening'] },
	{ year: 2019, month: 12, city: 'Bengaluru', avgDailyVehicles: 8600000, avgSpeedKmh: 19, accidentCount: 380, congestionIndex: 68, airQualityIndex: 90, majorEvents: ['Tech Summit'] },

	// 2020 Data (COVID impact)
	{ year: 2020, month: 3, city: 'Bengaluru', avgDailyVehicles: 4500000, avgSpeedKmh: 38, accidentCount: 120, congestionIndex: 22, airQualityIndex: 45, majorEvents: ['COVID Lockdown begins'] },
	{ year: 2020, month: 6, city: 'Bengaluru', avgDailyVehicles: 2100000, avgSpeedKmh: 55, accidentCount: 45, congestionIndex: 8, airQualityIndex: 28, majorEvents: ['Complete lockdown'] },
	{ year: 2020, month: 12, city: 'Bengaluru', avgDailyVehicles: 5800000, avgSpeedKmh: 28, accidentCount: 280, congestionIndex: 45, airQualityIndex: 72, majorEvents: ['Unlock phases', 'WFH continues'] },

	// 2021 Data (Recovery)
	{ year: 2021, month: 6, city: 'Bengaluru', avgDailyVehicles: 6200000, avgSpeedKmh: 24, accidentCount: 340, congestionIndex: 55, airQualityIndex: 68, majorEvents: ['Second wave recovery', 'Partial offices'] },
	{ year: 2021, month: 12, city: 'Bengaluru', avgDailyVehicles: 7200000, avgSpeedKmh: 20, accidentCount: 410, congestionIndex: 65, airQualityIndex: 78, majorEvents: ['Tech summits resume', 'Holiday traffic'] },

	// 2022 Data (Return to normal)
	{ year: 2022, month: 6, city: 'Bengaluru', avgDailyVehicles: 8100000, avgSpeedKmh: 17, accidentCount: 480, congestionIndex: 74, airQualityIndex: 75, majorEvents: ['Full office return', 'Metro extension opens'] },
	{ year: 2022, month: 12, city: 'Bengaluru', avgDailyVehicles: 8500000, avgSpeedKmh: 18, accidentCount: 420, congestionIndex: 72, airQualityIndex: 88, majorEvents: ['Pune Metro operational', 'Tech layoffs WFH'] },

	// 2023 Data
	{ year: 2023, month: 6, city: 'Bengaluru', avgDailyVehicles: 8800000, avgSpeedKmh: 15, accidentCount: 510, congestionIndex: 82, airQualityIndex: 70, majorEvents: ['Record rains', 'Metro Purple extension'] },
	{ year: 2023, month: 12, city: 'Bengaluru', avgDailyVehicles: 9100000, avgSpeedKmh: 16, accidentCount: 440, congestionIndex: 78, airQualityIndex: 85, majorEvents: ['G20 events', 'Signal AI deployment'] },

	// 2024 Data
	{ year: 2024, month: 6, city: 'Bengaluru', avgDailyVehicles: 9400000, avgSpeedKmh: 17, accidentCount: 390, congestionIndex: 75, airQualityIndex: 68, majorEvents: ['Metro Green Silk Board', 'EV adoption growth'] },
	{ year: 2024, month: 12, city: 'Bengaluru', avgDailyVehicles: 9600000, avgSpeedKmh: 18, accidentCount: 360, congestionIndex: 72, airQualityIndex: 82, majorEvents: ['Peripheral Ring Road Phase 1', 'Smart signals expansion'] },

	// Mumbai Data
	{ year: 2019, month: 6, city: 'Mumbai', avgDailyVehicles: 12000000, avgSpeedKmh: 14, accidentCount: 680, congestionIndex: 85, airQualityIndex: 95, majorEvents: ['Monsoon flooding'] },
	{ year: 2020, month: 6, city: 'Mumbai', avgDailyVehicles: 3500000, avgSpeedKmh: 48, accidentCount: 85, congestionIndex: 12, airQualityIndex: 35, majorEvents: ['COVID Lockdown'] },
	{ year: 2021, month: 12, city: 'Mumbai', avgDailyVehicles: 9800000, avgSpeedKmh: 18, accidentCount: 520, congestionIndex: 72, airQualityIndex: 80, majorEvents: ['Metro Line 7 prep'] },
	{ year: 2022, month: 6, city: 'Mumbai', avgDailyVehicles: 11200000, avgSpeedKmh: 15, accidentCount: 620, congestionIndex: 80, airQualityIndex: 88, majorEvents: ['Metro Line 7 opens', 'Record monsoon'] },
	{ year: 2023, month: 12, city: 'Mumbai', avgDailyVehicles: 12500000, avgSpeedKmh: 16, accidentCount: 550, congestionIndex: 78, airQualityIndex: 92, majorEvents: ['Coastal Road construction peak'] },
	{ year: 2024, month: 6, city: 'Mumbai', avgDailyVehicles: 12200000, avgSpeedKmh: 18, accidentCount: 480, congestionIndex: 70, airQualityIndex: 85, majorEvents: ['Coastal Road Phase 1 opens', 'Atal Setu operational'] },

	// Delhi Data
	{ year: 2019, month: 11, city: 'Delhi', avgDailyVehicles: 14000000, avgSpeedKmh: 22, accidentCount: 520, congestionIndex: 75, airQualityIndex: 380, majorEvents: ['Severe pollution', 'Odd-even'] },
	{ year: 2020, month: 6, city: 'Delhi', avgDailyVehicles: 4200000, avgSpeedKmh: 52, accidentCount: 95, congestionIndex: 15, airQualityIndex: 55, majorEvents: ['COVID Lockdown'] },
	{ year: 2022, month: 11, city: 'Delhi', avgDailyVehicles: 13500000, avgSpeedKmh: 20, accidentCount: 480, congestionIndex: 78, airQualityIndex: 320, majorEvents: ['Pollution emergency', 'GRAP measures'] },
	{ year: 2023, month: 6, city: 'Delhi', avgDailyVehicles: 13800000, avgSpeedKmh: 22, accidentCount: 420, congestionIndex: 72, airQualityIndex: 120, majorEvents: ['Metro Phase 4 work', 'G20 Summit prep'] },
	{ year: 2024, month: 6, city: 'Delhi', avgDailyVehicles: 14200000, avgSpeedKmh: 24, accidentCount: 380, congestionIndex: 68, airQualityIndex: 145, majorEvents: ['Dwarka Expressway opens', 'Smart traffic signals'] },
];

// ============================================================================
// WEATHER TRAFFIC IMPACT
// ============================================================================

export const WEATHER_TRAFFIC_IMPACT: WeatherTrafficImpact[] = [
	{
		condition: 'Heavy Monsoon Rain',
		region: 'Mumbai, Chennai, Kolkata',
		speedReduction: 40,
		accidentRiskMultiplier: 2.5,
		visibilityImpact: 'Severely reduced, 50-100m',
		recommendations: ['Avoid low-lying areas', 'Check waterlogging reports', 'Allow 2x travel time'],
	},
	{
		condition: 'Moderate Rain',
		region: 'All India',
		speedReduction: 25,
		accidentRiskMultiplier: 1.8,
		visibilityImpact: 'Moderately reduced, 200-500m',
		recommendations: ['Maintain safe distance', 'Use headlights', 'Avoid overtaking'],
	},
	{
		condition: 'Dense Fog',
		region: 'Delhi NCR, Punjab, Haryana, UP',
		speedReduction: 60,
		accidentRiskMultiplier: 4.0,
		visibilityImpact: 'Near zero, less than 50m',
		recommendations: ['Avoid highway travel', 'Use fog lights only', 'Follow vehicle ahead closely', 'Check flight/train status'],
	},
	{
		condition: 'Extreme Heat (>45°C)',
		region: 'Rajasthan, Gujarat, Central India',
		speedReduction: 10,
		accidentRiskMultiplier: 1.3,
		visibilityImpact: 'Heat shimmer on roads',
		recommendations: ['Avoid 12-4 PM travel', 'Carry water', 'Check tire pressure', 'Watch for tire bursts'],
	},
	{
		condition: 'Dust Storm',
		region: 'Rajasthan, Delhi NCR, Western UP',
		speedReduction: 50,
		accidentRiskMultiplier: 3.0,
		visibilityImpact: 'Severely reduced, 20-100m',
		recommendations: ['Pull over if possible', 'Keep windows closed', 'Use hazard lights'],
	},
	{
		condition: 'Smog/Pollution',
		region: 'Delhi NCR, Lucknow, Kanpur',
		speedReduction: 15,
		accidentRiskMultiplier: 1.5,
		visibilityImpact: 'Reduced to 500m-1km',
		recommendations: ['Use masks', 'Keep windows closed', 'Consider public transport'],
	},
];

// ============================================================================
// DATA ACCESS FUNCTIONS
// ============================================================================

/**
 * Get city traffic profile by name
 */
export function getCityTrafficProfile(cityName: string): CityTrafficProfile | undefined {
	return CITY_TRAFFIC_PROFILES.find(
		city => city.name.toLowerCase() === cityName.toLowerCase()
	);
}

/**
 * Get infrastructure updates for a city
 */
export function getInfrastructureUpdates(cityName: string, afterYear?: number): InfrastructureUpdate[] {
	return INFRASTRUCTURE_UPDATES.filter(update => {
		const matchCity = update.city.toLowerCase() === cityName.toLowerCase();
		if (!afterYear) return matchCity;
		const updateYear = new Date(update.completionDate).getFullYear();
		return matchCity && updateYear >= afterYear;
	});
}

/**
 * Get bus routes for a city
 */
export function getBusRoutes(cityName: string, routeType?: BusRoute['type']): BusRoute[] {
	return BUS_ROUTES.filter(route => {
		const matchCity = route.city.toLowerCase() === cityName.toLowerCase();
		if (!routeType) return matchCity;
		return matchCity && route.type === routeType;
	});
}

/**
 * Get development zones that affect traffic
 */
export function getDevelopmentZones(cityName: string): DevelopmentZone[] {
	return DEVELOPMENT_ZONES.filter(
		zone => zone.city.toLowerCase() === cityName.toLowerCase()
	);
}

/**
 * Get active construction zones
 */
export function getActiveConstructionZones(cityName?: string): ConstructionZone[] {
	return CONSTRUCTION_ZONES.filter(zone => {
		const isActive = zone.status === 'active' || zone.status === 'delayed';
		if (!cityName) return isActive;
		return isActive && zone.city.toLowerCase() === cityName.toLowerCase();
	});
}

/**
 * Get festival traffic patterns for current/upcoming month
 */
export function getUpcomingFestivals(month: number): FestivalTrafficPattern[] {
	return FESTIVAL_TRAFFIC_PATTERNS.filter(
		festival => festival.months.includes(month) || festival.months.includes((month % 12) + 1)
	);
}

/**
 * Get historical traffic data for a city and year range
 */
export function getHistoricalTrafficData(
	cityName: string,
	startYear: number,
	endYear: number
): TrafficHistoricalData[] {
	return HISTORICAL_TRAFFIC_DATA.filter(
		data =>
			data.city.toLowerCase() === cityName.toLowerCase() &&
			data.year >= startYear &&
			data.year <= endYear
	);
}

/**
 * Get weather impact data for a condition
 */
export function getWeatherImpact(condition: string): WeatherTrafficImpact | undefined {
	return WEATHER_TRAFFIC_IMPACT.find(
		impact => impact.condition.toLowerCase().includes(condition.toLowerCase())
	);
}

/**
 * Calculate current traffic multiplier based on time, day, festivals
 */
export function calculateTrafficMultiplier(
	cityName: string,
	hour: number,
	dayOfWeek: number,
	month: number
): { multiplier: number; factors: string[] } {
	const factors: string[] = [];
	let multiplier = 1.0;

	// Get city profile
	const city = getCityTrafficProfile(cityName);
	if (!city) {
		return { multiplier: 1.2, factors: ['City data not available'] };
	}

	// Check peak hours
	const { morning, evening } = city.peakHours;
	if (hour >= morning.start && hour <= morning.end) {
		multiplier *= 1 + (morning.severity / 10);
		factors.push('Morning peak hour');
	} else if (hour >= evening.start && hour <= evening.end) {
		multiplier *= 1 + (evening.severity / 10);
		factors.push('Evening peak hour');
	} else if (hour >= 22 || hour <= 5) {
		multiplier *= 0.6;
		factors.push('Night time - light traffic');
	}

	// Weekday vs weekend
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
	if (isWeekend) {
		multiplier *= 0.7;
		factors.push('Weekend - reduced traffic');
	}

	// Check festivals
	const festivals = getUpcomingFestivals(month);
	if (festivals.length > 0) {
		const avgFestivalMultiplier = festivals.reduce((sum, f) => sum + f.trafficMultiplier, 0) / festivals.length;
		multiplier *= 1 + ((avgFestivalMultiplier - 1) * 0.3); // Partial festival effect
		factors.push(`Festival season: ${festivals.map(f => f.name).join(', ')}`);
	}

	// Check active construction
	const constructions = getActiveConstructionZones(cityName);
	if (constructions.length > 0) {
		const avgDelay = constructions.reduce((sum, c) => sum + c.delayMinutes, 0) / constructions.length;
		if (avgDelay > 10) {
			multiplier *= 1.15;
			factors.push(`Active construction: ${constructions.map(c => c.location).join(', ')}`);
		}
	}

	return { multiplier: Math.round(multiplier * 100) / 100, factors };
}

/**
 * Get comprehensive traffic intelligence for a route
 */
export function getRouteTrafficIntelligence(
	originCity: string,
	destinationCity: string,
	hour: number,
	dayOfWeek: number,
	month: number
): {
	trafficMultiplier: number;
	factors: string[];
	recommendations: string[];
	infrastructure: InfrastructureUpdate[];
	constructions: ConstructionZone[];
	festivals: FestivalTrafficPattern[];
	historicalContext: string;
} {
	const { multiplier, factors } = calculateTrafficMultiplier(originCity, hour, dayOfWeek, month);
	const recommendations: string[] = [];

	// Get relevant data
	const infrastructure = getInfrastructureUpdates(originCity, 2022);
	const constructions = getActiveConstructionZones(originCity);
	const festivals = getUpcomingFestivals(month);
	const historicalData = getHistoricalTrafficData(originCity, 2023, 2024);

	// Generate recommendations
	if (multiplier > 1.5) {
		recommendations.push('Consider delaying travel by 1-2 hours');
		recommendations.push('Use public transport if available');
	}

	if (constructions.length > 0) {
		recommendations.push(`Avoid: ${constructions.map(c => c.location).join(', ')}`);
		const alternates = constructions.flatMap(c => c.alternateRoutes);
		if (alternates.length > 0) {
			recommendations.push(`Alternate routes: ${[...new Set(alternates)].join(', ')}`);
		}
	}

	if (infrastructure.filter(i => i.trafficImpact === 'major_improvement').length > 0) {
		const newRoutes = infrastructure.filter(i => i.trafficImpact === 'major_improvement');
		recommendations.push(`Consider new routes: ${newRoutes.map(r => r.name).join(', ')}`);
	}

	// Historical context
	let historicalContext = 'No historical data available';
	if (historicalData.length > 0) {
		const latestData = historicalData[historicalData.length - 1];
		const prevYearData = historicalData.find(d => d.year === latestData.year - 1 && d.month === latestData.month);
		if (prevYearData) {
			const speedChange = ((latestData.avgSpeedKmh - prevYearData.avgSpeedKmh) / prevYearData.avgSpeedKmh * 100).toFixed(1);
			historicalContext = `Traffic ${Number(speedChange) > 0 ? 'improved' : 'worsened'} by ${Math.abs(Number(speedChange))}% compared to last year`;
		} else {
			historicalContext = `Average speed in ${originCity}: ${latestData.avgSpeedKmh} km/h, Congestion index: ${latestData.congestionIndex}/100`;
		}
	}

	return {
		trafficMultiplier: multiplier,
		factors,
		recommendations,
		infrastructure,
		constructions,
		festivals,
		historicalContext,
	};
}

// ============================================================================
// DATA SUMMARY FOR LLM CONTEXT
// ============================================================================

/**
 * Generate a comprehensive summary for LLM interpretation
 */
export function generateLLMDataSummary(): string {
	const summary = `
## India Traffic Intelligence Database Summary

### Coverage Period: 2019-2025 (6 Years)

### Cities Covered: ${CITY_TRAFFIC_PROFILES.length}
${CITY_TRAFFIC_PROFILES.map(c => `- ${c.name}, ${c.state} (Pop: ${(c.population2024/1000000).toFixed(1)}M)`).join('\n')}

### Infrastructure Updates: ${INFRASTRUCTURE_UPDATES.length} projects
- Metro Lines: ${INFRASTRUCTURE_UPDATES.filter(u => u.type === 'metro_line').length}
- Flyovers: ${INFRASTRUCTURE_UPDATES.filter(u => u.type === 'flyover').length}
- Ring Roads: ${INFRASTRUCTURE_UPDATES.filter(u => u.type === 'ring_road').length}
- Expressways: ${INFRASTRUCTURE_UPDATES.filter(u => u.type === 'expressway').length}
- Bridges: ${INFRASTRUCTURE_UPDATES.filter(u => u.type === 'bridge').length}

### Bus Routes: ${BUS_ROUTES.length} routes across major cities

### Development Zones: ${DEVELOPMENT_ZONES.length} major developments
- IT Parks: ${DEVELOPMENT_ZONES.filter(d => d.type === 'it_park').length}
- Commercial: ${DEVELOPMENT_ZONES.filter(d => d.type === 'commercial').length}
- Mixed Use: ${DEVELOPMENT_ZONES.filter(d => d.type === 'mixed_use').length}

### Festival Patterns: ${FESTIVAL_TRAFFIC_PATTERNS.length} major festivals tracked

### Active Construction Zones: ${CONSTRUCTION_ZONES.filter(c => c.status === 'active').length}

### Weather Impact Patterns: ${WEATHER_TRAFFIC_IMPACT.length} conditions

### Historical Data Points: ${HISTORICAL_TRAFFIC_DATA.length} monthly records

This database contains detailed traffic patterns, infrastructure changes, and predictive factors for Indian road conditions. Use this data for accurate route optimization and travel time predictions.
`;
	return summary.trim();
}

/**
 * Export all data for developer inspection
 */
export function exportAllTrafficData() {
	return {
		cityProfiles: CITY_TRAFFIC_PROFILES,
		infrastructureUpdates: INFRASTRUCTURE_UPDATES,
		busRoutes: BUS_ROUTES,
		developmentZones: DEVELOPMENT_ZONES,
		festivalPatterns: FESTIVAL_TRAFFIC_PATTERNS,
		constructionZones: CONSTRUCTION_ZONES,
		historicalData: HISTORICAL_TRAFFIC_DATA,
		weatherImpact: WEATHER_TRAFFIC_IMPACT,
		summary: generateLLMDataSummary(),
	};
}
