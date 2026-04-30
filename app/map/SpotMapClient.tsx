"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { GestureHandling } from "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BrandLogoFullLink, BRAND_LOGO_MAP_HEADER_CLASS } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";
import type { SpotWithStats, SpotDetail } from "@/lib/types/database";
import type { MembershipTier } from "@/lib/types/database";
import { SPORT_OPTIONS, SPOT_STYLE_OPTIONS_BY_SPORT, getSpotTypeLabel } from "@/lib/types/database";
import { useGeofence } from "@/hooks/useGeofence";
import { haversineDistanceKm } from "@/lib/utils/geo";
import {
  getSpotsWithStats,
  getSpotDetail,
  getTrendHeatData,
  getActiveRidersCountForSpot,
  createSpot,
  createCheckIn,
  updateGhostMode,
} from "./actions";

L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);

const SPOT_SPORTS = SPORT_OPTIONS.map((o) => o.name);

/** Combined snow/ski filter value (spots can be either sport) */
const MAP_FILTER_SNOW_SKI = "Snowboard_Skiing";

/** Sport filter options for map: All sports + each sport (Snowboard & Skiing combined as one option) */
const MAP_SPORT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All sports" },
  ...SPORT_OPTIONS.filter((o) => o.name !== "Skiing").map((o) =>
    o.name === "Snowboard"
      ? { value: MAP_FILTER_SNOW_SKI, label: "Snow" }
      : { value: o.name, label: o.name }
  ),
];

/** 10 miles in km for radius check (spot poaching prevention) */
const RADIUS_KM = 10 * 1.60934;

/**
 * Optional override for local testing: ?mapGestures=desktop | touch | auto
 * (persists in sessionStorage). Use when Chrome Device Mode spoofs mobile UA.
 */
function getMapGesturesOverride(): "desktop" | "touch" | null {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search).get("mapGestures");
    if (q === "desktop" || q === "touch") {
      sessionStorage.setItem("fta_mapGestures", q);
      return q;
    }
    if (q === "auto") {
      sessionStorage.removeItem("fta_mapGestures");
      return null;
    }
  } catch {
    /* ignore */
  }
  try {
    const s = sessionStorage.getItem("fta_mapGestures");
    if (s === "desktop" || s === "touch") return s;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Split mobile UI from gesture policy:
 * - mobileMapUx: layout (sheet, bottom nav) for narrow viewports or mobile UA.
 * - cooperativeGestures: currently disabled to prioritize one-finger panning precision.
 */
function getMapInteractionProfile(): {
  mobileMapUx: boolean;
  cooperativeGestures: boolean;
} {
  if (typeof window === "undefined") {
    return { mobileMapUx: false, cooperativeGestures: false };
  }

  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const ua = navigator.userAgent ?? "";
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touchCapable =
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;
  const mobileDevice = mobileUa && touchCapable;

  /** True if any input is a fine pointer (mouse/trackpad). Stays true in DevTools mobile emulation. */
  const hasAnyFinePointer = window.matchMedia("(any-pointer: fine)").matches;

  const override = getMapGesturesOverride();
  let cooperativeGestures = false;
  if (override === "touch") cooperativeGestures = true;
  if (override === "desktop") cooperativeGestures = false;
  if (!override && (mobileDevice || hasAnyFinePointer)) cooperativeGestures = false;

  return {
    mobileMapUx: narrow || mobileDevice,
    cooperativeGestures,
  };
}

/** Spot Hub: leaderboard this month, sponsors, who's here (permission + radius + ghost). No clips. */
function SpotHub({
  spotDetail,
  currentUserId,
  viewerTier,
  userLocation,
  onCheckIn,
  onClose,
  embedded,
  loadingDetails = false,
}: {
  spotDetail: SpotDetail;
  currentUserId: string | null;
  viewerTier: MembershipTier;
  userLocation: { lat: number; lng: number } | null;
  onCheckIn: () => void;
  onClose: () => void;
  embedded?: boolean;
  loadingDetails?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [liveRidersCount, setLiveRidersCount] = useState(spotDetail.active_now);

  useEffect(() => {
    setLiveRidersCount(spotDetail.active_now);
  }, [spotDetail.id, spotDetail.active_now]);

  useEffect(() => {
    const supabase = createClient();
    const sid = spotDetail.id;
    const refreshCount = () => {
      getActiveRidersCountForSpot(sid).then(setLiveRidersCount);
    };
    refreshCount();
    const channel = supabase
      .channel(`check_ins_spot_${sid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "check_ins", filter: `spot_id=eq.${sid}` },
        () => {
          refreshCount();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [spotDetail.id]);

  const isCheckedIn = !!currentUserId && spotDetail.recent_check_ins.some((c) => c.user_id === currentUserId);
  const within10Miles = userLocation
    ? haversineDistanceKm(userLocation, { lat: spotDetail.lat, lng: spotDetail.lng }) <= RADIUS_KM
    : false;
  const canSeeNames =
    (viewerTier === "free" && isCheckedIn) ||
    (viewerTier === "pro" && within10Miles) ||
    viewerTier === "brand";

  const visibleCheckIns = useMemo(() => {
    if (!canSeeNames) return [];
    return spotDetail.recent_check_ins.filter((u) => !u.ghost_mode);
  }, [canSeeNames, spotDetail.recent_check_ins]);

  const visibleLeaderboard = useMemo(() => {
    return spotDetail.leaderboard_this_month.filter((e) => !e.ghost_mode);
  }, [spotDetail.leaderboard_this_month]);

  async function handleCheckIn() {
    if (!currentUserId || isCheckedIn) return;
    setLoading(true);
    const result = await createCheckIn(spotDetail.id);
    setLoading(false);
    if (!result.error) onCheckIn();
  }

  return (
    <div
      className={
        embedded
          ? "border-[3px] border-fta-black bg-fta-paper p-6 rounded-none max-h-[80vh] overflow-y-auto"
          : "absolute bottom-4 left-4 right-4 z-[1000] border-[3px] border-fta-black bg-fta-paper p-6 rounded-none max-h-[80vh] overflow-y-auto"
      }
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-fta-black">{spotDetail.name}</h2>
          <span className="inline-block mt-1 px-2 py-1 border-2 border-fta-black bg-fta-orange text-fta-black text-xs font-bold uppercase">
            {spotDetail.sport} · {getSpotTypeLabel(spotDetail.sport, spotDetail.type)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loadingDetails && (
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-fta-black/70">
              <span className="inline-block h-2 w-2 bg-fta-orange animate-pulse" aria-hidden />
              Loading
            </span>
          )}
          <button type="button" onClick={onClose} className="text-fta-black font-bold hover:text-fta-orange" aria-label="Close">
            ×
          </button>
        </div>
      </div>
      <p className="text-sm font-bold uppercase tracking-wide text-fta-black mb-3" aria-live="polite">
        <span className="text-fta-orange" aria-hidden>
          ●
        </span>{" "}
        {liveRidersCount} RIDERS HERE
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border-[3px] border-fta-black p-2">
          <p className="text-xs font-bold uppercase text-fta-black/70">Active now</p>
          <p className="text-xl font-bold uppercase text-fta-black">{liveRidersCount}</p>
        </div>
        <div className="border-[3px] border-fta-black p-2">
          <p className="text-xs font-bold uppercase text-fta-black/70">Weekly average</p>
          <p className="text-xl font-bold uppercase text-fta-black">{spotDetail.weekly_avg}</p>
        </div>
      </div>
      {spotDetail.heating_up && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 border-[3px] border-fta-orange bg-fta-orange text-fta-black">
          <span className="inline-block w-2 h-2 bg-fta-black animate-pulse" aria-hidden />
          <span className="text-sm font-bold uppercase tracking-wide">HEATING UP</span>
        </div>
      )}
      {spotDetail.description && <p className="text-sm text-fta-black/80 mb-4">{spotDetail.description}</p>}

      {/* Live Leaderboard: this month */}
      <div className="border-[3px] border-fta-black p-3 mb-4">
        <p className="text-xs font-bold uppercase text-fta-black/70 mb-2">Leaderboard this month</p>
        {visibleLeaderboard.length > 0 ? (
          <ul className="list-none p-0 m-0 space-y-1">
            {visibleLeaderboard.slice(0, 10).map((entry, i) => (
              <li key={entry.user_id} className="flex items-center gap-2">
                <span className="text-fta-orange font-bold w-5">{i + 1}.</span>
                {entry.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={entry.avatar_url} alt="" className="w-6 h-6 border-2 border-fta-black object-cover" />
                ) : (
                  <span className="w-6 h-6 border-2 border-fta-black bg-fta-paper flex items-center justify-center text-[10px] font-bold">
                    {(entry.display_name ?? "?")[0]}
                  </span>
                )}
                <span className="font-medium text-fta-black truncate">{entry.display_name ?? "Athlete"}</span>
                <span className="text-xs text-fta-black/70 ml-auto">{entry.check_ins_this_month} check-ins</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-fta-black/60">No check-ins this month yet.</p>
        )}
      </div>

      {/* Sponsor presence */}
      {spotDetail.sponsors.length > 0 && (
        <div className="border-[3px] border-fta-black p-3 mb-4">
          <p className="text-xs font-bold uppercase text-fta-black/70 mb-2">Sponsors</p>
          <div className="flex flex-wrap gap-2 items-center">
            {spotDetail.sponsors.map((s) => (
              <div
                key={s.brand_id}
                className="flex items-center gap-2 px-2 py-1 border-2 border-fta-black bg-fta-paper"
                title={s.display_name ?? "Brand"}
              >
                {s.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={s.avatar_url} alt="" className="w-8 h-8 object-cover border-2 border-fta-black" />
                ) : (
                  <span className="w-8 h-8 border-2 border-fta-black bg-fta-paper flex items-center justify-center text-xs font-bold">
                    {(s.display_name ?? "B")[0]}
                  </span>
                )}
                <span className="text-xs font-bold uppercase truncate max-w-[100px]">{s.display_name ?? "Brand"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={loading || !currentUserId || isCheckedIn}
          className="px-4 py-2 border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold uppercase text-sm hover:bg-fta-paper hover:border-fta-black transition-colors disabled:opacity-50 rounded-none"
        >
          {isCheckedIn ? "CHECKED IN" : "CHECK IN"}
        </button>
        {liveRidersCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold uppercase text-fta-black/70">Who&apos;s here:</span>
            {canSeeNames ? (
              visibleCheckIns.length > 0 ? (
                <div className="flex -space-x-2">
                  {visibleCheckIns.slice(0, 8).map((u) => (
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
              ) : (
                <span className="text-xs text-fta-black/60">Count only (ghost or outside radius)</span>
              )
            ) : (
              <span className="text-xs text-fta-black/60">
                {liveRidersCount} active — {viewerTier === "free" ? "check in to see who" : "move within 10 mi to see names"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpotDialog({
  open,
  mobile,
  onClose,
  children,
}: {
  open: boolean;
  mobile: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close spot dialog"
        onClick={onClose}
        className="absolute inset-0 bg-fta-black/50"
      />
      {mobile ? (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="max-h-[90vh] overflow-hidden border-[3px] border-fta-black bg-white text-black shadow-[6px_6px_0_0_#000]">
            {children}
          </div>
        </div>
      ) : (
        <div className="absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4">
          <div className="max-h-[90vh] overflow-hidden border-[3px] border-fta-black bg-white text-black shadow-[8px_8px_0_0_#000]">
            {children}
          </div>
        </div>
      )}
    </div>,
    document.body
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
        className="w-full min-w-0 px-3 py-2 border-2 md:border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium text-left flex items-center justify-between gap-2 rounded-none min-h-[44px]"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <span className="text-fta-orange font-bold shrink-0" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-[1100] w-full mt-0 border-2 md:border-[3px] border-t-0 border-fta-black bg-fta-paper rounded-none max-h-48 overflow-y-auto"
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
              className={`px-3 py-3 min-h-[44px] flex items-center border-b-2 md:border-b-[3px] border-fta-black last:border-b-0 font-medium cursor-pointer rounded-none ${
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

const LONG_PRESS_MS = 550;

/**
 * Add Spot gesture handler:
 * - Double tap / double click anywhere on the map.
 * - Long press on touch devices as fallback.
 * Marker taps remain normal click events and still open SpotHub immediately.
 */
function MapAddSpotGestureHandler({
  onAddSpot,
}: {
  onAddSpot: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLongPressTimer() {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  useEffect(() => {
    const handleDblClick = (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      onAddSpot(e.latlng.lat, e.latlng.lng);
    };
    const handleTouchStart = (e: L.LeafletMouseEvent) => {
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        onAddSpot(e.latlng.lat, e.latlng.lng);
      }, LONG_PRESS_MS);
    };
    const cancelLongPress = () => {
      clearLongPressTimer();
    };

    map.on("dblclick", handleDblClick);
    map.on("touchstart", handleTouchStart as L.LeafletEventHandlerFn);
    map.on("touchmove", cancelLongPress as L.LeafletEventHandlerFn);
    map.on("touchend", cancelLongPress as L.LeafletEventHandlerFn);

    return () => {
      map.off("dblclick", handleDblClick);
      map.off("touchstart", handleTouchStart as L.LeafletEventHandlerFn);
      map.off("touchmove", cancelLongPress as L.LeafletEventHandlerFn);
      map.off("touchend", cancelLongPress as L.LeafletEventHandlerFn);
      clearLongPressTimer();
    };
  }, [map, onAddSpot]);

  return null;
}

/** Keeps leaflet-gesture-handling in sync when resizing between mobile and desktop. */
function SyncGestureHandling({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    const m = map as L.Map & { gestureHandling?: { enable: () => void; disable: () => void } };
    if (enabled) m.gestureHandling?.enable?.();
    else m.gestureHandling?.disable?.();
    return () => m.gestureHandling?.disable?.();
  }, [map, enabled]);
  return null;
}

/** Ensure Leaflet tap handler is enabled on touch devices for responsive marker taps. */
function EnsureTapEnabled() {
  const map = useMap();
  useEffect(() => {
    const m = map as L.Map & { tap?: { enable: () => void } };
    m.tap?.enable?.();
  }, [map]);
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
        haversineDistanceKm(near, { lat: a.lat, lng: a.lng }) -
        haversineDistanceKm(near, { lat: b.lat, lng: b.lng })
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

type TrendHeatPoint = { spot_id: string; lat: number; lng: number; count: number };

function MapInner({
  spots,
  setSpots,
  currentUserId,
  viewerTier,
  initialCenter,
  initialZoom,
  userLocation,
  searchCenter,
  trendHeatData,
  showTrendOverlay,
  showAddSpotHint,
}: {
  spots: SpotWithStats[];
  setSpots: (s: SpotWithStats[] | ((prev: SpotWithStats[]) => SpotWithStats[])) => void;
  currentUserId: string | null;
  viewerTier: MembershipTier;
  initialCenter: [number, number];
  initialZoom: number;
  userLocation: { lat: number; lng: number } | null;
  searchCenter: { lat: number; lng: number } | null;
  trendHeatData: TrendHeatPoint[];
  showTrendOverlay: boolean;
  showAddSpotHint: boolean;
}) {
  const [selectedSpot, setSelectedSpot] = useState<SpotWithStats | null>(null);
  const [spotDetail, setSpotDetail] = useState<SpotDetail | null>(null);
  const [addSpotCoords, setAddSpotCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [{ mobileMapUx, cooperativeGestures }, setMapProfile] = useState(() => getMapInteractionProfile());

  useEffect(() => {
    function update() {
      setMapProfile(getMapInteractionProfile());
    }
    update();

    const mqNarrow = window.matchMedia("(max-width: 767px)");
    const mqAnyFine = window.matchMedia("(any-pointer: fine)");
    const mqPointer = window.matchMedia("(pointer: coarse)");
    const mqAnyPointer = window.matchMedia("(any-pointer: coarse)");

    mqNarrow.addEventListener("change", update);
    mqAnyFine.addEventListener("change", update);
    mqPointer.addEventListener("change", update);
    mqAnyPointer.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      mqNarrow.removeEventListener("change", update);
      mqAnyFine.removeEventListener("change", update);
      mqPointer.removeEventListener("change", update);
      mqAnyPointer.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!selectedSpot) {
      setSpotDetail(null);
      return;
    }
    let cancelled = false;
    getSpotDetail(selectedSpot.id).then((detail) => {
      if (!cancelled && detail) setSpotDetail(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSpot]);

  const displaySpotDetail = useMemo<SpotDetail | null>(() => {
    if (spotDetail) return spotDetail;
    if (!selectedSpot) return null;
    return {
      ...selectedSpot,
      leaderboard_this_month: [],
      sponsors: [],
    };
  }, [spotDetail, selectedSpot]);

  const refreshSpots = useCallback(async () => {
    const next = await getSpotsWithStats();
    setSpots(next);
    if (selectedSpot) {
      const updated = next.find((s) => s.id === selectedSpot.id);
      if (updated) setSelectedSpot(updated);
      if (spotDetail) {
        const detail = await getSpotDetail(selectedSpot.id);
        if (detail) setSpotDetail(detail);
      }
    }
  }, [selectedSpot, spotDetail, setSpots]);

  const handleCheckIn = useCallback(() => {
    refreshSpots();
  }, [refreshSpots]);

  const geofenceSpots = useMemo(
    () => spots.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, radius_meters: s.radius_meters })),
    [spots]
  );
  useGeofence({ enabled: !!currentUserId, spots: geofenceSpots, onSessionChange: refreshSpots });

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
        className="map-container absolute inset-0 h-full w-full"
        dragging
        touchZoom="center"
        doubleClickZoom={false}
        scrollWheelZoom={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <EnsureTapEnabled />
        <SyncGestureHandling enabled={cooperativeGestures} />
        <LocateUser userLocation={userLocation} zoom={initialZoom} />
        <FlyToSearch searchCenter={searchCenter} zoom={initialZoom} />
        <MapAddSpotGestureHandler onAddSpot={(lat, lng) => setAddSpotCoords({ lat, lng })} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
        )}
        {searchCenter && (
          <Marker position={[searchCenter.lat, searchCenter.lng]} icon={searchResultIcon} />
        )}
        {showTrendOverlay && trendHeatData.length > 0 &&
          trendHeatData.map((p) => {
            const maxCount = Math.max(...trendHeatData.map((d) => d.count), 1);
            const radius = 8 + (24 * p.count) / maxCount;
            return (
              <CircleMarker
                key={p.spot_id}
                center={[p.lat, p.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: "#FF5F1F",
                  color: "#000",
                  weight: 2,
                  fillOpacity: 0.4,
                  opacity: 0.8,
                }}
                eventHandlers={{ click: () => {} }}
              />
            );
          })}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={orangeIcon}
            eventHandlers={{
              click: () => setSelectedSpot(spot),
            }}
          >
            {!mobileMapUx && (
              <Tooltip
                direction="top"
                offset={[0, -14]}
                opacity={1}
                className="fta-spot-tooltip"
              >
                <div className="min-w-[200px] max-w-[320px] border-0">
                  <p className="font-bold text-fta-black text-sm uppercase tracking-tight px-3 pt-2 pb-1 border-b-2 border-fta-orange break-words">
                    {spot.name}
                  </p>
                  <p className="text-xs font-bold text-fta-black/80 uppercase px-3 py-1 break-words">
                    {spot.sport} · {getSpotTypeLabel(spot.sport, spot.type)}
                  </p>
                  {spot.description && (
                    <p className="text-xs text-fta-black/70 px-3 pb-2 break-words whitespace-normal max-h-[6.5rem] overflow-y-auto">
                      {spot.description}
                    </p>
                  )}
                  {(spot.active_now > 0 || spot.weekly_avg > 0 || !spot.description) && (
                    <p className="text-xs font-bold text-fta-black/60 uppercase px-3 pb-2 break-words">
                      {spot.active_now > 0 && `Active now: ${spot.active_now}`}
                      {spot.active_now > 0 && spot.weekly_avg > 0 && " · "}
                      {spot.weekly_avg > 0 && `Weekly avg: ${spot.weekly_avg}`}
                      {!spot.description && spot.active_now === 0 && spot.weekly_avg === 0 && "Click for details"}
                    </p>
                  )}
                </div>
              </Tooltip>
            )}
          </Marker>
        ))}
      </MapContainer>
      {showAddSpotHint && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[1001] -translate-x-1/2 border-[3px] border-fta-black bg-fta-paper px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-fta-black">Double-tap to add a spot</p>
        </div>
      )}

      <SpotDialog
        open={!!selectedSpot}
        mobile={mobileMapUx}
        onClose={() => {
          setSelectedSpot(null);
          setSpotDetail(null);
        }}
      >
        {displaySpotDetail ? (
          <SpotHub
            spotDetail={displaySpotDetail}
            currentUserId={currentUserId}
            viewerTier={viewerTier}
            userLocation={userLocation}
            loadingDetails={!spotDetail}
            onCheckIn={handleCheckIn}
            onClose={() => {
              setSelectedSpot(null);
              setSpotDetail(null);
            }}
            embedded
          />
        ) : null}
      </SpotDialog>

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

export default function SpotMapClient({
  currentUserId: initialCurrentUserId,
  viewerTier,
  viewerGhostMode,
}: {
  currentUserId: string | null;
  viewerTier: MembershipTier;
  viewerGhostMode: boolean;
}) {
  const [spots, setSpots] = useState<SpotWithStats[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId ?? null);
  const [ghostMode, setGhostMode] = useState(viewerGhostMode);
  const [ghostLoading, setGhostLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendOverlayOn, setTrendOverlayOn] = useState(false);
  const [trendHeatData, setTrendHeatData] = useState<{ spot_id: string; lat: number; lng: number; count: number }[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [sportFilter, setSportFilter] = useState("");
  const [showAddSpotHint, setShowAddSpotHint] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredSpots = useMemo(() => {
    if (!sportFilter) return spots;
    if (sportFilter === MAP_FILTER_SNOW_SKI)
      return spots.filter((s) => s.sport === "Snowboard" || s.sport === "Skiing");
    return spots.filter((s) => s.sport === sportFilter);
  }, [spots, sportFilter]);

  const handleTrendOverlayToggle = useCallback(async () => {
    if (viewerTier !== "brand") return;
    const next = !trendOverlayOn;
    setTrendOverlayOn(next);
    if (next) {
      setTrendLoading(true);
      const data = await getTrendHeatData();
      setTrendHeatData(data);
      setTrendLoading(false);
    } else {
      setTrendHeatData([]);
    }
  }, [viewerTier, trendOverlayOn]);

  useEffect(() => {
    setCurrentUserId(initialCurrentUserId ?? null);
  }, [initialCurrentUserId]);
  useEffect(() => {
    setGhostMode(viewerGhostMode);
  }, [viewerGhostMode]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? initialCurrentUserId ?? null);
    });
  }, [initialCurrentUserId]);

  useEffect(() => {
    getSpotsWithStats().then((s) => {
      setSpots(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "fta_map_add_spot_hint_seen_v1";
    if (window.localStorage.getItem(key) === "1") return;
    setShowAddSpotHint(true);
    const timer = setTimeout(() => {
      setShowAddSpotHint(false);
      window.localStorage.setItem(key, "1");
    }, 3600);
    return () => clearTimeout(timer);
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
    <main className="h-full flex flex-col bg-fta-paper min-h-0">
      <header className="border-b-2 md:border-b-[3px] border-fta-black px-4 py-3 flex flex-col gap-3 flex-shrink-0 md:flex-row md:items-center md:justify-between md:flex-wrap md:gap-2">
        <div className="w-full md:w-auto shrink-0 pb-1 border-b-2 md:border-b-[3px] border-fta-orange">
          <BrandLogoFullLink
            href="/"
            priority
            className="!inline-block"
            logoClassName={BRAND_LOGO_MAP_HEADER_CLASS}
          />
          <span className="sr-only">Spot Map</span>
        </div>
        <div ref={searchContainerRef} className="relative flex gap-0 w-full min-w-0 md:flex-1 md:max-w-md order-2 md:order-none">
          <form onSubmit={handleSearch} className="flex gap-0 flex-1 min-w-0 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null);
              }}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Address or place"
              className="flex-1 min-w-0 px-3 py-2.5 border-2 md:border-[3px] border-fta-black border-r-0 bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50 rounded-none text-base"
              aria-label="Search address or location"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2.5 min-h-[44px] border-2 md:border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold text-sm uppercase hover:bg-fta-paper hover:border-fta-black transition-colors disabled:opacity-50 rounded-none"
            >
              {searchLoading ? "…" : "Search"}
            </button>
          </form>
          {showSuggestions && searchSuggestions.length > 0 && (
            <ul
              className="absolute top-full left-0 right-0 z-[1100] mt-0 border-2 md:border-[3px] border-fta-black border-t-0 bg-fta-paper max-h-60 overflow-y-auto list-none p-0 m-0"
              role="listbox"
              aria-label="Address suggestions"
            >
              {searchSuggestions.map((s, i) => (
                <li key={`${s.lat}-${s.lng}-${i}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="w-full text-left px-3 py-3 min-h-[44px] border-b-2 md:border-b-[3px] border-fta-black last:border-b-0 font-medium text-sm text-fta-black hover:bg-fta-orange hover:text-fta-black transition-colors rounded-none"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full min-w-0 md:w-auto order-3 md:order-none">
          {viewerTier === "brand" && (
            <button
              type="button"
              onClick={handleTrendOverlayToggle}
              disabled={trendLoading}
              className={`min-h-[44px] px-3 py-2 border-2 md:border-[3px] font-bold text-sm uppercase rounded-none transition-colors ${
                trendOverlayOn
                  ? "border-fta-orange bg-fta-orange text-fta-black"
                  : "border-fta-black bg-fta-paper text-fta-black hover:bg-fta-orange hover:border-fta-orange"
              }`}
              aria-pressed={trendOverlayOn}
              aria-label={trendOverlayOn ? "Trend overlay on (30-day heat)" : "Show trend overlay"}
            >
              {trendLoading ? "…" : trendOverlayOn ? "Trend on" : "Trend overlay"}
            </button>
          )}
          {viewerTier === "pro" && (
            <button
              type="button"
              onClick={async () => {
                setGhostLoading(true);
                const result = await updateGhostMode(!ghostMode);
                setGhostLoading(false);
                if (!result.error) setGhostMode(!ghostMode);
              }}
              disabled={ghostLoading}
              className={`min-h-[44px] px-3 py-2 border-2 md:border-[3px] font-bold text-sm uppercase rounded-none transition-colors ${
                ghostMode
                  ? "border-fta-orange bg-fta-orange text-fta-black"
                  : "border-fta-black bg-fta-paper text-fta-black hover:bg-fta-orange hover:border-fta-orange"
              }`}
              aria-pressed={ghostMode}
              aria-label={ghostMode ? "Go Ghost on (hide name from others)" : "Go Ghost off"}
            >
              {ghostMode ? "Ghost on" : "Go Ghost"}
            </button>
          )}
          <button
            type="button"
            onClick={handleMyLocation}
            className="min-h-[44px] px-3 py-2 border-2 md:border-[3px] border-fta-orange bg-fta-orange text-fta-black font-bold text-sm uppercase hover:bg-fta-paper hover:border-fta-black transition-colors rounded-none shrink-0"
            aria-label="Center on my location"
          >
            My location
          </button>
          <div className="min-w-0 flex-1 md:flex-none md:min-w-[140px]" aria-labelledby="map-sport-filter-label">
            <span id="map-sport-filter-label" className="sr-only">
              Filter spots by sport
            </span>
            <ThemeDropdown
              id="map-sport-filter"
              labelId="map-sport-filter-label"
              options={MAP_SPORT_FILTER_OPTIONS}
              value={sportFilter}
              onChange={setSportFilter}
              placeholder="All sports"
            />
          </div>
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
            spots={filteredSpots}
            setSpots={setSpots}
            currentUserId={currentUserId}
            viewerTier={viewerTier}
            initialCenter={DEFAULT_CENTER}
            initialZoom={DEFAULT_ZOOM}
            userLocation={userLocation}
            searchCenter={searchCenter}
            trendHeatData={trendHeatData}
            showTrendOverlay={viewerTier === "brand" && trendOverlayOn}
            showAddSpotHint={showAddSpotHint}
          />
        )}
      </div>
    </main>
  );
}
