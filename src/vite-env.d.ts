/// <reference types="vite/client" />

declare module 'react-leaflet' {
  import * as React from 'react';
  import * as Leaflet from 'leaflet';

  export const MapContainer: React.ForwardRefExoticComponent<any>;
  export const TileLayer: React.ForwardRefExoticComponent<any>;
  export const Marker: React.ForwardRefExoticComponent<any>;
  export const Popup: React.ForwardRefExoticComponent<any>;
  export const Tooltip: React.ForwardRefExoticComponent<any>;
  export const Circle: React.ForwardRefExoticComponent<any>;
  export const CircleMarker: React.ForwardRefExoticComponent<any>;
  export const Polyline: React.ForwardRefExoticComponent<any>;
  export const Polygon: React.ForwardRefExoticComponent<any>;
  export const Rectangle: React.ForwardRefExoticComponent<any>;
  export const LayerGroup: React.ForwardRefExoticComponent<any>;
  export const FeatureGroup: React.ForwardRefExoticComponent<any>;
  export const LayersControl: React.ForwardRefExoticComponent<any> & {
    BaseLayer: React.ForwardRefExoticComponent<any>;
    Overlay: React.ForwardRefExoticComponent<any>;
  };
  export const useMap: () => Leaflet.Map;
  export const useMapEvents: (handlers: Record<string, any>) => Leaflet.Map;
  export const useMapEvent: (type: string, handler: (...args: any[]) => void) => Leaflet.Map;
  export const GeoJSON: React.ForwardRefExoticComponent<any>;
  export const Pane: React.ForwardRefExoticComponent<any>;
  export const SVGOverlay: React.ForwardRefExoticComponent<any>;
  export const ImageOverlay: React.ForwardRefExoticComponent<any>;
  export const VideoOverlay: React.ForwardRefExoticComponent<any>;
  export const WMSTileLayer: React.ForwardRefExoticComponent<any>;
  export const ZoomControl: React.ForwardRefExoticComponent<any>;
  export const ScaleControl: React.ForwardRefExoticComponent<any>;
  export const AttributionControl: React.ForwardRefExoticComponent<any>;
}
