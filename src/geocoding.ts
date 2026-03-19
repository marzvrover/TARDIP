export interface SearchResult {
  displayName: string;
  lat: number;
  lon: number;
  type: string;
}

export interface LocationInfo {
  displayName: string;
  address: Record<string, string>;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

let lastRequestTime = 0;

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = 1100 - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  const response = await throttledFetch(`${NOMINATIM_BASE}/search?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  return data.map((item: Record<string, string>) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type,
  }));
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<LocationInfo> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    zoom: '10',
    addressdetails: '1',
  });

  const response = await throttledFetch(`${NOMINATIM_BASE}/reverse?${params}`);

  if (!response.ok) {
    return { displayName: 'Unknown location', address: {} };
  }

  const data = await response.json();

  if (data.error) {
    return { displayName: 'Open ocean', address: {} };
  }

  return {
    displayName: data.display_name || 'Unknown location',
    address: data.address || {},
  };
}

export function getNearestSettlement(address: Record<string, string>): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.municipality ||
    address.county ||
    address.state ||
    address.country ||
    'Unknown'
  );
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
