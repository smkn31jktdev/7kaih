import { useState, useEffect, useCallback, useRef } from "react";

// --- SCHOOL COORDINATES (SMK Negeri 31 Jakarta) ---
const SCHOOL_COORDINATES = {
  latitude: -6.1819399,
  longitude: 106.8518572,
};
const MAX_RADIUS_METERS = 100;

// --- HAVERSINE DISTANCE CALCULATION ---
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- MULTI-LAYER FAKE GPS DETECTION ---

/** Layer 1: Classic heuristic - perfect accuracy with no sensor data */
const isClassicFakeGPS = (position: GeolocationPosition): boolean => {
  const { altitude, accuracy, heading, speed } = position.coords;
  if (accuracy < 5 && altitude === null && heading === null && speed === null) {
    return true;
  }
  return false;
};

/** Layer 2: Timestamp consistency check - fake GPS often has timestamp anomalies */
const isTimestampSuspicious = (position: GeolocationPosition): boolean => {
  const now = Date.now();
  const posTime = position.timestamp;
  const diff = Math.abs(now - posTime);
  // If the position timestamp is more than 30 seconds off from current time, suspicious
  if (diff > 30000) {
    return true;
  }
  return false;
};

/** Layer 3: Accuracy anomaly - Fake GPS apps often report exactly round accuracy values */
const isAccuracyAnomalous = (position: GeolocationPosition): boolean => {
  const { accuracy } = position.coords;
  // Exactly 0 accuracy is impossible in real GPS
  if (accuracy === 0) return true;
  // Suspiciously exact integer accuracy consistently (real GPS fluctuates)
  if (accuracy === 1 || accuracy === 3 || accuracy === 10) return true;
  return false;
};

/** Layer 4: WebGL renderer check for emulator/desktop spoofing */
const isEmulatorDetected = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      "WEBGL_debug_renderer_info",
    );
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL,
      );
      const rendererLower = renderer?.toLowerCase() || "";
      // Common emulator/VM renderer strings
      if (
        rendererLower.includes("swiftshader") ||
        rendererLower.includes("llvmpipe") ||
        rendererLower.includes("virtualbox") ||
        rendererLower.includes("vmware")
      ) {
        return true;
      }
    }
  } catch {
    // Ignore errors
  }
  return false;
};

export interface FakeGPSReport {
  isFake: boolean;
  reasons: string[];
}

const detectFakeGPS = (position: GeolocationPosition): FakeGPSReport => {
  const reasons: string[] = [];

  if (isClassicFakeGPS(position)) {
    reasons.push("Akurasi terlalu sempurna tanpa data sensor");
  }
  if (isTimestampSuspicious(position)) {
    reasons.push("Timestamp lokasi tidak sinkron");
  }
  if (isAccuracyAnomalous(position)) {
    reasons.push("Nilai akurasi GPS tidak wajar");
  }
  if (isEmulatorDetected()) {
    reasons.push("Terdeteksi penggunaan emulator");
  }

  return {
    isFake: reasons.length > 0,
    reasons,
  };
};

// --- END DETECTION ---

export interface GeolocationResult {
  isInsideSchoolBounds: boolean;
  locationMessage: string;
  isDevToolsOpen: boolean;
  isLoadingLocation: boolean;
  verifyLocation: () => void;
  distance: number | null;
  accuracy: number | null;
  fakeGPSReport: FakeGPSReport | null;
  coordinates: { latitude: number; longitude: number } | null;
}

export function useGeolocation(): GeolocationResult {
  const [isInsideSchoolBounds, setIsInsideSchoolBounds] =
    useState<boolean>(false);
  const [locationMessage, setLocationMessage] = useState<string>(
    "Sedang memverifikasi lokasi Anda...",
  );
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [fakeGPSReport, setFakeGPSReport] = useState<FakeGPSReport | null>(
    null,
  );
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Track previous positions for velocity check
  const prevPositionRef = useRef<{
    lat: number;
    lon: number;
    time: number;
  } | null>(null);

  // Anti-Inspect Element / DevTools Heuristic
  useEffect(() => {
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        setIsDevToolsOpen(true);
      } else {
        setIsDevToolsOpen(false);
      }
    };

    window.addEventListener("resize", detectDevTools);
    detectDevTools();

    return () => window.removeEventListener("resize", detectDevTools);
  }, []);

  const verifyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Browser Anda tidak mendukung deteksi lokasi.");
      setIsLoadingLocation(false);
      return;
    }

    if (isDevToolsOpen) {
      setLocationMessage(
        "Tolong tutup Developer Tools Anda untuk melanjutkan absen.",
      );
      setIsInsideSchoolBounds(false);
      setIsLoadingLocation(false);
      return;
    }

    setIsLoadingLocation(true);
    setLocationMessage("Mencari titik koordinat Anda...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Multi-layer fake GPS detection
        const report = detectFakeGPS(position);

        // Layer 5: Velocity check - if teleporting > 1000 km/h from last position
        if (prevPositionRef.current) {
          const timeDiff =
            (position.timestamp - prevPositionRef.current.time) / 1000; // seconds
          if (timeDiff > 0) {
            const dist = calculateDistance(
              prevPositionRef.current.lat,
              prevPositionRef.current.lon,
              position.coords.latitude,
              position.coords.longitude,
            );
            const speedKmH = (dist / 1000 / timeDiff) * 3600;
            if (speedKmH > 1000) {
              report.isFake = true;
              report.reasons.push(
                "Perpindahan lokasi terlalu cepat (teleportasi terdeteksi)",
              );
            }
          }
        }

        prevPositionRef.current = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          time: position.timestamp,
        };

        if (report.isFake) {
          setFakeGPSReport(report);
          setLocationMessage(
            `🚫 Terdeteksi Lokasi Palsu: ${report.reasons[0]}. Matikan aplikasi Fake GPS Anda.`,
          );
          setIsInsideSchoolBounds(false);
          setIsLoadingLocation(false);
          setCoordinates(null);
          return;
        }

        setFakeGPSReport(null);
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);

        const dist = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          SCHOOL_COORDINATES.latitude,
          SCHOOL_COORDINATES.longitude,
        );
        setDistance(dist);

        if (dist <= MAX_RADIUS_METERS) {
          setIsInsideSchoolBounds(true);
          setLocationMessage(
            `Lokasi Valid! Jarak: ${Math.round(dist)}m dari sekolah. (Akurasi: ±${Math.round(position.coords.accuracy)}m)`,
          );
        } else {
          setIsInsideSchoolBounds(false);
          setLocationMessage(
            `Anda di luar area sekolah. Jarak: ${Math.round(dist)}m (Akurasi: ±${Math.round(position.coords.accuracy)}m)`,
          );
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            "Izin akses lokasi ditolak. Aktifkan GPS dan beri izin browser.",
          );
        } else {
          setLocationMessage(
            "Gagal mendapatkan lokasi Anda. Pastikan sinyal GPS optimal.",
          );
        }
        setIsInsideSchoolBounds(false);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [isDevToolsOpen]);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  return {
    isInsideSchoolBounds,
    locationMessage,
    isDevToolsOpen,
    isLoadingLocation,
    verifyLocation,
    distance,
    accuracy,
    fakeGPSReport,
    coordinates,
  };
}
