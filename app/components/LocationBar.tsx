"use client";
import { useState, useCallback } from "react";
import {
  getNearestDistrict,
  getDistrictCoords,
} from "../../lib/biharDistrictCoords";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

export type UserLocation = {
  lat: number;
  lng: number;
  label: string;    // display: "Patna" or "GPS: Siwan"
  district: string; // canonical district name
  isGPS: boolean;
};

const RADIUS_OPTIONS = [
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "All Bihar", value: 0 },
];

interface Props {
  location: UserLocation | null;
  onLocationChange: (loc: UserLocation | null) => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

export default function LocationBar({ location, onLocationChange, radius, onRadiusChange }: Props) {
  const [detecting, setDetecting] = useState(false);
  const [showPanel, setShowPanel]  = useState(false);
  const [gpsError, setGpsError]   = useState("");

  const detectGPS = useCallback(() => {
    setDetecting(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("GPS browser mein supported nahi hai. District manually chunein.");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const district = getNearestDistrict(latitude, longitude);
        onLocationChange({
          lat: latitude, lng: longitude,
          label: `GPS: ${district}`,
          district,
          isGPS: true,
        });
        setDetecting(false);
        setShowPanel(false);
        setGpsError("");
      },
      () => {
        setGpsError("Location access deny ho gayi. District manually chunein.");
        setDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, [onLocationChange]);

  function pickDistrict(d: string) {
    if (!d) return;
    const coords = getDistrictCoords(d);
    if (!coords) return;
    onLocationChange({ lat: coords.lat, lng: coords.lng, label: d, district: d, isGPS: false });
    setShowPanel(false);
    setGpsError("");
  }

  function clearLocation() {
    onLocationChange(null);
    setShowPanel(false);
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl px-4 py-3 mb-4">
      {/* Main row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Icon + label */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{location?.isGPS ? "📡" : "📍"}</span>
          <div className="min-w-0">
            <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wide leading-none mb-0.5">
              Aapki Location
            </p>
            <p className="text-sm font-bold text-gray-800 truncate">
              {location ? location.label : "Location set nahi hai — GPS use karein ya district chunein"}
            </p>
          </div>
        </div>

        {/* Radius selector (only when location is set) */}
        {location && (
          <select
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white text-teal-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 flex-shrink-0"
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* GPS button */}
        <button
          onClick={detectGPS}
          disabled={detecting}
          className="flex items-center gap-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition flex-shrink-0"
        >
          {detecting ? (
            <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Detecting...</>
          ) : (
            <>📡 GPS</>
          )}
        </button>

        {/* Change / collapse toggle */}
        <button
          onClick={() => setShowPanel((v) => !v)}
          className="text-xs font-semibold text-teal-700 bg-white border border-teal-300 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition flex-shrink-0"
        >
          {showPanel ? "▲ Band" : "✏️ Change"}
        </button>
      </div>

      {/* GPS error */}
      {gpsError && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <span>⚠️</span> {gpsError}
        </p>
      )}

      {/* Expanded panel: manual district select */}
      {showPanel && (
        <div className="mt-3 pt-3 border-t border-teal-200 space-y-2">
          <p className="text-xs text-gray-500 font-medium">Koi bhi district manually select karein:</p>
          <select
            defaultValue=""
            onChange={(e) => pickDistrict(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">-- District chunein --</option>
            {BIHAR_DISTRICTS.map((d) => (
              <option key={d} value={d} selected={location?.district === d}>
                {d}
              </option>
            ))}
          </select>
          {location && (
            <button
              onClick={clearLocation}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Location filter hatao (poora Bihar dikhao)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
