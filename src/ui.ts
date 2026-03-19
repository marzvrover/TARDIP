import type { SearchResult } from './geocoding';
import type { Coordinates } from './antipode';
import { formatCoords, surfaceDistance } from './antipode';
import { getNearestSettlement } from './geocoding';

export function updateInfoPanel(data: {
  origin: { name: string; lat: number; lon: number };
  antipode: {
    name: string;
    lat: number;
    lon: number;
    address: Record<string, string>;
  };
}): void {
  const panel = document.getElementById('info-panel')!;
  const content = document.getElementById('info-content')!;

  const o: Coordinates = { lat: data.origin.lat, lon: data.origin.lon };
  const a: Coordinates = { lat: data.antipode.lat, lon: data.antipode.lon };
  const dist = surfaceDistance(o, a);
  const nearest = getNearestSettlement(data.antipode.address);

  content.innerHTML = `
    <div class="location-section origin-section">
      <div class="section-header">
        <span class="dot origin-dot"></span>
        <h3>Origin</h3>
      </div>
      <p class="location-name">${escapeHtml(data.origin.name)}</p>
      <p class="location-coords">${formatCoords(data.origin.lat, data.origin.lon)}</p>
    </div>
    <div class="divider"></div>
    <div class="location-section antipode-section">
      <div class="section-header">
        <span class="dot antipode-dot"></span>
        <h3>Antipode</h3>
      </div>
      <p class="location-name">${escapeHtml(data.antipode.name)}</p>
      <p class="location-coords">${formatCoords(data.antipode.lat, data.antipode.lon)}</p>
      <p class="nearest">Nearest place: <strong>${escapeHtml(nearest)}</strong></p>
    </div>
    <div class="divider"></div>
    <div class="distance-section">
      <p>Surface distance: <strong>${formatNumber(dist)} km</strong></p>
      <p>Through Earth: <strong>${formatNumber(12_742)} km</strong> (diameter)</p>
    </div>
  `;

  panel.classList.add('visible');
}

export function showSearchResults(
  results: SearchResult[],
  onSelect: (result: SearchResult) => void,
): void {
  const container = document.getElementById('search-results')!;
  container.innerHTML = '';

  if (results.length === 0) {
    const item = document.createElement('div');
    item.className = 'search-result-item no-results';
    item.textContent = 'No results found';
    container.appendChild(item);
    container.classList.add('visible');
    return;
  }

  for (const result of results) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.textContent = result.displayName;
    item.addEventListener('click', () => onSelect(result));
    container.appendChild(item);
  }

  container.classList.add('visible');
}

export function hideSearchResults(): void {
  const container = document.getElementById('search-results')!;
  container.classList.remove('visible');
  container.innerHTML = '';
}

export function showLoading(show: boolean): void {
  const el = document.getElementById('loading-indicator')!;
  el.classList.toggle('visible', show);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
