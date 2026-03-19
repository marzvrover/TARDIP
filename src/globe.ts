import {
  Viewer,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  Cartesian3,
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  LabelStyle,
  PolylineGlowMaterialProperty,
  EllipsoidTerrainProvider,
  Ion,
} from 'cesium';
import type { Entity } from 'cesium';

let viewer: Viewer;
let originEntity: Entity | undefined;
let antipodeEntity: Entity | undefined;
let arcEntity: Entity | undefined;

export async function initGlobe(containerId: string): Promise<Viewer> {
  // Suppress Ion token warnings — we use only OSS tile sources
  Ion.defaultAccessToken = '';

  viewer = new Viewer(containerId, {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    timeline: false,
    animation: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    selectionIndicator: false,
    infoBox: false,
    terrainProvider: new EllipsoidTerrainProvider(),
    baseLayer: new ImageryLayer(
      new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      }),
    ),
  });

  // Minimal credit styling
  viewer.cesiumWidget.creditContainer.setAttribute(
    'style',
    'font-size:10px; opacity:0.6;',
  );

  return viewer;
}

export function clearMarkers(): void {
  if (originEntity) {
    viewer.entities.remove(originEntity);
    originEntity = undefined;
  }
  if (antipodeEntity) {
    viewer.entities.remove(antipodeEntity);
    antipodeEntity = undefined;
  }
  if (arcEntity) {
    viewer.entities.remove(arcEntity);
    arcEntity = undefined;
  }
}

export function placeOriginMarker(lat: number, lon: number, label: string): void {
  originEntity = viewer.entities.add({
    position: Cartesian3.fromDegrees(lon, lat),
    point: {
      pixelSize: 14,
      color: Color.DODGERBLUE,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: label,
      font: '14px system-ui, sans-serif',
      fillColor: Color.WHITE,
      style: LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Color.BLACK,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -18),
    },
  });
}

export function placeAntipodeMarker(lat: number, lon: number, label: string): void {
  antipodeEntity = viewer.entities.add({
    position: Cartesian3.fromDegrees(lon, lat),
    point: {
      pixelSize: 14,
      color: Color.ORANGERED,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: label,
      font: '14px system-ui, sans-serif',
      fillColor: Color.WHITE,
      style: LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Color.BLACK,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -18),
    },
  });
}

export function drawArc(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): void {
  const positions: Cartesian3[] = [];
  const steps = 200;
  const maxAlt = 2_500_000; // 2500 km peak altitude

  // Determine shortest longitude path
  let dLon = toLon - fromLon;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = fromLat + (toLat - fromLat) * t;
    let lon = fromLon + dLon * t;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    const alt = maxAlt * Math.sin(Math.PI * t);
    positions.push(Cartesian3.fromDegrees(lon, lat, alt));
  }

  arcEntity = viewer.entities.add({
    polyline: {
      positions,
      width: 3,
      material: new PolylineGlowMaterialProperty({
        glowPower: 0.25,
        color: Color.CYAN,
      }),
    },
  });
}

export async function flyTo(
  lat: number,
  lon: number,
  height: number = 15_000_000,
): Promise<void> {
  return new Promise<void>((resolve) => {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, lat, height),
      duration: 2.0,
      complete: resolve,
    });
  });
}

export function setView(lat: number, lon: number, height: number = 20_000_000): void {
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(lon, lat, height),
  });
}

export function zoomIn(): void {
  viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.4);
}

export function zoomOut(): void {
  viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.6);
}

export function onGlobeClick(
  callback: (lat: number, lon: number) => void,
): void {
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((event: { position: Cartesian2 }) => {
    const cartesian = viewer.camera.pickEllipsoid(
      event.position,
      viewer.scene.globe.ellipsoid,
    );
    if (cartesian) {
      const cartographic = Cartographic.fromCartesian(cartesian);
      callback(
        CesiumMath.toDegrees(cartographic.latitude),
        CesiumMath.toDegrees(cartographic.longitude),
      );
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
}
