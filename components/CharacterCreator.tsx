import React, { useState } from 'react';
import { Character, StatName, Stats, Rarity, InventoryItem } from '../types';
import { DEFAULT_STATS, RACES, CLASSES, STARTING_POINTS, CLASS_PROGRESSION, GET_SPECIAL_ABILITY } from '../constants';
import { User, ScrollText, ArrowRight, Minus, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { generateCharacterBackstory } from '../services/geminiService';

interface CharacterCreatorProps {
  mode: 'SINGLE' | 'COOP';
  onComplete: (characters: Character[]) => void;
  onCancel: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ mode, onComplete, onCancel }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [createdCharacters, setCreatedCharacters] = useState<Character[]>([]);
  
  const [name, setName] = useState('');
  const [race, setRace] = useState(RACES[0]);
  const [charClass, setCharClass] = useState(CLASSES[0]);
  const [stats, setStats] = useState<Stats>({ ...DEFAULT_STATS });
  const [background, setBackground] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const pointsUsed = (Object.values(stats) as number[]).reduce((acc, val) => acc + (val - 10), 0);
  const pointsRemaining = STARTING_POINTS - pointsUsed;

  const handleStatChange = (stat: StatName, delta: number) => {
    const currentVal = stats[stat];
    if (delta > 0 && pointsRemaining <= 0) return;
    if (delta < 0 && currentVal <= 10) return;
    setStats(prev => ({ ...prev, [stat]: currentVal + delta }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  // Resize to a small thumbnail to prevent localStorage quota errors
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const maxSize = 200; // 200x200 max
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                      if (width > maxSize) {
                          height *= maxSize / width;
                          width = maxSize;
                      }
                  } else {
                      if (height > maxSize) {
                          width *= maxSize / height;
                          height = maxSize;
                      }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  ctx?.drawImage(img, 0, 0, width, height);
                  
                  // Set compressed base64
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                  setAvatarUrl(dataUrl);
              };
              if (event.target?.result) {
                img.src = event.target.result as string;
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerateBackstory = async () => {
    if (!name) return;
    setIsGeneratingStory(true);
    const story = await generateCharacterBackstory(race, charClass, name);
    setBackground(story);
    setIsGeneratingStory(false);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { alert("Enter a name!"); return; }

    const startingWeapon: InventoryItem = {
        id: crypto.randomUUID(),
        name: 'Rusty Weapon',
        type: 'WEAPON',
        rarity: Rarity.BASIC,
        description: 'A basic starter weapon.'
    };

    const hp = 20 + stats[StatName.STR]; 

    const newChar: Character = {
      id: crypto.randomUUID(),
      name,
      race,
      class: charClass,
      classTitle: CLASS_PROGRESSION[charClass][0]?.title || "Novice",
      level: 1, // Start Level 1
      stats: { ...stats },
      attributePoints: 0,
      specialAbility: GET_SPECIAL_ABILITY(charClass, race),
      hp,
      maxHp: hp,
      xp: 1, // Start with 1 XP to be level 1
      gold: 50,
      inventory: [startingWeapon],
      equipment: { weapon: null, armor: null },
      quests: [],
      background: background || "A new adventurer.",
      avatarUrl: avatarUrl,
      isNpc: false
    };

    if (mode === 'COOP' && currentPlayerIndex === 0) {
        setCreatedCharacters([newChar]);
        setCurrentPlayerIndex(1);
        // Reset form
        setName('');
        setStats({ ...DEFAULT_STATS });
        setBackground('');
        setAvatarUrl('');
    } else {
        onComplete([...createdCharacters, newChar]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-3xl text-amber-500 fantasy-font flex items-center gap-2">
                    <User className="w-8 h-8" /> 
                    {mode === 'COOP' ? `Player ${currentPlayerIndex + 1} Creation` : 'Create Your Hero'}
                </h2>
                <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                    Cancel
                </button>
            </div>

            <form onSubmit={handleNext} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Info */}
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="relative group w-24 h-24 bg-slate-900 rounded border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-600 w-8 h-8" />
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Upload className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-slate-400 mb-2 text-xs font-bold uppercase">Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-amber-500 placeholder-slate-600"
                                placeholder="Hero Name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 mb-2 text-xs font-bold uppercase">Race</label>
                            <select 
                                value={race} onChange={(e) => setRace(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-amber-500"
                            >
                                {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-2 text-xs font-bold uppercase">Class</label>
                            <select 
                                value={charClass} onChange={(e) => setCharClass(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded focus:outline-none focus:border-amber-500"
                            >
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                     <div>
                        <label className="block text-slate-400 mb-2 text-xs font-bold uppercase flex justify-between">
                            <span>Backstory</span>
                            <button type="button" onClick={handleGenerateBackstory} disabled={isGeneratingStory || !name} className="text-amber-500 hover:text-amber-400 flex items-center gap-1 disabled:opacity-50">
                                <ScrollText className="w-3 h-3" /> Auto
                            </button>
                        </label>
                        <textarea 
                            value={background} onChange={(e) => setBackground(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded h-24 focus:outline-none focus:border-amber-500 resize-none text-sm"
                            placeholder="Your origin..."
                        />
                    </div>
                </div>

                {/* Right: Stats Point Buy */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2 p-2 bg-slate-900 rounded border border-slate-700">
                        <span className="text-slate-400 text-sm font-bold uppercase">Points Remaining</span>
                        <span className={`text-xl font-mono font-bold ${pointsRemaining === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                            {pointsRemaining}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {Object.values(StatName).map((stat) => (
                            <div key={stat} className="flex items-center justify-between bg-slate-700/30 p-2 rounded border border-slate-700/50">
                                <span className="font-bold text-slate-300 text-sm w-32">{stat}</span>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => handleStatChange(stat, -1)} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center font-mono text-lg font-bold text-white">{stats[stat]}</span>
                                    <button type="button" onClick={() => handleStatChange(stat, 1)} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-amber-500 flex items-center justify-center disabled:opacity-50" disabled={pointsRemaining <= 0}>
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-700">
                    <button 
                        type="submit" 
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-900/20"
                    >
                        {mode === 'COOP' && currentPlayerIndex === 0 ? 'Next Player' : 'Start Adventure'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default CharacterCreator;