import { useEffect, useState } from "react";

export type ServicesSource = "all" | "by_route";
export type ServicesType = "services" | "bike_sharing";

export function useServicesGeoJson(source: ServicesSource, type: ServicesType = "services") {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let filename = "";
    if (type === "services") {
      filename = source === "all" ? "services_all.geojson" : "services_by_route.geojson";
    } else {
      filename = source === "all" ? "bike_sharing_all.geojson" : "bike_sharing_by_route.geojson";
    }
    const path = `/data/${filename}`;

    setLoading(true);
    fetch(path)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        // Handle empty file gently without crashing
        if (!text.trim()) {
          return { type: "FeatureCollection", features: [] };
        }

        try {
          const json = JSON.parse(text);
          return json;
        } catch (e) {
          throw new Error(`Invalid JSON inside ${filename}`);
        }
      })
      .then((geoJson) => {
        if (geoJson && Array.isArray(geoJson.features)) {
          setData(geoJson.features);
        } else {
          setData([]);
        }
        setError(null);
      })
      .catch((err) => {
        console.warn(`Error loading services from ${path}:`, err);
        setError(err.message);
        
        // For 'by_route' fallback to '/data/service_by_route.geojson' if there's an older file
        if (source === "by_route" && type === "services") {
          console.log("Attempting fallback to service_by_route.geojson");
          fetch("/data/service_by_route.geojson")
            .then(res => res.json())
            .then(fbData => {
              if (fbData && Array.isArray(fbData.features)) {
                setData(fbData.features);
              }
            })
            .catch(fbE => {
              console.error("Fallback load failed too:", fbE);
            });
        } else {
          setData([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [source, type]);

  return { services: data, loading, error };
}
