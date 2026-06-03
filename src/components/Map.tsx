import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import { Artwork, ArtworkCategory, ArtworkType, Neighborhood, VisibilityLevel, Itinerary } from "../types";
import L from "leaflet";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRoutesGeoJson } from "../useRoutesGeoJson.ts"
import { useServicesGeoJson } from "../useServicesGeoJson";
import { ItineraryRouteLayer } from "./ItineraryRouteLayer";
import { ItinerarySegmentLayer } from "./ItinerarySegmentLayer";
import { useLanguage } from "./LanguageContext";

// Format helper for service subtype
const formatServiceSubtype = (subtype: string): string => {
  if (!subtype) return "";
  const mappings: Record<string, string> = {
    cafe: "Café",
    bar: "Bar",
    ice_cream: "Ice cream parlor",
    bus_stop: "Bus stop",
    tram_stop: "Tram stop",
    subway_entrance: "Subway entrance",
    subway_ent: "Subway entrance",
    bike_sharing: "Bike sharing"
  };
  return mappings[subtype] || subtype.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Reusable component for service details popup
function ServicePopup({ properties }: { properties: any }) {
  const { t, formatServiceSubtype } = useLanguage();
  const isBike = properties.service_subtype === "bike_sharing" || properties.service_type === "mobility";
  const name = properties.name || (isBike ? t("Bike sharing station") : t("Unnamed service"));
  const subtype = formatServiceSubtype(properties.service_subtype);
  const lines = properties.lines;
  const isTransport = properties.service_type === "transport";

  return (
    <div className="p-1 min-w-[160px] text-xs">
      <div className="mb-1 font-bold text-text-main leading-tight">
        {name}
      </div>
      <div className="flex flex-col gap-1 mt-1.5">
        <div className="text-[10px] text-text-main">
          <span className="font-bold text-text-light/80 mr-1">{t("Type")}:</span>
          {isBike ? t("Bike sharing") : subtype}
        </div>
        {isTransport && lines && String(lines).trim().length > 0 && (
          <div className="text-[10px] text-text-main font-mono border-t border-border-color/60 pt-1 mt-1 leading-normal">
            <span className="font-bold text-accent-gold mr-1">{t("Lines")}:</span>
            {lines}
          </div>
        )}
      </div>
    </div>
  );
}

// Track map zoom levels internally within MapContainer
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    map.on("zoomend", handleZoom);
    onZoomChange(map.getZoom());
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map, onZoomChange]);
  return null;
}


// Helper for custom service markers (food_drink or transport)
const createServiceIcon = (serviceType: string, serviceSubtype: string) => {
  let color = '#78350F'; // Warm brown/amber for food_drink
  if (serviceType === 'transport') {
    color = '#4B5563'; // Cool gray/blue-gray for transport
  } else if (serviceType === 'mobility' || serviceSubtype === 'bike_sharing') {
    color = '#10B981'; // Vibrant emerald green for bike sharing
  }

  // Icons based on type
  let iconSvg = '';
  if (serviceType === 'food_drink') {
    iconSvg = `
      <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
        <line x1="6" y1="2" x2="6" y2="4"/>
        <line x1="10" y1="2" x2="10" y2="4"/>
        <line x1="14" y1="2" x2="14" y2="4"/>
      </svg>
    `;
  } else if (serviceType === 'mobility' || serviceSubtype === 'bike_sharing') {
    iconSvg = `
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5"/>
        <circle cx="18.5" cy="17.5" r="2.5"/>
        <path d="M15 17.5L12 12H9l-3 5.5"/>
        <path d="M12 12l2-5H9"/>
        <path d="m14 7 1-2h2"/>
        <path d="M8 7h2"/>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="4" width="14" height="16" rx="2"/>
        <line x1="19" y1="18" x2="5" y2="18"/>
        <line x1="12" y1="4" x2="12" y2="18"/>
        <circle cx="8" cy="15" r="1"/>
        <circle cx="16" cy="15" r="1"/>
      </svg>
    `;
  }

  return L.divIcon({
    className: 'custom-service-icon',
    html: `
      <div class="service-marker-container" style="
        background-color: ${color};
        color: white;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        border: 1.5px solid white;
      ">
        ${iconSvg}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Helper for custom markers based on category
const createIcon = (
  category: ArtworkCategory, 
  isSelected: boolean, 
  isGuided: boolean = false, 
  isCurrent: boolean = false, 
  isNext: boolean = false,
  stopNumber?: number
) => {
  let color = '#c5a059'; // accent-gold
  if (category === 'contemporanea') color = '#A41034';
  if (category === 'storica') color = '#1a1a1a';
  
  const icons = {
    contemporanea: `
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3Z"/>
      </svg>
    `,
    storica: `
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"/>
        <path d="M5 21V9l7-5 7 5v12"/>
        <path d="M9 21v-8h6v8"/>
      </svg>
    `,
    monumento: `
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 21h16"/>
        <path d="M6 18h12"/>
        <path d="M8 18V9"/>
        <path d="M16 18V9"/>
        <path d="M12 3l7 6H5l7-6Z"/>
      </svg>
    `,
    'hidden-art': `
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `,
    'cortili-segreti': `
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 21V9l8-6 8 6v12"/>
        <path d="M9 21v-6a3 3 0 0 1 6 0v6"/>
        <path d="M4 9h16"/>
      </svg>
    `
  };
  
  const iconSvg = icons[category as keyof typeof icons] || icons.contemporanea;
  
  // Guided mode styling
  let scale = isSelected ? '1.3' : '1';
  let opacity = '1';
  let borderStyle = '2px solid white';
  let shadow = '0 4px 12px rgba(0,0,0,0.15)';
  let bgOverride = isSelected ? '#c5a059' : color;
  
  if (isGuided && stopNumber !== undefined) {
    if (isCurrent) {
      scale = '1.4';
      borderStyle = '3px solid #3B82F6'; // Highlighted current stop in gorgeous blue border
      shadow = '0 0 16px rgba(59, 130, 246, 0.8)'; // Blue halo glow
      bgOverride = '#2563EB'; // Blue color
    } else if (isNext) {
      scale = '1.15';
      borderStyle = '3px solid #C5A059'; // Next stop has rich gold border
      shadow = '0 0 12px rgba(197, 160, 89, 0.7)'; // Gold glow
      bgOverride = '#C5A059'; // Gold background
    } else {
      scale = '0.75';
      opacity = '0.4';
      borderStyle = '1.5px solid rgba(255, 255, 255, 0.5)';
      bgOverride = '#9CA3AF'; // Subdued gray
      shadow = 'none';
    }
  }

  return L.divIcon({
    className: `custom-div-icon ${isSelected ? 'highlighted-pin' : ''}`,
    html: `
      <div class="marker-container" style="
        background-color: ${bgOverride};
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadow};
        border: ${borderStyle};
        opacity: ${opacity};
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform: scale(${scale});
        ${isSelected && !isGuided ? 'filter: drop-shadow(0 0 8px rgba(197, 160, 89, 0.6));' : ''}
      ">
        ${isGuided && stopNumber !== undefined 
          ? `<span style="font-family: var(--font-mono), monospace; font-weight: 900; font-size: 15px; text-shadow: 0 1px 2px rgba(0,0,0,0.25);">${stopNumber}</span>`
          : iconSvg
        }
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

interface MapProps {
  artworks: Artwork[];
  selectedArtwork?: Artwork;
  selectionOffsetX?: number;
  onArtworkSelect?: (artwork: Artwork) => void;
  onMarkerClick?: () => void;
  activeItineraryIds?: string[];
  containerSizeChanged?: boolean; // Prop to trigger invalidateSize
  showFilters?: boolean;
  selectedItinerary?: Itinerary;
  isGuidedMode?: boolean;
  currentStopIndex?: number;
}

function InvalidateMapSize({ trigger }: { trigger: any }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [map, trigger]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize({ pan: false });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
}

function FitItineraryBounds({
  positions,
  fitKey,
}: {
  positions: [number, number][] | null;
  fitKey: string;
}) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    if (lastFitKey.current === fitKey) return;

    lastFitKey.current = fitKey;

    const timer = setTimeout(() => {
      map.invalidateSize();

      if (positions.length > 1) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, {
          padding: [80, 80],
          animate: true,
          maxZoom: 16,
        });
      } else {
        map.setView(positions[0], 16, { animate: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [map, positions, fitKey]);

  return null;
}

function ChangeView({
  center,
  id,
  offsetX = 0,
}: {
  center: [number, number];
  id?: string;
  offsetX?: number;
}) {
  const map = useMap();
  const lastViewKey = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const viewKey = `${id}-${offsetX}-${center[0]}-${center[1]}`;

    if (lastViewKey.current === viewKey) return;

    lastViewKey.current = viewKey;

    const timer = setTimeout(() => {
      map.invalidateSize({ pan: false });

      if (offsetX !== 0) {
        // Calculate the new center by shifting the camera pixels
        // To make the marker appear shifted to the LEFT, we shift the center to the RIGHT
        const point = map.project(center, 16);
        const shiftedPoint = point.add([offsetX, 0]);
        const shiftedCenter = map.unproject(shiftedPoint, 16);
        map.setView(shiftedCenter, 16, { animate: true });
      } else {
        map.setView(center, 16, { animate: true });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [center, map, id, offsetX]);

  return null;
}
function FitRouteBounds({
  routeFeature,
  fitKey
}: {
  routeFeature: any;
  fitKey: string;
}) {
  const map = useMap();
  const lastFitKey = useRef<string | null>(null);

  useEffect(() => {
    if (!routeFeature || !map || lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;

    try {
      const coordinates = routeFeature.geometry?.coordinates;
      if (coordinates && coordinates.length > 0) {
        // LineString is list of [lng, lat], let's convert to [lat, lng] for Leaflet bounds
        const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        const bounds = L.latLngBounds(latLngs);
        map.invalidateSize();
        map.fitBounds(bounds, {
          padding: [80, 80],
          animate: true,
          maxZoom: 16
        });
      }
    } catch (err) {
      console.error("Error doing fitBounds on route feature", err);
    }
  }, [map, routeFeature, fitKey]);

  return null;
}

export function Map({ 
  artworks, 
  selectedArtwork, 
  onArtworkSelect, 
  onMarkerClick, 
  activeItineraryIds, 
  containerSizeChanged, 
  showFilters = true,
  selectionOffsetX = 0, 
  selectedItinerary, 
  isGuidedMode = false,
  currentStopIndex = 0,
}: MapProps) {
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [segmentLayerFailed, setSegmentLayerFailed] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<"all" | "cafe" | "bar" | "ice_cream" | "transport" | "bike_sharing">("all");
  const [mapZoom, setMapZoom] = useState(15);
  const { t, language } = useLanguage();

  const { services: allServices } = useServicesGeoJson("all");
  const { services: routeServices } = useServicesGeoJson("by_route");
  const { services: allBikeSharing } = useServicesGeoJson("all", "bike_sharing");
  const { services: routeBikeSharing } = useServicesGeoJson("by_route", "bike_sharing");

  const displayedServices = useMemo(() => {
    if (!showServices) return [];

    let filtered = [];
    let bikeFiltered = [];

    if (selectedItinerary) {
      // Filter by route_id
      filtered = routeServices.filter(
        (feature) => feature.properties?.route_id === selectedItinerary.route_id
      );
      bikeFiltered = routeBikeSharing.filter(
        (feature) => feature.properties?.route_id === selectedItinerary.route_id
      );
    } else {
      // General view, only show if mapZoom >= 14
      if (mapZoom < 14) return [];
      filtered = allServices;
      bikeFiltered = allBikeSharing;
    }

    if (serviceFilter === "all") {
      return [...filtered, ...bikeFiltered];
    } else if (serviceFilter === "cafe") {
      return filtered.filter(f => f.properties?.service_subtype === "cafe");
    } else if (serviceFilter === "bar") {
      return filtered.filter(f => f.properties?.service_subtype === "bar");
    } else if (serviceFilter === "ice_cream") {
      return filtered.filter(f => f.properties?.service_subtype === "ice_cream");
    } else if (serviceFilter === "transport") {
      return filtered.filter(f => 
        f.properties?.service_type === "transport" || 
        ["bus_stop", "tram_stop", "subway_entrance", "subway_ent"].includes(f.properties?.service_subtype)
      );
    } else if (serviceFilter === "bike_sharing") {
      return bikeFiltered;
    }

    return filtered;
  }, [showServices, selectedItinerary, routeServices, allServices, routeBikeSharing, allBikeSharing, mapZoom, serviceFilter]);

  useEffect(() => {
    setSegmentLayerFailed(false);
  }, [selectedItinerary?.id, currentStopIndex]);

  useEffect(() => {
    if (selectedItinerary) {
      console.log("Selected itinerary", selectedItinerary);
      console.log("Selected route_id", selectedItinerary?.route_id);
      if (selectedItinerary) {
        console.log("Route features found", selectedItinerary.walkingTimes);
      } else {
        console.log("Route features found", 0);
      }
    }
  }, [selectedItinerary, selectedItinerary]);

  useEffect(() => {
    // Set initial responsive state
    setLegendExpanded(window.innerWidth >= 768);
  }, []);

  const [activeCategory, setActiveCategory] = useState<ArtworkCategory | 'all'>('all');
  const [activeType, setActiveType] = useState<ArtworkType | 'all'>('all');
  const [activeNeighborhood, setActiveNeighborhood] = useState<Neighborhood | 'all'>('all');
  const [activeVisibility, setActiveVisibility] = useState<VisibilityLevel | 'all'>('all');
  const { routesGeoJson, routesError } = useRoutesGeoJson();

  const filteredArtworks = useMemo(() => {
    return artworks.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchType = activeType === 'all' || a.type === activeType;
      const matchNeigh = activeNeighborhood === 'all' || a.neighborhood === activeNeighborhood;
      const matchVis = activeVisibility === 'all' || a.visibility === activeVisibility;
      return matchCat && matchType && matchNeigh && matchVis;
    });
  }, [artworks, activeCategory, activeType, activeNeighborhood, activeVisibility, language]);

  const itineraryPath = useMemo(() => {
    if (!activeItineraryIds) return null;
    return activeItineraryIds
      .map(id => artworks.find(a => a.id === id))
      .filter((a): a is Artwork => !!a)
      .map(a => [a.location.lat, a.location.lng] as [number, number]);
  }, [activeItineraryIds, artworks, language]);

  const defaultCenter: [number, number] = [45.0725, 7.684];
  const center: [number, number] = selectedArtwork 
    ? [selectedArtwork.location.lat, selectedArtwork.location.lng] 
    : defaultCenter;

  const FilterPills = ({ 
    label, 
    options, 
    activeValue, 
    onChange 
  }: { 
    label: string, 
    options: string[], 
    activeValue: string, 
    onChange: (val: any) => void 
  }) => {
    const getLabel = (opt: string) => {
      if (opt === 'all') return 'All';
      const labels: Record<string, string> = {
        'contemporanea': 'Contemporary',
        'storica': 'Historical',
        'monumento': 'Monument',
        'hidden-art': 'Hidden Art',
        'sculture': 'Sculptures',
        'murale': 'Murals',
        'architettura': 'Architecture',
        'installazione-urbana': 'Urban Installation',
        'iconico': 'Iconics',
        'poco-conosciuto': 'Lesser Known',
        'molto-nascosto': 'Very Hidden',
        'centro': 'City Center',
        'quadrilatero': 'Quadrilatero',
        'san-salvario': 'San Salvario',
        'borgo-po': 'Borgo Po',
        'vanchiglia': 'Vanchiglia',
        'campidoglio': 'Campidoglio'
      };
      return labels[opt] || opt.replace('-', ' ');
    };

    return (
      <div className="flex flex-col gap-1.5 min-w-fit pr-8 border-r border-border-color last:border-0 last:pr-0">
        <span className="text-[10px] uppercase tracking-[1px] font-black text-text-light/50 pl-1">{label}</span>
        <div className="flex gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border ${
                activeValue === opt 
                  ? "bg-accent-gold border-accent-gold text-white shadow-md shadow-accent-gold/20" 
                  : "bg-white border-border-color text-text-light hover:border-accent-gold/40 hover:text-accent-gold"
              }`}
            >
              {getLabel(opt)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
  <div className="w-full h-full flex flex-col relative group min-w-0">
    {/* Scrollable Filter Bar */}
     {showFilters && (
    <div className="bg-white border-b border-border-color px-4 md:px-6 py-2 md:py-3 z-[900] shadow-sm overflow-x-auto hide-scrollbar w-full max-w-full box-border shrink-0">
      <div className="flex gap-4 md:gap-6 items-center w-max min-w-max flex-nowrap whitespace-nowrap pr-12">
        <FilterPills 
          label="Category" 
          options={['all', 'contemporanea', 'storica', 'monumento', 'hidden-art']} 
          activeValue={activeCategory} 
          onChange={setActiveCategory} 
        />

        <FilterPills 
          label="Type" 
          options={['all', 'sculture', 'murale', 'architettura', 'installazione-urbana']} 
          activeValue={activeType} 
          onChange={setActiveType} 
        />

        <FilterPills 
          label="Neighborhood" 
          options={['all', 'centro', 'quadrilatero', 'san-salvario', 'borgo-po', 'vanchiglia', 'campidoglio']} 
          activeValue={activeNeighborhood} 
          onChange={setActiveNeighborhood} 
        />

        <FilterPills 
          label="Visibility" 
          options={['all', 'iconico', 'poco-conosciuto', 'molto-nascosto']} 
          activeValue={activeVisibility} 
          onChange={setActiveVisibility} 
        />
      </div>
    </div>
     )}

    <div className="flex-grow relative min-h-0 bg-bg-canvas">
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1000] opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* MAP LEGEND OR INFO PERCORSO */}
      {isGuidedMode && selectedItinerary ? (
        <div className="absolute bottom-6 left-6 z-[1001] bg-white/95 backdrop-blur-sm border border-border-color shadow-xl rounded-sm w-[260px] md:w-[320px] pointer-events-auto transition-all duration-300">
          <button 
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between text-left border-b border-border-color bg-gray-50/50 hover:bg-gray-50 transition-colors border-0 cursor-pointer"
          >
            <span className="text-[10px] uppercase tracking-[1.5px] font-black text-accent-gold flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
              {t("Route Info")}
            </span>
            <span className="text-xs text-text-light font-bold select-none">
              {legendExpanded ? "−" : "+"}
            </span>
          </button>
          
          {legendExpanded && (
            <div className="p-3.5 space-y-3.5 shrink-0 text-xs text-text-main overflow-y-auto max-h-[220px] sidebar-scroll">
              <div>
                <span className="block text-[8px] font-mono font-black uppercase text-accent-gold/80 tracking-widest leading-none mb-1">
                  {t("RECOMMENDED FOR")}
                </span>
                <p className="text-[11px] text-text-main font-medium leading-snug">
                  {selectedItinerary.target || t("Art enthusiasts and urban explorers")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-[8px] font-mono font-black uppercase text-text-light tracking-widest leading-none mb-1">
                    {t("DISTANCE")}
                  </span>
                  <p className="text-[11px] text-text-main font-black leading-none">
                    {selectedItinerary.totalDistance || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="block text-[8px] font-mono font-black uppercase text-text-light tracking-widest leading-none mb-1">
                    {t("DURATION")}
                  </span>
                  <p className="text-[11px] text-text-main font-black leading-none">
                    {selectedItinerary.duration || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-[8px] font-mono font-black uppercase text-text-light tracking-widest leading-none mb-1">
                    {t("DIFFICULTY")}
                  </span>
                  <p className="text-[11px] text-text-main font-bold leading-none">
                    {selectedItinerary.difficulty || t("Easy")}
                  </p>
                </div>
                <div>
                  <span className="block text-[8px] font-mono font-black uppercase text-text-light tracking-widest leading-none mb-1">
                    {t("ACCESSIBILITY")}
                  </span>
                  <p className="text-[10px] md:text-[11px] text-text-main leading-tight font-medium">
                    {selectedItinerary.accessibility || "Standard"}
                  </p>
                </div>
              </div>

              {selectedItinerary.warnings && (
                <div className="pt-2 border-t border-border-color/60">
                  <span className="block text-[8px] font-mono font-black uppercase text-[#A41034] tracking-widest leading-none mb-1">
                    {t("PRACTICAL NOTES / WARNINGS")}
                  </span>
                  <p className="text-[10px] text-text-light leading-normal italic">
                    {selectedItinerary.warnings}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 z-[1001] bg-white/95 backdrop-blur-sm border border-border-color shadow-xl rounded-sm w-[240px] md:w-[280px] pointer-events-auto transition-all duration-300">
          <button 
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between text-left border-b border-border-color bg-gray-50/50 hover:bg-gray-50 transition-colors border-0 cursor-pointer"
          >
            <span className="text-[10px] uppercase tracking-[1.5px] font-black text-text-main flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
              {t("Legend")}
            </span>
            <span className="text-xs text-text-light font-bold select-none">
              {legendExpanded ? "−" : "+"}
            </span>
          </button>
          
          {legendExpanded && (
            <div className="p-3.5 space-y-3 shrink-0 select-none">
              {/* Contemporanea */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#A41034] border border-[#A41034]/20 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3Z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-text-main uppercase tracking-wider leading-none mb-0.5">Contemporary</h4>
                  <p className="text-[9px] text-text-light leading-snug">Contemporary installations</p>
                </div>
              </div>

              {/* Storica */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#1a1a1a] border border-[#1a1a1a]/20 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M3 21h18"/>
                    <path d="M5 21V9l7-5 7 5v12"/>
                    <path d="M9 21v-8h6v8"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-text-main uppercase tracking-wider leading-none mb-0.5">Historical</h4>
                  <p className="text-[9px] text-text-light leading-snug">Historical landmarks</p>
                </div>
              </div>

              {/* Monumento */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#c5a059] border border-[#c5a059]/20 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M4 21h16"/>
                    <path d="M6 18h12"/>
                    <path d="M8 18V9"/>
                    <path d="M16 18V9"/>
                    <path d="M12 3l7 6H5l7-6Z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-text-main uppercase tracking-wider leading-none mb-0.5">Monument</h4>
                  <p className="text-[9px] text-text-light leading-snug">Key sculptures & columns</p>
                </div>
              </div>

              {/* Hidden Art */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#c5a059] border border-[#c5a059]/20 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-text-main uppercase tracking-wider leading-none mb-0.5">Hidden Art</h4>
                  <p className="text-[9px] text-text-light leading-snug">Courtyard secret gems & details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute top-4 right-4 z-[1001] bg-white/95 backdrop-blur-sm border border-border-color shadow-lg rounded-sm py-2 px-3 flex flex-col gap-1.5 pointer-events-auto transition-all duration-300 w-[240px] md:w-[280px]">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={showServices} 
            onChange={(e) => setShowServices(e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent-gold" />
          <span className="text-[10px] font-black uppercase tracking-wider text-text-main flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
            {selectedItinerary 
              ? "Show nearby services" 
              : "Show services"
            }
          </span>
        </label>

        {showServices && (
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border-color/60 mt-1">
            {[
              { value: "all", label: "All" },
              { value: "cafe", label: "Café" },
              { value: "bar", label: "Bar" },
              { value: "ice_cream", label: "Gelaterias" },
              { value: "transport", label: "Transit Stops" },
              { value: "bike_sharing", label: "Bike sharing" }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setServiceFilter(opt.value as any)}
                className={`px-1.5 py-0.5 rounded-[2px] text-[8px] md:text-[9px] uppercase tracking-wider font-bold transition-all border leading-none ${
                  serviceFilter === opt.value
                    ? "bg-accent-gold border-accent-gold text-white shadow-sm font-black"
                    : "bg-white border-border-color text-text-light hover:border-accent-gold/40 hover:text-accent-gold"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {!selectedItinerary && showServices && mapZoom < 14 && (
          <div className="text-[8px] font-mono uppercase font-bold text-[#A41034] tracking-wider leading-none text-right animate-pulse mt-1">
            Zoom in to view
          </div>
        )}
      </div>
      
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="h-full w-full"
        
      >
        <ZoomTracker onZoomChange={setMapZoom} />
        <InvalidateMapSize trigger={activeItineraryIds?.join("-") || "default"} />
        <InvalidateMapSize trigger={containerSizeChanged} />
        {isGuidedMode && !segmentLayerFailed ? (
          <ItinerarySegmentLayer
            selectedItinerary={selectedItinerary ?? null}
            currentStopIndex={currentStopIndex}
            onFallback={() => setSegmentLayerFailed(true)}
          />
        ) : (
          <ItineraryRouteLayer
            routesGeoJson={routesGeoJson}
            selectedItinerary={selectedItinerary ?? null}
          />
        )}



        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      


       {selectedArtwork && (
  <ChangeView
    center={center}
    id={selectedArtwork.id}
    offsetX={selectionOffsetX}
  />
)}
      

        {itineraryPath && itineraryPath.length > 1 && !selectedItinerary?.route_id && (
          <Polyline 
            positions={itineraryPath} 
            color="#c5a059" 
            weight={3} 
            dashArray="10, 10" 
            opacity={0.6} 
          />
        )}

        {filteredArtworks.map((artwork) => {
          const isGuided = !!isGuidedMode && !!activeItineraryIds;
          const isCurrent = isGuided && activeItineraryIds?.[currentStopIndex] === artwork.id;
          const isNext = isGuided && activeItineraryIds?.[currentStopIndex + 1] === artwork.id;

          return (
            <Marker 
              key={artwork.id} 
              position={[artwork.location.lat, artwork.location.lng]}
              icon={createIcon(
                artwork.category, 
                selectedArtwork?.id === artwork.id,
                isGuided,
                isCurrent,
                isNext,
                isGuided ? activeItineraryIds.indexOf(artwork.id) + 1 : undefined
              )}
              eventHandlers={{
                popupopen: () => onMarkerClick?.()
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex gap-3 items-start mb-3">
                    <div className="w-12 h-12 rounded bg-gray-100 border border-border-color flex-shrink-0 flex items-center justify-center overflow-hidden thumb-img">
                      {artwork.thumbnail_url ? (
                        <img
                          src={artwork.thumbnail_url}
                          alt={artwork.image_alt || artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[6px] uppercase tracking-tighter text-text-light/40 text-center">
                          Thumbnail<br />Placeholder
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] uppercase tracking-tighter text-accent-gold font-bold px-1.5 py-0.5 bg-accent-gold/10 rounded">
                          {(() => {
                            switch (artwork.category) {
                              case "contemporanea": return "Contemporary";
                              case "storica": return "Historical";
                              case "monumento": return "Monument";
                              case "hidden-art": return "Hidden Art";
                              default: return artwork.category;
                            }
                          })()}
                        </span>

                        <span className="text-[8px] uppercase tracking-widest text-text-light opacity-60">
                          {artwork.visibility.replace('-', ' ')}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-sm leading-tight text-text-main">
                        {artwork.title}
                      </h3>

                      <p className="text-[9px] uppercase tracking-widest text-text-light mt-0.5">
                        {artwork.artist}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border-color flex justify-between items-center">
                    <span className="text-[9px] italic text-text-light font-medium">
                      {artwork.neighborhood.replace('-', ' ')}
                    </span>

                    <button 
                      onClick={() => onArtworkSelect?.(artwork)}
                      className="text-[10px] uppercase font-bold text-accent-gold hover:underline"
                    >
                      Details &rarr;
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {displayedServices.map((service, index) => {
          const coords = service.geometry?.coordinates;
          if (!coords || coords.length < 2) return null;
          const pos: [number, number] = [coords[1], coords[0]];
          const properties = service.properties || {};
          const sType = properties.service_type || "";
          const sSubtype = properties.service_subtype || "";

          return (
            <Marker
              key={`service-${properties.full_id || properties.osm_id || 'no-id'}-${properties.route_id || 'all'}-${index}`}
              position={pos}
              icon={createServiceIcon(sType, sSubtype)}
            >
              <Popup>
                <ServicePopup properties={properties} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  </div>
);
}