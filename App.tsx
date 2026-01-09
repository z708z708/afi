import React, { useState, useEffect } from 'react';
import { Registration } from './components/Registration';
import { AdminPanel } from './components/AdminPanel';
import { FoyerDisplay } from './components/FoyerDisplay';
import { AppView, CinemaProfile, Movie, ScreenConfig } from './types';
import { fetchData, saveData } from './services/api';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.REGISTRATION);
  const [profile, setProfile] = useState<CinemaProfile | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from Database on mount
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const { profile: loadedProfile, movies: loadedMovies } = await fetchData();
        
        if (loadedProfile) {
            // Migration logic if needed (ensuring screenConfig structure)
            if (loadedProfile.screens && typeof loadedProfile.screens[0] === 'string') {
               const migratedScreens: ScreenConfig[] = (loadedProfile.screens as unknown as string[]).map((name, idx) => ({
                  id: idx,
                  name: name,
                  rotation: 0,
                  showSchedule: false
              }));
              loadedProfile.screens = migratedScreens;
            }

            setProfile(loadedProfile);
            setMovies(loadedMovies || []);
            setView(AppView.DASHBOARD);
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const handleRegistrationComplete = async (newProfile: CinemaProfile, demoMovies?: Movie[]) => {
    setProfile(newProfile);
    const initialMovies = demoMovies || [];
    setMovies(initialMovies);
    
    await saveData(newProfile, initialMovies);
    setView(AppView.DASHBOARD);
  };

  const handleProfileUpdate = async (updatedProfile: CinemaProfile) => {
    setProfile(updatedProfile);
    await saveData(updatedProfile, movies);
  };

  const handleMoviesUpdate: React.Dispatch<React.SetStateAction<Movie[]>> = (value) => {
      // Wrapper to handle both functional updates and direct values for setMovies
      // and ensure persistence
      setMovies(prev => {
          const newMovies = typeof value === 'function' ? value(prev) : value;
          // Persist (debounce could be added here for optimization)
          if (profile) {
              saveData(profile, newMovies);
          }
          return newMovies;
      });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white gap-3">
        <Loader2 className="animate-spin w-8 h-8 text-red-600" />
        <span className="font-light tracking-widest uppercase">Загрузка системы...</span>
      </div>
    );
  }

  return (
    <>
      {view === AppView.REGISTRATION && (
        <Registration onComplete={handleRegistrationComplete} />
      )}
      
      {view === AppView.DASHBOARD && profile && (
        <AdminPanel 
          profile={profile} 
          onUpdateProfile={handleProfileUpdate}
          movies={movies} 
          setMovies={handleMoviesUpdate}
          onLaunchFoyer={() => setView(AppView.FOYER_DISPLAY)}
        />
      )}

      {view === AppView.FOYER_DISPLAY && profile && (
        <FoyerDisplay 
          movies={movies} 
          profile={profile}
          onExit={() => setView(AppView.DASHBOARD)}
        />
      )}
    </>
  );
};

export default App;