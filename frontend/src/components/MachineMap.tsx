import { useEffect, useRef } from 'react';
import maplibregl, {
  type GeoJSONSource,
  type LineLayerSpecification,
  type Map as MapLibreMap,
  Marker,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, LineString } from 'geojson';
import { machineColor } from '../colors';
import { ANALYSIS_ZONE_GEOJSON, MAP_CENTER, MAP_ZOOM } from '../zone';
import type { MachineState } from '../types';

const TRACES_SOURCE = 'traces';

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const TRACE_LAYER: LineLayerSpecification = {
  id: 'traces-line',
  type: 'line',
  source: TRACES_SOURCE,
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': ['get', 'color'],
    'line-width': 3,
  },
};

function buildTraceCollection(
  machines: MachineState[],
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: machines
      .filter((machine) => machine.trace.length >= 2)
      .map((machine, index) => ({
        type: 'Feature',
        properties: { color: machineColor(index) },
        geometry: {
          type: 'LineString',
          coordinates: machine.trace.map((point) => [point.lng, point.lat]),
        },
      })),
  };
}

function createMarkerElement(color: string, label: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'machine-marker';
  el.style.backgroundColor = color;
  el.title = label;
  return el;
}

interface MachineMapProps {
  machines: MachineState[];
}

export function MachineMap({ machines }: MachineMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
    });
    mapRef.current = map;
    const markers = markersRef.current;

    map.on('load', () => {
      map.addSource('zone', {
        type: 'geojson',
        data: ANALYSIS_ZONE_GEOJSON,
      });
      map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zone',
        paint: { 'fill-color': '#2b8cbe', 'fill-opacity': 0.15 },
      });
      map.addLayer({
        id: 'zone-outline',
        type: 'line',
        source: 'zone',
        paint: { 'line-color': '#2b8cbe', 'line-width': 2 },
      });

      map.addSource(TRACES_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer(TRACE_LAYER);

      loadedRef.current = true;
    });

    return () => {
      loadedRef.current = false;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) {
      return;
    }

    const source = map.getSource(TRACES_SOURCE) as GeoJSONSource | undefined;
    if (source) {
      source.setData(buildTraceCollection(machines));
    }

    const markers = markersRef.current;
    const seen = new Set<string>();

    machines.forEach((machine, index) => {
      if (!machine.current) {
        return;
      }
      seen.add(machine.id);
      const lngLat: [number, number] = [
        machine.current.lng,
        machine.current.lat,
      ];

      const existing = markers.get(machine.id);
      if (existing) {
        existing.setLngLat(lngLat);
      } else {
        const marker = new Marker({
          element: createMarkerElement(machineColor(index), machine.name),
        })
          .setLngLat(lngLat)
          .addTo(map);
        markers.set(machine.id, marker);
      }
    });

    markers.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });
  }, [machines]);

  return <div ref={containerRef} className="map" />;
}
