import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import { Artwork, ArtworkCategory, ArtworkType, Neighborhood, VisibilityLevel } from "../types";
import L from "leaflet";
import { useEffect, useState, useMemo, useRef } from "react";
import { Filter, Map as MapIcon, X } from "lucide-react";


// Helper for custom markers based on category
const createIcon = (category: ArtworkCategory, isSelected: boolean) => {
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

  return L.divIcon({
    className: `custom-div-icon ${isSelected ? 'highlighted-pin' : ''}`,
    html: `
      <div class="marker-container" style="
        background-color: ${isSelected ? '#c5a059' : color};
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: 2px solid white;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        ${isSelected ? 'transform: scale(1.3); filter: drop-shadow(0 0 8px rgba(197, 160, 89, 0.6));' : ''}
      ">
        ${iconSvg}
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
export function Map({ artworks, selectedArtwork, onArtworkSelect, onMarkerClick, activeItineraryIds, containerSizeChanged, showFilters = true,selectionOffsetX = 0, }: MapProps) {
  const [activeCategory, setActiveCategory] = useState<ArtworkCategory | 'all'>('all');
  const [activeType, setActiveType] = useState<ArtworkType | 'all'>('all');
  const [activeNeighborhood, setActiveNeighborhood] = useState<Neighborhood | 'all'>('all');
  const [activeVisibility, setActiveVisibility] = useState<VisibilityLevel | 'all'>('all');

  const filteredArtworks = useMemo(() => {
    return artworks.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchType = activeType === 'all' || a.type === activeType;
      const matchNeigh = activeNeighborhood === 'all' || a.neighborhood === activeNeighborhood;
      const matchVis = activeVisibility === 'all' || a.visibility === activeVisibility;
      return matchCat && matchType && matchNeigh && matchVis;
    });
  }, [artworks, activeCategory, activeType, activeNeighborhood, activeVisibility]);

  const itineraryPath = useMemo(() => {
    if (!activeItineraryIds) return null;
    return activeItineraryIds
      .map(id => artworks.find(a => a.id === id))
      .filter((a): a is Artwork => !!a)
      .map(a => [a.location.lat, a.location.lng] as [number, number]);
  }, [activeItineraryIds, artworks]);

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

    <div className="flex-grow relative min-h-0">
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1000] opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <InvalidateMapSize trigger={activeItineraryIds?.join("-") || "default"} />
        <InvalidateMapSize trigger={containerSizeChanged} />

        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {itineraryPath && !selectedArtwork && (
          <FitItineraryBounds
            positions={itineraryPath}
            fitKey={activeItineraryIds?.join("-") || "default"}
          />
        )}

       {selectedArtwork && (
  <ChangeView
    center={center}
    id={selectedArtwork.id}
    offsetX={selectionOffsetX}
  />
)}
        {itineraryPath && itineraryPath.length > 1 && (
          <Polyline 
            positions={itineraryPath} 
            color="#c5a059" 
            weight={3} 
            dashArray="10, 10" 
            opacity={0.6} 
          />
        )}

        {filteredArtworks.map((artwork) => (
          <Marker 
            key={artwork.id} 
            position={[artwork.location.lat, artwork.location.lng]}
            icon={createIcon(artwork.category, selectedArtwork?.id === artwork.id)}
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
                        {artwork.category}
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
        ))}
      </MapContainer>
    </div>
  </div>
);
}