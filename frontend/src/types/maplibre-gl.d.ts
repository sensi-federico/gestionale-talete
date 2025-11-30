declare module "maplibre-gl" {
  export interface MapOptions {
    container: string | HTMLElement;
    style: string | object;
    center?: [number, number];
    zoom?: number;
    pitch?: number;
    bearing?: number;
  }

  export interface FlyToOptions {
    center: [number, number];
    zoom?: number;
    essential?: boolean;
  }

  export interface LngLat {
    lat: number;
    lng: number;
  }

  export interface MapMouseEvent {
    lngLat: LngLat;
  }

  export interface EventData {}

  export class Map {
    constructor(options: MapOptions);
    remove(): void;
    addControl(control: unknown): void;
    on(event: string, handler: (event: MapMouseEvent & EventData) => void): void;
    flyTo(options: FlyToOptions): void;
  }

  export interface MarkerOptions {
    color?: string;
  }

  export class Marker {
    constructor(options?: MarkerOptions);
    setLngLat(coords: [number, number]): this;
    addTo(map: Map): this;
    remove(): this;
  }

  export class NavigationControl {
    constructor();
  }

  const maplibregl: {
    Map: typeof Map;
    Marker: typeof Marker;
    NavigationControl: typeof NavigationControl;
  };

  export default maplibregl;
}
