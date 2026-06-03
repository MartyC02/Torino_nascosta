import { Artwork } from "../types";
import { MapPin, User, Info, Layers } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface ArtworkListProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  onViewOnMap: (artwork: Artwork) => void;
  selectedArtworkId?: string;
}

export function ArtworkList({
  artworks,
  onSelectArtwork,
  onViewOnMap,
  selectedArtworkId,
}: ArtworkListProps) {
  const { t, formatCategory, formatType, formatVisibility, formatNeighborhood } = useLanguage();
  
  const getCategoryTheme = (category: string) => {
    const label = formatCategory(category);
    switch (category) {
      case "contemporanea":
        return {
          bg: "bg-[#A41034]/10",
          text: "text-[#A41034]",
          border: "border-[#A41034]/20",
          label,
        };
      case "storica":
        return {
          bg: "bg-black/10",
          text: "text-black",
          border: "border-black/20",
          label,
        };
      case "monumento":
        return {
          bg: "bg-accent-gold/10",
          text: "text-accent-gold",
          border: "border-accent-gold/20",
          label,
        };
      case "hidden-art":
        return {
          bg: "bg-accent-gold/10",
          text: "text-accent-gold",
          border: "border-accent-gold/20",
          label,
        };
      default:
        return {
          bg: "bg-accent-gold/10",
          text: "text-accent-gold",
          border: "border-accent-gold/20",
          label,
        };
    }
  };

  const getVisibilityLabel = (vis: string) => formatVisibility(vis);
  const getTypeLabel = (type: string) => formatType(type);
  const getNeighborhoodLabel = (neigh: string) => formatNeighborhood(neigh);

  if (artworks.length === 0) {
    return (
      <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-bg-canvas animate-fadeIn">
        <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mb-4">
          <Info size={32} className="text-accent-gold" />
        </div>
        <h3 className="font-serif text-2xl italic text-text-main mb-2">
          {t("No works found")}
        </h3>
        <p className="text-sm text-text-light max-w-sm">
          {t("No masterpieces match your currently selected filters. Try broadening your criteria!")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-bg-canvas p-6 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs uppercase tracking-[3px] font-bold text-text-light/60">
            {t("Showing")}{" "}{artworks.length}{" "}{t("filtered " + (artworks.length === 1 ? "work" : "works"))}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {artworks.map((artwork) => {
            const catStyle = getCategoryTheme(artwork.category);
            const isSelected = selectedArtworkId === artwork.id;

            return (
              <div
                key={artwork.id}
                className={`group bg-white border rounded-sm transition-all overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-accent-gold/30 ${
                  isSelected 
                    ? "border-accent-gold ring-1 ring-accent-gold/20 shadow-lg scale-[1.01]" 
                    : "border-border-color shadow-sm"
                }`}
              >
                {/* Visual Thumbnail Frame */}
                <div className="w-full aspect-[16/10] bg-gray-50 border-b border-border-color relative overflow-hidden shrink-0">
                  {artwork.image_url || artwork.thumbnail_url ? (
                    <img
                      src={artwork.image_url || artwork.thumbnail_url}
                      alt={artwork.image_alt || artwork.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-text-light/30">
                      {t("No Image Available")}
                    </div>
                  )}

                  {/* Badge Row Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 animate-fadeIn">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold shadow-sm border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      {catStyle.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold bg-white/95 text-text-main border border-border-color shadow-sm">
                      {getTypeLabel(artwork.type)}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 z-10 animate-fadeIn">
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold bg-sidebar-bg text-accent-gold shadow-sm">
                      {getVisibilityLabel(artwork.visibility)}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-grow flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-accent-gold mb-2.5">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{getNeighborhoodLabel(artwork.neighborhood)}</span>
                    </div>

                    <h3 className="font-serif italic text-2xl text-text-main mb-2 leading-tight group-hover:text-accent-gold transition-colors truncate">
                      {artwork.title}
                    </h3>

                    {artwork.artist && (
                      <div className="flex items-center gap-1.5 text-xs text-text-light/80 mb-4 font-medium italic">
                        <User size={12} className="shrink-0 text-text-light/50" />
                        <span className="truncate">{artwork.artist}</span>
                      </div>
                    )}

                    <p className="text-xs text-text-light leading-relaxed font-light line-clamp-3 mb-6">
                      {artwork.description}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border-color shrink-0 mt-auto">
                    <button
                      onClick={() => onSelectArtwork(artwork)}
                      className={`flex-1 py-2 text-[10px] uppercase tracking-[1.5px] font-bold border transition-all text-center rounded-sm cursor-pointer ${
                        isSelected
                          ? "bg-accent-gold border-accent-gold text-white"
                          : "bg-white border-border-color text-text-main hover:bg-bg-canvas"
                      }`}
                    >
                      {t("Open Details")}
                    </button>
                    <button
                      onClick={() => onViewOnMap(artwork)}
                      className="flex-1 py-2 text-[10px] uppercase tracking-[1.5px] font-bold bg-sidebar-bg text-accent-gold hover:bg-black transition-all text-center rounded-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers size={11} />
                      {t("View on map")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
