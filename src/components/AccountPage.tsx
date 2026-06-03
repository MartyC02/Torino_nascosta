import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { ARTWORKS } from "../constants";
import { Artwork } from "../types";
import { useLanguage } from "./LanguageContext";
import { Heart, MapPin, Eye, ArrowLeft, Loader2 } from "lucide-react";

// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
try {
  // @ts-ignore
  if (window.supabase) {
    // @ts-ignore
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Failed to initialize Supabase inside AccountPage:", err);
}

interface AccountPageProps {
  onBack: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
}

export function AccountPage({ onBack, onSelectArtwork }: AccountPageProps) {
  const { user, profile } = useAuth();
  const { t, translateArtwork, formatCategory, formatVisibility, formatNeighborhood } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [toVisitIds, setToVisitIds] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"likes" | "to_visit" | "visited">("likes");

  const [errorMsg, setErrorMsg] = useState("");

  const loadUserData = async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch liked artworks
      const { data: likesData, error: likesError } = await supabase
        .from("artwork_likes")
        .select("artwork_id")
        .eq("user_id", user.id);

      if (likesError) console.error("Error fetching likes for account page:", likesError);
      else if (likesData) {
        setLikedIds(likesData.map((d: any) => d.artwork_id));
      }

      // 2. Fetch statuses
      const { data: statusData, error: statusError } = await supabase
        .from("user_artwork_status")
        .select("artwork_id, status")
        .eq("user_id", user.id);

      if (statusError) console.error("Error fetching statuses for account page:", statusError);
      else if (statusData) {
        const toVisit: string[] = [];
        const visited: string[] = [];
        statusData.forEach((row: any) => {
          if (row.status === "to_visit") {
            toVisit.push(row.artwork_id);
          } else if (row.status === "visited") {
            visited.push(row.artwork_id);
          }
        });
        setToVisitIds(toVisit);
        setVisitedIds(visited);
      }
    } catch (err) {
      console.error("Critical error in loadUserData:", err);
      setErrorMsg("Could not load account data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Map IDs to original Artwork data
  const getArtworksFromIds = (ids: string[]): Artwork[] => {
    return ARTWORKS.filter((art) => ids.includes(art.id)).map(translateArtwork);
  };

  const currentArtworksList: Artwork[] = (() => {
    if (activeTab === "likes") return getArtworksFromIds(likedIds);
    if (activeTab === "to_visit") return getArtworksFromIds(toVisitIds);
    return getArtworksFromIds(visitedIds);
  })();

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 bg-bg-canvas text-center">
        <p className="text-text-light text-base mb-4 font-serif italic">{t("Please sign in to view your account details.")}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-sidebar-bg text-accent-gold uppercase tracking-wider text-xs font-bold transition-all hover:scale-105 cursor-pointer"
        >
          {t("Go Back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col overflow-auto h-full bg-bg-canvas relative">
      {/* Upper header */}
      <div className="bg-sidebar-bg text-white py-12 px-6 md:px-12 border-b border-white/10 flex flex-col justify-start relative overflow-hidden">
        <button
          onClick={onBack}
          className="absolute top-4 left-6 flex items-center gap-2 text-white/60 hover:text-white text-xs uppercase tracking-widest font-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> {t("Go Back")}
        </button>

        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-accent-gold/25 border-2 border-accent-gold flex items-center justify-center text-accent-gold text-2xl md:text-4xl font-serif italic uppercase shadow-inner">
              {profile?.first_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-serif italic text-2xl md:text-4xl text-accent-gold">
                {profile?.first_name} {profile?.last_name || ""}
              </h2>
              <p className="text-xs text-white/60 font-mono tracking-wider mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 bg-black/10 border border-white/5 p-4 rounded-sm">
            <div className="text-center min-w-[70px]">
              <span className="block text-xl font-serif text-accent-gold font-bold">{likedIds.length}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/50">{t("Favorited")}</span>
            </div>
            <div className="border-r border-white/10" />
            <div className="text-center min-w-[70px]">
              <span className="block text-xl font-serif text-accent-gold font-bold">{toVisitIds.length}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/50">{t("To Visit")}</span>
            </div>
            <div className="border-r border-white/10" />
            <div className="text-center min-w-[70px]">
              <span className="block text-xl font-serif text-accent-gold font-bold">{visitedIds.length}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/50">{t("Visited")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main interaction tabs */}
      <div className="p-6 md:p-12 flex-grow max-w-7xl w-full mx-auto flex flex-col min-h-0">
        <div className="flex border-b border-border-color shrink-0">
          {[
            { value: "likes", label: t("Favorites"), count: likedIds.length, icon: Heart },
            { value: "to_visit", label: t("To visit"), count: toVisitIds.length, icon: MapPin },
            { value: "visited", label: t("Visited"), count: visitedIds.length, icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`flex items-center gap-2.5 px-6 py-4 border-b-2 font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all relative ${
                  isTabActive
                    ? "border-accent-gold text-accent-gold font-black"
                    : "border-transparent text-text-light hover:text-text-main"
                }`}
              >
                <Icon size={14} className={isTabActive ? "text-accent-gold" : "text-text-light"} />
                <span>{tab.label}</span>
                <span className={`text-[9px] opacity-75 font-mono px-1.5 py-0.5 rounded-full ${isTabActive ? "bg-accent-gold/10 text-accent-gold" : "bg-gray-100 text-text-light"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content body with responsive columns */}
        <div className="mt-8 flex-grow">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 text-sm mb-6 rounded border border-red-200">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-light gap-2 font-mono text-xs uppercase tracking-widest leading-none">
              <Loader2 className="animate-spin text-accent-gold" size={24} />
              <span>{t("Loading account data...")}</span>
            </div>
          ) : currentArtworksList.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-border-color/60 bg-white/50 rounded-sm">
              <p className="text-text-light italic font-serif text-sm">
                {activeTab === "likes" && t("You haven't favorited any artwork yet.")}
                {activeTab === "to_visit" && t("You haven't saved any artwork to visit.")}
                {activeTab === "visited" && t("You haven't marked any artwork as visited yet.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentArtworksList.map((artwork) => {
                const artImage = artwork.thumbnail_url || artwork.image_url || "/placeholder.jpg";
                return (
                  <div
                    key={artwork.id}
                    onClick={() => onSelectArtwork(artwork)}
                    className="bg-white border border-border-color/80 shadow-sm hover:shadow-md hover:border-accent-gold/40 transition-all group cursor-pointer rounded-sm overflow-hidden flex flex-col"
                  >
                    {/* Thumbnail container */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-bg-canvas">
                      <img
                        referrerPolicy="no-referrer"
                        src={artImage}
                        alt={artwork.image_alt || artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-sidebar-bg/90 text-white border border-white/5 px-2.5 py-1 text-[8px] uppercase tracking-widest font-bold backdrop-blur-sm">
                        {formatCategory(artwork.category)}
                      </span>
                    </div>

                    {/* Meta area */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h4 className="font-serif italic text-lg text-text-main group-hover:text-accent-gold transition-colors leading-tight mb-1 truncate">
                        {artwork.title}
                      </h4>
                      <p className="text-[10px] text-text-light/80 uppercase font-bold tracking-wider leading-none">
                        {t("by")} {artwork.artist}
                      </p>
                      
                      <div className="border-t border-border-color/60 mt-4 pt-3 flex items-center justify-between text-[10px] text-text-light/70 uppercase tracking-widest font-black leading-none">
                        <span>{formatNeighborhood(artwork.neighborhood)}</span>
                        <span>{formatVisibility(artwork.visibility)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
