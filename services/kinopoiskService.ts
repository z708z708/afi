import { Movie } from "../types";

// Using standard unofficial Kinopoisk API endpoint
const BASE_URL = 'https://api.kinopoisk.dev';

interface KpPerson {
  id: number;
  photo: string;
  name: string;
  enName: string;
  description: string;
  profession: string;
  enProfession: string;
}

interface KpMovie {
  id: number;
  name: string;
  alternativeName: string;
  enName: string;
  type: string;
  year: number;
  description: string;
  shortDescription: string;
  rating: {
    kp: number;
    imdb: number;
  };
  poster: {
    url: string;
    previewUrl: string;
  };
  genres: { name: string }[];
  countries: { name: string }[];
  persons: KpPerson[];
  ageRating: number;
  movieLength?: number;
}

interface KpResponse {
  docs: KpMovie[];
  total: number;
  limit: number;
  page: number;
  pages: number;
}

const mapKpMovieToAppMovie = (kpMovie: KpMovie): Partial<Movie> & { kpId?: number } => {
    // Extract Director
    const director = kpMovie.persons?.find(p => p.enProfession === 'director' || p.profession === 'режиссер')?.name || 'Неизвестно';
    
    // Extract Actors (limit to 5)
    const actors = kpMovie.persons
        ?.filter(p => p.enProfession === 'actor' || p.profession === 'актер')
        .slice(0, 5)
        .map(p => p.name || p.enName || '')
        .filter(n => n) || [];

    return {
        kpId: kpMovie.id,
        title: kpMovie.name || kpMovie.alternativeName || kpMovie.enName || "Без названия",
        description: kpMovie.description || kpMovie.shortDescription || "Описание отсутствует",
        posterUrl: kpMovie.poster?.url || '',
        rating: kpMovie.rating?.kp?.toFixed(1) || kpMovie.rating?.imdb?.toFixed(1) || "0.0",
        year: kpMovie.year?.toString() || new Date().getFullYear().toString(),
        director,
        actors,
        ageRating: kpMovie.ageRating ? `${kpMovie.ageRating}+` : "12+",
        productionCompany: kpMovie.countries?.[0]?.name || "Unknown", 
    };
};

export const searchKinopoisk = async (
  query: string, 
  token: string
): Promise<(Partial<Movie> & { kpId?: number })[]> => {
  if (!token) {
    console.error("Kinopoisk: No token provided");
    return [];
  }

  try {
    const url = `${BASE_URL}/v1.4/movie/search?query=${encodeURIComponent(query)}&limit=10`;
    console.log(`Kinopoisk Search: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        console.error(`Kinopoisk API Error: ${response.status} ${response.statusText}`);
        return [];
    }

    const data: KpResponse = await response.json();
    
    if (!data.docs) {
       console.warn("Kinopoisk: No docs in response", data);
       return [];
    }
    
    if (data.docs.length === 0) {
       console.log("Kinopoisk: 0 results found");
       return [];
    }

    return data.docs.map(mapKpMovieToAppMovie);

  } catch (error) {
    console.error("Kinopoisk Fetch Exception:", error);
    return [];
  }
};

export const getKinopoiskMovieById = async (
    id: number,
    token: string
): Promise<Partial<Movie> | null> => {
    if (!token || !id) return null;

    try {
        const url = `${BASE_URL}/v1.4/movie/${id}`;
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': token,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
             console.error(`Kinopoisk Details Error: ${response.status}`);
             return null;
        }

        const data: KpMovie = await response.json();
        return mapKpMovieToAppMovie(data);
    } catch (error) {
        console.error("Kinopoisk Details Exception", error);
        return null;
    }
}
