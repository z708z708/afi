import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";

// Helper to get AI instance
const getAi = (apiKey: string) => new GoogleGenAI({ apiKey });

export const enrichMovieData = async (
  rawTitle: string,
  apiKey: string
): Promise<Partial<Movie>> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getAi(apiKey);
  
  const prompt = `Provide detailed movie metadata for the film titled: "${rawTitle}".
  If the input implies a specific year or version, respect it.
  Provide a placeholder standard generic poster URL from 'https://picsum.photos/seed/${rawTitle.replace(/\s/g, '')}/600/900'.
  IMPORTANT: All text content (description, genre, etc.) MUST be in RUSSIAN language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            rating: { type: Type.STRING, description: "IMDb or Kinopoisk rating ex: 8.5" },
            director: { type: Type.STRING },
            actors: { type: Type.ARRAY, items: { type: Type.STRING } },
            year: { type: Type.STRING },
            description: { type: Type.STRING, description: "Short plot summary in Russian (max 200 chars)" },
            productionCompany: { type: Type.STRING },
            ageRating: { type: Type.STRING, description: "e.g., 12+, 16+, 18+" },
            posterUrl: { type: Type.STRING }
          },
          required: ["title", "rating", "director", "year", "description", "ageRating", "posterUrl"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as Partial<Movie>;
  } catch (error) {
    console.error("AI Enrichment Error:", error);
    // Fallback for demo purposes if AI fails
    return {
      title: rawTitle,
      description: "Информация временно недоступна.",
      posterUrl: `https://picsum.photos/seed/${Math.random()}/600/900`
    };
  }
};

export const parseScheduleFileWithAI = async (
  fileContent: string,
  apiKey: string
): Promise<Partial<Movie>[]> => {
    if (!apiKey) throw new Error("API Key is missing");
    const ai = getAi(apiKey);

    const prompt = `
    Analyze the following raw schedule file content. 
    The format might be CSV or TXT with ';' delimiter.
    Each line represents a movie.
    Extract the movie title and potential showtimes.
    If details are missing, halluncinate plausible details based on the title.
    IMPORTANT: All text output MUST be in RUSSIAN.
    
    Raw Content:
    ${fileContent.substring(0, 5000)} 
    `;

    // Limit char count to avoid token limits in demo
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  rating: { type: Type.STRING },
                  director: { type: Type.STRING },
                  actors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  year: { type: Type.STRING },
                  description: { type: Type.STRING },
                  productionCompany: { type: Type.STRING },
                  ageRating: { type: Type.STRING },
                  posterUrl: { type: Type.STRING },
                  showTimes: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
          }
        }
    });

    const text = response.text;
    if(!text) return [];
    return JSON.parse(text);
}