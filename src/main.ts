import './style.css';
import { initGlobe, clearMarkers, placeOriginMarker, placeAntipodeMarker, drawArc, flyTo, setView, onGlobeClick, zoomIn, zoomOut } from './globe';
import { getAntipode } from './antipode';
import { searchLocation, reverseGeocode, debounce } from './geocoding';
import { getIPLocation, getCurrentLocation } from './geolocation';
import { updateInfoPanel, showSearchResults, hideSearchResults, showLoading } from './ui';

let busy = false;

async function handleLocation(lat: number, lon: number, name?: string): Promise<void> {
  if (busy) return;
  busy = true;
  showLoading(true);

  try {
    clearMarkers();

    // Reverse-geocode the origin if no name was provided
    let originName = name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    let originAddress: Record<string, string> = {};
    if (!name) {
      try {
        const originInfo = await reverseGeocode(lat, lon);
        originName = originInfo.displayName;
        originAddress = originInfo.address;
      } catch {
        // keep coordinate-based name
      }
    }

    placeOriginMarker(lat, lon, originName);

    const antipode = getAntipode({ lat, lon });

    // Reverse-geocode the antipode location
    let antipodeName = `${antipode.lat.toFixed(4)}, ${antipode.lon.toFixed(4)}`;
    let antipodeAddress: Record<string, string> = {};
    try {
      const info = await reverseGeocode(antipode.lat, antipode.lon);
      antipodeName = info.displayName;
      antipodeAddress = info.address;
    } catch {
      // keep coordinate-based name
    }

    placeAntipodeMarker(antipode.lat, antipode.lon, 'Antipode');
    drawArc(lat, lon, antipode.lat, antipode.lon);

    updateInfoPanel(
      {
        origin: { name: originName, lat, lon, address: originAddress },
        antipode: {
          name: antipodeName,
          lat: antipode.lat,
          lon: antipode.lon,
          address: antipodeAddress,
        },
      },
      (lat, lon) => flyTo(lat, lon, 8_000_000),
    );

    // Animated fly-to: zoom out → fly to antipode
    await flyTo(lat, lon, 20_000_000);
    await sleep(800);
    await flyTo(antipode.lat, antipode.lon, 8_000_000);
  } finally {
    busy = false;
    showLoading(false);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function init(): Promise<void> {
  await initGlobe('cesiumContainer');

  // --- Search ---
  const searchInput = document.getElementById('search-input') as HTMLInputElement;

  const debouncedSearch = debounce(async (query: string) => {
    if (query.length < 2) {
      hideSearchResults();
      return;
    }
    try {
      const results = await searchLocation(query);
      showSearchResults(results, (result) => {
        searchInput.value = '';
        hideSearchResults();
        handleLocation(result.lat, result.lon, result.displayName);
      });
    } catch {
      hideSearchResults();
    }
  }, 500);

  searchInput.addEventListener('input', () => {
    debouncedSearch(searchInput.value);
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#search-container')) {
      hideSearchResults();
    }
  });

  // --- Globe click ---
  onGlobeClick((lat, lon) => {
    handleLocation(lat, lon);
  });

  // --- My Location button ---
  document.getElementById('my-location-btn')!.addEventListener('click', async () => {
    showLoading(true);
    try {
      const pos = await getCurrentLocation();
      await handleLocation(pos.lat, pos.lon, 'My Location');
    } catch {
      console.warn('Could not determine location');
      showLoading(false);
    }
  });

  // --- Zoom buttons ---
  document.getElementById('zoom-in-btn')!.addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn')!.addEventListener('click', zoomOut);

  // --- Default: IP geolocation ---
  try {
    showLoading(true);
    const pos = await getIPLocation();
    await handleLocation(pos.lat, pos.lon, 'Your Location (estimated)');
  } catch {
    setView(20, 0, 25_000_000);
    showLoading(false);
  }
}

init();
