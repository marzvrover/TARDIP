export interface GeoPosition {
  lat: number;
  lon: number;
}

export function getBrowserLocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function parseLatLon(d: Record<string, unknown>): GeoPosition {
  return { lat: d.latitude as number, lon: d.longitude as number };
}

export async function getIPLocation(): Promise<GeoPosition> {
  // Try primary service first, then fall back to a secondary one.
  // A 5-second timeout prevents indefinite hangs when a service is
  // blocked by iOS Safari's Intelligent Tracking Prevention (ITP).
  const services = [
    {
      url: 'https://ipapi.co/json/',
      check: (d: Record<string, unknown>) => d.latitude != null && d.longitude != null,
    },
    {
      url: 'https://ipwho.is/',
      check: (d: Record<string, unknown>) => d.success === true && d.latitude != null && d.longitude != null,
    },
  ];

  let lastError: unknown;
  for (const service of services) {
    try {
      const response = await fetchWithTimeout(service.url, 5000);
      if (!response.ok) throw new Error('IP geolocation failed');
      const data = (await response.json()) as Record<string, unknown>;
      if (!service.check(data)) throw new Error('No coordinates in IP response');
      return parseLatLon(data);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('IP geolocation failed');
}

export async function getCurrentLocation(): Promise<GeoPosition> {
  try {
    return await getBrowserLocation();
  } catch {
    return await getIPLocation();
  }
}
