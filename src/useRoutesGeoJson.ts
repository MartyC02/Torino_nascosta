import { useEffect, useState } from "react";

export function useRoutesGeoJson() {
  const [routesGeoJson, setRoutesGeoJson] = useState<any | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/routes.geojson")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load routes.geojson: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json") && !contentType.includes("geo+json")) {
          const text = await response.text();
          throw new Error(
            `routes.geojson did not return JSON. First characters: ${text.slice(0, 40)}`
          );
        }

        return response.json();
      })
      .then((data) => {
        setRoutesGeoJson(data);
      })
      .catch((error) => {
        console.error("Error loading routes.geojson", error);
        setRoutesError(error.message);
      });
  }, []);

  return { routesGeoJson, routesError };
}