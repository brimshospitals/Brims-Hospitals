// Bihar district centroid coordinates + alias resolution + distance utilities

export const BIHAR_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Patna":           { lat: 25.5941, lng: 85.1376 },
  "Gaya":            { lat: 24.7955, lng: 85.0002 },
  "Bhojpur":         { lat: 25.5562, lng: 84.6607 },
  "Buxar":           { lat: 25.5652, lng: 83.9782 },
  "Rohtas":          { lat: 24.9463, lng: 84.0318 },
  "Kaimur":          { lat: 25.0390, lng: 83.6036 },
  "Nalanda":         { lat: 25.1954, lng: 85.5010 },
  "Nawada":          { lat: 24.8857, lng: 85.5440 },
  "Aurangabad":      { lat: 24.7517, lng: 84.3743 },
  "Jehanabad":       { lat: 25.2121, lng: 84.9941 },
  "Arwal":           { lat: 25.2532, lng: 84.6808 },
  "Saran":           { lat: 25.7829, lng: 84.7431 },
  "Siwan":           { lat: 26.2227, lng: 84.3543 },
  "Gopalganj":       { lat: 26.4683, lng: 84.4338 },
  "West Champaran":  { lat: 27.0283, lng: 84.5110 },
  "East Champaran":  { lat: 26.6499, lng: 84.9167 },
  "Muzaffarpur":     { lat: 26.1209, lng: 85.3647 },
  "Sheohar":         { lat: 26.5193, lng: 85.2969 },
  "Sitamarhi":       { lat: 26.5912, lng: 85.4820 },
  "Vaishali":        { lat: 25.6900, lng: 85.2099 },
  "Darbhanga":       { lat: 26.1542, lng: 85.8999 },
  "Madhubani":       { lat: 26.3534, lng: 86.0729 },
  "Samastipur":      { lat: 25.8639, lng: 85.7822 },
  "Begusarai":       { lat: 25.4182, lng: 86.1272 },
  "Khagaria":        { lat: 25.5024, lng: 86.4633 },
  "Munger":          { lat: 25.3762, lng: 86.4736 },
  "Lakhisarai":      { lat: 25.1553, lng: 86.1027 },
  "Sheikhpura":      { lat: 25.1393, lng: 85.8423 },
  "Jamui":           { lat: 24.9262, lng: 86.2221 },
  "Banka":           { lat: 24.8859, lng: 86.9228 },
  "Bhagalpur":       { lat: 25.2496, lng: 86.9718 },
  "Supaul":          { lat: 26.1260, lng: 86.6044 },
  "Madhepura":       { lat: 25.9262, lng: 86.7897 },
  "Saharsa":         { lat: 25.8829, lng: 86.5980 },
  "Purnia":          { lat: 25.7771, lng: 87.4718 },
  "Katihar":         { lat: 25.5392, lng: 87.5821 },
  "Kishanganj":      { lat: 26.1043, lng: 87.9440 },
  "Araria":          { lat: 26.1457, lng: 87.5173 },
};

// Alternate names / common spellings → canonical district name
const DISTRICT_ALIASES: Record<string, string> = {
  // Patna
  "rajdhani":             "Patna",
  "patna sahib":          "Patna",
  "patna saheb":          "Patna",
  "patna city":           "Patna",
  "patna ji":             "Patna",
  // Saran
  "chapra":               "Saran",
  "chhapra":              "Saran",
  // Bhojpur
  "ara":                  "Bhojpur",
  "arrah":                "Bhojpur",
  // Rohtas
  "sasaram":              "Rohtas",
  // Kaimur
  "bhabua":               "Kaimur",
  // Nalanda
  "biharsharif":          "Nalanda",
  "bihar sharif":         "Nalanda",
  "nalanda sahib":        "Nalanda",
  // West Champaran
  "bettiah":              "West Champaran",
  "pashchim champaran":   "West Champaran",
  "paschim champaran":    "West Champaran",
  "west champaran":       "West Champaran",
  // East Champaran
  "motihari":             "East Champaran",
  "purba champaran":      "East Champaran",
  "east champaran":       "East Champaran",
  // Vaishali
  "hajipur":              "Vaishali",
  // Purnia
  "purnea":               "Purnia",
  "purnia":               "Purnia",
  // Muzaffarpur
  "muzaffarpur city":     "Muzaffarpur",
  // Begusarai
  "begusarai city":       "Begusarai",
  // Bhagalpur
  "bhagalpur city":       "Bhagalpur",
  // Gopalganj
  "gopalganj city":       "Gopalganj",
  // Sitamarhi
  "sitamarhi city":       "Sitamarhi",
  // Darbhanga
  "darbhanga city":       "Darbhanga",
  // Samastipur
  "samastipur city":      "Samastipur",
};

/** Resolve any district name or alias → canonical name used in BIHAR_DISTRICT_COORDS */
export function normalizeDistrict(input: string): string {
  if (!input) return "";
  const lower = input.trim().toLowerCase();
  // Try alias map first
  if (DISTRICT_ALIASES[lower]) return DISTRICT_ALIASES[lower];
  // Try case-insensitive match against canonical names
  const found = Object.keys(BIHAR_DISTRICT_COORDS).find(
    (d) => d.toLowerCase() === lower
  );
  return found || input.trim();
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Distance from a lat/lng point to a district centroid (handles aliases). Returns null if unknown district. */
export function getDistanceKm(
  fromLat: number, fromLng: number,
  toDistrict: string
): number | null {
  const canonical = normalizeDistrict(toDistrict);
  const coords = BIHAR_DISTRICT_COORDS[canonical];
  if (!coords) return null;
  return Math.round(haversineKm(fromLat, fromLng, coords.lat, coords.lng));
}

/** Find the canonical Bihar district nearest to a GPS coordinate */
export function getNearestDistrict(lat: number, lng: number): string {
  let nearest = "Patna";
  let minDist = Infinity;
  for (const [name, c] of Object.entries(BIHAR_DISTRICT_COORDS)) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < minDist) { minDist = d; nearest = name; }
  }
  return nearest;
}

/** Get centroid coords for a district (or alias). Returns null if unknown. */
export function getDistrictCoords(district: string): { lat: number; lng: number } | null {
  const canonical = normalizeDistrict(district);
  return BIHAR_DISTRICT_COORDS[canonical] ?? null;
}

/** Format a distance for display: "~3 km", "~45 km", etc. */
export function fmtDistance(km: number | null): string {
  if (km === null) return "";
  if (km < 2) return "~1 km";
  if (km < 10) return `~${km} km`;
  return `~${Math.round(km / 5) * 5} km`; // round to nearest 5
}

/**
 * Distance from user GPS to an item (doctor/lab/surgery package).
 * Prefers item.coordinates (actual GPS) over district centroid fallback.
 */
export function getItemDistanceKm(
  userLat: number,
  userLng: number,
  item: { coordinates?: { lat?: number; lng?: number }; address?: { district?: string } }
): number | null {
  if (item.coordinates?.lat && item.coordinates?.lng)
    return Math.round(haversineKm(userLat, userLng, item.coordinates.lat, item.coordinates.lng));
  return getDistanceKm(userLat, userLng, item.address?.district || "");
}
