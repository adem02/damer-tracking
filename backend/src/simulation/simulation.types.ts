export interface SeedPosition {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface SeedMachine {
  id: string;
  name: string;
  positions: SeedPosition[];
}

export interface Seed {
  machines: SeedMachine[];
}
