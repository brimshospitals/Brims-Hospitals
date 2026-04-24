import { NextResponse } from "next/server";
import biharDistricts from "../../../lib/biharDistricts";

export const dynamic = "force-dynamic";

// GET /api/districts
// Returns all 38 districts with their prakhands
// Used by: Web (register, update-profile) + Flutter app
//
// Query params:
//   ?district=Patna          → returns prakhands for that district only
//   ?names=true              → returns only district names array
//   (no params)              → returns full { district: [prakhands] } map
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const namesOnly = searchParams.get("names") === "true";

  if (district) {
    const prakhands = biharDistricts[district] || [];
    return NextResponse.json({ success: true, district, prakhands });
  }

  if (namesOnly) {
    const districts = Object.keys(biharDistricts).sort();
    return NextResponse.json({ success: true, districts });
  }

  return NextResponse.json({ success: true, data: biharDistricts });
}
