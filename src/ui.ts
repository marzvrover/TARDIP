import type { Coordinates } from './antipode';
import type { SearchResult } from './geocoding';
import { formatCoords, surfaceDistance } from './antipode';
import { getNearestSettlement } from './geocoding';

export function updateInfoPanel(
  data: {
    origin: { name: string; lat: number; lon: number; address: Record<string, string> };
    antipode: {
      name: string;
      lat: number;
      lon: number;
      address: Record<string, string>;
    };
  },
  onFlyTo?: (lat: number, lon: number) => void,
): void {
  const panel = document.getElementById('info-panel')!;
  const content = document.getElementById('info-content')!;

  const o: Coordinates = { lat: data.origin.lat, lon: data.origin.lon };
  const a: Coordinates = { lat: data.antipode.lat, lon: data.antipode.lon };
  const dist = surfaceDistance(o, a);
  const originNearest = getNearestSettlement(data.origin.address);
  const nearest = getNearestSettlement(data.antipode.address);

  const originShort = getShortName(data.origin.name, data.origin.address);
  const antipodeShort = getShortName(data.antipode.name, data.antipode.address);

  const summary = document.getElementById('info-summary')!;
  summary.innerHTML = `
    <span class="summary-item" data-lat="${data.origin.lat}" data-lon="${data.origin.lon}">
      <span class="dot origin-dot"></span>
      <span class="summary-name">${escapeHtml(originShort)}</span>
    </span>
    <span class="summary-arrow">↔</span>
    <span class="summary-item" data-lat="${data.antipode.lat}" data-lon="${data.antipode.lon}">
      <span class="dot antipode-dot"></span>
      <span class="summary-name">${escapeHtml(antipodeShort)}</span>
    </span>
  `;

  content.innerHTML = `
    <div class="location-section origin-section clickable" data-lat="${data.origin.lat}" data-lon="${data.origin.lon}">
      <div class="section-header">
        <span class="dot origin-dot"></span>
        <h3>Origin</h3>
      </div>
      <p class="location-name">${escapeHtml(data.origin.name)}</p>
      <p class="location-coords">${formatCoords(data.origin.lat, data.origin.lon)}</p>
      ${Object.keys(data.origin.address).length > 0 ? `<p class="nearest">Nearest place: <strong>${escapeHtml(originNearest)}</strong></p>` : ''}
    </div>
    <div class="divider"></div>
    <div class="location-section antipode-section clickable" data-lat="${data.antipode.lat}" data-lon="${data.antipode.lon}">
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

  if (onFlyTo) {
    content.querySelectorAll('.location-section.clickable').forEach((el) => {
      el.addEventListener('click', () => {
        const lat = parseFloat((el as HTMLElement).dataset.lat || '0');
        const lon = parseFloat((el as HTMLElement).dataset.lon || '0');
        onFlyTo(lat, lon);
      });
    });
    summary.querySelectorAll('.summary-item').forEach((el) => {
      el.addEventListener('click', () => {
        const lat = parseFloat((el as HTMLElement).dataset.lat || '0');
        const lon = parseFloat((el as HTMLElement).dataset.lon || '0');
        onFlyTo(lat, lon);
      });
    });
  }

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

function getShortName(displayName: string, address: Record<string, string>): string {
  const settlement = address.city || address.town || address.village || address.hamlet || address.suburb;
  if (settlement) return settlement;
  // Fall back to first segment of the display name
  const first = displayName.split(',')[0]?.trim();
  return first || 'Unknown';
}
