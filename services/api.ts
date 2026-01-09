import { CinemaProfile, Movie } from "../types";

export const fetchData = async (): Promise<{ profile: CinemaProfile | null, movies: Movie[] }> => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return { profile: null, movies: [] };
  }
};

export const saveData = async (profile: CinemaProfile, movies: Movie[]): Promise<void> => {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile, movies }),
    });
  } catch (error) {
    console.error("Failed to save data:", error);
  }
};