const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

export interface PlacesResult {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
}

export async function findVendorRating(vendorName: string, country?: string): Promise<PlacesResult | null> {
  if (!PLACES_KEY) return null;

  const query = country ? `${vendorName} ${country}` : vendorName;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${PLACES_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{
        place_id: string;
        rating?: number;
        user_ratings_total?: number;
      }>;
    };

    const place = data.results?.[0];
    if (!place) return null;

    return {
      placeId: place.place_id,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    };
  } catch {
    return null;
  }
}
