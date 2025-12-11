import React, { useState, useEffect } from 'react';
import { Character, SaveSlot, GameState, Screen, Difficulty, Rarity, InventoryItem } from './types';
import CharacterCreator from './components/CharacterCreator';
import GameInterface from './components/GameInterface';
import { Content } from '@google/genai';
import { Sword, Skull, Scroll, Plus, Play, Trash2, Users, BookOpen, Crown, X, Info } from 'lucide-react';
import { DEFAULT_STATS, GET_SPECIAL_ABILITY, CLASS_PROGRESSION, GAME_TIPS } from './constants';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [activeGame, setActiveGame] = useState<Partial<GameState>>({});
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [activeTipTab, setActiveTipTab] = useState<'weapons' | 'armor' | 'rarity' | 'locations'>('weapons');

  useEffect(() => {
    const loadedSaves = localStorage.getItem('dnd_saves');
    if (loadedSaves) {
      try {
        setSaves(JSON.parse(loadedSaves));
      } catch (e) {
        console.error("Failed to parse saves", e);
      }
    }
  }, []);

  const saveToDisk = (updatedSaves: SaveSlot[]) => {
    try {
        localStorage.setItem('dnd_saves', JSON.stringify(updatedSaves));
        setSaves(updatedSaves);
    } catch (e) {
        console.error("Save failed (possibly quota exceeded)", e);
        alert("Failed to save game! Your browser storage might be full. Try deleting old saves or using smaller character images.");
    }
  };

  const handleStartNewGame = (mode: 'SINGLE' | 'COOP') => {
      setActiveGame({ mode }); 
      setScreen('CREATE_CHARACTER');
  };

  const openCampaignModal = () => {
      setShowDifficultyModal(true);
  };

  const handleStartCampaign = (difficulty: Difficulty) => {
      setShowDifficultyModal(false);
      
      // Auto-generate the "Dragora" character with hidden potential
      const startingWeapon: InventoryItem = {
        id: crypto.randomUUID(), name: 'Broken Celestial Blade', type: 'WEAPON', rarity: Rarity.SPECIAL, description: 'A shard of your former power.'
      };
      
      const hero: Character = {
          id: crypto.randomUUID(),
          name: 'Dragora',
          race: 'Human (Reincarnated)',
          class: 'Fighter', // Starts as Fighter, but logic in GameInterface switches progression for "Dragora"
          classTitle: 'The Fallen One',
          level: 1,
          stats: { ...DEFAULT_STATS, 'Strength': 14 }, 
          attributePoints: 0,
          specialAbility: { name: 'Faint Divinity', description: 'The world recognizes you slightly.', level: 1, maxLevel: 100 },
          hp: 30,
          maxHp: 30,
          xp: 0,
          gold: 0,
          inventory: [startingWeapon],
          equipment: { weapon: startingWeapon, armor: null },
          quests: [],
          background: 'You woke up in the ashes of a star, with no name but a burning feeling in your chest.',
          avatarUrl: '', 
          isNpc: false
      };

      const newSaveId = crypto.randomUUID();
      setActiveGame({
          currentSaveId: newSaveId,
          characters: [hero],
          chatHistory: [],
          mode: 'CAMPAIGN',
          difficulty: difficulty
      });
      setScreen('GAME');
  };

  const handleCharacterComplete = (characters: Character[]) => {
    const newSaveId = crypto.randomUUID();
    setActiveGame(prev => ({
      ...prev,
      currentSaveId: newSaveId,
      characters: characters,
      chatHistory: [],
    }));
    setScreen('GAME');
  };

  const handleLoadGame = (slot: SaveSlot) => {
    setActiveGame({
      currentSaveId: slot.id,
      characters: slot.characters,
      chatHistory: slot.chatHistory,
      mode: slot.mode || 'SINGLE', 
      difficulty: slot.difficulty
    });
    setScreen('GAME');
  };

  const handleDeleteSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this save?")) {
        const newSaves = saves.filter(s => s.id !== id);
        saveToDisk(newSaves);
    }
  };

  const handleSaveGame = (characters: Character[], history: Content[], summary: string) => {
    if (!activeGame.currentSaveId) return;

    let saveName = characters[0].name;
    if (activeGame.mode === 'COOP' && characters[1]) {
        saveName = `${characters[0].name} & ${characters[1].name}`;
    }
    if (activeGame.mode === 'CAMPAIGN') {
        saveName = "Elyria: " + characters[0].name;
    }

    const newSlot: SaveSlot = {
      id: activeGame.currentSaveId,
      name: saveName,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      characters: characters,
      chatHistory: history,
      lastSummary: summary,
      mode: activeGame.mode || 'SINGLE',
      difficulty: activeGame.difficulty
    };

    const existingIndex = saves.findIndex(s => s.id === activeGame.currentSaveId);
    let newSaves = [...saves];
    if (existingIndex >= 0) {
      newSaves[existingIndex] = newSlot;
    } else {
      newSaves.push(newSlot);
    }
    
    saveToDisk(newSaves);
  };

  const handleExitGame = () => {
      setScreen('HOME');
      setActiveGame({});
  };

  // --- RENDER ---

  if (screen === 'GAME' && activeGame.characters) {
    return (
      <GameInterface 
        initialCharacters={activeGame.characters}
        initialHistory={activeGame.chatHistory || []}
        mode={activeGame.mode || 'SINGLE'}
        difficulty={activeGame.difficulty}
        saveId={activeGame.currentSaveId || null}
        onSave={handleSaveGame}
        onExit={handleExitGame}
      />
    );
  }

  if (screen === 'CREATE_CHARACTER') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <CharacterCreator 
            mode={activeGame.mode === 'COOP' ? 'COOP' : 'SINGLE'}
            onComplete={handleCharacterComplete}
            onCancel={() => setScreen('HOME')}
          />
      </div>
    );
  }

  // Home Screen
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

        <button 
             onClick={() => setShowTipsModal(true)} 
             className="absolute top-4 right-4 z-50 text-slate-400 hover:text-amber-500 transition-colors bg-slate-900/50 p-2 rounded-full border border-slate-700 hover:border-amber-500"
             title="Game Guide"
        >
             <Info className="w-6 h-6" />
        </button>

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="mb-12 text-center animate-fade-in">
                <Sword className="w-20 h-20 text-amber-600 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
                <h1 className="text-5xl md:text-7xl font-bold fantasy-font text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-700 drop-shadow-sm">
                    REALMS AI
                </h1>
                <p className="text-slate-400 mt-4 text-lg font-light tracking-widest uppercase">The Infinite Dungeon Awaits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* New Game Card - Selection Mode */}
                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl shadow-xl backdrop-blur-sm flex flex-col items-center gap-4">
                     <div className="bg-amber-900/30 p-4 rounded-full text-amber-600">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-200 fantasy-font">New Adventure</h3>
                    
                    <div className="flex flex-col gap-3 w-full mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleStartNewGame('SINGLE')}
                                className="bg-slate-800 hover:bg-amber-700 border border-slate-600 hover:border-amber-500 p-4 rounded flex flex-col items-center gap-2 transition-all"
                            >
                                <Sword className="w-6 h-6" />
                                <span className="text-sm font-bold">Solo</span>
                            </button>
                            <button 
                                onClick={() => handleStartNewGame('COOP')}
                                className="bg-slate-800 hover:bg-amber-700 border border-slate-600 hover:border-amber-500 p-4 rounded flex flex-col items-center gap-2 transition-all"
                            >
                                <Users className="w-6 h-6" />
                                <span className="text-sm font-bold">2 Players</span>
                            </button>
                        </div>
                        {/* CAMPAIGN BUTTON */}
                        <button 
                            onClick={openCampaignModal}
                            className="bg-purple-900/50 hover:bg-purple-800 border border-purple-700 hover:border-purple-400 p-4 rounded flex items-center justify-center gap-3 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 animate-pulse"></div>
                            <BookOpen className="w-6 h-6 text-purple-300" />
                            <div className="flex flex-col items-start">
                                <span className="text-base font-bold text-purple-100">Elyria Campaign</span>
                                <span className="text-[10px] text-purple-300 uppercase tracking-widest">Story Mode</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Continue Card */}
                <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl shadow-xl backdrop-blur-sm flex flex-col h-96">
                    <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <Scroll className="w-5 h-5 text-amber-600" /> Saved Chronicles
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {saves.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <Skull className="w-12 h-12 mb-2 opacity-20" />
                                <p>No tales recorded yet.</p>
                            </div>
                        ) : (
                            saves.map(slot => (
                                <div 
                                    key={slot.id}
                                    onClick={() => handleLoadGame(slot)}
                                    className="bg-slate-800/50 p-4 rounded border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer transition-all group flex justify-between items-center"
                                >
                                    <div className="overflow-hidden mr-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold truncate ${slot.mode === 'CAMPAIGN' ? 'text-purple-400' : 'text-amber-500/90'} group-hover:text-amber-400`}>{slot.name}</h4>
                                            {slot.mode === 'COOP' && <Users className="w-3 h-3 text-slate-500" />}
                                            {slot.mode === 'CAMPAIGN' && <Crown className="w-3 h-3 text-purple-500" />}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{slot.date} {slot.difficulty && `• ${slot.difficulty}`}</p>
                                        <p className="text-xs text-slate-400 italic mt-2 line-clamp-1 border-l-2 border-slate-600 pl-2 opacity-70">"{slot.lastSummary}"</p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button className="p-2 bg-slate-700 rounded-full text-green-400 hover:bg-green-900 transition-colors">
                                            <Play className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteSave(slot.id, e)}
                                            className="p-2 bg-slate-700 rounded-full text-red-400 hover:bg-red-900 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Difficulty Modal */}
        {showDifficultyModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in p-4">
                <div className="bg-slate-900 border border-purple-500/50 p-8 rounded-2xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                    <button onClick={() => setShowDifficultyModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X /></button>
                    
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold fantasy-font text-purple-400">Select Difficulty</h2>
                        <div className="flex justify-center items-center gap-2 mt-2">
                            <p className="text-slate-400">The world of Elyria is broken. How much punishment can you endure?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => handleStartCampaign('EASY')} className="p-4 border border-green-900 bg-green-900/10 hover:bg-green-900/30 rounded-lg text-left transition-colors group">
                            <h3 className="text-green-400 font-bold text-lg group-hover:text-green-300">EASY</h3>
                            <p className="text-slate-400 text-xs mt-1">Story focused. Enemies are weaker. Divine luck is on your side.</p>
                        </button>

                        <button onClick={() => handleStartCampaign('MEDIUM')} className="p-4 border border-blue-900 bg-blue-900/10 hover:bg-blue-900/30 rounded-lg text-left transition-colors group">
                            <h3 className="text-blue-400 font-bold text-lg group-hover:text-blue-300">MEDIUM</h3>
                            <p className="text-slate-400 text-xs mt-1">The intended experience. Challenges are fair but dangerous.</p>
                        </button>

                        <button onClick={() => handleStartCampaign('HARD')} className="p-4 border border-orange-900 bg-orange-900/10 hover:bg-orange-900/30 rounded-lg text-left transition-colors group">
                            <h3 className="text-orange-400 font-bold text-lg group-hover:text-orange-300">HARD</h3>
                            <p className="text-slate-400 text-xs mt-1">Resources are scarce. Enemies are +2 Levels higher. Tactical play required.</p>
                        </button>

                        <button onClick={() => handleStartCampaign('BRUTAL')} className="p-4 border border-red-900 bg-red-900/10 hover:bg-red-900/30 rounded-lg text-left transition-colors group relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-red-500 font-bold text-lg group-hover:text-red-400 flex items-center gap-2"><Skull className="w-4 h-4"/> BRUTAL</h3>
                            <p className="text-slate-400 text-xs mt-1">The Twelve Gods want you dead. Enemies +5 Levels. No mercy. Good luck.</p>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Tips Modal */}
        {showTipsModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in p-4">
                 <div className="bg-slate-900 border border-slate-700 p-0 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2"><BookOpen className="w-5 h-5"/> Adventurer's Guide</h3>
                        <button onClick={() => setShowTipsModal(false)} className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"><X /></button>
                    </div>
                    
                    <div className="flex flex-1 overflow-hidden">
                        {/* Tabs */}
                        <div className="w-1/4 bg-slate-950 border-r border-slate-800 flex flex-col">
                            {(['weapons', 'armor', 'rarity', 'locations'] as const).map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTipTab(tab)}
                                    className={`p-3 text-left text-xs font-bold uppercase tracking-wider transition-colors ${activeTipTab === tab ? 'bg-slate-900 text-amber-500 border-l-2 border-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-300">
                             {activeTipTab === 'weapons' && (
                                <div className="space-y-4">
                                    {GAME_TIPS.weapons.map((tip, i) => (
                                        <div key={i} className="mb-4">
                                            <h4 className="text-white font-bold text-lg mb-1">{tip.title}</h4>
                                            <p className="text-sm leading-relaxed text-slate-400">{tip.content}</p>
                                        </div>
                                    ))}
                                </div>
                             )}
                             {activeTipTab === 'armor' && (
                                 <div className="space-y-4">
                                    {GAME_TIPS.armor.map((tip, i) => (
                                        <div key={i} className="mb-4">
                                            <h4 className="text-white font-bold text-lg mb-1">{tip.title}</h4>
                                            <p className="text-sm leading-relaxed text-slate-400">{tip.content}</p>
                                        </div>
                                    ))}
                                </div>
                             )}
                             {activeTipTab === 'rarity' && (
                                 <div className="space-y-2">
                                     <p className="text-xs text-slate-500 mb-4 italic">Items range from basic scrap to god-killing artifacts.</p>
                                    {GAME_TIPS.rarity.map((tip, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-950/50 border border-slate-800">
                                            <span className={`font-bold w-24 text-right ${tip.color}`}>{tip.name}</span>
                                            <span className="text-sm text-slate-400">{tip.desc}</span>
                                        </div>
                                    ))}
                                </div>
                             )}
                             {activeTipTab === 'locations' && (
                                 <div className="space-y-4">
                                    {GAME_TIPS.locations.map((tip, i) => (
                                        <div key={i} className="mb-4">
                                            <h4 className="text-white font-bold text-lg mb-1">{tip.title}</h4>
                                            <p className="text-sm leading-relaxed text-slate-400">{tip.content}</p>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default App;