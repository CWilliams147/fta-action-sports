"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";
import type { SpotWithStats } from "@/lib/types/database";
import { SPORT_OPTIONS, SPOT_STYLE_OPTIONS_BY_SPORT, getSpotTypeLabel } from "@/lib/types/database";
import { getSpotsWithStats, createSpot, createCheckIn } from "./actions";

const SPOT_SPORTS = SPORT_OPTIONS.map((o) => o.name);

function SpotCard({
  spot,
  onCheckIn,
  onClose,
  currentUserId,
  isCheckedIn,
}: {
  spot: SpotWithStats;
  onCheckIn: () => void;
  onClose: () => void;
  currentUserId: string | null;
  isCheckedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    if (!currentUserId || isCheckedIn) return;
    setLoading(true);
    const result = await createCheckIn(spot.id);
    setLoading(false);
    if (!result.error) onCheckIn();
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] border-[3px] border-fta-black bg-fta-paper p-4 rounded-none">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-fta-black">
            {spot.name}
          </h2>
          <p className="text-sm font-bold uppercase text-fta-orange">
            {spot.sport} · {getSpotTypeLabel(spot.sport, spot.type)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-fta-black font-bold hover:text-fta-orange"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border-[3px] border-fta-black p-2">
          <p className="text-xs font-bold uppercase text-fta-black/70">Active now</p>
          <p className="text-xl font-bold uppercase text-fta-black">{spot.active_now}</p>
        </div>
        <div className="border-[3px] border-fta-black p-2">
          <p className="text-xs font-bold uppercase text-fta-black/70">Weekly average</p>
          <p className="text-xl font-bold uppercase text-fta-black">{spot.weekly_avg}</p>
        </div>
      </div>
      {spot.heating_up && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 border-[3px] border-fta-orange bg-fta-orange text-fta-black">
          <span className="inline-block w-2 h-2 bg-fta-black animate-pulse" aria-hidden />
          <span className="text-sm font-bold uppercase tracking-wide">HEATING UP</span>
        </div>
      )}
      {spot.description && (
        <p className="text-sm text-fta-black/80 mb-4">{spot.description}</p>
      )}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={loading || !currentUserId || isCheckedIn}
          className="px-4 py-2 border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold uppercase text-sm hover:bg-fta-paper hover:border-fta-black transition-colors disabled:opacity-50 rounded-none"
        >
          {isCheckedIn ? "CHECKED IN" : "CHECK IN"}
        </button>
        {spot.recent_check_ins.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold uppercase text-fta-black/70">Who&apos;s here:</span>
            <div className="flex -space-x-2">
              {Array.from(
                new Map(spot.recent_check_ins.map((u) => [u.user_id, u])).values()
              )
                .slice(0, 8)
                .map((u) => (
                <div
                  key={u.user_id}
                  className="w-8 h-8 border-2 border-fta-black bg-fta-paper flex items-center justify-center text-xs font-bold overflow-hidden"
                  title={u.display_name ?? "User"}
                >
                  {u.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-fta-black">{(u.display_name ?? "?")[0]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Theme-matched dropdown: paper white, 3px black border, Safety Orange selected/hover. */
function ThemeDropdown({
  id,
  labelId,
  options,
  value,
  onChange,
  placeholder = "—",
}: {
  id: string;
  labelId: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium text-left flex items-center justify-between rounded-none"
      >
        <span>{selectedLabel}</span>
        <span className="text-fta-orange font-bold" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-[1100] w-full mt-0 border-[3px] border-t-0 border-fta-black bg-fta-paper rounded-none max-h-48 overflow-y-auto"
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={value === o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`px-3 py-2 border-b-[3px] border-fta-black last:border-b-0 font-medium cursor-pointer rounded-none ${
                value === o.value
                  ? "bg-fta-orange text-fta-black"
                  : "bg-fta-paper text-fta-black hover:bg-fta-orange hover:text-fta-black"
              }`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MapClickHandler({
  onContextMenu,
}: {
  onContextMenu: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault();
      onContextMenu(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** When userLocation is set, fly the map to it and optionally setView once. */
function LocateUser({
  userLocation,
  zoom,
}: {
  userLocation: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;
    map.flyTo([userLocation.lat, userLocation.lng], zoom, { duration: 1 });
  }, [userLocation, map, zoom]);

  return null;
}

/** Fly the map to search result when user searches for an address. */
function FlyToSearch({
  searchCenter,
  zoom,
}: {
  searchCenter: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!searchCenter) return;
    map.flyTo([searchCenter.lat, searchCenter.lng], Math.max(zoom, 14), { duration: 1 });
  }, [searchCenter, map, zoom]);

  return null;
}

export type GeocodeSuggestion = { lat: number; lng: number; display_name: string };

/** Approximate distance in km between two points (Haversine). */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Fetch address suggestions from OpenStreetMap Nominatim, sorted by distance from near (closest first). */
async function geocodeSuggestions(
  query: string,
  near?: { lat: number; lng: number }
): Promise<GeocodeSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5`;
  if (near) {
    const pad = 0.25;
    const viewbox = [near.lng - pad, near.lat - pad, near.lng + pad, near.lat + pad].join(",");
    url += `&viewbox=${viewbox}&bounded=0`;
  }
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "FTA-Action-Sports/1.0" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!data?.length) return [];
  const list: GeocodeSuggestion[] = data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    display_name: d.display_name,
  }));
  if (near) {
    list.sort(
      (a, b) =>
        distanceKm(near.lat, near.lng, a.lat, a.lng) - distanceKm(near.lat, near.lng, b.lat, b.lng)
    );
  }
  return list;
}

/** Geocode single address (closest result when near is provided). */
async function geocodeAddress(
  query: string,
  near?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | null> {
  const list = await geocodeSuggestions(query, near);
  return list.length ? { lat: list[0].lat, lng: list[0].lng } : null;
}

function AddSpotForm({
  lat,
  lng,
  onDone,
  onCancel,
}: {
  lat: number;
  lng: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState<string>("Skateboard");
  const styleOptions = useMemo(
    () => SPOT_STYLE_OPTIONS_BY_SPORT[sport] ?? SPOT_STYLE_OPTIONS_BY_SPORT.Skateboard,
    [sport]
  );
  const [type, setType] = useState<string>(styleOptions[0]?.value ?? "street");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const opts = SPOT_STYLE_OPTIONS_BY_SPORT[sport] ?? SPOT_STYLE_OPTIONS_BY_SPORT.Skateboard;
    setType((prev) => (opts.some((o) => o.value === prev) ? prev : opts[0]?.value ?? "street"));
  }, [sport]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("sport", sport);
    formData.set("type", type);
    formData.set("lat", String(lat));
    formData.set("lng", String(lng));
    if (description.trim()) formData.set("description", description.trim());
    const result = await createSpot(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] border-[3px] border-fta-black bg-fta-paper p-4 rounded-none max-w-md">
      <h3 className="text-lg font-bold uppercase mb-3 text-fta-black">Add new spot</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="spot-name" className="block text-xs font-bold uppercase text-fta-black/70 mb-1">
            Name
          </label>
          <input
            id="spot-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        <div>
          <label id="spot-sport-label" htmlFor="spot-sport" className="block text-xs font-bold uppercase text-fta-black/70 mb-1">
            Sport
          </label>
          <ThemeDropdown
            id="spot-sport"
            labelId="spot-sport-label"
            options={SPOT_SPORTS.map((s) => ({ value: s, label: s }))}
            value={sport}
            onChange={setSport}
          />
        </div>
        <div>
          <label id="spot-type-label" htmlFor="spot-type" className="block text-xs font-bold uppercase text-fta-black/70 mb-1">
            Style / Type
          </label>
          <ThemeDropdown
            id="spot-type"
            labelId="spot-type-label"
            options={styleOptions}
            value={type}
            onChange={setType}
          />
        </div>
        <div>
          <label htmlFor="spot-desc" className="block text-xs font-bold uppercase text-fta-black/70 mb-1">
            Description (optional)
          </label>
          <input
            id="spot-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold uppercase text-sm disabled:opacity-50 rounded-none"
          >
            Add spot
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold uppercase text-sm rounded-none"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const searchResultIcon = L.divIcon({
  className: "fta-search-marker",
  html: `<div style="width:20px;height:20px;background:#000;border:3px solid #FF5F1F;box-sizing:border-box;"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function MapInner({
  spots,
  setSpots,
  currentUserId,
  initialCenter,
  initialZoom,
  userLocation,
  searchCenter,
}: {
  spots: SpotWithStats[];
  setSpots: (s: SpotWithStats[] | ((prev: SpotWithStats[]) => SpotWithStats[])) => void;
  currentUserId: string | null;
  initialCenter: [number, number];
  initialZoom: number;
  userLocation: { lat: number; lng: number } | null;
  searchCenter: { lat: number; lng: number } | null;
}) {
  const [selectedSpot, setSelectedSpot] = useState<SpotWithStats | null>(null);
  const [addSpotCoords, setAddSpotCoords] = useState<{ lat: number; lng: number } | null>(null);

  const refreshSpots = useCallback(async () => {
    const next = await getSpotsWithStats();
    setSpots(next);
    if (selectedSpot) {
      const updated = next.find((s) => s.id === selectedSpot.id);
      if (updated) setSelectedSpot(updated);
    }
  }, [selectedSpot, setSpots]);

  const handleCheckIn = useCallback(() => {
    refreshSpots();
  }, [refreshSpots]);

  const orangeIcon = L.divIcon({
    className: "fta-marker",
    html: `<div style="width:24px;height:24px;background:#FF5F1F;border:3px solid #000;box-sizing:border-box;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const userLocationIcon = L.divIcon({
    className: "fta-user-marker",
    html: `<div style="width:16px;height:16px;background:#000;border:3px solid #F4F4F4;box-sizing:border-box;border-radius:50%;"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return (
    <>
      <MapContainer
        center={userLocation ?? initialCenter}
        zoom={initialZoom}
        className="map-container h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocateUser userLocation={userLocation} zoom={initialZoom} />
        <FlyToSearch searchCenter={searchCenter} zoom={initialZoom} />
        <MapClickHandler onContextMenu={(lat, lng) => setAddSpotCoords({ lat, lng })} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
        )}
        {searchCenter && (
          <Marker position={[searchCenter.lat, searchCenter.lng]} icon={searchResultIcon} />
        )}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={orangeIcon}
            eventHandlers={{
              click: () => setSelectedSpot(spot),
            }}
          />
        ))}
      </MapContainer>

      {selectedSpot && (
        <SpotCard
          spot={selectedSpot}
          onCheckIn={handleCheckIn}
          onClose={() => setSelectedSpot(null)}
          currentUserId={currentUserId}
          isCheckedIn={
            !!currentUserId &&
            selectedSpot.recent_check_ins.some((c) => c.user_id === currentUserId)
          }
        />
      )}

      {addSpotCoords && (
        <AddSpotForm
          lat={addSpotCoords.lat}
          lng={addSpotCoords.lng}
          onDone={() => {
            setAddSpotCoords(null);
            refreshSpots();
          }}
          onCancel={() => setAddSpotCoords(null)}
        />
      )}
    </>
  );
}

const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437];
const DEFAULT_ZOOM = 10;

export default function SpotMapClient() {
  const [spots, setSpots] = useState<SpotWithStats[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    getSpotsWithStats().then((s) => {
      setSpots(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("Location unavailable"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("Location unavailable"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const referencePoint = useMemo(
    () =>
      userLocation ??
      searchCenter ??
      { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] },
    [userLocation, searchCenter]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const list = await geocodeSuggestions(q, referencePoint);
        if (!cancelled) {
          setSearchSuggestions(list);
          setShowSuggestions(list.length > 0);
        }
      } catch {
        if (!cancelled) setSearchSuggestions([]);
      }
      if (!cancelled) setSearchLoading(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, referencePoint]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSearchError(null);
      setShowSuggestions(false);
      if (!searchQuery.trim()) return;
      setSearchLoading(true);
      const ref =
        userLocation ?? searchCenter ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
      try {
        const result = await geocodeAddress(searchQuery, ref);
        if (result) {
          setSearchCenter(result);
        } else {
          setSearchError("Address not found");
        }
      } catch {
        setSearchError("Search failed");
      }
      setSearchLoading(false);
    },
    [searchQuery, userLocation, searchCenter]
  );

  const handleSelectSuggestion = useCallback((suggestion: GeocodeSuggestion) => {
    setSearchQuery(suggestion.display_name);
    setSearchCenter({ lat: suggestion.lat, lng: suggestion.lng });
    setShowSuggestions(false);
    setSearchError(null);
  }, []);

  return (
    <main className="h-screen flex flex-col bg-fta-paper">
      <header className="border-b-[3px] border-fta-black px-4 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <h1 className="text-xl font-bold uppercase tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-1">
          Spot Map
        </h1>
        <div ref={searchContainerRef} className="relative flex gap-0 flex-1 min-w-0 max-w-md">
          <form onSubmit={handleSearch} className="flex gap-0 flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null);
              }}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Address or place"
              className="flex-1 min-w-0 px-3 py-2 border-[3px] border-fta-black border-r-0 bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50 rounded-none"
              aria-label="Search address or location"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2 border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold text-sm uppercase hover:bg-fta-paper hover:border-fta-black transition-colors disabled:opacity-50 rounded-none"
            >
              {searchLoading ? "…" : "Search"}
            </button>
          </form>
          {showSuggestions && searchSuggestions.length > 0 && (
            <ul
              className="absolute top-full left-0 right-0 z-[1100] mt-0 border-[3px] border-fta-black border-t-0 bg-fta-paper max-h-60 overflow-y-auto list-none p-0 m-0"
              role="listbox"
              aria-label="Address suggestions"
            >
              {searchSuggestions.map((s, i) => (
                <li key={`${s.lat}-${s.lng}-${i}`}>
                  <button
                    type="button"
                    role="option"
                    className="w-full text-left px-3 py-2 border-b-[3px] border-fta-black last:border-b-0 font-medium text-sm text-fta-black hover:bg-fta-orange hover:text-fta-black transition-colors rounded-none"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={handleMyLocation}
            className="px-3 py-2 border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold text-sm uppercase hover:bg-fta-paper hover:border-fta-black transition-colors rounded-none"
            aria-label="Center on my location"
          >
            My location
          </button>
          <Link
            href="/"
            className="px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold text-sm uppercase hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            Home
          </Link>
          <Link
            href="/discovery"
            className="px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold text-sm uppercase hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            Discovery
          </Link>
        </div>
      </header>
      {(locationError || searchError) && (
        <p className="text-xs font-bold uppercase text-fta-black/70 px-4 py-1 border-b-[3px] border-fta-black bg-fta-paper">
          {locationError && `${locationError}. Use "My location" to try again.`}
          {locationError && searchError && " "}
          {searchError}
        </p>
      )}
      <div className="relative flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center border-[3px] border-fta-black">
            <p className="font-bold uppercase text-fta-black/70">Loading map…</p>
          </div>
        ) : (
          <MapInner
            spots={spots}
            setSpots={setSpots}
            currentUserId={currentUserId}
            initialCenter={DEFAULT_CENTER}
            initialZoom={DEFAULT_ZOOM}
            userLocation={userLocation}
            searchCenter={searchCenter}
          />
        )}
      </div>
      <p className="text-xs font-bold uppercase text-fta-black/60 px-4 py-2 border-t-[3px] border-fta-black flex-shrink-0">
        Right-click map to add a new spot · FTA Action Sports
      </p>
    </main>
  );
}
