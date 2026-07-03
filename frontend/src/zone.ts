import type { Feature, Polygon } from 'geojson';

const ZONE_RING: [number, number][] = [
  [6.53, 44.94],
  [6.56, 44.94],
  [6.56, 44.925],
  [6.53, 44.925],
  [6.53, 44.94],
];

export const ANALYSIS_ZONE_GEOJSON: Feature<Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [ZONE_RING],
  },
};

export const MAP_CENTER: [number, number] = [6.545, 44.9325];
export const MAP_ZOOM = 12.5;
