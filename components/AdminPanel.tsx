import React, { useState } from 'react';
import { CinemaProfile, Movie, ScreenConfig } from '../types';
import { enrichMovieData, parseScheduleFileWithAI } from '../services/geminiService';
import { searchKinopoisk, getKinopoiskMovieById } from '../services/kinopoiskService';
import { Upload, Plus, Trash2, MonitorPlay, Save, Film, AlertCircle, Search, Settings, Grid, Palette, Clock, X, Sparkles, Loader2, RotateCw, Calendar, Type } from 'lucide-react';

interface AdminPanelProps {
  profile: CinemaProfile;
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  onLaunchFoyer: () => void;
  onUpdateProfile: (profile: CinemaProfile) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ profile, movies, setMovies, onLaunchFoyer, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [loading, setLoading] = useState(false);
  
  // New Movie Form State
  const [newTitle, setNewTitle] = useState('');
  const [selectedScreen, setSelectedScreen] = useState<number>(profile.screens[0]?.id || 0);
  const [searchResults, setSearchResults] = useState<(Partial<Movie> & { kpId?: number })[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState(profile);

  const handleSearch = async () => {
    if (!newTitle) return;
    setLoading(true);
    setSearchPerformed(true);
    setSearchResults([]);
    setSearchError(null);

    try {
      // 1. Try Kinopoisk first
      if (profile.kinopoiskApiKey) {
            const results = await searchKinopoisk(newTitle, profile.kinopoiskApiKey);
            if (results.length === 0) {
               // Only set error if we are sure it's not just "not found", but we can't easily distinguish from service yet without more complex return type.
               // Assuming service returns [] on empty or error.
            }
            setSearchResults(results);
      } else {
        setSearchError("API ключ Кинопоиска не найден.");
      }
    } catch (e: any) {
      console.error(e);
      setSearchError("Ошибка соединения с API.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async (enriched: Partial<Movie> & { kpId?: number }) => {
      let movieData = enriched;
      
      // If we have a Kinopoisk ID, try to fetch full details for better quality
      if (enriched.kpId && profile.kinopoiskApiKey) {
          setLoading(true);
          try {
              const fullDetails = await getKinopoiskMovieById(enriched.kpId, profile.kinopoiskApiKey);
              if (fullDetails) {
                  movieData = { ...movieData, ...fullDetails };
              }
          } catch (e) {
              console.warn("Could not fetch full details, using search results");
          } finally {
              setLoading(false);
          }
      }

      const newMovie: Movie = {
        id: crypto.randomUUID(),
        title: movieData.title || newTitle,
        posterUrl: movieData.posterUrl || 'https://picsum.photos/300/450',
        rating: movieData.rating || 'N/A',
        director: movieData.director || 'Неизвестно',
        actors: movieData.actors || [],
        year: movieData.year || new Date().getFullYear().toString(),
        description: movieData.description || '',
        productionCompany: movieData.productionCompany || '',
        ageRating: movieData.ageRating || '12+',
        screenId: selectedScreen,
        showTimes: ['12:00', '15:00', '18:00', '21:00'] // Default times
      };

      setMovies(prev => [...prev, newMovie]);
      setSearchResults([]);
      setNewTitle('');
      setSearchPerformed(false);
  };

  const handleAiGenerate = async () => {
      setLoading(true);
      try {
          if (!profile.apiKey) throw new Error("API ключ Gemini не настроен");
          const enriched = await enrichMovieData(newTitle, profile.apiKey);
          handleAddMovie(enriched);
      } catch (e: any) {
          alert("AI Ошибка: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parsedMovies = await parseScheduleFileWithAI(content, profile.apiKey);
        const mappedMovies: Movie[] = parsedMovies.map(m => ({
           id: crypto.randomUUID(),
           title: m.title || "Без названия",
           posterUrl: m.posterUrl || `https://picsum.photos/seed/${Math.random()}/300/450`,
           rating: m.rating || "N/A",
           director: m.director || "Неизвестно",
           actors: m.actors || [],
           year: m.year || "2024",
           description: m.description || "Нет описания",
           productionCompany: m.productionCompany || "Unknown",
           ageRating: m.ageRating || "0+",
           screenId: selectedScreen, 
           showTimes: m.showTimes || ["10:00", "14:00", "18:00"]
        }));
        
        setMovies(prev => [...prev, ...mappedMovies]);
      } catch (err) {
        console.error(err);
        alert("Ошибка при разборе файла.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSettingsForm(prev => ({
        ...prev,
        theme: {
          ...prev.theme,
          backgroundImage: result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeBackgroundImage = () => {
       setSettingsForm(prev => ({
        ...prev,
        theme: {
          ...prev.theme,
          backgroundImage: undefined
        }
      }));
  };

  const handleDelete = (id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id));
  };

  const saveSettings = () => {
    onUpdateProfile(settingsForm);
    alert("Настройки сохранены!");
  };

  const updateScreenConfig = (idx: number, updates: Partial<ScreenConfig>) => {
      const newScreens = [...settingsForm.screens];
      newScreens[idx] = { ...newScreens[idx], ...updates };
      setSettingsForm({ ...settingsForm, screens: newScreens });
  };

  const addScreen = () => {
      const newId = settingsForm.screens.length > 0 ? Math.max(...settingsForm.screens.map(s => s.id)) + 1 : 0;
      const newScreen: ScreenConfig = {
          id: newId,
          name: `Экран ${newId + 1}`,
          rotation: 0,
          showSchedule: false
      };
      setSettingsForm({ ...settingsForm, screens: [...settingsForm.screens, newScreen] });
  };

  const removeScreen = (idx: number) => {
      const newScreens = settingsForm.screens.filter((_, i) => i !== idx);
      setSettingsForm({ ...settingsForm, screens: newScreens });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Film className="w-6 h-6 text-red-600" />
            {profile.name}
          </h1>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={() => setActiveTab('content')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'content' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Grid size={16} /> Контент
           </button>
           <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Settings size={16} /> Настройки
           </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onLaunchFoyer}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
          >
            <MonitorPlay className="w-4 h-4" />
            Запуск Афиши
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                 <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="font-bold text-lg flex items-center gap-2"><MonitorPlay size={20} className="text-slate-400"/> Конфигурация Экранов</h2>
                    <button onClick={addScreen} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1">
                        <Plus size={12}/> Добавить
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {settingsForm.screens.map((screen, idx) => (
                        <div key={screen.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                                <label className="block text-xs font-bold text-slate-500">Экран ID: {screen.id}</label>
                                <button onClick={() => removeScreen(idx)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-bold uppercase">Название зала</label>
                                    <input 
                                        type="text" 
                                        value={screen.name}
                                        onChange={(e) => updateScreenConfig(idx, { name: e.target.value })}
                                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-red-600 outline-none bg-white"
                                        placeholder="Название зала"
                                    />
                                </div>
                                
                                <div className="flex gap-6 items-center">
                                    <div className="flex-1 space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                                            <RotateCw size={10}/> Поворот
                                        </label>
                                        <select 
                                            value={screen.rotation}
                                            onChange={(e) => updateScreenConfig(idx, { rotation: parseInt(e.target.value) as 0|90|180|270 })}
                                            className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white"
                                        >
                                            <option value={0}>0° (Пейзаж)</option>
                                            <option value={90}>90° (Портрет)</option>
                                            <option value={180}>180°</option>
                                            <option value={270}>270° (Портрет)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><Calendar size={10}/> Слайд расписания</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={screen.showSchedule}
                                                onChange={(e) => updateScreenConfig(idx, { showSchedule: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 border-b pb-2"><Palette size={20} className="text-slate-400"/> Оформление</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Основной фон</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    value={settingsForm.theme.backgroundColor}
                                    onChange={(e) => setSettingsForm({...settingsForm, theme: {...settingsForm.theme, backgroundColor: e.target.value}})}
                                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                                />
                                <span className="text-sm font-mono text-slate-600">{settingsForm.theme.backgroundColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Фоновое изображение</label>
                            <div className="flex items-center gap-2">
                                {settingsForm.theme.backgroundImage ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${settingsForm.theme.backgroundImage})` }}></div>
                                        <button onClick={removeBackgroundImage} className="text-xs text-red-500 hover:underline">Удалить</button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded flex items-center gap-2 transition-colors">
                                        <Upload size={14}/> Загрузить
                                        <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Акцент (Кнопки)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    value={settingsForm.theme.accentColor}
                                    onChange={(e) => setSettingsForm({...settingsForm, theme: {...settingsForm.theme, accentColor: e.target.value}})}
                                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                                />
                                <span className="text-sm font-mono text-slate-600">{settingsForm.theme.accentColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Цвет текста (Заголовки)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    value={settingsForm.theme.textColor || '#ffffff'}
                                    onChange={(e) => setSettingsForm({...settingsForm, theme: {...settingsForm.theme, textColor: e.target.value}})}
                                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                                />
                                <span className="text-sm font-mono text-slate-600">{settingsForm.theme.textColor || '#ffffff'}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Цвет текста (Доп.)</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    value={settingsForm.theme.mutedColor || '#94a3b8'}
                                    onChange={(e) => setSettingsForm({...settingsForm, theme: {...settingsForm.theme, mutedColor: e.target.value}})}
                                    className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                                />
                                <span className="text-sm font-mono text-slate-600">{settingsForm.theme.mutedColor || '#94a3b8'}</span>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 border-b pb-2"><Clock size={20} className="text-slate-400"/> Ротация</h2>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Интервал смены постеров (сек)</label>
                        <input 
                            type="number" 
                            min="5"
                            value={settingsForm.rotationInterval}
                            onChange={(e) => setSettingsForm({...settingsForm, rotationInterval: parseInt(e.target.value) || 60})}
                            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-red-600 outline-none"
                        />
                     </div>
                 </div>

                 <button 
                    onClick={saveSettings}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-transform active:scale-95 shadow-lg flex justify-center items-center gap-2"
                  >
                    <Save size={18} /> Сохранить настройки
                  </button>
              </div>
           </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Controls */}
            <div className="lg:col-span-1 space-y-6">
            
            {/* Add Movie Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" /> Добавить контент
                </h2>
                
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Выберите экран</label>
                    <select 
                    value={selectedScreen} 
                    onChange={(e) => setSelectedScreen(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-red-500 outline-none"
                    >
                    {profile.screens.map((screen) => (
                        <option key={screen.id} value={screen.id}>{screen.name} ({screen.id})</option>
                    ))}
                    </select>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Поиск (Kinopoisk / AI)</p>
                    <div className="flex gap-2 mb-3">
                    <input 
                        type="text"
                        placeholder="Название фильма..."
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:border-red-500 outline-none"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading || !newTitle}
                        className="bg-red-600 text-white px-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-4 h-4"/>
                        ) : (
                            <Search size={18} />
                        )}
                    </button>
                    </div>

                    {/* Search Results Area */}
                    {(searchPerformed || searchError) && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto mb-2">
                            {searchError && (
                                <div className="p-3 text-center text-red-500 text-xs font-medium">
                                    {searchError}
                                </div>
                            )}
                            {searchResults.length === 0 && !searchError ? (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-2">Ничего не найдено на Кинопоиске.</p>
                                    <button 
                                        onClick={handleAiGenerate}
                                        className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded flex items-center gap-1 mx-auto transition-colors"
                                    >
                                        <Sparkles size={12} className="text-purple-600"/> Сгенерировать с AI
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {searchResults.map((result, idx) => (
                                        <div key={idx} className="p-2 flex gap-3 hover:bg-white transition-colors cursor-pointer group" onClick={() => handleAddMovie(result)}>
                                            <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                                {result.posterUrl ? (
                                                    <img src={result.posterUrl} className="w-full h-full object-cover" alt="" />
                                                ) : <Film className="w-full h-full p-2 text-slate-400"/>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{result.title}</p>
                                                <p className="text-xs text-slate-500">{result.year} • {result.director}</p>
                                                <div className="mt-1 flex gap-2">
                                                     <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">★ {result.rating}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Plus size={16} className="text-slate-300 group-hover:text-red-600"/>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-2 bg-slate-100 border-t border-slate-200 text-center">
                                         <button 
                                            onClick={handleAiGenerate}
                                            className="text-xs text-slate-500 hover:text-purple-600 flex items-center justify-center gap-1 w-full"
                                        >
                                            <Sparkles size={12}/> Не нашли? Создать с AI
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {(searchPerformed || searchError) && (
                        <div className="flex justify-end mb-2">
                            <button onClick={() => { setSearchPerformed(false); setSearchResults([]); setSearchError(null); }} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                <X size={12}/> Закрыть поиск
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Загрузка расписания</p>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                            <p className="text-xs text-slate-500">Перетащите CSV/TXT (;)</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                    </label>
                    <div className="mt-2 text-xs text-slate-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5" />
                    <span>Формат: Название; Время; Рейтинг...<br/>Для Excel сохраните как .CSV</span>
                    </div>
                </div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Активных фильмов</h3>
                <p className="text-4xl font-black text-white">{movies.length}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {profile.screens.map((screen) => (
                    <div key={screen.id} className="bg-slate-700/50 p-2 rounded text-xs flex justify-between">
                        <span className="truncate pr-1">{screen.name}</span>
                        <span className="font-bold">{movies.filter(m => m.screenId === screen.id).length}</span>
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* Right Column: List */}
            <div className="lg:col-span-2">
            <h2 className="font-bold text-xl mb-6 text-slate-800">Текущий плейлист</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movies.length === 0 && (
                <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400">Нет расписания. Добавьте контент.</p>
                </div>
                )}
                
                {movies.map(movie => {
                    const screenName = profile.screens.find(s => s.id === movie.screenId)?.name || 'Unknown Screen';
                    return (
                        <div key={movie.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex h-32 hover:shadow-md transition-shadow">
                            <img src={movie.posterUrl} alt={movie.title} className="w-24 h-full object-cover" />
                            <div className="flex-1 p-3 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800 line-clamp-1">{movie.title}</h3>
                                <button onClick={() => handleDelete(movie.id)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded truncate max-w-[120px]">
                                    {screenName}
                                </span>
                                <span className="text-xs text-slate-500">{movie.ageRating}</span>
                                <span className="text-xs text-yellow-600 font-bold">★ {movie.rating}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 overflow-hidden mt-2">
                                {movie.showTimes.slice(0,3).map((t, i) => (
                                <span key={i} className="text-xs bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                    {t}
                                </span>
                                ))}
                            </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
            </div>
        )}

      </main>
    </div>
  );
};
