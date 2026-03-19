import './style.css';
import { initGlobe, clearMarkers, placeOriginMarker, placeAntipodeMarker, drawArc, flyTo, flyAlongArc, setView, onGlobeClick, zoomIn, zoomOut, toggleLayer } from './globe';
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

    // Animated fly-to: follow the arc from origin to antipode
    await flyAlongArc(lat, lon, antipode.lat, antipode.lon, 8_000_000);
  } finally {
    busy = false;
    showLoading(false);
  }
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
      await handleLocation(pos.lat, pos.lon);
    } catch {
      console.warn('Could not determine location');
      showLoading(false);
    }
  });

  // --- Zoom buttons ---
  document.getElementById('zoom-in-btn')!.addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn')!.addEventListener('click', zoomOut);

  // --- Layer toggle ---
  document.getElementById('layer-toggle-btn')!.addEventListener('click', () => {
    const isSatellite = toggleLayer();
    document.getElementById('layer-icon-satellite')!.style.display = isSatellite ? 'none' : 'block';
    document.getElementById('layer-icon-map')!.style.display = isSatellite ? 'block' : 'none';
  });

  // --- Info panel toggle ---
  document.getElementById('info-panel-toggle')!.addEventListener('click', () => {
    document.getElementById('info-panel')!.classList.toggle('collapsed');
  });

  // --- Default: IP geolocation ---
  try {
    showLoading(true);
    const pos = await getIPLocation();
    await handleLocation(pos.lat, pos.lon);
  } catch {
    setView(20, 0, 25_000_000);
    showLoading(false);
  }
}

init();
