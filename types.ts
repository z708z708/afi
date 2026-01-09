export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  rating: string; // IMDb or Kinopoisk
  director: string;
  actors: string[];
  year: string;
  description: string;
  productionCompany: string;
  ageRating: string;
  screenId: number; // Changed to number to support dynamic IDs
  showTimes: string[]; // e.g., ["10:00", "14:30"]
}

export interface CinemaTheme {
  backgroundColor: string; // Hex color for foyer background
  backgroundImage?: string; // Data URL for background image
  accentColor: string;     // Hex color for buttons and highlights
  textColor: string;       // Primary text color (Titles)
  mutedColor: string;      // Secondary text color (Descriptions, metadata)
}

export interface ScreenConfig {
  id: number;
  name: string;
  rotation: 0 | 90 | 180 | 270; // Rotation in degrees
  showSchedule: boolean; // Whether to inject a schedule slide into rotation
}

export interface CinemaProfile {
  name: string;
  address: string;
  screens: ScreenConfig[]; // Array of screen configurations
  apiKey: string; // Gemini API Key
  kinopoiskApiKey: string; // Kinopoisk API Key
  theme: CinemaTheme;
  rotationInterval: number; // Seconds to rotate movies
}

export enum AppView {
  REGISTRATION = 'REGISTRATION',
  DASHBOARD = 'DASHBOARD',
  FOYER_DISPLAY = 'FOYER_DISPLAY'
}
