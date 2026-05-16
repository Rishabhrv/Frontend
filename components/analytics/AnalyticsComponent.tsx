"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { 
  Users, UserCheck, UserMinus, Activity, MapPin, Clock, TrendingUp, Globe
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Source = "all" | "apgh" | "agclassics";
export type Period = "all" | "week" | "month";

interface AnalyticsComponentProps {
  source: Source;
  period: Period;
}

interface RawRow { country: string; state: string; knownUsers: number; unknownUsers: number; }
interface CountryData { name: string; known: number; unknown: number; }
interface CountryMeta { lat: number; lon: number; flag: string; short: string; }
interface TooltipState { name: string; known: number; unknown: number; x: number; y: number; }
interface SpikeMesh { mesh: THREE.Mesh; country: string; }
interface StatCardProps { label: string; value: number; sub?: string; icon: React.ReactNode; }
interface CountryRowProps { data: CountryData; maxTotal: number; rank: number; active: boolean; onHover: (name: string | null) => void; onClick: (name: string) => void; }
interface LiveTopCountry { country: string; count: number; }
interface LiveData { onlineNow: number; activeLast30m: number; todayUnique: number; newVisitors: number; returningVisitors: number; topLiveCountries: LiveTopCountry[]; peakToday: number; }

// ── Raw data (fallback) ────────────────────────────────────────────────────────
const MOCK_DATA: RawRow[] = [
  { country: "United States", state: "California",  knownUsers: 4821, unknownUsers: 1203 },
  { country: "India",         state: "Maharashtra", knownUsers: 2340, unknownUsers: 980  },
];
const MOCK_LIVE: LiveData = {
  onlineNow: 47, activeLast30m: 134, todayUnique: 1820, newVisitors: 310, returningVisitors: 1510, topLiveCountries: [{ country: "United States", count: 18 }], peakToday: 93,
};

// ── Exhaustive Country Metadata ────────────────────────────────────────────────
const COUNTRY_META: Record<string, CountryMeta> = {
  "Afghanistan": { lat: 33.93, lon: 67.70, flag: "🇦🇫", short: "AF" },
  "Albania": { lat: 41.15, lon: 20.16, flag: "🇦🇱", short: "AL" },
  "Algeria": { lat: 28.03, lon: 1.65, flag: "🇩🇿", short: "DZ" },
  "Andorra": { lat: 42.50, lon: 1.52, flag: "🇦🇩", short: "AD" },
  "Angola": { lat: -11.20, lon: 17.87, flag: "🇦🇴", short: "AO" },
  "Antigua and Barbuda": { lat: 17.06, lon: -61.79, flag: "🇦🇬", short: "AG" },
  "Argentina": { lat: -38.41, lon: -63.61, flag: "🇦🇷", short: "AR" },
  "Armenia": { lat: 40.06, lon: 45.03, flag: "🇦🇲", short: "AM" },
  "Australia": { lat: -25.27, lon: 133.77, flag: "🇦🇺", short: "AU" },
  "Austria": { lat: 47.51, lon: 14.55, flag: "🇦🇹", short: "AT" },
  "Azerbaijan": { lat: 40.14, lon: 47.57, flag: "🇦🇿", short: "AZ" },
  "Bahamas": { lat: 25.03, lon: -77.39, flag: "🇧🇸", short: "BS" },
  "Bahrain": { lat: 26.06, lon: 50.55, flag: "🇧🇭", short: "BH" },
  "Bangladesh": { lat: 23.68, lon: 90.35, flag: "🇧🇩", short: "BD" },
  "Barbados": { lat: 13.19, lon: -59.54, flag: "🇧🇧", short: "BB" },
  "Belarus": { lat: 53.70, lon: 27.95, flag: "🇧🇾", short: "BY" },
  "Belgium": { lat: 50.50, lon: 4.46, flag: "🇧🇪", short: "BE" },
  "Belize": { lat: 17.18, lon: -88.49, flag: "🇧🇿", short: "BZ" },
  "Benin": { lat: 9.30, lon: 2.31, flag: "🇧🇯", short: "BJ" },
  "Bhutan": { lat: 27.51, lon: 90.43, flag: "🇧🇹", short: "BT" },
  "Bolivia": { lat: -16.29, lon: -63.58, flag: "🇧🇴", short: "BO" },
  "Bosnia and Herzegovina": { lat: 43.91, lon: 17.67, flag: "🇧🇦", short: "BA" },
  "Botswana": { lat: -22.32, lon: 24.68, flag: "🇧🇼", short: "BW" },
  "Brazil": { lat: -14.23, lon: -51.92, flag: "🇧🇷", short: "BR" },
  "Brunei": { lat: 4.53, lon: 114.72, flag: "🇧🇳", short: "BN" },
  "Bulgaria": { lat: 42.73, lon: 25.48, flag: "🇧🇬", short: "BG" },
  "Burkina Faso": { lat: 12.23, lon: -1.56, flag: "🇧🇫", short: "BF" },
  "Burundi": { lat: -3.37, lon: 29.91, flag: "🇧🇮", short: "BI" },
  "Cabo Verde": { lat: 16.00, lon: -24.01, flag: "🇨🇻", short: "CV" },
  "Cambodia": { lat: 12.56, lon: 104.99, flag: "🇰🇭", short: "KH" },
  "Cameroon": { lat: 3.84, lon: 11.50, flag: "🇨🇲", short: "CM" },
  "Canada": { lat: 56.13, lon: -106.34, flag: "🇨🇦", short: "CA" },
  "Central African Republic": { lat: 6.61, lon: 20.93, flag: "🇨🇫", short: "CF" },
  "Chad": { lat: 15.45, lon: 18.73, flag: "🇹🇩", short: "TD" },
  "Chile": { lat: -35.67, lon: -71.54, flag: "🇨🇱", short: "CL" },
  "China": { lat: 35.86, lon: 104.19, flag: "🇨🇳", short: "CN" },
  "Colombia": { lat: 4.57, lon: -74.29, flag: "🇨🇴", short: "CO" },
  "Comoros": { lat: -11.87, lon: 43.87, flag: "🇰🇲", short: "KM" },
  "Congo": { lat: -0.22, lon: 15.82, flag: "🇨🇬", short: "CG" },
  "Costa Rica": { lat: 9.74, lon: -83.75, flag: "🇨🇷", short: "CR" },
  "Croatia": { lat: 45.10, lon: 15.20, flag: "🇭🇷", short: "HR" },
  "Cuba": { lat: 21.52, lon: -77.78, flag: "🇨🇺", short: "CU" },
  "Cyprus": { lat: 35.12, lon: 33.42, flag: "🇨🇾", short: "CY" },
  "Czechia": { lat: 49.81, lon: 15.47, flag: "🇨🇿", short: "CZ" },
  "Denmark": { lat: 56.26, lon: 9.50, flag: "🇩🇰", short: "DK" },
  "Djibouti": { lat: 11.82, lon: 42.59, flag: "🇩🇯", short: "DJ" },
  "Dominica": { lat: 15.41, lon: -61.37, flag: "🇩🇲", short: "DM" },
  "Dominican Republic": { lat: 18.73, lon: -70.16, flag: "🇩🇴", short: "DO" },
  "Ecuador": { lat: -1.83, lon: -78.18, flag: "🇪🇨", short: "EC" },
  "Egypt": { lat: 26.82, lon: 30.80, flag: "🇪🇬", short: "EG" },
  "El Salvador": { lat: 13.79, lon: -88.89, flag: "🇸🇻", short: "SV" },
  "Equatorial Guinea": { lat: 1.65, lon: 10.26, flag: "🇬🇶", short: "GQ" },
  "Eritrea": { lat: 15.17, lon: 39.78, flag: "🇪🇷", short: "ER" },
  "Estonia": { lat: 58.59, lon: 25.01, flag: "🇪🇪", short: "EE" },
  "Eswatini": { lat: -26.52, lon: 31.46, flag: "🇸🇿", short: "SZ" },
  "Ethiopia": { lat: 9.14, lon: 40.48, flag: "🇪🇹", short: "ET" },
  "Fiji": { lat: -17.71, lon: 178.06, flag: "🇫🇯", short: "FJ" },
  "Finland": { lat: 61.92, lon: 25.74, flag: "🇫🇮", short: "FI" },
  "France": { lat: 46.22, lon: 2.21, flag: "🇫🇷", short: "FR" },
  "Gabon": { lat: -0.80, lon: 11.60, flag: "🇬🇦", short: "GA" },
  "Gambia": { lat: 13.44, lon: -15.31, flag: "🇬🇲", short: "GM" },
  "Georgia": { lat: 42.31, lon: 43.35, flag: "🇬🇪", short: "GE" },
  "Germany": { lat: 51.16, lon: 10.45, flag: "🇩🇪", short: "DE" },
  "Ghana": { lat: 7.94, lon: -1.02, flag: "🇬🇭", short: "GH" },
  "Greece": { lat: 39.07, lon: 21.82, flag: "🇬🇷", short: "GR" },
  "Grenada": { lat: 12.26, lon: -61.60, flag: "🇬🇩", short: "GD" },
  "Guatemala": { lat: 15.78, lon: -90.23, flag: "🇬🇹", short: "GT" },
  "Guinea": { lat: 9.94, lon: -9.69, flag: "🇬🇳", short: "GN" },
  "Guinea-Bissau": { lat: 11.80, lon: -15.18, flag: "🇬🇼", short: "GW" },
  "Guyana": { lat: 4.86, lon: -58.93, flag: "🇬🇾", short: "GY" },
  "Haiti": { lat: 18.97, lon: -72.28, flag: "🇭🇹", short: "HT" },
  "Honduras": { lat: 15.19, lon: -86.24, flag: "🇭🇳", short: "HN" },
  "Hungary": { lat: 47.16, lon: 19.50, flag: "🇭🇺", short: "HU" },
  "Iceland": { lat: 64.96, lon: -19.02, flag: "🇮🇸", short: "IS" },
  "India": { lat: 20.59, lon: 78.96, flag: "🇮🇳", short: "IN" },
  "Indonesia": { lat: -0.78, lon: 113.92, flag: "🇮🇩", short: "ID" },
  "Iran": { lat: 32.42, lon: 53.68, flag: "🇮🇷", short: "IR" },
  "Iraq": { lat: 33.22, lon: 43.67, flag: "🇮🇶", short: "IQ" },
  "Ireland": { lat: 53.41, lon: -8.24, flag: "🇮🇪", short: "IE" },
  "Israel": { lat: 31.04, lon: 34.85, flag: "🇮🇱", short: "IL" },
  "Italy": { lat: 41.87, lon: 12.56, flag: "🇮🇹", short: "IT" },
  "Jamaica": { lat: 18.10, lon: -77.29, flag: "🇯🇲", short: "JM" },
  "Japan": { lat: 36.20, lon: 138.25, flag: "🇯🇵", short: "JP" },
  "Jordan": { lat: 30.58, lon: 36.23, flag: "🇯🇴", short: "JO" },
  "Kazakhstan": { lat: 48.01, lon: 66.92, flag: "🇰🇿", short: "KZ" },
  "Kenya": { lat: -0.02, lon: 37.90, flag: "🇰🇪", short: "KE" },
  "Kiribati": { lat: -3.37, lon: -168.73, flag: "🇰🇮", short: "KI" },
  "Kuwait": { lat: 29.31, lon: 47.48, flag: "🇰🇼", short: "KW" },
  "Kyrgyzstan": { lat: 41.20, lon: 74.76, flag: "🇰🇬", short: "KG" },
  "Laos": { lat: 19.85, lon: 102.49, flag: "🇱🇦", short: "LA" },
  "Latvia": { lat: 56.87, lon: 24.60, flag: "🇱🇻", short: "LV" },
  "Lebanon": { lat: 33.85, lon: 35.86, flag: "🇱🇧", short: "LB" },
  "Lesotho": { lat: -29.60, lon: 28.23, flag: "🇱🇸", short: "LS" },
  "Liberia": { lat: 6.42, lon: -9.42, flag: "🇱🇷", short: "LR" },
  "Libya": { lat: 26.33, lon: 17.22, flag: "🇱🇾", short: "LY" },
  "Liechtenstein": { lat: 47.16, lon: 9.55, flag: "🇱🇮", short: "LI" },
  "Lithuania": { lat: 55.16, lon: 23.88, flag: "🇱🇹", short: "LT" },
  "Luxembourg": { lat: 49.81, lon: 6.12, flag: "🇱🇺", short: "LU" },
  "Madagascar": { lat: -18.76, lon: 46.86, flag: "🇲🇬", short: "MG" },
  "Malawi": { lat: -13.25, lon: 34.30, flag: "🇲🇼", short: "MW" },
  "Malaysia": { lat: 4.21, lon: 101.97, flag: "🇲🇾", short: "MY" },
  "Maldives": { lat: 3.20, lon: 73.22, flag: "🇲🇻", short: "MV" },
  "Mali": { lat: 17.57, lon: -3.99, flag: "🇲🇱", short: "ML" },
  "Malta": { lat: 35.93, lon: 14.37, flag: "🇲🇹", short: "MT" },
  "Marshall Islands": { lat: 7.13, lon: 171.18, flag: "🇲🇭", short: "MH" },
  "Mauritania": { lat: 21.00, lon: -10.94, flag: "🇲🇷", short: "MR" },
  "Mauritius": { lat: -20.34, lon: 57.55, flag: "🇲🇺", short: "MU" },
  "Mexico": { lat: 23.63, lon: -102.55, flag: "🇲🇽", short: "MX" },
  "Micronesia": { lat: 7.42, lon: 150.55, flag: "🇫🇲", short: "FM" },
  "Moldova": { lat: 47.41, lon: 28.36, flag: "🇲🇩", short: "MD" },
  "Monaco": { lat: 43.73, lon: 7.42, flag: "🇲🇨", short: "MC" },
  "Mongolia": { lat: 46.86, lon: 103.84, flag: "🇲🇳", short: "MN" },
  "Montenegro": { lat: 42.70, lon: 19.37, flag: "🇲🇪", short: "ME" },
  "Morocco": { lat: 31.79, lon: -7.09, flag: "🇲🇦", short: "MA" },
  "Mozambique": { lat: -18.66, lon: 35.52, flag: "🇲🇿", short: "MZ" },
  "Myanmar": { lat: 21.91, lon: 95.95, flag: "🇲🇲", short: "MM" },
  "Namibia": { lat: -22.95, lon: 18.49, flag: "🇳🇦", short: "NA" },
  "Nauru": { lat: -0.52, lon: 166.93, flag: "🇳🇷", short: "NR" },
  "Nepal": { lat: 28.39, lon: 84.12, flag: "🇳🇵", short: "NP" },
  "Netherlands": { lat: 52.13, lon: 5.29, flag: "🇳🇱", short: "NL" },
  "New Zealand": { lat: -40.90, lon: 174.88, flag: "🇳🇿", short: "NZ" },
  "Nicaragua": { lat: 12.86, lon: -85.20, flag: "🇳🇮", short: "NI" },
  "Niger": { lat: 17.60, lon: 8.08, flag: "🇳🇪", short: "NE" },
  "Nigeria": { lat: 9.08, lon: 8.67, flag: "🇳🇬", short: "NG" },
  "North Korea": { lat: 40.33, lon: 127.51, flag: "🇰🇵", short: "KP" },
  "North Macedonia": { lat: 41.60, lon: 21.74, flag: "🇲🇰", short: "MK" },
  "Norway": { lat: 60.47, lon: 8.46, flag: "🇳🇴", short: "NO" },
  "Oman": { lat: 21.51, lon: 55.92, flag: "🇴🇲", short: "OM" },
  "Pakistan": { lat: 30.37, lon: 69.34, flag: "🇵🇰", short: "PK" },
  "Palau": { lat: 7.51, lon: 134.58, flag: "🇵🇼", short: "PW" },
  "Palestine": { lat: 31.95, lon: 35.23, flag: "🇵🇸", short: "PS" },
  "Panama": { lat: 8.53, lon: -80.78, flag: "🇵🇦", short: "PA" },
  "Papua New Guinea": { lat: -6.31, lon: 143.95, flag: "🇵🇬", short: "PG" },
  "Paraguay": { lat: -23.44, lon: -58.44, flag: "🇵🇾", short: "PY" },
  "Peru": { lat: -9.18, lon: -75.01, flag: "🇵🇪", short: "PE" },
  "Philippines": { lat: 12.87, lon: 121.77, flag: "🇵🇭", short: "PH" },
  "Poland": { lat: 51.91, lon: 19.14, flag: "🇵🇱", short: "PL" },
  "Portugal": { lat: 39.39, lon: -8.22, flag: "🇵🇹", short: "PT" },
  "Qatar": { lat: 25.35, lon: 51.18, flag: "🇶🇦", short: "QA" },
  "Romania": { lat: 45.94, lon: 24.96, flag: "🇷🇴", short: "RO" },
  "Russia": { lat: 61.52, lon: 105.31, flag: "🇷🇺", short: "RU" },
  "Rwanda": { lat: -1.94, lon: 29.87, flag: "🇷🇼", short: "RW" },
  "Saint Kitts and Nevis": { lat: 17.35, lon: -62.78, flag: "🇰🇳", short: "KN" },
  "Saint Lucia": { lat: 13.90, lon: -60.97, flag: "🇱🇨", short: "LC" },
  "Saint Vincent and the Grenadines": { lat: 12.98, lon: -61.28, flag: "🇻🇨", short: "VC" },
  "Samoa": { lat: -13.75, lon: -172.10, flag: "🇼🇸", short: "WS" },
  "San Marino": { lat: 43.94, lon: 12.45, flag: "🇸🇲", short: "SM" },
  "Sao Tome and Principe": { lat: 0.18, lon: 6.61, flag: "🇸🇹", short: "ST" },
  "Saudi Arabia": { lat: 23.88, lon: 45.07, flag: "🇸🇦", short: "SA" },
  "Senegal": { lat: 14.49, lon: -14.45, flag: "🇸🇳", short: "SN" },
  "Serbia": { lat: 44.01, lon: 21.00, flag: "🇷🇸", short: "RS" },
  "Seychelles": { lat: -4.67, lon: 55.49, flag: "🇸🇨", short: "SC" },
  "Sierra Leone": { lat: 8.46, lon: -11.77, flag: "🇸🇱", short: "SL" },
  "Singapore": { lat: 1.35, lon: 103.81, flag: "🇸🇬", short: "SG" },
  "Slovakia": { lat: 48.66, lon: 19.69, flag: "🇸🇰", short: "SK" },
  "Slovenia": { lat: 46.15, lon: 14.99, flag: "🇸🇮", short: "SI" },
  "Solomon Islands": { lat: -9.64, lon: 160.15, flag: "🇸🇧", short: "SB" },
  "Somalia": { lat: 5.15, lon: 46.19, flag: "🇸🇴", short: "SO" },
  "South Africa": { lat: -30.55, lon: 22.93, flag: "🇿🇦", short: "ZA" },
  "South Korea": { lat: 35.90, lon: 127.76, flag: "🇰🇷", short: "KR" },
  "South Sudan": { lat: 6.87, lon: 31.30, flag: "🇸🇸", short: "SS" },
  "Spain": { lat: 40.46, lon: -3.74, flag: "🇪🇸", short: "ES" },
  "Sri Lanka": { lat: 7.87, lon: 80.77, flag: "🇱🇰", short: "LK" },
  "Sudan": { lat: 12.86, lon: 30.21, flag: "🇸🇩", short: "SD" },
  "Suriname": { lat: 3.91, lon: -56.02, flag: "🇸🇷", short: "SR" },
  "Sweden": { lat: 60.12, lon: 18.64, flag: "🇸🇪", short: "SE" },
  "Switzerland": { lat: 46.81, lon: 8.22, flag: "🇨🇭", short: "CH" },
  "Syria": { lat: 34.80, lon: 38.99, flag: "🇸🇾", short: "SY" },
  "Taiwan": { lat: 23.69, lon: 120.96, flag: "🇹🇼", short: "TW" },
  "Tajikistan": { lat: 38.86, lon: 71.27, flag: "🇹🇯", short: "TJ" },
  "Tanzania": { lat: -6.36, lon: 34.88, flag: "🇹🇿", short: "TZ" },
  "Thailand": { lat: 15.87, lon: 100.99, flag: "🇹🇭", short: "TH" },
  "Timor-Leste": { lat: -8.87, lon: 125.72, flag: "🇹🇱", short: "TL" },
  "Togo": { lat: 8.61, lon: 0.98, flag: "🇹🇬", short: "TG" },
  "Tonga": { lat: -21.17, lon: -175.19, flag: "🇹🇴", short: "TO" },
  "Trinidad and Tobago": { lat: 10.69, lon: -61.22, flag: "🇹🇹", short: "TT" },
  "Tunisia": { lat: 33.88, lon: 9.53, flag: "🇹🇳", short: "TN" },
  "Turkey": { lat: 38.96, lon: 35.24, flag: "🇹🇷", short: "TR" },
  "Turkmenistan": { lat: 38.96, lon: 59.55, flag: "🇹🇲", short: "TM" },
  "Tuvalu": { lat: -7.10, lon: 177.64, flag: "🇹🇻", short: "TV" },
  "Uganda": { lat: 1.37, lon: 32.29, flag: "🇺🇬", short: "UG" },
  "Ukraine": { lat: 48.37, lon: 31.16, flag: "🇺🇦", short: "UA" },
  "United Arab Emirates": { lat: 23.42, lon: 53.84, flag: "🇦🇪", short: "AE" },
  "United Kingdom": { lat: 55.37, lon: -3.43, flag: "🇬🇧", short: "GB" },
  "United States": { lat: 37.09, lon: -95.71, flag: "🇺🇸", short: "US" },
  "Uruguay": { lat: -32.52, lon: -55.76, flag: "🇺🇾", short: "UY" },
  "Uzbekistan": { lat: 41.37, lon: 64.58, flag: "🇺🇿", short: "UZ" },
  "Vanuatu": { lat: -15.37, lon: 166.95, flag: "🇻🇺", short: "VU" },
  "Vatican City": { lat: 41.90, lon: 12.45, flag: "🇻🇦", short: "VA" },
  "Venezuela": { lat: 9.18, lon: -66.87, flag: "🇻🇪", short: "VE" },
  "Vietnam": { lat: 14.05, lon: 108.27, flag: "🇻🇳", short: "VN" },
  "Yemen": { lat: 15.55, lon: 48.51, flag: "🇾🇪", short: "YE" },
  "Zambia": { lat: -13.13, lon: 27.84, flag: "🇿🇲", short: "ZM" },
  "Zimbabwe": { lat: -19.01, lon: 29.15, flag: "🇿🇼", short: "ZW" }
};

// ── Auto-Generate ISO Mapping ──────────────────────────────────────────────────
const ISO_TO_NAME: Record<string, string> = {};
Object.entries(COUNTRY_META).forEach(([fullName, meta]) => {
  COUNTRY_META[meta.short] = meta;
  ISO_TO_NAME[meta.short] = fullName;
});

function displayName(raw: string): string {
  return ISO_TO_NAME[raw.toUpperCase()] ?? raw;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3( -r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeTopoArcs(topo: any, objectName: string, radius: number): Float32Array {
  const { scale, translate } = topo.transform as { scale: [number,number]; translate: [number,number] };
  const decodedArcs: [number, number][][] = (topo.arcs as number[][][]).map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as [number, number]; });
  });
  const positions: number[] = [];
  function ringToSegments(arcIndices: number[]) {
    const ring: [number, number][] = [];
    arcIndices.forEach(idx => {
      const rev = idx < 0; const arc = decodedArcs[rev ? ~idx : idx];
      const pts  = rev ? [...arc].reverse() : arc;
      if (ring.length === 0) ring.push(...pts); else ring.push(...pts.slice(1));
    });
    for (let i = 0; i < ring.length - 1; i++) {
      const v1 = latLonToVec3(ring[i][1], ring[i][0], radius);
      const v2 = latLonToVec3(ring[i+1][1], ring[i+1][0], radius);
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (topo.objects[objectName].geometries as any[]).forEach(geom => {
    if (!geom.arcs) return;
    if (geom.type === "Polygon") { (geom.arcs as number[][]).forEach(ring => ringToSegments(ring)); } 
    else if (geom.type === "MultiPolygon") { (geom.arcs as number[][][]).forEach(poly => poly.forEach(ring => ringToSegments(ring))); }
  });
  return new Float32Array(positions);
}

function useCountUp(target: number, duration = 1200): number {
  const [v, setV] = useState<number>(0);
  useEffect(() => {
    let s: number | null = null;
    let frameId: number;
    const step = (ts: number) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return v;
}

// ── Components ────────────────────────────────────────────────────────────────
function LiveBanner({ live }: { live: LiveData }) {
  const animNow = useCountUp(live.onlineNow); const anim30m = useCountUp(live.activeLast30m);
  const animPeak = useCountUp(live.peakToday); const animNew = useCountUp(live.newVisitors); const animReturn = useCountUp(live.returningVisitors);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center gap-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-3 shrink-0 border-r border-gray-100 pr-6">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-green-600 font-bold uppercase">Live Now</div>
          <div className="text-3xl font-bold text-gray-900 leading-none mt-1 tracking-tight">{animNow.toLocaleString()}</div>
        </div>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { label: "Last 30 min",  val: anim30m,    icon: <Clock size={14} className="text-blue-500" /> },
          { label: "Peak Today",   val: animPeak,   icon: <TrendingUp size={14} className="text-amber-500" /> },
          { label: "New Today",    val: animNew,    icon: <UserCheck size={14} className="text-purple-500" /> },
          { label: "Returning",    val: animReturn, icon: <Users size={14} className="text-emerald-500" /> },
        ].map(({ label, val, icon }) => (
          <div key={label} className="shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{icon} {label}</div>
            <div className="text-xl font-bold text-gray-900">{val.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block w-px h-10 bg-gray-100 shrink-0 ml-auto" />
      <div className="shrink-0 lg:ml-0 ml-auto">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Hot Right Now</div>
        <div className="flex gap-2">
          {live.topLiveCountries.slice(0, 4).map(({ country, count }) => {
            const meta = COUNTRY_META[country];
            return (
              <div key={country} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-sm">{meta?.flag || "🌐"}</span><span className="text-xs font-bold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: StatCardProps) {
  const anim = useCountUp(value);
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex-1 min-w-[150px]">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span></div>
      <p className="text-3xl font-bold text-gray-900 leading-none">{anim.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-600 mt-2">{sub}</p>}
    </div>
  );
}

function CountryRow({ data, maxTotal, rank, active, onHover, onClick }: CountryRowProps) {
  const total = data.known + data.unknown;
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const knownPct = total > 0 ? (data.known / total) * 100 : 0;
  const meta = COUNTRY_META[data.name];

  return (
    <div 
      onClick={() => onClick(data.name)}
      onMouseEnter={() => onHover(data.name)} 
      onMouseLeave={() => onHover(null)} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
    >
      <div className="text-xs text-gray-600 font-mono w-5 text-right shrink-0 font-medium">{String(rank).padStart(2, "0")}</div>
      <div className="text-base shrink-0 shadow-sm rounded-sm bg-white overflow-hidden leading-none">{meta?.flag || "🌐"}</div>
      <div className={`flex-[0_0_100px] text-xs font-medium truncate ${active ? 'text-blue-700' : 'text-gray-700'}`}>{displayName(data.name)}</div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="flex h-full rounded-full overflow-hidden transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}>
          <div className="bg-blue-500 h-full" style={{ width: `${knownPct}%` }} /><div className="bg-blue-200 h-full flex-1" />
        </div>
      </div>
      <div className="text-xs text-gray-700 font-mono w-12 text-right shrink-0 font-medium">{total.toLocaleString()}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsComponent({ source, period }: AnalyticsComponentProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const spikesRef     = useRef<SpikeMesh[]>([]);
  const frameRef      = useRef<number | null>(null);
  const mouseState    = useRef({ dragging: false, prev: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });
  const raycaster     = useRef(new THREE.Raycaster());
  const mouse2D       = useRef(new THREE.Vector2(-9, -9));
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Track auto-navigation targets
  const targetRotationRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const [data, setData]               = useState<RawRow[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [tooltip, setTooltip]         = useState<TooltipState | null>(null);
  const [highlight, setHighlight]     = useState<string | null>(null);
  const [liveData, setLiveData]       = useState<LiveData>(MOCK_LIVE);
  const [liveLoaded, setLiveLoaded]   = useState(false);

  // ── Fetch location data ─────────────────────────────────────────────────────
  const fetchLocations = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/analytics/locations?period=${period}&source=${source}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) { setData(json.data); setLoading(false); return; }
    } catch {}
    setTimeout(() => { setData(MOCK_DATA); setLoading(false); }, 400);
  }, [period, source]);

  useEffect(() => {
    setLoading(true);
    fetchLocations();
  }, [fetchLocations]);

  // ── Fetch live data ───────────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/analytics/live?source=${source}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) {
        setLiveData({
          onlineNow: json.onlineNow, activeLast30m: json.activeLast30m, todayUnique: json.todayUnique,
          newVisitors: json.newVisitors, returningVisitors: json.returningVisitors,
          topLiveCountries: json.topLiveCountries, peakToday: json.peakToday,
        });
        setLiveLoaded(true);
        return;
      }
    } catch {}
    setLiveLoaded(true);
  }, [source]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const countries = useMemo<CountryData[]>(() => {
    const map: Record<string, CountryData> = {};
    data.forEach(r => {
      const k = r.country;
      if (!map[k]) map[k] = { name: k, known: 0, unknown: 0 };
      map[k].known   += r.knownUsers;
      map[k].unknown += r.unknownUsers;
    });
    return Object.values(map)
      .filter(c => c.name !== "Unknown" && COUNTRY_META[c.name])
      .sort((a, b) => (b.known + b.unknown) - (a.known + a.unknown));
  }, [data]);

  const totals = useMemo(() => {
    let k = 0, u = 0;
    data.forEach(r => { k += r.knownUsers; u += r.unknownUsers; });
    return { known: k, unknown: u, total: k + u };
  }, [data]);

  const maxTotal = useMemo(() => Math.max(...countries.map(c => c.known + c.unknown), 1), [countries]);

  // ── Handle Right Side Row Clicking ─────────────────────────────────────────
  const handleCountryClick = useCallback((countryName: string) => {
    const meta = COUNTRY_META[countryName];
    if (!meta) return;

    // Convert Lat/Lon to Target Rotational Radians for the Globe
    const targetX = (meta.lat) * (Math.PI / 180);
    const targetY = -(meta.lon + 90) * (Math.PI / 180);

    targetRotationRef.current = {
      x: targetX,
      y: targetY,
      active: true
    };
  }, []);

  // ── Sync spike highlighting ────────────────────────────────────────────────
  useEffect(() => {
    spikesRef.current.forEach(({ mesh, country }) => {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const isHighlighted = highlight === country || highlight === null;
      mat.opacity = isHighlighted ? 0.95 : 0.2;
      mat.emissiveIntensity = highlight === country ? 2 : 0.4;
    });
  }, [highlight]);

  // ── Three.js setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !mountRef.current) return;

    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const GLOBE_R = 1.9;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 0.5, 6.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 72, 72),
      new THREE.MeshPhongMaterial({ color: 0xf4f7fc, emissive: 0xe8eef8, specular: 0xd0ddf0, shininess: 40 })
    ));

    const gridMat = new THREE.LineBasicMaterial({ color: 0xd4dff0, transparent: true, opacity: 0.7 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 3) pts.push(latLonToVec3(lat, lon - 180, GLOBE_R + 0.002));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lon = 0; lon < 360; lon += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) pts.push(latLonToVec3(lat, lon, GLOBE_R + 0.002));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    let fetchAborted = false;
    (async () => {
      try {
        const res  = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
        const topo = await res.json();
        if (fetchAborted) return;

        const countryPositions = decodeTopoArcs(topo, "countries", GLOBE_R + 0.006);
        const countryGeo = new THREE.BufferGeometry();
        countryGeo.setAttribute("position", new THREE.BufferAttribute(countryPositions, 3));
        globeGroup.add(new THREE.LineSegments(countryGeo, new THREE.LineBasicMaterial({ color: 0x7a9dbf, transparent: true, opacity: 0.55 })));
      } catch (e) {
        console.warn("Country borders unavailable:", e);
      }
    })();

    const spikeMeshes: SpikeMesh[] = [];
    countries.forEach((country) => {
      const meta = COUNTRY_META[country.name];
      if (!meta) return;
      const total = country.known + country.unknown;
      const norm  = total / maxTotal;
      const spikeH = 0.08 + norm * 1.4;
      const spikeR = 0.013 + norm * 0.022;
      const col = new THREE.Color().setHSL(0.60 - norm * 0.05, 0.75, 0.42 + norm * 0.22);

      const geo = new THREE.CylinderGeometry(0, spikeR, spikeH, 8, 1);
      geo.translate(0, spikeH / 2, 0);
      const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col.clone().multiplyScalar(0.35), transparent: true, opacity: 0.92, emissiveIntensity: 0.4 });
      const spike = new THREE.Mesh(geo, mat);
      const surfacePos = latLonToVec3(meta.lat, meta.lon, GLOBE_R);
      spike.position.copy(surfacePos);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfacePos.clone().normalize());
      spike.userData = { country: country.name, known: country.known, unknown: country.unknown };
      globeGroup.add(spike);
      spikeMeshes.push({ mesh: spike, country: country.name });
    });
    spikesRef.current = spikeMeshes;

    scene.add(new THREE.AmbientLight(0xf0f4ff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(6, 4, 5); scene.add(sun);
    
    const ms = mouseState.current;
    const onDown = (e: MouseEvent) => { ms.dragging = true; ms.prev = { x: e.clientX, y: e.clientY }; ms.vel = { x: 0, y: 0 }; };
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse2D.current.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse2D.current.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      if (!ms.dragging) return;
      const dx = e.clientX - ms.prev.x;
      const dy = e.clientY - ms.prev.y;
      ms.vel = { x: dy * 0.004, y: dx * 0.004 };
      if (globeGroupRef.current) { globeGroupRef.current.rotation.x += ms.vel.x; globeGroupRef.current.rotation.y += ms.vel.y; }
      ms.prev = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { ms.dragging = false; };
    container.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const onResize = () => {
      const nW = container.clientWidth, nH = container.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix(); renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let lastHoveredName: string | null = null;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      frame++;

      if (ms.dragging) {
        // Cancel active clicking pans if the user grabs and interacts manually
        targetRotationRef.current.active = false;
        globeGroup.rotation.y += 0.0018;
        ms.vel.x *= 0.92; ms.vel.y *= 0.92;
        globeGroup.rotation.x += ms.vel.x; globeGroup.rotation.y += ms.vel.y;
      } else if (targetRotationRef.current.active) {
        // Run smooth programmatic rotation tracking
        const target = targetRotationRef.current;
        const currentY = globeGroup.rotation.y;
        
        // Prevent reverse-spinning on modular meridian limits
        const diffY = ((target.y - currentY + Math.PI) % (Math.PI * 2)) - Math.PI;
        const cleanTargetY = currentY + (diffY < -Math.PI ? diffY + Math.PI * 2 : diffY);

        globeGroup.rotation.x += (target.x - globeGroup.rotation.x) * 0.08;
        globeGroup.rotation.y += (cleanTargetY - globeGroup.rotation.y) * 0.08;

        // Turn off when target threshold is reached
        if (Math.abs(target.x - globeGroup.rotation.x) < 0.001 && Math.abs(cleanTargetY - globeGroup.rotation.y) < 0.001) {
          target.active = false;
        }
      } else {
        // Fallback standard rotation
        globeGroup.rotation.y += 0.0018;
        ms.vel.x *= 0.92; ms.vel.y *= 0.92;
        globeGroup.rotation.x += ms.vel.x; globeGroup.rotation.y += ms.vel.y;
      }

      globeGroup.rotation.x = Math.max(-0.9, Math.min(0.9, globeGroup.rotation.x));
      spikeMeshes.forEach(({ mesh }, i) => { const s = 1 + 0.06 * Math.sin(frame * 0.025 + i * 1.1); mesh.scale.set(s, 1, s); });
      raycaster.current.setFromCamera(mouse2D.current, camera);
      const hits = raycaster.current.intersectObjects(spikeMeshes.map(s => s.mesh));
      if (hits.length > 0) {
        const ud = hits[0].object.userData as { country: string; known: number; unknown: number };
        if (ud.country !== lastHoveredName) {
          lastHoveredName = ud.country;
          const wp = new THREE.Vector3(); hits[0].object.getWorldPosition(wp); wp.project(camera);
          const rect = container.getBoundingClientRect();
          setTooltip({ name: ud.country, known: ud.known, unknown: ud.unknown, x: ((wp.x + 1) / 2) * rect.width, y: ((-wp.y + 1) / 2) * rect.height });
        }
        container.style.cursor = "pointer";
      } else {
        if (lastHoveredName !== null) { lastHoveredName = null; setTooltip(null); }
        container.style.cursor = targetRotationRef.current.active ? "default" : "grab";
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      fetchAborted = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      container.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [loading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
      <div className="text-gray-500 text-xs tracking-widest uppercase font-semibold">Loading Intelligence</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Live Banner ─────────────────────────────────────────────────── */}
      {liveLoaded && <LiveBanner live={liveData} />}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <StatCard label="Total Users"    value={totals.total}         icon={<Users size={16} className="text-blue-500" />} sub={`${countries.length} countries mapped`} />
        <StatCard label="Identified"     value={totals.known}         icon={<UserCheck size={16} className="text-green-500" />} sub={`${totals.total > 0 ? ((totals.known / totals.total)*100).toFixed(1) : 0}% verification rate`} />
        <StatCard label="Anonymous"      value={totals.unknown}       icon={<UserMinus size={16} className="text-gray-600" />} sub={`${totals.total > 0 ? ((totals.unknown / totals.total)*100).toFixed(1) : 0}% of total volume`} />
        <StatCard label="Today Unique"   value={liveData.todayUnique} icon={<Activity size={16} className="text-purple-500" />} sub="active sessions today" />
      </div>

      {/* ── Main Grid: Globe + Panel ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 flex-1 min-h-[480px]">

        {/* Globe Canvas */}
        <div className="relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-gray-100 rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[480px]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_#c8d8ee_1px,_transparent_1px)] bg-[size:28px_28px] opacity-40" />
          <div ref={mountRef} className="absolute inset-0 w-full h-full" />

          {/* Render Period context */}
          <div className="absolute top-4 left-4 bg-white/90 border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 text-[10px] tracking-widest text-gray-600 font-bold uppercase backdrop-blur-md pointer-events-none">
            <Globe size={12} className="inline mr-1 text-blue-500" />
            {period === "all" ? "All Time" : period === "week" ? "Last 7 Days" : "Last 30 Days"}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div style={{ left: Math.min(tooltip.x + 12, (mountRef.current?.clientWidth ?? 600) - 200), top: Math.max(tooltip.y - 80, 8) }} className="absolute bg-white/95 border border-gray-200 rounded-xl p-3 shadow-lg min-w-[170px] z-10 pointer-events-none backdrop-blur-md">
              <div className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-2"><span>{COUNTRY_META[tooltip.name]?.flag}</span><span>{displayName(tooltip.name)}</span></div>
              <div className="flex justify-between text-xs text-gray-500 pb-1"><span>Identified</span><span className="text-blue-600 font-bold">{tooltip.known.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs text-gray-500 pb-1"><span>Anonymous</span><span className="text-gray-600 font-bold">{tooltip.unknown.toLocaleString()}</span></div>
              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-xs text-gray-500"><span>Total Users</span><span className="text-gray-900 font-bold">{(tooltip.known + tooltip.unknown).toLocaleString()}</span></div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] text-gray-600 tracking-wider uppercase font-semibold pointer-events-none">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-blue-500" /> High Volume</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-blue-200" /> Low Volume</div>
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 font-semibold text-gray-800"><MapPin size={16} className="text-gray-500" /> Regions Ranked</div>
            <div className="text-[10px] text-gray-500 tracking-widest font-semibold uppercase mt-1">Based on global filter</div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white text-[10px] font-bold uppercase text-gray-600 tracking-wider">
            <div className="w-5 text-right shrink-0">#</div><div className="w-4 shrink-0" /><div className="flex-[0_0_100px]">Country</div><div className="flex-1">Share</div><div className="w-12 text-right shrink-0">Total</div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-50">
            {countries.map((c, i) => (
              <CountryRow key={c.name} data={c} maxTotal={maxTotal} rank={i + 1} active={highlight === c.name || (tooltip !== null && tooltip.name === c.name)} onHover={setHighlight} onClick={handleCountryClick} />
            ))}
            
            {countries.length === 0 && <div className="text-center py-10 text-gray-600 text-sm">No geographic data found</div>}
          </div>

          <div className="border-t border-gray-100 p-4 grid grid-cols-2 gap-3 bg-white">
            {[
              { label: "ID Rate",      val: `${totals.total > 0 ? ((totals.known / totals.total)*100).toFixed(1) : 0}%`,      col: "text-green-600" },
              { label: "Top Country",  val: countries[0]?.name.slice(0, 10) ?? "—",                                           col: "text-blue-600" },
              { label: "Top Share",    val: countries[0] ? `${(((countries[0].known + countries[0].unknown) / totals.total)*100).toFixed(1)}%` : "—", col: "text-purple-600" },
              { label: "Avg / Region", val: countries.length > 0 ? Math.round(totals.total / countries.length).toLocaleString() : "—", col: "text-amber-500" },
            ].map(({ label, val, col }) => (
              <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-[9px] text-gray-600 tracking-wider uppercase font-bold mb-1">{label}</div>
                <div className={`text-base font-bold ${col} leading-none tracking-tight`}>{val}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}