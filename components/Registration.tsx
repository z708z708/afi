import React, { useState } from 'react';
import { CinemaProfile, Movie } from '../types';
import { Clapperboard, PlayCircle } from 'lucide-react';

interface RegistrationProps {
  onComplete: (profile: CinemaProfile, demoMovies?: Movie[]) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [kinopoiskApiKey, setKinopoiskApiKey] = useState('Y9Y6RXV-ZYF4SXN-G5WDBBW-BNF8DQ9');
  
  // Default screen names
  const [screenCount, setScreenCount] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate Screen Configs
    const screens = Array.from({ length: screenCount }, (_, i) => ({
      id: i,
      name: `Зал ${i + 1}`,
      rotation: 0 as 0 | 90 | 180 | 270,
      showSchedule: i === 0 // Default first screen shows schedule
    }));

    onComplete({
      name,
      address,
      screens,
      apiKey,
      kinopoiskApiKey,
      theme: {
        backgroundColor: '#000000',
        backgroundImage: '',
        accentColor: '#dc2626', // Red-600
        textColor: '#ffffff',
        mutedColor: '#94a3b8' // Slate-400
      },
      rotationInterval: 60
    });
  };

  const handleDemoMode = () => {
    // Demo Profile
    const demoProfile: CinemaProfile = {
      name: "КиноЦентр Октябрь",
      address: "г. Москва, ул. Новый Арбат, 24",
      screens: [
        { id: 0, name: "IMAX Лазер", rotation: 0, showSchedule: true },
        { id: 1, name: "Зал Премьер", rotation: 0, showSchedule: false },
        { id: 2, name: "Детский Зал", rotation: 0, showSchedule: false },
        { id: 3, name: "VIP Lounge", rotation: 0, showSchedule: false }
      ],
      apiKey: apiKey || "DEMO_KEY",
      kinopoiskApiKey: kinopoiskApiKey || "DEMO_KP_KEY",
      theme: {
        backgroundColor: '#000000',
        backgroundImage: '',
        accentColor: '#dc2626',
        textColor: '#ffffff',
        mutedColor: '#94a3b8'
      },
      rotationInterval: 15 // Faster rotation for demo
    };

    // Demo Movies
    const demoMovies: Movie[] = [
      {
        id: "demo-1",
        title: "Мастер и Маргарита",
        posterUrl: "https://upload.wikimedia.org/wikipedia/ru/8/8a/%D0%9C%D0%B0%D1%81%D1%82%D0%B5%D1%80_%D0%B8_%D0%9C%D0%B0%D1%80%D0%B3%D0%B0%D1%80%D0%B8%D1%82%D0%B0_%28%D1%84%D0%B8%D0%BB%D1%8C%D0%BC%2C_2024%29.jpg",
        rating: "7.9",
        director: "Михаил Локшин",
        actors: ["Аугуст Диль", "Евгений Цыганов", "Юлия Снигирь"],
        year: "2024",
        description: "Известный писатель оказывается в центре литературного скандала. Спектакль по его пьесе снимают с репертуара, коллеги демонстративно избегают встречи.",
        productionCompany: "Mars Media",
        ageRating: "18+",
        screenId: 0,
        showTimes: ["10:00", "13:30", "17:00", "20:30"]
      },
      {
        id: "demo-2",
        title: "Дюна: Часть вторая",
        posterUrl: "https://upload.wikimedia.org/wikipedia/ru/3/30/Dune_Part_Two_poster.jpg",
        rating: "8.7",
        director: "Дени Вильнёв",
        actors: ["Тимоти Шаламе", "Зендея", "Ребекка Фергюсон"],
        year: "2024",
        description: "Герцог Пол Атрейдес присоединяется к фременам, чтобы стать Муад'Дибом, одновременно пытаясь предотвратить ужасное будущее.",
        productionCompany: "Legendary Pictures",
        ageRating: "12+",
        screenId: 0,
        showTimes: ["11:00", "14:40", "18:20", "22:00"]
      },
      {
        id: "demo-3",
        title: "Чебурашка",
        posterUrl: "https://upload.wikimedia.org/wikipedia/ru/7/77/Cheburashka_poster.jpg",
        rating: "7.3",
        director: "Дмитрий Дьяченко",
        actors: ["Сергей Гармаш", "Ольга Кузьмина"],
        year: "2023",
        description: "Мохнатого непоседливого зверька из далекой апельсиновой страны ждут удивительные приключения в приморском городке.",
        productionCompany: "Yellow, Black and White",
        ageRating: "6+",
        screenId: 2,
        showTimes: ["09:00", "11:00", "13:00", "15:00"]
      },
      {
        id: "demo-4",
        title: "Оппенгеймер",
        posterUrl: "https://upload.wikimedia.org/wikipedia/ru/0/07/Oppenheimer_poster.jpg",
        rating: "8.4",
        director: "Кристофер Нолан",
        actors: ["Киллиан Мерфи", "Эмили Блант", "Мэтт Дэймон"],
        year: "2023",
        description: "История жизни американского физика Роберта Оппенгеймера, который стоял во главе первых разработок ядерного оружия.",
        productionCompany: "Universal Pictures",
        ageRating: "16+",
        screenId: 3,
        showTimes: ["16:00", "19:30", "23:00"]
      }
    ];

    onComplete(demoProfile, demoMovies);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-red-600 p-8 text-center relative">
          <Clapperboard className="w-16 h-16 text-white mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">CineFoyer 4DX</h1>
          <p className="text-red-100 mt-2">Система цифровых афиш</p>
          
          <button 
            type="button"
            onClick={handleDemoMode}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 transition-colors"
          >
            <PlayCircle size={12} /> Демо
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Название Кинотеатра</label>
              <input 
                required
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full border-b-2 border-slate-200 focus:border-red-600 outline-none py-2 bg-transparent transition-colors"
                placeholder="Например: Киномир Москва"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Gemini API Key (AI)</label>
                <input 
                    type="password" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full border-b-2 border-slate-200 focus:border-red-600 outline-none py-2 bg-transparent transition-colors text-xs"
                    placeholder="Для генерации если нет в базе..."
                />
               </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kinopoisk API Key</label>
                <input 
                    type="text" 
                    value={kinopoiskApiKey} 
                    onChange={e => setKinopoiskApiKey(e.target.value)}
                    className="w-full border-b-2 border-slate-200 focus:border-red-600 outline-none py-2 bg-transparent transition-colors text-xs font-mono"
                    placeholder="X-X-X-X"
                />
               </div>
            </div>
            
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Количество экранов</label>
               <input 
                  type="number" 
                  min="1"
                  max="16"
                  value={screenCount}
                  onChange={e => setScreenCount(parseInt(e.target.value))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-red-600 outline-none"
               />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-transform active:scale-95 shadow-lg"
          >
            Зарегистрировать Систему
          </button>
        </form>
      </div>
    </div>
  );
};
