/**
 * India Landmarks & Buildings Database
 *
 * Comprehensive database of specific locations across major Indian cities:
 * - IT Parks & Tech Campuses
 * - Shopping Malls & Commercial Centers
 * - Hospitals & Medical Facilities
 * - Educational Institutions
 * - Government Buildings
 * - Transit Hubs (Metro Stations, Bus Terminals, Railway Stations)
 * - Religious Places & Temples
 * - Entertainment Venues
 * - Residential Complexes & Apartments
 * - Hotels & Hospitality
 * - Sports Venues & Stadiums
 * - Historical Monuments
 *
 * This enables precise location pinpointing for traffic optimization.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Landmark {
	id: string;
	name: string;
	alternateName?: string[];
	type: LandmarkType;
	category: LandmarkCategory;
	city: string;
	area: string;
	street?: string;
	lat: number;
	lng: number;
	description?: string;
	popularFor?: string[];
	nearbyLandmarks?: string[];
	peakHours?: { start: number; end: number }[];
	avgDailyFootfall?: number;
}

export type LandmarkType =
	| 'it_park'
	| 'tech_campus'
	| 'shopping_mall'
	| 'hospital'
	| 'school'
	| 'college'
	| 'university'
	| 'government'
	| 'metro_station'
	| 'railway_station'
	| 'bus_terminal'
	| 'airport'
	| 'temple'
	| 'mosque'
	| 'church'
	| 'gurudwara'
	| 'cinema'
	| 'stadium'
	| 'hotel'
	| 'apartment'
	| 'office_complex'
	| 'monument'
	| 'park'
	| 'restaurant'
	| 'bank'
	| 'atm'
	| 'petrol_pump'
	| 'police_station'
	| 'fire_station'
	| 'post_office'
	// New types for travelers
	| 'local_shop'
	| 'street_food'
	| 'tea_stall'
	| 'dhaba'
	| 'historical_site'
	| 'hidden_gem'
	| 'viewpoint'
	| 'local_market'
	| 'handicraft_shop'
	| 'sweet_shop';

export type LandmarkCategory =
	| 'business'
	| 'shopping'
	| 'healthcare'
	| 'education'
	| 'government'
	| 'transit'
	| 'religious'
	| 'entertainment'
	| 'residential'
	| 'hospitality'
	| 'sports'
	| 'heritage'
	| 'services'
	| 'local'
	| 'food'
	| 'attraction';

export interface AreaDetails {
	name: string;
	city: string;
	type: 'residential' | 'commercial' | 'mixed' | 'industrial' | 'heritage';
	pincode?: string;
	majorStreets: string[];
	nearbyAreas: string[];
	landmarks: string[];
	lat: number;
	lng: number;
}

export interface Street {
	name: string;
	alternateName?: string[];
	city: string;
	area: string;
	type: 'main_road' | 'highway' | 'service_road' | 'lane' | 'cross_street' | 'ring_road';
	startPoint: { lat: number; lng: number };
	endPoint: { lat: number; lng: number };
	landmarks?: string[];
}

// ============================================================================
// BENGALURU LANDMARKS
// ============================================================================

const BENGALURU_LANDMARKS: Landmark[] = [
	// IT Parks & Tech Campuses
	{
		id: 'blr_infosys_ec',
		name: 'Infosys Electronic City',
		alternateName: ['Infosys Campus EC', 'Infosys Electronic City Phase 1'],
		type: 'tech_campus',
		category: 'business',
		city: 'Bengaluru',
		area: 'Electronic City',
		street: 'Electronics City Phase 1',
		lat: 12.8456,
		lng: 77.6603,
		description: 'Major Infosys development center',
		popularFor: ['IT jobs', 'Software development'],
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_wipro_ec',
		name: 'Wipro Electronic City',
		alternateName: ['Wipro Campus', 'Wipro Technologies EC'],
		type: 'tech_campus',
		category: 'business',
		city: 'Bengaluru',
		area: 'Electronic City',
		lat: 12.8389,
		lng: 77.6765,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 20000,
	},
	{
		id: 'blr_tcs_ec',
		name: 'TCS Electronic City',
		alternateName: ['TCS Campus EC', 'Tata Consultancy Services EC'],
		type: 'tech_campus',
		category: 'business',
		city: 'Bengaluru',
		area: 'Electronic City',
		lat: 12.8401,
		lng: 77.6589,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 18000,
	},
	{
		id: 'blr_manyata',
		name: 'Manyata Tech Park',
		alternateName: ['Manyata Embassy Business Park', 'Manyata'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Hebbal',
		street: 'Outer Ring Road',
		lat: 13.0467,
		lng: 77.6208,
		description: 'One of the largest tech parks in Asia',
		popularFor: ['IT companies', 'Startups', 'MNCs'],
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 80000,
	},
	{
		id: 'blr_embassy_golflinks',
		name: 'Embassy Golf Links Business Park',
		alternateName: ['Embassy Golf Links', 'EGLBP'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Domlur',
		lat: 12.9583,
		lng: 77.6471,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'blr_prestige_techpark',
		name: 'Prestige Tech Park',
		alternateName: ['Prestige Shantiniketan Tech Park'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Whitefield',
		lat: 12.9859,
		lng: 77.7384,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'blr_itpl',
		name: 'ITPL - International Tech Park',
		alternateName: ['International Tech Park Bangalore', 'ITPB Whitefield'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Whitefield',
		street: 'ITPL Main Road',
		lat: 12.9856,
		lng: 77.7315,
		description: 'Indias first IT Park',
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 45000,
	},
	{
		id: 'blr_rmz_ecospace',
		name: 'RMZ Ecospace',
		alternateName: ['Ecospace Bellandur', 'RMZ Ecospace Business Park'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Bellandur',
		lat: 12.9262,
		lng: 77.6836,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'blr_bagmane_tech',
		name: 'Bagmane Tech Park',
		alternateName: ['Bagmane World Technology Center'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'CV Raman Nagar',
		lat: 12.9886,
		lng: 77.6637,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'blr_global_tech_park',
		name: 'Global Tech Park',
		alternateName: ['GTP Marathahalli'],
		type: 'it_park',
		category: 'business',
		city: 'Bengaluru',
		area: 'Marathahalli',
		lat: 12.9562,
		lng: 77.7013,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 25000,
	},

	// Shopping Malls
	{
		id: 'blr_phoenix_marketcity',
		name: 'Phoenix Marketcity',
		alternateName: ['Phoenix Mall Whitefield', 'Phoenix Marketcity Bangalore'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Whitefield',
		street: 'Whitefield Main Road',
		lat: 12.9969,
		lng: 77.6969,
		description: 'Premium shopping destination with entertainment',
		popularFor: ['Shopping', 'Dining', 'Movies', 'Gaming'],
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'blr_orion_mall',
		name: 'Orion Mall',
		alternateName: ['Orion Mall Rajajinagar', 'Brigade Gateway Orion'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Rajajinagar',
		lat: 13.0117,
		lng: 77.5556,
		popularFor: ['Shopping', 'WTC', 'Sheraton Hotel'],
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'blr_ub_city',
		name: 'UB City Mall',
		alternateName: ['UB City', 'United Breweries City'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Vittal Mallya Road',
		lat: 12.9716,
		lng: 77.5969,
		description: 'Luxury shopping and commercial complex',
		popularFor: ['Luxury brands', 'Fine dining', 'Premium offices'],
		peakHours: [{ start: 12, end: 21 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_forum_mall',
		name: 'Forum Mall Koramangala',
		alternateName: ['The Forum', 'Forum Value Mall'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Koramangala',
		street: 'Hosur Road',
		lat: 12.9347,
		lng: 77.6104,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 45000,
	},
	{
		id: 'blr_mantri_square',
		name: 'Mantri Square Mall',
		alternateName: ['Mantri Mall', 'Mantri Square Malleshwaram'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Malleshwaram',
		lat: 12.9916,
		lng: 77.5700,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'blr_garuda_mall',
		name: 'Garuda Mall',
		alternateName: ['Garuda Mall Magrath Road'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Magrath Road',
		lat: 12.9697,
		lng: 77.6088,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'blr_central_mall',
		name: 'Central Mall JP Nagar',
		alternateName: ['Shoppers Stop Central'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'JP Nagar',
		lat: 12.9088,
		lng: 77.5917,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 20000,
	},
	{
		id: 'blr_gopalan_arcade',
		name: 'Gopalan Arcade Mall',
		alternateName: ['Gopalan Mall Bannerghatta'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Bannerghatta Road',
		lat: 12.8902,
		lng: 77.5984,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 15000,
	},
	{
		id: 'blr_vr_bengaluru',
		name: 'VR Bengaluru',
		alternateName: ['VR Mall Whitefield', 'Virtuous Retail Bengaluru'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Whitefield',
		lat: 12.9732,
		lng: 77.7249,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 35000,
	},

	// Hospitals
	{
		id: 'blr_manipal_hal',
		name: 'Manipal Hospital HAL Airport Road',
		alternateName: ['Manipal Hospital Old Airport Road', 'Manipal HAL'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'HAL Airport Road',
		lat: 12.9591,
		lng: 77.6476,
		description: 'Multi-specialty hospital',
		popularFor: ['Cardiac care', 'Oncology', 'Neurology'],
		avgDailyFootfall: 8000,
	},
	{
		id: 'blr_fortis',
		name: 'Fortis Hospital Bannerghatta',
		alternateName: ['Fortis Bannerghatta Road', 'Fortis Cunningham Road'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'Bannerghatta Road',
		lat: 12.8917,
		lng: 77.5970,
		avgDailyFootfall: 6000,
	},
	{
		id: 'blr_apollo',
		name: 'Apollo Hospital Bannerghatta',
		alternateName: ['Apollo Hospitals', 'Apollo Sheshadripuram'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'Bannerghatta Road',
		lat: 12.8853,
		lng: 77.5964,
		avgDailyFootfall: 7000,
	},
	{
		id: 'blr_narayana_health',
		name: 'Narayana Health City',
		alternateName: ['Narayana Hrudayalaya', 'NH Bommasandra'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'Bommasandra',
		lat: 12.8116,
		lng: 77.6890,
		description: 'Affordable cardiac and multi-specialty care',
		popularFor: ['Heart surgery', 'Affordable healthcare'],
		avgDailyFootfall: 10000,
	},
	{
		id: 'blr_sakra',
		name: 'Sakra World Hospital',
		alternateName: ['Sakra Premium Clinic'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'Bellandur',
		lat: 12.9285,
		lng: 77.6782,
		avgDailyFootfall: 4000,
	},
	{
		id: 'blr_nimhans',
		name: 'NIMHANS',
		alternateName: ['National Institute of Mental Health and Neurosciences'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'Hosur Road',
		lat: 12.9428,
		lng: 77.5968,
		description: 'Premier mental health institution',
		avgDailyFootfall: 5000,
	},
	{
		id: 'blr_victoria',
		name: 'Victoria Hospital',
		alternateName: ['Vani Vilas Hospital'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Bengaluru',
		area: 'City Market',
		lat: 12.9583,
		lng: 77.5758,
		avgDailyFootfall: 6000,
	},

	// Metro Stations
	{
		id: 'blr_metro_majestic',
		name: 'Majestic Metro Station',
		alternateName: ['Kempegowda Interchange', 'Majestic Interchange'],
		type: 'metro_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Majestic',
		lat: 12.9777,
		lng: 77.5710,
		description: 'Interchange station for Green and Purple lines',
		popularFor: ['Metro interchange', 'Bus terminal connectivity'],
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 100000,
	},
	{
		id: 'blr_metro_mg_road',
		name: 'MG Road Metro Station',
		alternateName: ['Mahatma Gandhi Road Metro'],
		type: 'metro_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'MG Road',
		lat: 12.9753,
		lng: 77.6069,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'blr_metro_indiranagar',
		name: 'Indiranagar Metro Station',
		type: 'metro_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Indiranagar',
		lat: 12.9784,
		lng: 77.6408,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'blr_metro_whitefield',
		name: 'Whitefield Metro Station',
		alternateName: ['Kadugodi Metro'],
		type: 'metro_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Whitefield',
		lat: 12.9900,
		lng: 77.7540,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_metro_yeshwanthpur',
		name: 'Yeshwanthpur Metro Station',
		type: 'metro_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Yeshwanthpur',
		lat: 13.0285,
		lng: 77.5428,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 30000,
	},

	// Railway Stations
	{
		id: 'blr_railway_city',
		name: 'Bangalore City Railway Station',
		alternateName: ['SBC', 'Krantivira Sangolli Rayanna Station', 'Majestic Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Majestic',
		lat: 12.9783,
		lng: 77.5671,
		description: 'Main railway terminal of Bengaluru',
		avgDailyFootfall: 150000,
	},
	{
		id: 'blr_railway_yesvantpur',
		name: 'Yesvantpur Junction',
		alternateName: ['YPR', 'Yeshwanthpur Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Yeshwanthpur',
		lat: 13.0283,
		lng: 77.5353,
		avgDailyFootfall: 80000,
	},
	{
		id: 'blr_railway_cantonment',
		name: 'Bangalore Cantonment Station',
		alternateName: ['BNC', 'Cantonment Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Cantonment',
		lat: 12.9918,
		lng: 77.5953,
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_railway_whitefield',
		name: 'Whitefield Railway Station',
		alternateName: ['WFD'],
		type: 'railway_station',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Whitefield',
		lat: 12.9769,
		lng: 77.7236,
		avgDailyFootfall: 15000,
	},

	// Airports
	{
		id: 'blr_kia',
		name: 'Kempegowda International Airport',
		alternateName: ['KIA', 'Bengaluru Airport', 'BLR Airport', 'BIAL'],
		type: 'airport',
		category: 'transit',
		city: 'Bengaluru',
		area: 'Devanahalli',
		lat: 13.1986,
		lng: 77.7066,
		description: 'International airport serving Bengaluru',
		peakHours: [{ start: 5, end: 9 }, { start: 18, end: 23 }],
		avgDailyFootfall: 100000,
	},
	{
		id: 'blr_hal_airport',
		name: 'HAL Airport',
		alternateName: ['Old Bengaluru Airport', 'Hindustan Aeronautics Airport'],
		type: 'airport',
		category: 'transit',
		city: 'Bengaluru',
		area: 'HAL',
		lat: 12.9500,
		lng: 77.6681,
		description: 'Former main airport, now used for defense and aviation shows',
		avgDailyFootfall: 2000,
	},

	// Educational Institutions
	{
		id: 'blr_iisc',
		name: 'Indian Institute of Science',
		alternateName: ['IISc', 'IISc Bangalore', 'Tata Institute'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Malleshwaram',
		lat: 13.0219,
		lng: 77.5671,
		description: 'Premier research institution',
		avgDailyFootfall: 15000,
	},
	{
		id: 'blr_iim',
		name: 'IIM Bangalore',
		alternateName: ['Indian Institute of Management Bangalore', 'IIMB'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Bannerghatta Road',
		lat: 12.8981,
		lng: 77.5958,
		avgDailyFootfall: 5000,
	},
	{
		id: 'blr_rvce',
		name: 'RV College of Engineering',
		alternateName: ['RVCE', 'RV Engineering'],
		type: 'college',
		category: 'education',
		city: 'Bengaluru',
		area: 'Mysore Road',
		lat: 12.9236,
		lng: 77.4996,
		avgDailyFootfall: 8000,
	},
	{
		id: 'blr_pesit',
		name: 'PES University',
		alternateName: ['PESIT', 'PES Institute of Technology'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Banashankari',
		lat: 12.9349,
		lng: 77.5363,
		avgDailyFootfall: 10000,
	},
	{
		id: 'blr_christ',
		name: 'Christ University',
		alternateName: ['Christ College', 'Christ Deemed University'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Hosur Road',
		lat: 12.9355,
		lng: 77.6054,
		avgDailyFootfall: 12000,
	},
	{
		id: 'blr_jain',
		name: 'Jain University',
		alternateName: ['Jain Deemed University', 'JGI'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Jayanagar',
		lat: 12.9251,
		lng: 77.5811,
		avgDailyFootfall: 8000,
	},
	{
		id: 'blr_bangalore_university',
		name: 'Bangalore University',
		alternateName: ['BU', 'Jnana Bharathi Campus'],
		type: 'university',
		category: 'education',
		city: 'Bengaluru',
		area: 'Jnana Bharathi',
		lat: 12.9373,
		lng: 77.5046,
		avgDailyFootfall: 20000,
	},

	// Temples & Religious Places
	{
		id: 'blr_iskcon',
		name: 'ISKCON Temple Bangalore',
		alternateName: ['Hare Krishna Temple', 'ISKCON Rajajinagar'],
		type: 'temple',
		category: 'religious',
		city: 'Bengaluru',
		area: 'Rajajinagar',
		lat: 13.0104,
		lng: 77.5517,
		description: 'One of the largest ISKCON temples in the world',
		peakHours: [{ start: 16, end: 20 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_bull_temple',
		name: 'Bull Temple',
		alternateName: ['Nandi Temple', 'Dodda Basavana Gudi'],
		type: 'temple',
		category: 'religious',
		city: 'Bengaluru',
		area: 'Basavanagudi',
		lat: 12.9426,
		lng: 77.5678,
		avgDailyFootfall: 10000,
	},
	{
		id: 'blr_gavi_gangadhareshwara',
		name: 'Gavi Gangadhareshwara Temple',
		alternateName: ['Gavipuram Cave Temple'],
		type: 'temple',
		category: 'religious',
		city: 'Bengaluru',
		area: 'Gavipuram',
		lat: 12.9414,
		lng: 77.5671,
		avgDailyFootfall: 3000,
	},
	{
		id: 'blr_ragigudda',
		name: 'Ragigudda Anjaneya Temple',
		alternateName: ['Ragigudda Temple', 'Hanuman Temple Jayanagar'],
		type: 'temple',
		category: 'religious',
		city: 'Bengaluru',
		area: 'Jayanagar 9th Block',
		lat: 12.9184,
		lng: 77.5853,
		avgDailyFootfall: 8000,
	},

	// Entertainment Venues
	{
		id: 'blr_kanteerava',
		name: 'Kanteerava Stadium',
		alternateName: ['Sree Kanteerava Stadium', 'Kanteerava Indoor Stadium'],
		type: 'stadium',
		category: 'sports',
		city: 'Bengaluru',
		area: 'Kasturba Road',
		lat: 12.9763,
		lng: 77.5989,
		popularFor: ['Athletics', 'Football', 'Concerts'],
		avgDailyFootfall: 5000,
	},
	{
		id: 'blr_chinnaswamy',
		name: 'M. Chinnaswamy Stadium',
		alternateName: ['Chinnaswamy Stadium', 'KSCA Stadium'],
		type: 'stadium',
		category: 'sports',
		city: 'Bengaluru',
		area: 'MG Road',
		lat: 12.9788,
		lng: 77.5996,
		description: 'International cricket stadium, home of RCB',
		popularFor: ['Cricket', 'IPL matches'],
		avgDailyFootfall: 3000,
	},
	{
		id: 'blr_palace_grounds',
		name: 'Palace Grounds',
		alternateName: ['Jayamahal Palace Grounds'],
		type: 'park',
		category: 'entertainment',
		city: 'Bengaluru',
		area: 'Sadashivanagar',
		lat: 13.0040,
		lng: 77.5875,
		popularFor: ['Exhibitions', 'Concerts', 'Events'],
		avgDailyFootfall: 10000,
	},
	{
		id: 'blr_cubbon_park',
		name: 'Cubbon Park',
		alternateName: ['Sri Chamarajendra Park'],
		type: 'park',
		category: 'entertainment',
		city: 'Bengaluru',
		area: 'MG Road',
		lat: 12.9763,
		lng: 77.5929,
		popularFor: ['Walking', 'Jogging', 'Photography'],
		peakHours: [{ start: 6, end: 9 }, { start: 16, end: 19 }],
		avgDailyFootfall: 20000,
	},
	{
		id: 'blr_lalbagh',
		name: 'Lalbagh Botanical Garden',
		alternateName: ['Lalbagh', 'Lal Bagh Gardens'],
		type: 'park',
		category: 'entertainment',
		city: 'Bengaluru',
		area: 'Lalbagh',
		lat: 12.9507,
		lng: 77.5848,
		description: 'Historic botanical garden with glass house',
		popularFor: ['Flower shows', 'Walking', 'Photography'],
		peakHours: [{ start: 6, end: 9 }, { start: 16, end: 18 }],
		avgDailyFootfall: 15000,
	},

	// Apartments & Residential
	{
		id: 'blr_prestige_shantiniketan',
		name: 'Prestige Shantiniketan',
		type: 'apartment',
		category: 'residential',
		city: 'Bengaluru',
		area: 'Whitefield',
		lat: 12.9873,
		lng: 77.7411,
		description: 'Large residential township',
		avgDailyFootfall: 15000,
	},
	{
		id: 'blr_brigade_gateway',
		name: 'Brigade Gateway',
		alternateName: ['Brigade Gateway Enclave'],
		type: 'apartment',
		category: 'residential',
		city: 'Bengaluru',
		area: 'Rajajinagar',
		lat: 13.0137,
		lng: 77.5571,
		avgDailyFootfall: 10000,
	},
	{
		id: 'blr_sobha_city',
		name: 'Sobha City',
		type: 'apartment',
		category: 'residential',
		city: 'Bengaluru',
		area: 'Thanisandra',
		lat: 13.0589,
		lng: 77.6247,
		avgDailyFootfall: 8000,
	},
	{
		id: 'blr_salarpuria_sattva',
		name: 'Salarpuria Sattva Greenage',
		alternateName: ['Greenage Apartments'],
		type: 'apartment',
		category: 'residential',
		city: 'Bengaluru',
		area: 'Hosur Road',
		lat: 12.8796,
		lng: 77.6338,
		avgDailyFootfall: 5000,
	},

	// Hotels
	{
		id: 'blr_leela_palace',
		name: 'The Leela Palace',
		alternateName: ['Leela Palace Bangalore'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Bengaluru',
		area: 'HAL Airport Road',
		lat: 12.9611,
		lng: 77.6475,
		description: '5-star luxury hotel',
		avgDailyFootfall: 2000,
	},
	{
		id: 'blr_taj_west_end',
		name: 'Taj West End',
		alternateName: ['Taj West End Hotel'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Bengaluru',
		area: 'Race Course Road',
		lat: 12.9698,
		lng: 77.5851,
		description: 'Heritage 5-star hotel',
		avgDailyFootfall: 1500,
	},
	{
		id: 'blr_itc_windsor',
		name: 'ITC Windsor',
		alternateName: ['Windsor Manor Sheraton'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Bengaluru',
		area: 'Golf Course Road',
		lat: 12.9688,
		lng: 77.5940,
		avgDailyFootfall: 1500,
	},
	{
		id: 'blr_oberoi',
		name: 'The Oberoi Bengaluru',
		alternateName: ['Oberoi Hotel'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Bengaluru',
		area: 'MG Road',
		lat: 12.9742,
		lng: 77.6097,
		avgDailyFootfall: 1200,
	},
	{
		id: 'blr_jw_marriott',
		name: 'JW Marriott Hotel Bengaluru',
		alternateName: ['JW Marriott Prestige Golfshire'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Bengaluru',
		area: 'Vittal Mallya Road',
		lat: 12.9711,
		lng: 77.5967,
		avgDailyFootfall: 1500,
	},

	// Government Buildings
	{
		id: 'blr_vidhana_soudha',
		name: 'Vidhana Soudha',
		alternateName: ['Karnataka Legislature'],
		type: 'government',
		category: 'government',
		city: 'Bengaluru',
		area: 'Ambedkar Veedhi',
		lat: 12.9791,
		lng: 77.5913,
		description: 'Seat of Karnataka state legislature',
		avgDailyFootfall: 5000,
	},
	{
		id: 'blr_high_court',
		name: 'Karnataka High Court',
		alternateName: ['Attara Kacheri'],
		type: 'government',
		category: 'government',
		city: 'Bengaluru',
		area: 'Ambedkar Veedhi',
		lat: 12.9784,
		lng: 77.5901,
		avgDailyFootfall: 8000,
	},
	{
		id: 'blr_rto_kasturba',
		name: 'RTO Kasturba Road',
		alternateName: ['Regional Transport Office'],
		type: 'government',
		category: 'government',
		city: 'Bengaluru',
		area: 'Kasturba Road',
		lat: 12.9735,
		lng: 77.5975,
		avgDailyFootfall: 3000,
	},

	// Monuments
	{
		id: 'blr_bangalore_palace',
		name: 'Bangalore Palace',
		alternateName: ['Bengaluru Palace'],
		type: 'monument',
		category: 'heritage',
		city: 'Bengaluru',
		area: 'Vasanth Nagar',
		lat: 12.9987,
		lng: 77.5921,
		description: 'Tudor-style palace built in 1878',
		popularFor: ['History', 'Architecture', 'Events'],
		peakHours: [{ start: 10, end: 17 }],
		avgDailyFootfall: 3000,
	},
	{
		id: 'blr_tippu_summer_palace',
		name: "Tipu Sultan's Summer Palace",
		alternateName: ['Tippu Summer Palace', 'Dariya Daulat Bagh'],
		type: 'monument',
		category: 'heritage',
		city: 'Bengaluru',
		area: 'City Market',
		lat: 12.9594,
		lng: 77.5733,
		avgDailyFootfall: 2000,
	},
];

// ============================================================================
// MUMBAI LANDMARKS
// ============================================================================

const MUMBAI_LANDMARKS: Landmark[] = [
	// IT Parks & Office Complexes
	{
		id: 'mum_bkc',
		name: 'Bandra Kurla Complex',
		alternateName: ['BKC', 'BKC Business District'],
		type: 'office_complex',
		category: 'business',
		city: 'Mumbai',
		area: 'Bandra East',
		lat: 19.0596,
		lng: 72.8656,
		description: 'Major financial and commercial hub',
		peakHours: [{ start: 8, end: 11 }, { start: 17, end: 20 }],
		avgDailyFootfall: 200000,
	},
	{
		id: 'mum_mindspace',
		name: 'Mindspace Malad',
		alternateName: ['Mindspace IT Park', 'Mindspace Business Park'],
		type: 'it_park',
		category: 'business',
		city: 'Mumbai',
		area: 'Malad West',
		lat: 19.1796,
		lng: 72.8345,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'mum_nirlon_kp',
		name: 'Nirlon Knowledge Park',
		alternateName: ['Nirlon Complex Goregaon'],
		type: 'it_park',
		category: 'business',
		city: 'Mumbai',
		area: 'Goregaon East',
		lat: 19.1580,
		lng: 72.8634,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'mum_nesco',
		name: 'NESCO IT Park',
		alternateName: ['Nesco Complex', 'Bombay Exhibition Centre'],
		type: 'it_park',
		category: 'business',
		city: 'Mumbai',
		area: 'Goregaon East',
		lat: 19.1550,
		lng: 72.8570,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'mum_hiranandani',
		name: 'Hiranandani Business Park',
		alternateName: ['Hiranandani Powai'],
		type: 'it_park',
		category: 'business',
		city: 'Mumbai',
		area: 'Powai',
		lat: 19.1175,
		lng: 72.9060,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 45000,
	},
	{
		id: 'mum_seepz',
		name: 'SEEPZ SEZ',
		alternateName: ['Santacruz Electronic Export Processing Zone'],
		type: 'it_park',
		category: 'business',
		city: 'Mumbai',
		area: 'Andheri East',
		lat: 19.1228,
		lng: 72.8564,
		avgDailyFootfall: 30000,
	},
	{
		id: 'mum_nariman_point',
		name: 'Nariman Point',
		alternateName: ['Nariman Point Business District'],
		type: 'office_complex',
		category: 'business',
		city: 'Mumbai',
		area: 'Nariman Point',
		lat: 18.9248,
		lng: 72.8238,
		description: 'Premium business district with sea view',
		avgDailyFootfall: 100000,
	},

	// Shopping Malls
	{
		id: 'mum_phoenix_lower_parel',
		name: 'Phoenix Palladium',
		alternateName: ['High Street Phoenix', 'Palladium Mall'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Lower Parel',
		lat: 18.9941,
		lng: 72.8262,
		description: 'Premium luxury shopping destination',
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 60000,
	},
	{
		id: 'mum_oberoi_mall',
		name: 'Oberoi Mall',
		alternateName: ['Oberoi Mall Goregaon'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Goregaon East',
		lat: 19.1590,
		lng: 72.8631,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'mum_infiniti_mall',
		name: 'Infiniti Mall',
		alternateName: ['Infiniti Mall Andheri'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Andheri West',
		lat: 19.1368,
		lng: 72.8283,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'mum_phoenix_kurla',
		name: 'Phoenix Marketcity Mumbai',
		alternateName: ['Phoenix Kurla'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Kurla West',
		lat: 19.0859,
		lng: 72.8896,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 55000,
	},
	{
		id: 'mum_viviana',
		name: 'Viviana Mall',
		alternateName: ['Viviana Mall Thane'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Thane West',
		lat: 19.2072,
		lng: 72.9676,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'mum_rcity_mall',
		name: 'R City Mall',
		alternateName: ['R City Ghatkopar'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Mumbai',
		area: 'Ghatkopar West',
		lat: 19.0883,
		lng: 72.9087,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 45000,
	},

	// Hospitals
	{
		id: 'mum_tata_memorial',
		name: 'Tata Memorial Hospital',
		alternateName: ['Tata Cancer Hospital', 'TMH Mumbai'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Parel',
		lat: 18.9989,
		lng: 72.8422,
		description: 'Premier cancer treatment center',
		avgDailyFootfall: 10000,
	},
	{
		id: 'mum_kem',
		name: 'KEM Hospital',
		alternateName: ['King Edward Memorial Hospital'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Parel',
		lat: 19.0017,
		lng: 72.8411,
		avgDailyFootfall: 15000,
	},
	{
		id: 'mum_lilavati',
		name: 'Lilavati Hospital',
		alternateName: ['Lilavati Hospital Bandra'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Bandra West',
		lat: 19.0515,
		lng: 72.8273,
		avgDailyFootfall: 8000,
	},
	{
		id: 'mum_kokilaben',
		name: 'Kokilaben Dhirubhai Ambani Hospital',
		alternateName: ['Kokilaben Hospital', 'KDAH'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Andheri West',
		lat: 19.1309,
		lng: 72.8255,
		avgDailyFootfall: 7000,
	},
	{
		id: 'mum_hinduja',
		name: 'Hinduja Hospital',
		alternateName: ['P.D. Hinduja Hospital'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Mahim',
		lat: 19.0385,
		lng: 72.8403,
		avgDailyFootfall: 6000,
	},
	{
		id: 'mum_jaslok',
		name: 'Jaslok Hospital',
		alternateName: ['Jaslok Hospital Peddar Road'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Mumbai',
		area: 'Peddar Road',
		lat: 18.9691,
		lng: 72.8078,
		avgDailyFootfall: 5000,
	},

	// Railway Stations
	{
		id: 'mum_cst',
		name: 'Chhatrapati Shivaji Maharaj Terminus',
		alternateName: ['CST', 'CSMT', 'VT', 'Victoria Terminus'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Fort',
		lat: 18.9398,
		lng: 72.8354,
		description: 'UNESCO World Heritage Site, major railway terminal',
		avgDailyFootfall: 500000,
	},
	{
		id: 'mum_dadar',
		name: 'Dadar Station',
		alternateName: ['Dadar Central', 'Dadar Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Dadar',
		lat: 19.0186,
		lng: 72.8425,
		avgDailyFootfall: 400000,
	},
	{
		id: 'mum_bandra',
		name: 'Bandra Terminus',
		alternateName: ['Bandra Station', 'Bandra Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Bandra West',
		lat: 19.0544,
		lng: 72.8402,
		avgDailyFootfall: 150000,
	},
	{
		id: 'mum_andheri',
		name: 'Andheri Station',
		alternateName: ['Andheri Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Andheri',
		lat: 19.1197,
		lng: 72.8468,
		avgDailyFootfall: 300000,
	},
	{
		id: 'mum_churchgate',
		name: 'Churchgate Station',
		alternateName: ['Churchgate Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Churchgate',
		lat: 18.9352,
		lng: 72.8277,
		avgDailyFootfall: 350000,
	},
	{
		id: 'mum_mumbai_central',
		name: 'Mumbai Central Station',
		alternateName: ['Mumbai Central Railway Station', 'BCT'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Mumbai Central',
		lat: 18.9692,
		lng: 72.8198,
		avgDailyFootfall: 200000,
	},
	{
		id: 'mum_ltm',
		name: 'Lokmanya Tilak Terminus',
		alternateName: ['LTT', 'Kurla Terminus'],
		type: 'railway_station',
		category: 'transit',
		city: 'Mumbai',
		area: 'Kurla',
		lat: 19.0702,
		lng: 72.8882,
		avgDailyFootfall: 100000,
	},

	// Airports
	{
		id: 'mum_csia',
		name: 'Chhatrapati Shivaji Maharaj International Airport',
		alternateName: ['Mumbai Airport', 'CSIA', 'BOM'],
		type: 'airport',
		category: 'transit',
		city: 'Mumbai',
		area: 'Andheri East',
		lat: 19.0896,
		lng: 72.8656,
		description: 'India busiest airport',
		peakHours: [{ start: 5, end: 10 }, { start: 18, end: 24 }],
		avgDailyFootfall: 150000,
	},

	// Educational Institutions
	{
		id: 'mum_iit',
		name: 'IIT Bombay',
		alternateName: ['Indian Institute of Technology Bombay', 'IITB'],
		type: 'university',
		category: 'education',
		city: 'Mumbai',
		area: 'Powai',
		lat: 19.1334,
		lng: 72.9133,
		avgDailyFootfall: 15000,
	},
	{
		id: 'mum_mumbai_university',
		name: 'University of Mumbai',
		alternateName: ['Mumbai University', 'Kalina Campus'],
		type: 'university',
		category: 'education',
		city: 'Mumbai',
		area: 'Kalina',
		lat: 19.0737,
		lng: 72.8567,
		avgDailyFootfall: 25000,
	},
	{
		id: 'mum_xaviers',
		name: "St. Xavier's College",
		alternateName: ['Xaviers College Mumbai'],
		type: 'college',
		category: 'education',
		city: 'Mumbai',
		area: 'Fort',
		lat: 18.9386,
		lng: 72.8319,
		avgDailyFootfall: 8000,
	},

	// Monuments & Heritage
	{
		id: 'mum_gateway',
		name: 'Gateway of India',
		alternateName: ['Gateway'],
		type: 'monument',
		category: 'heritage',
		city: 'Mumbai',
		area: 'Colaba',
		lat: 18.9220,
		lng: 72.8347,
		description: 'Iconic arch monument on waterfront',
		peakHours: [{ start: 8, end: 20 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'mum_taj_hotel',
		name: 'Taj Mahal Palace Hotel',
		alternateName: ['Taj Hotel Mumbai', 'Taj Palace'],
		type: 'hotel',
		category: 'hospitality',
		city: 'Mumbai',
		area: 'Colaba',
		lat: 18.9217,
		lng: 72.8332,
		description: 'Iconic heritage luxury hotel',
		avgDailyFootfall: 5000,
	},
	{
		id: 'mum_marine_drive',
		name: 'Marine Drive',
		alternateName: ['Queens Necklace', 'Marine Lines Promenade'],
		type: 'park',
		category: 'entertainment',
		city: 'Mumbai',
		area: 'Marine Lines',
		lat: 18.9436,
		lng: 72.8231,
		description: 'Iconic promenade along Arabian Sea',
		peakHours: [{ start: 5, end: 9 }, { start: 17, end: 21 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'mum_siddhivinayak',
		name: 'Siddhivinayak Temple',
		alternateName: ['Shree Siddhivinayak Ganapati Mandir'],
		type: 'temple',
		category: 'religious',
		city: 'Mumbai',
		area: 'Prabhadevi',
		lat: 19.0167,
		lng: 72.8307,
		description: 'Famous Hindu temple dedicated to Lord Ganesha',
		peakHours: [{ start: 5, end: 8 }, { start: 17, end: 20 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'mum_haji_ali',
		name: 'Haji Ali Dargah',
		alternateName: ['Haji Ali Mosque'],
		type: 'mosque',
		category: 'religious',
		city: 'Mumbai',
		area: 'Mahalaxmi',
		lat: 18.9828,
		lng: 72.8089,
		description: 'Iconic mosque on islet connected by causeway',
		avgDailyFootfall: 20000,
	},
	{
		id: 'mum_mahalaxmi_temple',
		name: 'Mahalaxmi Temple',
		alternateName: ['Shree Mahalaxmi Temple'],
		type: 'temple',
		category: 'religious',
		city: 'Mumbai',
		area: 'Mahalaxmi',
		lat: 18.9817,
		lng: 72.8099,
		avgDailyFootfall: 15000,
	},
];

// ============================================================================
// DELHI LANDMARKS
// ============================================================================

const DELHI_LANDMARKS: Landmark[] = [
	// IT Parks & Business Districts
	{
		id: 'del_noida_it',
		name: 'Noida IT Sector 62',
		alternateName: ['Noida Tech Park', 'Sector 62 IT Hub'],
		type: 'it_park',
		category: 'business',
		city: 'Delhi',
		area: 'Noida',
		lat: 28.6219,
		lng: 77.3656,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 80000,
	},
	{
		id: 'del_cyber_city',
		name: 'DLF Cyber City',
		alternateName: ['Cyber City Gurugram', 'DLF Cyber Hub'],
		type: 'it_park',
		category: 'business',
		city: 'Delhi',
		area: 'Gurugram',
		lat: 28.4948,
		lng: 77.0888,
		description: 'Premier IT business district',
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 150000,
	},
	{
		id: 'del_connaught_place',
		name: 'Connaught Place',
		alternateName: ['CP', 'Rajiv Chowk Area'],
		type: 'office_complex',
		category: 'business',
		city: 'Delhi',
		area: 'Central Delhi',
		lat: 28.6315,
		lng: 77.2167,
		description: 'Central business district and shopping area',
		peakHours: [{ start: 10, end: 21 }],
		avgDailyFootfall: 200000,
	},
	{
		id: 'del_nehru_place',
		name: 'Nehru Place',
		alternateName: ['Nehru Place IT Market'],
		type: 'office_complex',
		category: 'business',
		city: 'Delhi',
		area: 'South Delhi',
		lat: 28.5494,
		lng: 77.2519,
		description: 'Major electronics and IT market',
		peakHours: [{ start: 10, end: 19 }],
		avgDailyFootfall: 100000,
	},
	{
		id: 'del_technopark',
		name: 'Technopark Noida',
		alternateName: ['Noida Technopark', 'Sector 126 Tech Park'],
		type: 'it_park',
		category: 'business',
		city: 'Delhi',
		area: 'Noida',
		lat: 28.5458,
		lng: 77.3939,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 40000,
	},

	// Shopping Malls
	{
		id: 'del_dlf_mall',
		name: 'DLF Mall of India',
		alternateName: ['Mall of India Noida'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Delhi',
		area: 'Noida',
		lat: 28.5672,
		lng: 77.3211,
		description: 'Largest mall in India',
		peakHours: [{ start: 12, end: 22 }],
		avgDailyFootfall: 100000,
	},
	{
		id: 'del_select_citywalk',
		name: 'Select Citywalk',
		alternateName: ['Citywalk Saket'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Delhi',
		area: 'Saket',
		lat: 28.5289,
		lng: 77.2180,
		peakHours: [{ start: 12, end: 22 }],
		avgDailyFootfall: 60000,
	},
	{
		id: 'del_ambience_mall_gurgaon',
		name: 'Ambience Mall Gurgaon',
		alternateName: ['Ambience Mall Gurugram'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Delhi',
		area: 'Gurugram',
		lat: 28.5039,
		lng: 77.0960,
		peakHours: [{ start: 12, end: 22 }],
		avgDailyFootfall: 55000,
	},
	{
		id: 'del_dlf_promenade',
		name: 'DLF Promenade',
		alternateName: ['DLF Promenade Vasant Kunj'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Delhi',
		area: 'Vasant Kunj',
		lat: 28.5423,
		lng: 77.1564,
		peakHours: [{ start: 12, end: 22 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'del_pacific_mall',
		name: 'Pacific Mall',
		alternateName: ['Pacific Mall Subhash Nagar'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Delhi',
		area: 'Subhash Nagar',
		lat: 28.6412,
		lng: 77.1068,
		peakHours: [{ start: 12, end: 22 }],
		avgDailyFootfall: 35000,
	},

	// Hospitals
	{
		id: 'del_aiims',
		name: 'AIIMS Delhi',
		alternateName: ['All India Institute of Medical Sciences'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Delhi',
		area: 'Ansari Nagar',
		lat: 28.5672,
		lng: 77.2100,
		description: 'India premier medical institution',
		avgDailyFootfall: 30000,
	},
	{
		id: 'del_safdarjung',
		name: 'Safdarjung Hospital',
		alternateName: ['Safdarjung Hospital Delhi'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Delhi',
		area: 'Ring Road',
		lat: 28.5694,
		lng: 77.2066,
		avgDailyFootfall: 20000,
	},
	{
		id: 'del_apollo',
		name: 'Apollo Hospital Sarita Vihar',
		alternateName: ['Indraprastha Apollo Hospital'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Delhi',
		area: 'Sarita Vihar',
		lat: 28.5310,
		lng: 77.2880,
		avgDailyFootfall: 10000,
	},
	{
		id: 'del_fortis',
		name: 'Fortis Escorts Heart Institute',
		alternateName: ['Fortis Okhla', 'Escorts Heart Institute'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Delhi',
		area: 'Okhla',
		lat: 28.5360,
		lng: 77.2722,
		avgDailyFootfall: 8000,
	},
	{
		id: 'del_max_saket',
		name: 'Max Super Speciality Hospital Saket',
		alternateName: ['Max Hospital Saket'],
		type: 'hospital',
		category: 'healthcare',
		city: 'Delhi',
		area: 'Saket',
		lat: 28.5271,
		lng: 77.2142,
		avgDailyFootfall: 9000,
	},

	// Metro Stations
	{
		id: 'del_metro_rajiv_chowk',
		name: 'Rajiv Chowk Metro Station',
		alternateName: ['Rajiv Chowk', 'Connaught Place Metro'],
		type: 'metro_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Connaught Place',
		lat: 28.6328,
		lng: 77.2195,
		description: 'Busiest metro station in Delhi',
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 400000,
	},
	{
		id: 'del_metro_kashmere_gate',
		name: 'Kashmere Gate Metro Station',
		alternateName: ['Kashmere Gate ISBT'],
		type: 'metro_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Kashmere Gate',
		lat: 28.6674,
		lng: 77.2289,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 200000,
	},
	{
		id: 'del_metro_chandni_chowk',
		name: 'Chandni Chowk Metro Station',
		type: 'metro_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Chandni Chowk',
		lat: 28.6562,
		lng: 77.2311,
		peakHours: [{ start: 9, end: 11 }, { start: 17, end: 20 }],
		avgDailyFootfall: 150000,
	},
	{
		id: 'del_metro_hauz_khas',
		name: 'Hauz Khas Metro Station',
		type: 'metro_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Hauz Khas',
		lat: 28.5430,
		lng: 77.2065,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 100000,
	},

	// Railway Stations
	{
		id: 'del_new_delhi',
		name: 'New Delhi Railway Station',
		alternateName: ['NDLS', 'New Delhi Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Paharganj',
		lat: 28.6431,
		lng: 77.2197,
		description: 'Major railway terminal of Delhi',
		avgDailyFootfall: 500000,
	},
	{
		id: 'del_old_delhi',
		name: 'Old Delhi Railway Station',
		alternateName: ['DLI', 'Delhi Junction'],
		type: 'railway_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Chandni Chowk',
		lat: 28.6614,
		lng: 77.2288,
		avgDailyFootfall: 200000,
	},
	{
		id: 'del_hazrat',
		name: 'Hazrat Nizamuddin Railway Station',
		alternateName: ['NZM', 'Nizamuddin Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Nizamuddin',
		lat: 28.5872,
		lng: 77.2508,
		avgDailyFootfall: 150000,
	},
	{
		id: 'del_anand_vihar',
		name: 'Anand Vihar Terminal',
		alternateName: ['ANVT', 'Anand Vihar Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Delhi',
		area: 'Anand Vihar',
		lat: 28.6469,
		lng: 77.3160,
		avgDailyFootfall: 100000,
	},

	// Airports
	{
		id: 'del_igi',
		name: 'Indira Gandhi International Airport',
		alternateName: ['IGI Airport', 'Delhi Airport', 'DEL'],
		type: 'airport',
		category: 'transit',
		city: 'Delhi',
		area: 'Palam',
		lat: 28.5562,
		lng: 77.1000,
		description: 'India largest airport',
		peakHours: [{ start: 5, end: 10 }, { start: 18, end: 24 }],
		avgDailyFootfall: 200000,
	},

	// Educational Institutions
	{
		id: 'del_iit',
		name: 'IIT Delhi',
		alternateName: ['Indian Institute of Technology Delhi', 'IITD'],
		type: 'university',
		category: 'education',
		city: 'Delhi',
		area: 'Hauz Khas',
		lat: 28.5459,
		lng: 77.1926,
		avgDailyFootfall: 20000,
	},
	{
		id: 'del_du',
		name: 'Delhi University North Campus',
		alternateName: ['DU North Campus', 'University of Delhi'],
		type: 'university',
		category: 'education',
		city: 'Delhi',
		area: 'Civil Lines',
		lat: 28.6897,
		lng: 77.2107,
		avgDailyFootfall: 50000,
	},
	{
		id: 'del_jnu',
		name: 'Jawaharlal Nehru University',
		alternateName: ['JNU'],
		type: 'university',
		category: 'education',
		city: 'Delhi',
		area: 'Vasant Kunj',
		lat: 28.5402,
		lng: 77.1675,
		avgDailyFootfall: 20000,
	},
	{
		id: 'del_jamia',
		name: 'Jamia Millia Islamia',
		alternateName: ['JMI', 'Jamia University'],
		type: 'university',
		category: 'education',
		city: 'Delhi',
		area: 'Okhla',
		lat: 28.5611,
		lng: 77.2808,
		avgDailyFootfall: 25000,
	},

	// Monuments & Heritage
	{
		id: 'del_india_gate',
		name: 'India Gate',
		alternateName: ['All India War Memorial'],
		type: 'monument',
		category: 'heritage',
		city: 'Delhi',
		area: 'Rajpath',
		lat: 28.6129,
		lng: 77.2295,
		description: 'War memorial and iconic landmark',
		peakHours: [{ start: 17, end: 21 }],
		avgDailyFootfall: 100000,
	},
	{
		id: 'del_red_fort',
		name: 'Red Fort',
		alternateName: ['Lal Qila'],
		type: 'monument',
		category: 'heritage',
		city: 'Delhi',
		area: 'Chandni Chowk',
		lat: 28.6562,
		lng: 77.2410,
		description: 'UNESCO World Heritage Site, Mughal era fort',
		peakHours: [{ start: 9, end: 17 }],
		avgDailyFootfall: 20000,
	},
	{
		id: 'del_qutub_minar',
		name: 'Qutub Minar',
		alternateName: ['Qutb Minar', 'Qutab Minar'],
		type: 'monument',
		category: 'heritage',
		city: 'Delhi',
		area: 'Mehrauli',
		lat: 28.5244,
		lng: 77.1855,
		description: 'UNESCO World Heritage Site, 73m minaret',
		peakHours: [{ start: 9, end: 17 }],
		avgDailyFootfall: 15000,
	},
	{
		id: 'del_lotus_temple',
		name: 'Lotus Temple',
		alternateName: ['Bahai House of Worship'],
		type: 'temple',
		category: 'religious',
		city: 'Delhi',
		area: 'Nehru Place',
		lat: 28.5535,
		lng: 77.2588,
		description: 'Iconic lotus-shaped Bahai temple',
		peakHours: [{ start: 9, end: 17 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'del_akshardham',
		name: 'Akshardham Temple',
		alternateName: ['Swaminarayan Akshardham'],
		type: 'temple',
		category: 'religious',
		city: 'Delhi',
		area: 'Pandav Nagar',
		lat: 28.6127,
		lng: 77.2773,
		description: 'Magnificent Hindu temple complex',
		peakHours: [{ start: 10, end: 18 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'del_jama_masjid',
		name: 'Jama Masjid',
		alternateName: ['Masjid-i-Jahaan-Numa', 'Friday Mosque'],
		type: 'mosque',
		category: 'religious',
		city: 'Delhi',
		area: 'Old Delhi',
		lat: 28.6507,
		lng: 77.2334,
		description: 'One of India largest mosques',
		avgDailyFootfall: 25000,
	},
];

// ============================================================================
// OTHER MAJOR CITY LANDMARKS
// ============================================================================

const CHENNAI_LANDMARKS: Landmark[] = [
	{
		id: 'che_tidel',
		name: 'Tidel Park',
		alternateName: ['Tidel Park Chennai'],
		type: 'it_park',
		category: 'business',
		city: 'Chennai',
		area: 'Taramani',
		lat: 12.9872,
		lng: 80.2459,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'che_spencer_plaza',
		name: 'Spencer Plaza',
		alternateName: ['Spencer Mall'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Chennai',
		area: 'Mount Road',
		lat: 13.0565,
		lng: 80.2622,
		avgDailyFootfall: 30000,
	},
	{
		id: 'che_express_avenue',
		name: 'Express Avenue Mall',
		alternateName: ['EA Mall'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Chennai',
		area: 'Royapettah',
		lat: 13.0585,
		lng: 80.2654,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 45000,
	},
	{
		id: 'che_phoenix_marketcity',
		name: 'Phoenix Marketcity Chennai',
		alternateName: ['Phoenix Mall Velachery'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Chennai',
		area: 'Velachery',
		lat: 12.9824,
		lng: 80.2177,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'che_central_station',
		name: 'Chennai Central',
		alternateName: ['MAS', 'Puratchi Thalaivar Dr MGR Central'],
		type: 'railway_station',
		category: 'transit',
		city: 'Chennai',
		area: 'Park Town',
		lat: 13.0827,
		lng: 80.2707,
		avgDailyFootfall: 400000,
	},
	{
		id: 'che_egmore',
		name: 'Chennai Egmore',
		alternateName: ['MS', 'Egmore Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Chennai',
		area: 'Egmore',
		lat: 13.0732,
		lng: 80.2609,
		avgDailyFootfall: 150000,
	},
	{
		id: 'che_airport',
		name: 'Chennai International Airport',
		alternateName: ['MAA', 'Chennai Airport'],
		type: 'airport',
		category: 'transit',
		city: 'Chennai',
		area: 'Meenambakkam',
		lat: 12.9941,
		lng: 80.1709,
		avgDailyFootfall: 60000,
	},
	{
		id: 'che_iit',
		name: 'IIT Madras',
		alternateName: ['Indian Institute of Technology Madras', 'IITM'],
		type: 'university',
		category: 'education',
		city: 'Chennai',
		area: 'Adyar',
		lat: 12.9915,
		lng: 80.2337,
		avgDailyFootfall: 15000,
	},
	{
		id: 'che_marina',
		name: 'Marina Beach',
		alternateName: ['Marina'],
		type: 'park',
		category: 'entertainment',
		city: 'Chennai',
		area: 'Marina',
		lat: 13.0500,
		lng: 80.2824,
		description: 'Second longest urban beach in the world',
		peakHours: [{ start: 5, end: 8 }, { start: 16, end: 19 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'che_kapaleeshwarar',
		name: 'Kapaleeshwarar Temple',
		alternateName: ['Mylapore Temple'],
		type: 'temple',
		category: 'religious',
		city: 'Chennai',
		area: 'Mylapore',
		lat: 13.0340,
		lng: 80.2696,
		avgDailyFootfall: 20000,
	},
];

const HYDERABAD_LANDMARKS: Landmark[] = [
	{
		id: 'hyd_hitech_city',
		name: 'HITEC City',
		alternateName: ['Hyderabad IT City', 'Cyber Towers'],
		type: 'it_park',
		category: 'business',
		city: 'Hyderabad',
		area: 'Madhapur',
		lat: 17.4435,
		lng: 78.3772,
		description: 'Major IT hub of Hyderabad',
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 20 }],
		avgDailyFootfall: 200000,
	},
	{
		id: 'hyd_raheja_mindspace',
		name: 'Raheja Mindspace',
		alternateName: ['Mindspace IT Park Hyderabad'],
		type: 'it_park',
		category: 'business',
		city: 'Hyderabad',
		area: 'Madhapur',
		lat: 17.4478,
		lng: 78.3814,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 80000,
	},
	{
		id: 'hyd_gachibowli',
		name: 'Gachibowli IT Hub',
		alternateName: ['DLF Cyber City Gachibowli'],
		type: 'it_park',
		category: 'business',
		city: 'Hyderabad',
		area: 'Gachibowli',
		lat: 17.4401,
		lng: 78.3489,
		peakHours: [{ start: 8, end: 10 }, { start: 17, end: 19 }],
		avgDailyFootfall: 60000,
	},
	{
		id: 'hyd_inorbit',
		name: 'Inorbit Mall Hyderabad',
		alternateName: ['Inorbit Mall Madhapur'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Hyderabad',
		area: 'Madhapur',
		lat: 17.4352,
		lng: 78.3862,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 40000,
	},
	{
		id: 'hyd_gvk_one',
		name: 'GVK One Mall',
		alternateName: ['GVK One Banjara Hills'],
		type: 'shopping_mall',
		category: 'shopping',
		city: 'Hyderabad',
		area: 'Banjara Hills',
		lat: 17.4283,
		lng: 78.4483,
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'hyd_secunderabad',
		name: 'Secunderabad Junction',
		alternateName: ['SC', 'Secunderabad Railway Station'],
		type: 'railway_station',
		category: 'transit',
		city: 'Hyderabad',
		area: 'Secunderabad',
		lat: 17.4344,
		lng: 78.5013,
		avgDailyFootfall: 200000,
	},
	{
		id: 'hyd_rajiv_gandhi',
		name: 'Rajiv Gandhi International Airport',
		alternateName: ['Hyderabad Airport', 'RGIA', 'HYD'],
		type: 'airport',
		category: 'transit',
		city: 'Hyderabad',
		area: 'Shamshabad',
		lat: 17.2403,
		lng: 78.4294,
		avgDailyFootfall: 50000,
	},
	{
		id: 'hyd_charminar',
		name: 'Charminar',
		alternateName: ['Char Minar'],
		type: 'monument',
		category: 'heritage',
		city: 'Hyderabad',
		area: 'Old City',
		lat: 17.3616,
		lng: 78.4747,
		description: 'Iconic monument and mosque of Hyderabad',
		peakHours: [{ start: 10, end: 18 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'hyd_hussain_sagar',
		name: 'Hussain Sagar Lake',
		alternateName: ['Tank Bund', 'Buddha Statue Lake'],
		type: 'park',
		category: 'entertainment',
		city: 'Hyderabad',
		area: 'Tank Bund',
		lat: 17.4239,
		lng: 78.4738,
		peakHours: [{ start: 5, end: 8 }, { start: 17, end: 20 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'hyd_birla_mandir',
		name: 'Birla Mandir Hyderabad',
		alternateName: ['Birla Temple'],
		type: 'temple',
		category: 'religious',
		city: 'Hyderabad',
		area: 'Naubat Pahad',
		lat: 17.4062,
		lng: 78.4691,
		avgDailyFootfall: 15000,
	},
];

// ============================================================================
// AREA DETAILS - Major areas in cities
// ============================================================================

export const AREA_DETAILS: AreaDetails[] = [
	// Bengaluru Areas
	{
		name: 'Electronic City',
		city: 'Bengaluru',
		type: 'commercial',
		pincode: '560100',
		majorStreets: ['Hosur Main Road', 'Electronics City Flyover', 'Neeladri Road'],
		nearbyAreas: ['Bommasandra', 'Hebbagodi', 'Huskur'],
		landmarks: ['Infosys', 'Wipro', 'TCS', 'Electronic City Metro'],
		lat: 12.8456,
		lng: 77.6603,
	},
	{
		name: 'Whitefield',
		city: 'Bengaluru',
		type: 'mixed',
		pincode: '560066',
		majorStreets: ['Whitefield Main Road', 'ITPL Road', 'Varthur Road', 'Kadugodi Road'],
		nearbyAreas: ['Marathahalli', 'Varthur', 'ITPL', 'Brookefield'],
		landmarks: ['Phoenix Marketcity', 'ITPL', 'VR Bengaluru', 'Prestige Tech Park'],
		lat: 12.9698,
		lng: 77.7499,
	},
	{
		name: 'Koramangala',
		city: 'Bengaluru',
		type: 'mixed',
		pincode: '560034',
		majorStreets: ['100 Feet Road', '80 Feet Road', 'Hosur Road', 'Sarjapur Road'],
		nearbyAreas: ['Indiranagar', 'HSR Layout', 'BTM Layout', 'Ejipura'],
		landmarks: ['Forum Mall', 'Jyoti Nivas College', 'Sony World Junction'],
		lat: 12.9352,
		lng: 77.6245,
	},
	{
		name: 'Indiranagar',
		city: 'Bengaluru',
		type: 'mixed',
		pincode: '560038',
		majorStreets: ['100 Feet Road', 'CMH Road', '12th Main Road', 'HAL Airport Road'],
		nearbyAreas: ['Domlur', 'Koramangala', 'Old Airport Road', 'HAL'],
		landmarks: ['Indiranagar Metro', 'Empire Restaurant', 'BDA Complex'],
		lat: 12.9784,
		lng: 77.6408,
	},
	{
		name: 'Marathahalli',
		city: 'Bengaluru',
		type: 'mixed',
		pincode: '560037',
		majorStreets: ['Outer Ring Road', 'Marathahalli Bridge', 'HAL Old Airport Road'],
		nearbyAreas: ['Bellandur', 'Brookefield', 'Whitefield', 'Kadubeesanahalli'],
		landmarks: ['Marathahalli Bridge', 'Global Tech Park', 'Brand Factory'],
		lat: 12.9562,
		lng: 77.7013,
	},
	{
		name: 'Jayanagar',
		city: 'Bengaluru',
		type: 'residential',
		pincode: '560041',
		majorStreets: ['11th Main Road', '4th Block Main Road', '9th Block Main Road'],
		nearbyAreas: ['JP Nagar', 'Basavanagudi', 'BTM Layout', 'Banashankari'],
		landmarks: ['Ragigudda Temple', 'Jayanagar Shopping Complex', 'Cool Joint'],
		lat: 12.9299,
		lng: 77.5828,
	},
	{
		name: 'Hebbal',
		city: 'Bengaluru',
		type: 'mixed',
		pincode: '560024',
		majorStreets: ['Bellary Road', 'Outer Ring Road', 'Thanisandra Main Road'],
		nearbyAreas: ['Yelahanka', 'Sahakara Nagar', 'Manyata Tech Park'],
		landmarks: ['Manyata Tech Park', 'Hebbal Flyover', 'Esteem Mall'],
		lat: 13.0358,
		lng: 77.5970,
	},

	// Mumbai Areas
	{
		name: 'Bandra',
		city: 'Mumbai',
		type: 'mixed',
		pincode: '400050',
		majorStreets: ['Hill Road', 'Linking Road', 'Carter Road', 'Bandstand'],
		nearbyAreas: ['Khar', 'Santacruz', 'BKC', 'Mahim'],
		landmarks: ['Bandra Station', 'Bandstand', 'Lilavati Hospital', 'Mount Mary Church'],
		lat: 19.0596,
		lng: 72.8295,
	},
	{
		name: 'Andheri',
		city: 'Mumbai',
		type: 'mixed',
		pincode: '400058',
		majorStreets: ['SV Road', 'Link Road', 'Andheri-Kurla Road', 'Western Express Highway'],
		nearbyAreas: ['Jogeshwari', 'Vile Parle', 'Lokhandwala'],
		landmarks: ['Andheri Station', 'Infiniti Mall', 'SEEPZ', 'DN Nagar Metro'],
		lat: 19.1197,
		lng: 72.8468,
	},
	{
		name: 'Lower Parel',
		city: 'Mumbai',
		type: 'commercial',
		pincode: '400013',
		majorStreets: ['Senapati Bapat Marg', 'NM Joshi Marg', 'Dr E Moses Road'],
		nearbyAreas: ['Worli', 'Prabhadevi', 'Dadar', 'Mahalaxmi'],
		landmarks: ['Phoenix Palladium', 'Kamala Mills', 'High Street Phoenix', 'Tata Memorial'],
		lat: 18.9941,
		lng: 72.8262,
	},
	{
		name: 'Powai',
		city: 'Mumbai',
		type: 'mixed',
		pincode: '400076',
		majorStreets: ['Hiranandani Gardens Main Road', 'JVLR'],
		nearbyAreas: ['Chandivali', 'Vikhroli', 'Kanjurmarg'],
		landmarks: ['IIT Bombay', 'Powai Lake', 'Hiranandani Gardens', 'L&T'],
		lat: 19.1175,
		lng: 72.9060,
	},

	// Delhi Areas
	{
		name: 'Connaught Place',
		city: 'Delhi',
		type: 'commercial',
		pincode: '110001',
		majorStreets: ['Barakhamba Road', 'Kasturba Gandhi Marg', 'Janpath', 'Parliament Street'],
		nearbyAreas: ['Mandi House', 'Khan Market', 'ITO', 'Karol Bagh'],
		landmarks: ['Rajiv Chowk Metro', 'Palika Bazaar', 'Hanuman Temple', 'Central Park'],
		lat: 28.6315,
		lng: 77.2167,
	},
	{
		name: 'Saket',
		city: 'Delhi',
		type: 'mixed',
		pincode: '110017',
		majorStreets: ['Press Enclave Road', 'MB Road', 'Saket District Centre Road'],
		nearbyAreas: ['Malviya Nagar', 'Hauz Khas', 'Mehrauli', 'Chhatarpur'],
		landmarks: ['Select Citywalk', 'Max Hospital', 'DLF Place', 'Saket Metro'],
		lat: 28.5289,
		lng: 77.2180,
	},
	{
		name: 'Cyber City Gurugram',
		city: 'Delhi',
		type: 'commercial',
		pincode: '122002',
		majorStreets: ['Cyber Hub Road', 'NH 48', 'DLF Phase 2 Road'],
		nearbyAreas: ['DLF Phase 1', 'DLF Phase 2', 'Sikanderpur', 'Golf Course Road'],
		landmarks: ['Cyber Hub', 'DLF Cyber City', 'Ambience Mall', 'HUDA City Centre'],
		lat: 28.4948,
		lng: 77.0888,
	},
	{
		name: 'Sector 62 Noida',
		city: 'Delhi',
		type: 'commercial',
		pincode: '201301',
		majorStreets: ['Sector 62 Main Road', 'Noida-Greater Noida Expressway'],
		nearbyAreas: ['Sector 63', 'Sector 61', 'Sector 59', 'Film City'],
		landmarks: ['Noida City Centre', 'Logix Mall', 'Adobe India', 'NSEZ'],
		lat: 28.6219,
		lng: 77.3656,
	},
];

// ============================================================================
// LOCAL SHOPS, HIDDEN GEMS & TRAVELER FAVORITES
// ============================================================================

const LOCAL_TRAVELER_LANDMARKS: Landmark[] = [
	// BENGALURU LOCAL SPOTS
	{
		id: 'blr_vidyarthi_bhavan',
		name: 'Vidyarthi Bhavan',
		alternateName: ['VB Gandhi Bazaar', 'Famous Dosa Place'],
		type: 'street_food',
		category: 'food',
		city: 'Bengaluru',
		area: 'Gandhi Bazaar',
		lat: 12.9437,
		lng: 77.5695,
		description: 'Legendary dosa joint since 1943, must-visit for crispy butter masala dosa',
		popularFor: ['Masala Dosa', 'Filter Coffee', 'Traditional Breakfast'],
		peakHours: [{ start: 7, end: 11 }, { start: 16, end: 19 }],
		avgDailyFootfall: 3000,
	},
	{
		id: 'blr_mavalli_tiffin',
		name: 'MTR - Mavalli Tiffin Rooms',
		alternateName: ['MTR Lalbagh Road'],
		type: 'restaurant',
		category: 'food',
		city: 'Bengaluru',
		area: 'Lalbagh',
		lat: 12.9520,
		lng: 77.5850,
		description: 'Iconic South Indian restaurant, invented Rava Idli',
		popularFor: ['Rava Idli', 'Filter Coffee', 'Thali'],
		peakHours: [{ start: 7, end: 10 }, { start: 12, end: 14 }],
		avgDailyFootfall: 5000,
	},
	{
		id: 'blr_brahmin_coffee_bar',
		name: 'Brahmin\'s Coffee Bar',
		alternateName: ['Brahmins Shankarapuram'],
		type: 'tea_stall',
		category: 'food',
		city: 'Bengaluru',
		area: 'Shankarapuram',
		lat: 12.9567,
		lng: 77.5712,
		description: 'No-frills idli-vada joint, standing room only',
		popularFor: ['Idli-Vada', 'Filter Coffee'],
		avgDailyFootfall: 2000,
	},
	{
		id: 'blr_russell_market',
		name: 'Russell Market',
		alternateName: ['Shivaji Nagar Market'],
		type: 'local_market',
		category: 'local',
		city: 'Bengaluru',
		area: 'Shivaji Nagar',
		lat: 12.9831,
		lng: 77.6063,
		description: 'Historic colonial-era market, fresh produce and meat',
		popularFor: ['Fresh Vegetables', 'Meat', 'Flowers'],
		peakHours: [{ start: 6, end: 12 }],
		avgDailyFootfall: 15000,
	},
	{
		id: 'blr_chickpet_market',
		name: 'Chickpet Wholesale Market',
		alternateName: ['Chikpet Saree Market'],
		type: 'local_market',
		category: 'shopping',
		city: 'Bengaluru',
		area: 'Chickpet',
		lat: 12.9633,
		lng: 77.5767,
		description: 'Silk saree paradise, wholesale prices',
		popularFor: ['Silk Sarees', 'Wedding Shopping', 'Traditional Wear'],
		peakHours: [{ start: 10, end: 19 }],
		avgDailyFootfall: 25000,
	},
	{
		id: 'blr_nandi_hills_viewpoint',
		name: 'Nandi Hills Sunrise Point',
		alternateName: ['Nandi Betta', 'Nandidurg'],
		type: 'viewpoint',
		category: 'attraction',
		city: 'Bengaluru',
		area: 'Nandi Hills',
		lat: 13.3702,
		lng: 77.6835,
		description: 'Stunning sunrise views, 60km from Bangalore',
		popularFor: ['Sunrise', 'Trekking', 'Photography'],
		peakHours: [{ start: 5, end: 8 }],
		avgDailyFootfall: 5000,
	},
	// MUMBAI LOCAL SPOTS
	{
		id: 'mum_bademiya',
		name: 'Bademiya',
		alternateName: ['Bade Miyan Colaba'],
		type: 'street_food',
		category: 'food',
		city: 'Mumbai',
		area: 'Colaba',
		lat: 18.9220,
		lng: 72.8312,
		description: 'Legendary late-night kebab spot since 1946',
		popularFor: ['Seekh Kebab', 'Chicken Tikka Roll', 'Biryani'],
		peakHours: [{ start: 19, end: 2 }],
		avgDailyFootfall: 4000,
	},
	{
		id: 'mum_kyani_co',
		name: 'Kyani & Co.',
		alternateName: ['Kyani Irani Cafe'],
		type: 'restaurant',
		category: 'food',
		city: 'Mumbai',
		area: 'Marine Lines',
		lat: 18.9438,
		lng: 72.8258,
		description: 'Heritage Parsi cafe since 1904',
		popularFor: ['Bun Maska', 'Irani Chai', 'Kheema Pav'],
		peakHours: [{ start: 8, end: 11 }, { start: 16, end: 19 }],
		avgDailyFootfall: 1500,
	},
	{
		id: 'mum_crawford_market',
		name: 'Crawford Market',
		alternateName: ['Mahatma Jyotiba Phule Market'],
		type: 'local_market',
		category: 'local',
		city: 'Mumbai',
		area: 'Fort',
		lat: 18.9476,
		lng: 72.8356,
		description: 'British-era market with everything from spices to pets',
		popularFor: ['Dry Fruits', 'Spices', 'Imported Goods'],
		peakHours: [{ start: 9, end: 18 }],
		avgDailyFootfall: 30000,
	},
	{
		id: 'mum_chor_bazaar',
		name: 'Chor Bazaar',
		alternateName: ['Thieves Market', 'Mutton Street Market'],
		type: 'local_market',
		category: 'local',
		city: 'Mumbai',
		area: 'Grant Road',
		lat: 18.9625,
		lng: 72.8261,
		description: 'Famous antique and vintage market',
		popularFor: ['Antiques', 'Vintage Items', 'Bargains'],
		peakHours: [{ start: 10, end: 18 }],
		avgDailyFootfall: 10000,
	},
	{
		id: 'mum_banganga_tank',
		name: 'Banganga Tank',
		alternateName: ['Banganga Water Tank Malabar Hill'],
		type: 'historical_site',
		category: 'heritage',
		city: 'Mumbai',
		area: 'Malabar Hill',
		lat: 18.9527,
		lng: 72.7967,
		description: 'Ancient sacred water tank, peaceful oasis in the city',
		popularFor: ['Heritage', 'Photography', 'Peace'],
		avgDailyFootfall: 500,
	},
	// DELHI LOCAL SPOTS
	{
		id: 'del_paranthe_wali_gali',
		name: 'Paranthe Wali Gali',
		alternateName: ['Paratha Lane Chandni Chowk'],
		type: 'street_food',
		category: 'food',
		city: 'Delhi',
		area: 'Chandni Chowk',
		lat: 28.6562,
		lng: 77.2300,
		description: 'Historic lane famous for stuffed parathas since 1875',
		popularFor: ['Stuffed Parathas', 'Lassi', 'Street Food'],
		peakHours: [{ start: 9, end: 22 }],
		avgDailyFootfall: 8000,
	},
	{
		id: 'del_karim',
		name: 'Karim\'s',
		alternateName: ['Karim Hotel Jama Masjid'],
		type: 'restaurant',
		category: 'food',
		city: 'Delhi',
		area: 'Jama Masjid',
		lat: 28.6506,
		lng: 77.2335,
		description: 'Legendary Mughlai restaurant since 1913',
		popularFor: ['Mutton Burra', 'Nihari', 'Seekh Kebab'],
		peakHours: [{ start: 12, end: 15 }, { start: 19, end: 23 }],
		avgDailyFootfall: 5000,
	},
	{
		id: 'del_khari_baoli',
		name: 'Khari Baoli Spice Market',
		alternateName: ['Asia\'s Largest Spice Market'],
		type: 'local_market',
		category: 'local',
		city: 'Delhi',
		area: 'Chandni Chowk',
		lat: 28.6578,
		lng: 77.2247,
		description: 'Asia\'s largest wholesale spice market, 400+ years old',
		popularFor: ['Spices', 'Dry Fruits', 'Herbs'],
		peakHours: [{ start: 10, end: 18 }],
		avgDailyFootfall: 50000,
	},
	{
		id: 'del_mehrauli_village',
		name: 'Mehrauli Archaeological Park',
		alternateName: ['Mehrauli Heritage Walk'],
		type: 'historical_site',
		category: 'heritage',
		city: 'Delhi',
		area: 'Mehrauli',
		lat: 28.5243,
		lng: 77.1854,
		description: 'Hidden ruins spanning 1000 years of Delhi history',
		popularFor: ['Ruins', 'Heritage Walk', 'Photography'],
		avgDailyFootfall: 2000,
	},
	{
		id: 'del_agrasen_ki_baoli',
		name: 'Agrasen Ki Baoli',
		alternateName: ['Ugrasen Ki Baoli'],
		type: 'historical_site',
		category: 'heritage',
		city: 'Delhi',
		area: 'Connaught Place',
		lat: 28.6265,
		lng: 77.2244,
		description: 'Historic 14th century stepwell, architectural marvel',
		popularFor: ['Architecture', 'Photography', 'Heritage'],
		avgDailyFootfall: 3000,
	},
	// CHENNAI LOCAL SPOTS
	{
		id: 'che_murugan_idli',
		name: 'Murugan Idli Shop',
		alternateName: ['Murugan Idli T Nagar'],
		type: 'restaurant',
		category: 'food',
		city: 'Chennai',
		area: 'T. Nagar',
		lat: 13.0339,
		lng: 80.2301,
		description: 'Famous for soft idlis and variety dosas',
		popularFor: ['Idli', 'Podi Dosa', 'Filter Coffee'],
		peakHours: [{ start: 7, end: 11 }, { start: 16, end: 20 }],
		avgDailyFootfall: 4000,
	},
	{
		id: 'che_pondy_bazaar',
		name: 'Pondy Bazaar',
		alternateName: ['T Nagar Shopping Street'],
		type: 'local_market',
		category: 'shopping',
		city: 'Chennai',
		area: 'T. Nagar',
		lat: 13.0401,
		lng: 80.2344,
		description: 'Famous shopping street for clothes and gold',
		popularFor: ['Sarees', 'Gold Jewelry', 'Street Shopping'],
		peakHours: [{ start: 10, end: 21 }],
		avgDailyFootfall: 80000,
	},
	{
		id: 'che_marina_food_stalls',
		name: 'Marina Beach Food Stalls',
		alternateName: ['Marina Beach Evening Market'],
		type: 'street_food',
		category: 'food',
		city: 'Chennai',
		area: 'Marina Beach',
		lat: 13.0499,
		lng: 80.2824,
		description: 'Evening street food paradise on the beach',
		popularFor: ['Sundal', 'Mango Ice', 'Corn'],
		peakHours: [{ start: 16, end: 21 }],
		avgDailyFootfall: 20000,
	},
	// HYDERABAD LOCAL SPOTS
	{
		id: 'hyd_paradise_biryani',
		name: 'Paradise Biryani',
		alternateName: ['Paradise Secunderabad'],
		type: 'restaurant',
		category: 'food',
		city: 'Hyderabad',
		area: 'Secunderabad',
		lat: 17.4399,
		lng: 78.4983,
		description: 'Iconic biryani destination since 1953',
		popularFor: ['Hyderabadi Biryani', 'Kebabs', 'Haleem'],
		peakHours: [{ start: 12, end: 15 }, { start: 19, end: 22 }],
		avgDailyFootfall: 8000,
	},
	{
		id: 'hyd_laad_bazaar',
		name: 'Laad Bazaar',
		alternateName: ['Choodi Bazaar', 'Charminar Market'],
		type: 'local_market',
		category: 'shopping',
		city: 'Hyderabad',
		area: 'Charminar',
		lat: 17.3616,
		lng: 78.4747,
		description: 'Famous for bangles, pearls and wedding shopping',
		popularFor: ['Lac Bangles', 'Pearls', 'Bridal Wear'],
		peakHours: [{ start: 10, end: 21 }],
		avgDailyFootfall: 35000,
	},
	{
		id: 'hyd_nimrah_cafe',
		name: 'Nimrah Cafe & Bakery',
		alternateName: ['Nimrah Charminar'],
		type: 'tea_stall',
		category: 'food',
		city: 'Hyderabad',
		area: 'Charminar',
		lat: 17.3611,
		lng: 78.4744,
		description: 'Iconic Irani chai and Osmania biscuit spot',
		popularFor: ['Irani Chai', 'Osmania Biscuit'],
		peakHours: [{ start: 6, end: 22 }],
		avgDailyFootfall: 3000,
	},
	{
		id: 'hyd_qutb_shahi_tombs',
		name: 'Qutb Shahi Tombs',
		alternateName: ['Seven Tombs Hyderabad'],
		type: 'historical_site',
		category: 'heritage',
		city: 'Hyderabad',
		area: 'Ibrahim Bagh',
		lat: 17.3954,
		lng: 78.3981,
		description: 'Magnificent 16th century royal tombs',
		popularFor: ['Architecture', 'History', 'Photography'],
		peakHours: [{ start: 9, end: 17 }],
		avgDailyFootfall: 2000,
	},
];

// ============================================================================
// COMBINED LANDMARKS DATABASE
// ============================================================================

export const ALL_LANDMARKS: Landmark[] = [
	...BENGALURU_LANDMARKS,
	...MUMBAI_LANDMARKS,
	...DELHI_LANDMARKS,
	...CHENNAI_LANDMARKS,
	...HYDERABAD_LANDMARKS,
	...LOCAL_TRAVELER_LANDMARKS,
];

// ============================================================================
// SEARCH AND UTILITY FUNCTIONS
// ============================================================================

/**
 * Search landmarks by query string
 * Searches through name, alternate names, area, and city
 */
export function searchLandmarks(query: string, city?: string): Landmark[] {
	if (!query || query.length < 2) return [];

	const normalizedQuery = query.toLowerCase().trim();

	let landmarks = ALL_LANDMARKS;

	// Filter by city if specified
	if (city) {
		const normalizedCity = city.toLowerCase();
		landmarks = landmarks.filter(
			(l) => l.city.toLowerCase().includes(normalizedCity)
		);
	}

	// Score-based search for better relevance
	const scored = landmarks.map((landmark) => {
		let score = 0;

		// Exact name match - highest score
		if (landmark.name.toLowerCase() === normalizedQuery) {
			score += 100;
		}
		// Name starts with query
		else if (landmark.name.toLowerCase().startsWith(normalizedQuery)) {
			score += 80;
		}
		// Name contains query
		else if (landmark.name.toLowerCase().includes(normalizedQuery)) {
			score += 60;
		}

		// Check alternate names
		if (landmark.alternateName) {
			for (const altName of landmark.alternateName) {
				if (altName.toLowerCase() === normalizedQuery) {
					score += 90;
				} else if (altName.toLowerCase().startsWith(normalizedQuery)) {
					score += 70;
				} else if (altName.toLowerCase().includes(normalizedQuery)) {
					score += 50;
				}
			}
		}

		// Area match
		if (landmark.area.toLowerCase().includes(normalizedQuery)) {
			score += 30;
		}

		// Street match
		if (landmark.street?.toLowerCase().includes(normalizedQuery)) {
			score += 25;
		}

		// Type match
		if (landmark.type.toLowerCase().includes(normalizedQuery)) {
			score += 20;
		}

		// Popular for match
		if (landmark.popularFor) {
			for (const pf of landmark.popularFor) {
				if (pf.toLowerCase().includes(normalizedQuery)) {
					score += 15;
				}
			}
		}

		return { landmark, score };
	});

	// Filter out zero scores and sort by score
	return scored
		.filter((s) => s.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 20)
		.map((s) => s.landmark);
}

/**
 * Get landmarks by type
 */
export function getLandmarksByType(type: LandmarkType, city?: string): Landmark[] {
	let landmarks = ALL_LANDMARKS.filter((l) => l.type === type);

	if (city) {
		landmarks = landmarks.filter(
			(l) => l.city.toLowerCase() === city.toLowerCase()
		);
	}

	return landmarks;
}

/**
 * Get landmarks by category
 */
export function getLandmarksByCategory(
	category: LandmarkCategory,
	city?: string
): Landmark[] {
	let landmarks = ALL_LANDMARKS.filter((l) => l.category === category);

	if (city) {
		landmarks = landmarks.filter(
			(l) => l.city.toLowerCase() === city.toLowerCase()
		);
	}

	return landmarks;
}

/**
 * Get area details by name
 */
export function getAreaDetails(areaName: string, city?: string): AreaDetails | null {
	const normalizedName = areaName.toLowerCase().trim();

	let areas = AREA_DETAILS;
	if (city) {
		areas = areas.filter((a) => a.city.toLowerCase() === city.toLowerCase());
	}

	return (
		areas.find(
			(a) =>
				a.name.toLowerCase() === normalizedName ||
				a.name.toLowerCase().includes(normalizedName)
		) || null
	);
}

/**
 * Search areas by query
 */
export function searchAreas(query: string, city?: string): AreaDetails[] {
	if (!query || query.length < 2) return [];

	const normalizedQuery = query.toLowerCase().trim();

	let areas = AREA_DETAILS;
	if (city) {
		areas = areas.filter((a) => a.city.toLowerCase() === city.toLowerCase());
	}

	return areas.filter(
		(area) =>
			area.name.toLowerCase().includes(normalizedQuery) ||
			area.majorStreets.some((s) => s.toLowerCase().includes(normalizedQuery)) ||
			area.landmarks.some((l) => l.toLowerCase().includes(normalizedQuery)) ||
			(area.pincode && area.pincode.includes(normalizedQuery))
	);
}

/**
 * Get nearby landmarks within a radius (in km)
 */
export function getNearbyLandmarks(
	lat: number,
	lng: number,
	radiusKm: number = 2
): Landmark[] {
	const R = 6371; // Earth's radius in km

	return ALL_LANDMARKS.filter((landmark) => {
		const dLat = ((landmark.lat - lat) * Math.PI) / 180;
		const dLng = ((landmark.lng - lng) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat * Math.PI) / 180) *
				Math.cos((landmark.lat * Math.PI) / 180) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		return distance <= radiusKm;
	}).sort((a, b) => {
		// Sort by distance
		const distA = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
		const distB = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
		return distA - distB;
	});
}

/**
 * Get landmarks by city with optional type filter
 */
export function getLandmarksByCity(city: string, type?: LandmarkType): Landmark[] {
	const normalizedCity = city.toLowerCase();

	let landmarks = ALL_LANDMARKS.filter(
		(l) => l.city.toLowerCase() === normalizedCity
	);

	if (type) {
		landmarks = landmarks.filter((l) => l.type === type);
	}

	return landmarks;
}

/**
 * Get popular landmarks for quick access
 */
export function getPopularLandmarks(city?: string): Landmark[] {
	let landmarks = ALL_LANDMARKS;

	if (city) {
		landmarks = landmarks.filter(
			(l) => l.city.toLowerCase() === city.toLowerCase()
		);
	}

	// Sort by footfall and return top 20
	return landmarks
		.filter((l) => l.avgDailyFootfall && l.avgDailyFootfall > 10000)
		.sort((a, b) => (b.avgDailyFootfall || 0) - (a.avgDailyFootfall || 0))
		.slice(0, 20);
}

/**
 * Convert landmark to location format for route search
 */
export function landmarkToLocation(landmark: Landmark): {
	name: string;
	displayName: string;
	lat: number;
	lng: number;
	placeType: string;
} {
	const displayParts = [
		landmark.name,
		landmark.area,
		landmark.city,
	].filter(Boolean);

	return {
		name: landmark.name,
		displayName: displayParts.join(', '),
		lat: landmark.lat,
		lng: landmark.lng,
		placeType: landmark.type,
	};
}
