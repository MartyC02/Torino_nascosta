import { GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";

type ItineraryRouteLayerProps = {
  routesGeoJson: any | null;
  selectedItinerary: {
    route_id?: string;
    id: string;
    title: string;
  } | null;
};

export function ItineraryRouteLayer({
  routesGeoJson,
  selectedItinerary,
}: ItineraryRouteLayerProps) {
  const map = useMap();

  const selectedRoute = useMemo(() => {
    if (!routesGeoJson || !selectedItinerary?.route_id) {
      return null;
    }

    const features = Array.isArray(routesGeoJson.features)
      ? routesGeoJson.features.filter((feature: any) => {
          return feature.properties?.route_id === selectedItinerary.route_id;
        })
      : [];

    console.log("Selected route_id:", selectedItinerary.route_id);
    console.log("Route features found:", features.length);

    if (features.length === 0) {
      console.warn("No route found for route_id:", selectedItinerary.route_id);
      return null;
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [routesGeoJson, selectedItinerary]);

  useEffect(() => {
    if (!selectedRoute) return;

    const layer = L.geoJSON(selectedRoute as any);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
      });
    }
  }, [selectedRoute, map]);

  if (!selectedRoute) {
    return null;
  }

  const isAccessible =
    selectedItinerary?.id.includes("accessibile") ||
    selectedItinerary?.route_id?.includes("accessibile");

  return (
    <GeoJSON
      key={selectedItinerary?.route_id}
      data={selectedRoute as any}
      style={{
        color: isAccessible ? "#3B5BDB" : "#C89B3C",
        weight: 5,
        opacity: 0.9,
        dashArray: isAccessible ? "10 7" : undefined,
      }}
    />
  );
}