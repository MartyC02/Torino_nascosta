export type ArtworkCategory = 'contemporanea' | 'storica' | 'monumento' | 'hidden-art';

export type VisibilityLevel = 'molto-nascosto' | 'poco-conosciuto' | 'iconico';

export type ArtworkType = 'affreschi' | 'sculture' | 'murale' | 'cortili-segreti' | 'architettura' | 'installazione-urbana';

export type Neighborhood = 'quadrilatero' | 'san-salvario' | 'vanchiglia' | 'centro' | 'borgo-po' | 'san-donato' | 'campidoglio';

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  category: ArtworkCategory;
  type: ArtworkType;
  neighborhood: Neighborhood;
  visibility: VisibilityLevel;
  period: string;
  year?: string;
  material_short?: string;
  material_details: string;
  reuse_context: string;
  historical_context: string;

  timeline_year?: number;
 
  model_url?: string;
  image_url?: string;
  thumbnail_url?: string;
  image_alt?: string;


  before_image_url?: string;
  after_image_url?: string;
  before_image_alt?: string;
  after_image_alt?: string;

  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

export interface TimelineEra {
  id: string;
  title: string;
  dateLabel: string;
  image_url: string;
  image_alt: string;
  description: string;
  interpretation: string;
  artworkIds: string[];
}

export type Page = "home" | "explore" | "timeline" | "itineraries";

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  narrative?: string;
  artworkIds: string[];
  duration: string;
  walkingTimes?: string[]; // Times between stops: [stop1->stop2, stop2->stop3, ...]
}
