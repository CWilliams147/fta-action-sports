"use client";

import { useEffect, useRef } from "react";
import { haversineDistanceMeters } from "@/lib/utils/geo";
import { handleCheckIn, handleCheckOut, getMyActiveSpotIds } from "@/app/map/actions";

const EXIT_BUFFER_M = 10;

export type GeofenceSpot = {
  id: string;
  lat: number;
  lng: number;
  radius_meters?: number;
};

export function useGeofence(opts: {
  enabled: boolean;
  spots: GeofenceSpot[];
  onSessionChange?: () => void;
}) {
  const { enabled, spots, onSessionChange } = opts;
  const onSessionChangeRef = useRef(onSessionChange);
  onSessionChangeRef.current = onSessionChange;
  const activeSpotsRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getMyActiveSpotIds().then((ids) => {
      if (!cancelled) activeSpotsRef.current = new Set(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    const onPosition = (pos: GeolocationPosition) => {
      const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      for (const spot of spots) {
        const r = spot.radius_meters ?? 50;
        const d = haversineDistanceMeters(user, { lat: spot.lat, lng: spot.lng });
        const inside = d < r;
        const outside = d > r + EXIT_BUFFER_M;
        const id = spot.id;
        const inSet = activeSpotsRef.current.has(id);

        if (inside && !inSet && !pendingRef.current.has(`in:${id}`)) {
          pendingRef.current.add(`in:${id}`);
          void handleCheckIn(id).then((res) => {
            pendingRef.current.delete(`in:${id}`);
            if (!res?.error) {
              activeSpotsRef.current.add(id);
              onSessionChangeRef.current?.();
            }
          });
        } else if (outside && inSet && !pendingRef.current.has(`out:${id}`)) {
          pendingRef.current.add(`out:${id}`);
          void handleCheckOut(id).then((res) => {
            pendingRef.current.delete(`out:${id}`);
            if (!res?.error) {
              activeSpotsRef.current.delete(id);
              onSessionChangeRef.current?.();
            }
          });
        }
      }
    };

    const watchId = navigator.geolocation.watchPosition(onPosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 60_000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, spots]);
}
