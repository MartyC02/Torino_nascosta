export type ArtworkCategory = 'contemporanea' | 'storica' | 'monumento' | 'hidden-art';

export type VisibilityLevel = 'molto-nascosto' | 'poco-conosciuto' | 'iconico';

export type ArtworkType = 'affreschi' | 'sculture' | 'murale' | 'cortili-segreti' | 'architettura' | 'installazione-urbana';

export type Neighborhood = 'quadrilatero' | 'san-salvario' | 'vanchiglia' | 'centro' | 'borgo-po' | 'san-donato' | 'campidoglio';

export interface Artwork {
  id: string;
  title: string;
  title_it?: string;
  artist: string;
  description: string;
  description_it?: string;
  category: ArtworkCategory;
  type: ArtworkType;
  neighborhood: Neighborhood;
  visibility: VisibilityLevel;
  period: string;
  period_it?: string;
  year?: string;
  material_short?: string;
  material_short_it?: string;
  material_details: string;
  material_details_it?: string;
  reuse_context: string;
  reuse_context_it?: string;
  historical_context: string;
  historical_context_it?: string;
  historicalContext_it?: string;
  shortDescription_it?: string;
  curiosity_it?: string;
  narrative_it?: string;
  details_it?: string;
  locationDescription_it?: string;

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
  title_it?: string;
  dateLabel: string;
  image_url: string;
  image_alt: string;
  description: string;
  description_it?: string;
  interpretation: string;
  interpretation_it?: string;
  artworkIds: string[];
}

export type Page = "home" | "explore" | "timeline" | "itineraries";

export interface Itinerary {
  id: string;
  route_id?: string;
  title: string;
  title_it?: string;
  description: string;
  description_it?: string;
  narrative?: string;
  narrative_it?: string;
  artworkIds: string[];
  duration: string;
  walkingTimes?: string[]; // Times between stops: [stop1->stop2, stop2->stop3, ...]
  target?: string;
  target_it?: string;
  accessibility?: string;
  accessibility_it?: string;
  difficulty?: string;
  difficulty_it?: string;
  totalDistance?: string;
  routeType?: string;
  routeType_it?: string;
  bestFor?: string;
  bestFor_it?: string;
  warnings?: string;
  warnings_it?: string;
}
