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
  UrlTemplateImageryProvider,
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
      font: 'bold 15px system-ui, sans-serif',
      fillColor: Color.WHITE,
      style: LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 3,
      outlineColor: Color.BLACK,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -20),
      showBackground: true,
      backgroundColor: new Color(0, 0, 0, 0.6),
      backgroundPadding: new Cartesian2(8, 5),
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
      font: 'bold 15px system-ui, sans-serif',
      fillColor: Color.WHITE,
      style: LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 3,
      outlineColor: Color.BLACK,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -20),
      showBackground: true,
      backgroundColor: new Color(0, 0, 0, 0.6),
      backgroundPadding: new Cartesian2(8, 5),
    },
  });
}

// Helpers for spherical interpolation (great-circle arc)

function latLonToUnitCart(latRad: number, lonRad: number): Cartesian3 {
  return new Cartesian3(
    Math.cos(latRad) * Math.cos(lonRad),
    Math.cos(latRad) * Math.sin(lonRad),
    Math.sin(latRad),
  );
}

function slerp(a: Cartesian3, b: Cartesian3, t: number): Cartesian3 {
  let d = Cartesian3.dot(a, b);
  d = Math.max(-1, Math.min(1, d));
  const theta = Math.acos(d);
  if (theta < 1e-6) return Cartesian3.clone(a, new Cartesian3());
  const sinTheta = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;
  const result = new Cartesian3();
  Cartesian3.add(
    Cartesian3.multiplyByScalar(a, w1, new Cartesian3()),
    Cartesian3.multiplyByScalar(b, w2, new Cartesian3()),
    result,
  );
  Cartesian3.normalize(result, result);
  return result;
}

export function drawArc(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): void {
  const positions: Cartesian3[] = [];
  const steps = 200;
  const maxAlt = 2_500_000;

  const fromCart = latLonToUnitCart(CesiumMath.toRadians(fromLat), CesiumMath.toRadians(fromLon));
  const toCart = latLonToUnitCart(CesiumMath.toRadians(toLat), CesiumMath.toRadians(toLon));

  const dot = Math.max(-1, Math.min(1, Cartesian3.dot(fromCart, toCart)));
  const isAntipodal = dot < -0.999;

  // For nearly-antipodal points, pick a midpoint to define which great circle to follow
  let midCart: Cartesian3 | null = null;
  if (isAntipodal) {
    let dLon = toLon - fromLon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    const midLon = fromLon + dLon / 2;
    const candidate = latLonToUnitCart(0, CesiumMath.toRadians(midLon));
    const cross = Cartesian3.cross(fromCart, candidate, new Cartesian3());
    if (Cartesian3.magnitude(cross) > 0.01) {
      Cartesian3.normalize(candidate, candidate);
      midCart = candidate;
    } else {
      const perp = Cartesian3.cross(fromCart, Cartesian3.UNIT_Z, new Cartesian3());
      if (Cartesian3.magnitude(perp) < 0.01) {
        Cartesian3.cross(fromCart, Cartesian3.UNIT_X, perp);
      }
      Cartesian3.normalize(perp, perp);
      midCart = perp;
    }
  }

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let point: Cartesian3;

    if (isAntipodal && midCart) {
      point = t <= 0.5
        ? slerp(fromCart, midCart, t * 2)
        : slerp(midCart, toCart, (t - 0.5) * 2);
    } else {
      point = slerp(fromCart, toCart, t);
    }

    const latDeg = CesiumMath.toDegrees(Math.asin(point.z));
    const lonDeg = CesiumMath.toDegrees(Math.atan2(point.y, point.x));
    const alt = maxAlt * Math.sin(Math.PI * t);
    positions.push(Cartesian3.fromDegrees(lonDeg, latDeg, alt));
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

export function flyAlongArc(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  height: number = 8_000_000,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const fromCart = latLonToUnitCart(CesiumMath.toRadians(fromLat), CesiumMath.toRadians(fromLon));
    const toCart = latLonToUnitCart(CesiumMath.toRadians(toLat), CesiumMath.toRadians(toLon));

    const dot = Math.max(-1, Math.min(1, Cartesian3.dot(fromCart, toCart)));
    const isAntipodal = dot < -0.999;

    let midCart: Cartesian3 | null = null;
    if (isAntipodal) {
      let dLon = toLon - fromLon;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      const midLon = fromLon + dLon / 2;
      const candidate = latLonToUnitCart(0, CesiumMath.toRadians(midLon));
      const cross = Cartesian3.cross(fromCart, candidate, new Cartesian3());
      if (Cartesian3.magnitude(cross) > 0.01) {
        Cartesian3.normalize(candidate, candidate);
        midCart = candidate;
      } else {
        const perp = Cartesian3.cross(fromCart, Cartesian3.UNIT_Z, new Cartesian3());
        if (Cartesian3.magnitude(perp) < 0.01) {
          Cartesian3.cross(fromCart, Cartesian3.UNIT_X, perp);
        }
        Cartesian3.normalize(perp, perp);
        midCart = perp;
      }
    }

    function arcPoint(t: number): Cartesian3 {
      if (isAntipodal && midCart) {
        return t <= 0.5
          ? slerp(fromCart, midCart, t * 2)
          : slerp(midCart, toCart, (t - 0.5) * 2);
      }
      return slerp(fromCart, toCart, t);
    }

    const durationMs = 3000;
    const maxHeight = Math.max(height * 2.5, 15_000_000);
    const startTime = performance.now();

    function tick() {
      const raw = Math.min((performance.now() - startTime) / durationMs, 1);
      const t = raw < 0.5
        ? 4 * raw * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      const pt = arcPoint(t);
      const lat = CesiumMath.toDegrees(Math.asin(pt.z));
      const lon = CesiumMath.toDegrees(Math.atan2(pt.y, pt.x));
      const h = height + (maxHeight - height) * Math.sin(Math.PI * t);

      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(lon, lat, h),
      });

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
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

let isSatellite = false;

export function toggleLayer(): boolean {
  isSatellite = !isSatellite;
  viewer.imageryLayers.removeAll();

  if (isSatellite) {
    viewer.imageryLayers.addImageryProvider(
      new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri, Maxar, Earthstar Geographics',
        maximumLevel: 19,
      }),
    );
  } else {
    viewer.imageryLayers.addImageryProvider(
      new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      }),
    );
  }

  return isSatellite;
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
