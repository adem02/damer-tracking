export interface Machine {
  id: string;
  name: string;
  positions?: Position[];
}

export interface Position {
  id: string;
  machineId: string;
  location: GeoPoint;
  timestamp: Date;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

type Ring = [number, number][];

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: Ring[];
}

export interface NewPosition {
  machineId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}
