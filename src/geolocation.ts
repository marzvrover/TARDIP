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

export async function getIPLocation(): Promise<GeoPosition> {
  const response = await fetch('https://ipapi.co/json/');
  if (!response.ok) throw new Error('IP geolocation failed');
  const data = await response.json();
  if (!data.latitude || !data.longitude) throw new Error('No coordinates in IP response');
  return {
    lat: data.latitude,
    lon: data.longitude,
  };
}

export async function getCurrentLocation(): Promise<GeoPosition> {
  try {
    return await getBrowserLocation();
  } catch {
    return await getIPLocation();
  }
}
