import { GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";

type ItinerarySegmentLayerProps = {
  selectedItinerary: {
    route_id?: string;
    id: string;
    title: string;
  } | null;
  currentStopIndex: number;
  onFallback: () => void;
};

export function ItinerarySegmentLayer({
  selectedItinerary,
  currentStopIndex,
  onFallback,
}: ItinerarySegmentLayerProps) {
  const [segmentsData, setSegmentsData] = useState<any | null>(null);
  const map = useMap();

  useEffect(() => {
    fetch("/data/route_segments.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load route segments");
        return res.json();
      })
      .then((data) => setSegmentsData(data))
      .catch((err) => {
        console.error("Error loading route segments in Layer:", err);
        onFallback();
      });
  }, [onFallback]);

  const activeSegment = useMemo(() => {
    if (!segmentsData || !selectedItinerary?.route_id) return null;

    const segmentIndex = currentStopIndex + 1;
    const features = segmentsData.features?.filter((f: any) => {
      return (
        f.properties?.route_id === selectedItinerary.route_id &&
        Number(f.properties?.segment_index) === segmentIndex
      );
    });

    if (!features || features.length === 0) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features: features,
    };
  }, [segmentsData, selectedItinerary, currentStopIndex]);

  useEffect(() => {
    if (!activeSegment) return;

    try {
      const layer = L.geoJSON(activeSegment as any);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [80, 80],
          animate: true,
          maxZoom: 18,
        });
      }
    } catch (err) {
      console.error("Error getting bounds of active segment:", err);
    }
  }, [activeSegment, map]);

  if (!activeSegment) {
    return null;
  }

  return (
    <>
      {/* Background white Halo line */}
      <GeoJSON
        key={`halo-${selectedItinerary?.route_id}-${currentStopIndex}`}
        data={activeSegment as any}
        style={{
          color: "#FFFFFF",
          weight: 10,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Foreground gold routing line */}
      <GeoJSON
        key={`gold-${selectedItinerary?.route_id}-${currentStopIndex}`}
        data={activeSegment as any}
        style={{
          color: "#C89B3C",
          weight: 5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}
