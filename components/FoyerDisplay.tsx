import React, { useState, useEffect } from 'react';
import { Movie, CinemaProfile, ScreenConfig } from '../types';
import { Grid, Monitor, LogOut, Clock, Calendar } from 'lucide-react';

interface FoyerDisplayProps {
  movies: Movie[];
  profile: CinemaProfile;
  onExit: () => void;
}

// Special index to represent the schedule slide
const SCHEDULE_SLIDE_INDEX = -1;

const ScheduleCard: React.FC<{
    movies: Movie[];
    screenName: string;
    theme: CinemaProfile['theme'];
}> = ({ movies, screenName, theme }) => {
    // Flatten and sort all showtimes for this screen
    const scheduleItems = movies.flatMap(movie => 
        movie.showTimes.map(time => ({
            time,
            movie,
            timestamp: new Date(`1970/01/01 ${time}`).getTime()
        }))
    ).sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div 
            className="h-full w-full bg-slate-900 text-white flex flex-col relative overflow-hidden"
            style={{ 
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
             }}
        >
             {/* Overlay if image exists to ensure readability */}
             <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: theme.backgroundImage ? 'rgba(15, 23, 42, 0.9)' : undefined }}></div>

             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
             />

             {/* Header */}
             <div className="z-10 flex items-center justify-between p-8 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{screenName}</h2>
                    <p className="flex items-center gap-2 mt-1 text-lg font-light" style={{ color: theme.mutedColor }}>
                        <Calendar size={20}/> Расписание на сегодня
                    </p>
                 </div>
                 <div className="text-right">
                    <div className="text-5xl font-mono font-bold tracking-tighter" style={{ color: theme.textColor }}>
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                 </div>
             </div>

             {/* Schedule List */}
             <div className="z-10 flex-1 overflow-y-auto p-8">
                 <div className="grid gap-2">
                     <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-bold uppercase tracking-wider opacity-50 mb-2" style={{ color: theme.mutedColor }}>
                        <div className="col-span-2">Время</div>
                        <div className="col-span-7">Фильм</div>
                        <div className="col-span-3 text-right">Инфо</div>
                     </div>
                     
                     {scheduleItems.map((item, idx) => (
                         <div 
                            key={`${item.movie.id}-${idx}`} 
                            className="grid grid-cols-12 gap-4 items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 shadow-sm"
                         >
                             <div className="col-span-2">
                                 <span 
                                    className="text-2xl font-mono font-bold px-3 py-1 rounded bg-slate-700/50 border border-slate-600/50"
                                    style={{ color: theme.textColor }}
                                 >
                                     {item.time}
                                 </span>
                             </div>
                             <div className="col-span-7 flex items-center gap-4">
                                 <img src={item.movie.posterUrl} className="w-10 h-14 object-cover rounded shadow hidden md:block" alt=""/>
                                 <div>
                                     <div className="text-xl font-bold truncate" style={{ color: theme.textColor }}>{item.movie.title}</div>
                                     <div className="text-sm opacity-70 truncate max-w-md" style={{ color: theme.mutedColor }}>
                                         {item.movie.productionCompany} • {item.movie.director}
                                     </div>
                                 </div>
                             </div>
                             <div className="col-span-3 flex justify-end gap-3 items-center">
                                 <span className="text-sm font-bold opacity-60" style={{ color: theme.mutedColor }}>{item.movie.ageRating}</span>
                                 <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded font-bold text-sm">
                                     ★ {item.movie.rating}
                                 </span>
                             </div>
                         </div>
                     ))}
                     
                     {scheduleItems.length === 0 && (
                         <div className="text-center py-32 text-2xl font-light opacity-30 uppercase tracking-widest">
                             Нет сеансов
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
};

const ScreenCard: React.FC<{ 
  screenConfig: ScreenConfig; 
  movies: Movie[]; 
  activeIndex: number;
  isFullscreen?: boolean;
  theme: CinemaProfile['theme'];
}> = ({ screenConfig, movies, activeIndex, isFullscreen, theme }) => {
  
  // Helper to determine what to show based on activeIndex
  const getTargetItem = () => {
      if (activeIndex === SCHEDULE_SLIDE_INDEX) return { type: 'schedule', data: null };
      const m = movies[activeIndex];
      if (m) return { type: 'movie', data: m };
      return { type: 'empty', data: null };
  };

  // State to hold the currently visible content and its opacity
  const [currentItem, setCurrentItem] = useState<{ type: string, data: Movie | null }>(getTargetItem());
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
     const target = getTargetItem();
     
     // Determine if content changed. 
     // For movies, check ID. For schedule/empty, check type.
     const isSame = (currentItem.type === target.type) && 
                    (currentItem.data?.id === target.data?.id);
     
     if (isSame) return;

     // Trigger fade out
     setOpacity(0);
     
     // Wait for fade out, swap content, fade in
     const timer = setTimeout(() => {
         setCurrentItem(target);
         setOpacity(1);
     }, 500); // 500ms matches CSS transition

     return () => clearTimeout(timer);
  }, [activeIndex, movies, currentItem]);

  const renderContent = () => {
      if (currentItem.type === 'schedule') {
          return <ScheduleCard movies={movies} screenName={screenConfig.name} theme={theme} />;
      }
      
      if (currentItem.type === 'movie' && currentItem.data) {
          const movie = currentItem.data;
          return (
            <div className="h-full w-full relative bg-black">
                {/* Background Blur */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
                    style={{ backgroundImage: `url(${movie.posterUrl})` }}
                />
                
                {/* Content Container */}
                <div className="absolute inset-0 z-10 flex flex-col p-6 lg:p-12 bg-gradient-to-t from-black via-transparent to-black/40">
                    {/* Header: Screen Name & Rating */}
                    <div className="flex justify-between items-start mb-4">
                        <div 
                            className="px-3 py-1 lg:px-5 lg:py-2 text-xs lg:text-sm font-bold tracking-widest uppercase rounded shadow-lg"
                            style={{ backgroundColor: theme.accentColor, color: '#ffffff' }}
                        >
                            {screenConfig.name}
                        </div>
                        <div className="flex gap-2">
                            <span className="bg-slate-800/80 backdrop-blur-md px-2 py-1 lg:px-4 lg:py-2 rounded text-xs lg:text-sm border border-slate-600" style={{ color: theme.textColor }}>
                            {movie.ageRating}
                            </span>
                            <span className="bg-yellow-500/90 text-black px-2 py-1 lg:px-4 lg:py-2 rounded text-xs lg:text-sm font-bold">
                            ★ {movie.rating}
                            </span>
                        </div>
                    </div>

                    {/* Poster & Main Info */}
                    <div className="flex flex-1 gap-6 lg:gap-12 items-center">
                        <img 
                            src={movie.posterUrl} 
                            alt={movie.title} 
                            className="w-1/3 h-auto max-h-[70vh] object-cover rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-slate-700"
                        />
                        <div className="flex-1 space-y-4 lg:space-y-8">
                        <h2 
                            className={`font-black leading-tight font-sans tracking-tight drop-shadow-lg ${isFullscreen ? 'text-4xl lg:text-7xl' : 'text-2xl lg:text-4xl'}`}
                            style={{ color: theme.textColor }}
                        >
                            {movie.title}
                        </h2>
                        <div className={`font-light space-y-2 ${isFullscreen ? 'text-xl' : 'text-sm'}`} style={{ color: theme.mutedColor }}>
                            <p><span className="font-medium" style={{ opacity: 0.7 }}>Режиссер:</span> {movie.director}</p>
                            <p><span className="font-medium" style={{ opacity: 0.7 }}>В ролях:</span> {movie.actors.slice(0, 3).join(', ')}</p>
                            <p><span className="font-medium" style={{ opacity: 0.7 }}>Год:</span> {movie.year}</p>
                        </div>
                        <p className={`line-clamp-4 leading-relaxed ${isFullscreen ? 'text-lg' : 'text-xs'}`} style={{ color: theme.mutedColor }}>
                            {movie.description}
                        </p>
                        </div>
                    </div>

                    {/* Footer: Schedule */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="uppercase tracking-widest mb-3 text-xs lg:text-sm font-bold" style={{ color: theme.mutedColor }}>Сеансы сегодня</p>
                        <div className="flex flex-wrap gap-3">
                            {movie.showTimes.map((time, idx) => (
                            <span 
                                key={idx} 
                                className={`transition-all font-mono rounded border border-slate-700 flex items-center justify-center hover:scale-105 ${isFullscreen ? 'px-6 py-3 text-xl' : 'px-3 py-1.5 text-sm'}`}
                                style={{ 
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    borderColor: 'rgba(51, 65, 85, 1)',
                                    color: theme.textColor 
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accentColor; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'; }}
                            >
                                {time}
                            </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          );
      }

      // Empty State
      return (
        <div 
            className="h-full w-full border border-slate-800 flex items-center justify-center relative group"
            style={{ 
                backgroundColor: theme.backgroundColor,
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
             {/* Overlay for text contrast if background image exists */}
            {theme.backgroundImage && (
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
            )}
            <div className="text-2xl font-light tracking-widest uppercase z-10" style={{ color: theme.mutedColor }}>
            {screenConfig.name} - Оффлайн
            </div>
        </div>
      );
  };

  return (
    <div 
        className={`h-full w-full relative ${isFullscreen ? '' : 'rounded-2xl'} overflow-hidden shadow-2xl`}
        style={{ 
            backgroundColor: theme.backgroundColor || 'black',
            transform: `rotate(${screenConfig.rotation}deg)`,
            transformOrigin: 'center center'
        }} 
    >
        {/* Content Wrapper with Fade Transition */}
        <div 
            className="w-full h-full transition-opacity duration-500 ease-in-out" 
            style={{ opacity: opacity }}
        >
            {renderContent()}
        </div>
    </div>
  );
};

export const FoyerDisplay: React.FC<FoyerDisplayProps> = ({ movies, profile, onExit }) => {
  // Map screen IDs to rotation indices.
  // We use an object instead of array because IDs might not be sequential 0..N
  const [rotationIndices, setRotationIndices] = useState<{[key: number]: number}>({});
  const [activeScreenId, setActiveScreenId] = useState<number | null>(null);

  useEffect(() => {
    // Initialize indices
    const initialIndices: {[key: number]: number} = {};
    profile.screens.forEach(s => initialIndices[s.id] = 0);
    setRotationIndices(initialIndices);

    // Use user-defined rotation interval (default 60s)
    const intervalMs = (profile.rotationInterval || 60) * 1000;
    
    const interval = setInterval(() => {
      setRotationIndices(prev => {
        const nextState = { ...prev };
        
        profile.screens.forEach(screen => {
            const screenMovies = movies.filter(m => m.screenId === screen.id);
            const currentIdx = prev[screen.id] ?? 0;
            const hasSchedule = screen.showSchedule;
            
            // Logic flow:
            // 0 -> 1 -> ... -> LastMovie -> (if schedule) Schedule -> 0
            
            let nextIdx = 0;
            
            if (screenMovies.length === 0) {
                // No movies? If schedule enabled, show schedule, else 0
                nextIdx = hasSchedule ? SCHEDULE_SLIDE_INDEX : 0;
            } else {
                if (currentIdx === SCHEDULE_SLIDE_INDEX) {
                    // Was showing schedule, go to first movie
                    nextIdx = 0;
                } else if (currentIdx >= screenMovies.length - 1) {
                    // Reached end of movies
                    nextIdx = hasSchedule ? SCHEDULE_SLIDE_INDEX : 0;
                } else {
                    // Next movie
                    nextIdx = currentIdx + 1;
                }
            }

            nextState[screen.id] = nextIdx;
        });
        
        return nextState;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [movies, profile.screens, profile.rotationInterval]);

  // Dynamic Grid Style Calculation
  const getGridStyle = () => {
    const count = profile.screens.length;
    if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
    if (count <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
    if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
    return { gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }; // Fallback for many screens
  };

  return (
    <div 
        className="min-h-screen overflow-hidden flex flex-col relative group/container transition-colors duration-500"
        style={{ 
            backgroundColor: profile.theme.backgroundColor || '#000000', 
            backgroundImage: profile.theme.backgroundImage ? `url(${profile.theme.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: profile.theme.textColor 
        }}
    >
      
      {/* Control Bar (Shows on Hover) */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 transform -translate-y-full hover:translate-y-0 group-hover/container:translate-y-0 transition-transform duration-300 pb-12 flex justify-center">
        <div className="flex justify-center gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-full border border-slate-700 w-fit shadow-2xl overflow-x-auto max-w-[90vw]">
          <button 
            onClick={() => setActiveScreenId(null)}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${activeScreenId === null ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            style={activeScreenId === null ? { backgroundColor: profile.theme.accentColor } : {}}
            title="Все экраны"
          >
            <Grid size={20} />
          </button>
          
          {profile.screens.map(screen => (
            <button
              key={screen.id}
              onClick={() => setActiveScreenId(screen.id)}
              className={`px-4 py-1 rounded-full text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeScreenId === screen.id ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              style={activeScreenId === screen.id ? { backgroundColor: profile.theme.accentColor } : {}}
            >
              <Monitor size={16} />
              <span className="hidden md:inline">{screen.name}</span>
              <span className="md:hidden">{screen.id + 1}</span>
            </button>
          ))}

          <div className="w-px bg-slate-700 mx-2 flex-shrink-0"></div>

          <button 
            onClick={onExit}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Выход"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 w-full h-full relative">
        {activeScreenId === null ? (
          // Grid View
          <div 
            className="grid gap-4 p-4 h-screen box-border"
            style={getGridStyle()}
          >
            {profile.screens.map((screen) => (
              <div key={screen.id} className="relative w-full h-full overflow-hidden bg-black/50 rounded-2xl border border-slate-800/50 shadow-2xl">
                <ScreenCard 
                  screenConfig={screen}
                  movies={movies.filter(m => m.screenId === screen.id)}
                  activeIndex={rotationIndices[screen.id] ?? 0}
                  isFullscreen={false}
                  theme={profile.theme}
                />
              </div>
            ))}
          </div>
        ) : (
          // Single Screen Fullscreen View
          <div className="w-full h-screen p-0">
             {profile.screens.find(s => s.id === activeScreenId) && (
                 <ScreenCard 
                    screenConfig={profile.screens.find(s => s.id === activeScreenId)!}
                    movies={movies.filter(m => m.screenId === activeScreenId)}
                    activeIndex={rotationIndices[activeScreenId] ?? 0}
                    isFullscreen={true}
                    theme={profile.theme}
                  />
             )}
          </div>
        )}
      </div>
      
      {/* Branding Footer (Only in Grid View) */}
      {activeScreenId === null && (
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <h1 className="font-black text-6xl tracking-[1em] opacity-20 uppercase truncate px-8 drop-shadow-md" style={{ color: profile.theme.mutedColor }}>
            {profile.name}
          </h1>
        </div>
      )}
    </div>
  );
};
