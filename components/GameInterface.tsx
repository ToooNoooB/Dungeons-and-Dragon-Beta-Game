import React, { useState, useEffect, useRef } from 'react';
import { Character, GameState, InventoryItem, Rarity, StatName, Quest, Difficulty } from '../types';
import { createGameChat, generateSpeech } from '../services/geminiService';
import { Content } from '@google/genai';
import CharacterSheet from './CharacterSheet';
import { LEVEL_THRESHOLDS, CLASS_PROGRESSION, getLevelFromXP, getXPForNextLevel, GAME_TIPS } from '../constants';
import { Send, Save, Menu, X, Dice6, Volume2, Loader2, StopCircle, Ghost, User, Info, BookOpen } from 'lucide-react';

interface GameInterfaceProps {
  initialCharacters: Character[];
  initialHistory: Content[];
  mode: 'SINGLE' | 'COOP' | 'CAMPAIGN';
  difficulty?: Difficulty;
  saveId: string | null;
  onSave: (characters: Character[], history: Content[], summary: string) => void;
  onExit: () => void;
}

// --- Audio Helpers ---
function base64ToBytes(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ 
  initialCharacters, 
  initialHistory, 
  mode,
  difficulty,
  saveId, 
  onSave, 
  onExit 
}) => {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [history, setHistory] = useState<Content[]>(initialHistory);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  
  // Tips Modal State
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [activeTipTab, setActiveTipTab] = useState<'weapons' | 'armor' | 'rarity' | 'locations'>('weapons');

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoadingId, setAudioLoadingId] = useState<number | null>(null); // Index of message being loaded
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null); 
  const lastSummaryRef = useRef<string>("Adventure continues...");
  
  // Refs for audio management
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createGameChat(characters, history, mode, difficulty);
      // For campaign, the system instruction handles the intro. For others, trigger it.
      if (history.length === 0 && mode !== 'CAMPAIGN') handleSendMessage("Start the adventure.", true);
      if (history.length === 0 && mode === 'CAMPAIGN') handleSendMessage("Begin the intro sequence.", true);
    }
    
    return () => {
        stopAudio(); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (text: string, isSystemInit = false) => {
    if ((!text.trim() && !isSystemInit) || isLoading) return;

    const userMessage = text;
    setInputText('');
    setIsLoading(true);

    if (!isSystemInit) {
        setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    }

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMessage });
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) handleToolCalls(functionCalls);

      const modelText = response.text;
      if (modelText) {
         setHistory(prev => [...prev, { role: 'model', parts: [{ text: modelText }] }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "[System Error: The Dungeon Master is silent... please try again.]" }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch (e) { /* ignore */ }
          audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) { /* ignore */ }
          audioContextRef.current = null;
      }
      setIsPlayingAudio(false);
      setAudioLoadingId(null);
  };

  const playTextToSpeech = async (text: string, msgIndex: number) => {
      // If clicking the same message that is playing/loading, stop it.
      if (isPlayingAudio || audioLoadingId === msgIndex) {
          stopAudio();
          if (audioLoadingId === msgIndex) return; // Just stop if it was this one
      }

      try {
          setAudioLoadingId(msgIndex);
          const base64Audio = await generateSpeech(text);
          
          if (!base64Audio) {
              throw new Error("No audio generated");
          }

          // Initialize Audio Context
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          const ctx = new AudioContextClass({ sampleRate: 24000 });
          audioContextRef.current = ctx;

          const bytes = base64ToBytes(base64Audio);
          const buffer = await decodeAudioData(bytes, ctx);

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
              setIsPlayingAudio(false);
              setAudioLoadingId(null);
              // Clean up context
              if (audioContextRef.current === ctx) {
                  audioContextRef.current.close();
                  audioContextRef.current = null;
              }
          };

          audioSourceRef.current = source;
          source.start();
          setIsPlayingAudio(true);
          setAudioLoadingId(null); // Loaded, now playing

      } catch (e) {
          console.error("Audio playback error:", e);
          stopAudio();
          alert("Could not play audio.");
      }
  };

  const handleToolCalls = (calls: any[]) => {
      calls.forEach(call => {
          if (call.name === 'updateGameState') {
              const args = call.args;
              if (args.summary) lastSummaryRef.current = args.summary;

              setCharacters(prevChars => {
                  let updatedChars = [...prevChars];

                  if (args.newCompanion) {
                     const companion: Character = {
                         ...initialCharacters[0], 
                         id: crypto.randomUUID(), name: args.newCompanion.name, race: args.newCompanion.race || 'Unknown', class: args.newCompanion.class || 'Warrior',
                         isNpc: true, background: args.newCompanion.description,
                         level: 1, xp: 0, attributePoints: 0, 
                         specialAbility: { name: 'Support', description: 'Helps the party', level: 1, maxLevel: 10 },
                         quests: [], inventory: [], equipment: { weapon: null, armor: null }
                     };
                     updatedChars.push(companion);
                  }

                  if (args.targetCharacterName) {
                      const targetIdx = updatedChars.findIndex(c => c.name.toLowerCase().includes(args.targetCharacterName.toLowerCase()));
                      if (targetIdx !== -1) {
                          const char = { ...updatedChars[targetIdx] };
                          
                          if (args.hpChange) char.hp = Math.max(0, Math.min(char.maxHp, char.hp + (args.hpChange as number)));
                          if (args.goldChange) char.gold = Math.max(0, char.gold + (args.goldChange as number));
                          
                          if (args.xpChange) {
                              char.xp += (args.xpChange as number);
                              const newLevel = getLevelFromXP(char.xp);
                              
                              if (newLevel > char.level) {
                                  const levelsGained = newLevel - char.level;
                                  for (let i = 0; i < levelsGained; i++) {
                                      const lvl = char.level + 1 + i;
                                      const isThreshold = LEVEL_THRESHOLDS.includes(lvl);
                                      char.maxHp += isThreshold ? 15 : 5;
                                      char.hp = char.maxHp; 
                                      char.attributePoints += isThreshold ? 4 : 2;
                                      char.gold += isThreshold ? 50 : 10;
                                  }
                                  char.level = newLevel;
                                  
                                  // CHECK PROGRESSION - DRAGORA SPECIAL
                                  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
                                      if (char.level >= LEVEL_THRESHOLDS[i]) {
                                          // IF DRAGORA, USE THIRTEENTH GOD PROGRESSION
                                          const progressionKey = char.name === 'Dragora' ? 'The Thirteenth God' : char.class;
                                          const progression = CLASS_PROGRESSION[progressionKey] || CLASS_PROGRESSION[char.class];

                                          if (progression && progression[LEVEL_THRESHOLDS[i]]) {
                                              char.classTitle = progression[LEVEL_THRESHOLDS[i]].title;
                                          }
                                          break;
                                      }
                                  }
                              }
                          }

                          if (args.questUpdate) {
                              const q = args.questUpdate;
                              if (q.action === 'ADD') {
                                  const newQuest: Quest = { 
                                      id: q.questId || crypto.randomUUID(), 
                                      title: q.title, 
                                      description: q.description, 
                                      status: 'ACTIVE',
                                      reward: q.reward,
                                      type: q.type || 'SIDE',
                                      objectives: q.objectives
                                    };
                                  char.quests = [...char.quests, newQuest];
                              } else if (q.action === 'UPDATE_STATUS') {
                                  char.quests = char.quests.map(quest => {
                                    if (quest.title === q.title || quest.id === q.questId) {
                                        const updatedQuest = { ...quest, status: q.status };
                                        // Merge objectives if provided
                                        if (q.objectives) updatedQuest.objectives = q.objectives;
                                        return updatedQuest;
                                    }
                                    return quest;
                                  });
                              }
                          }
                          
                          if (args.loot) {
                              const lootItems = Array.isArray(args.loot) ? args.loot : [args.loot];
                              const newItems = lootItems.map((l: any) => ({
                                  id: crypto.randomUUID(), name: l.name, type: l.type || 'ITEM', rarity: l.rarity || Rarity.BASIC, description: l.description
                              }));
                              char.inventory = [...char.inventory, ...newItems];
                          }
                          updatedChars[targetIdx] = char;
                      }
                  } 
                  return updatedChars;
              });
          }
      });
  };

  const handleEquip = (charId: string, item: InventoryItem) => {
      setCharacters(prev => prev.map(c => {
          if (c.id !== charId) return c;
          const newChar = { ...c };
          const newInv = newChar.inventory.filter(i => i.id !== item.id);
          let oldItem: InventoryItem | null = null;
          if (item.type === 'WEAPON') { oldItem = newChar.equipment.weapon; newChar.equipment.weapon = item; }
          else if (item.type === 'ARMOR') { oldItem = newChar.equipment.armor; newChar.equipment.armor = item; }
          if (oldItem) newInv.push(oldItem);
          newChar.inventory = newInv;
          return newChar;
      }));
  };

  const handleUnequip = (charId: string, slot: 'weapon' | 'armor') => {
      setCharacters(prev => prev.map(c => {
          if (c.id !== charId) return c;
          const newChar = { ...c };
          const item = newChar.equipment[slot];
          if (item) { newChar.equipment[slot] = null; newChar.inventory.push(item); }
          return newChar;
      }));
  };

  const handleUpgradeStat = (charId: string, stat: StatName) => {
      setCharacters(prev => prev.map(c => {
          if (c.id !== charId || c.attributePoints <= 0) return c;
          return { ...c, stats: { ...c.stats, [stat]: c.stats[stat] + 1 }, attributePoints: c.attributePoints - 1 };
      }));
  };

  const handleUpgradeAbility = (charId: string) => {
    setCharacters(prev => prev.map(c => {
        if (c.id !== charId || c.attributePoints <= 0 || c.specialAbility.level >= c.specialAbility.maxLevel) return c;
        return { ...c, specialAbility: { ...c.specialAbility, level: c.specialAbility.level + 1 }, attributePoints: c.attributePoints - 1 };
    }));
  };

  const handleManualSave = () => { onSave(characters, history, lastSummaryRef.current); alert("Game Saved!"); };
  const rollDice = () => { const result = Math.floor(Math.random() * 20) + 1; setDiceResult(result); handleSendMessage(`[rolled a d20: ${result}]`); setTimeout(() => setDiceResult(null), 3000); };
  const formatText = (text: string) => text.split('\n').map((line, i) => <p key={i} className={`mb-2 ${line.startsWith('*') ? 'italic text-slate-400' : ''}`}>{line}</p>);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col h-full relative z-0">
        <header className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-amber-500"><Menu /></button>
                <h1 className="text-xl font-bold fantasy-font text-amber-500 tracking-wider">
                  {mode === 'CAMPAIGN' ? 'ELYRIA: Thirteenth Reborn' : 'Dungeon Master AI'}
                </h1>
            </div>
            <div className="flex gap-2 items-center">
                 {difficulty && <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-800 border ${difficulty === 'BRUTAL' ? 'text-red-500 border-red-900' : difficulty === 'HARD' ? 'text-orange-500 border-orange-900' : 'text-green-500 border-green-900'}`}>{difficulty}</span>}
                 
                 <button onClick={() => setShowTipsModal(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-500 p-2 rounded border border-slate-700 hover:border-amber-500 transition-colors" title="Game Guide">
                    <Info className="w-5 h-5" />
                 </button>

                 <button onClick={rollDice} className="bg-slate-800 hover:bg-slate-700 text-amber-500 p-2 rounded border border-slate-700 transition-colors"><Dice6 className="w-5 h-5" /></button>
                <button onClick={handleManualSave} className="bg-green-700/80 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm font-bold transition-colors"><Save className="w-4 h-4" /> <span className="hidden sm:inline">Save</span></button>
                <button onClick={onExit} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded text-sm transition-colors border border-red-900">Exit</button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-slate-950">
            {history.map((msg, idx) => {
                const text = msg.parts?.[0]?.text;
                if (!text || text.startsWith('[System')) return null;
                const isModel = msg.role === 'model';
                return (
                    <div key={idx} className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} animate-fade-in mb-6`}>
                        <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
                            
                            {/* Avatar */}
                            <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 mt-1">
                                {isModel ? (
                                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-lg">
                                        <Ghost className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                                    </div>
                                ) : (
                                    characters[0]?.avatarUrl ? (
                                        <img src={characters[0].avatarUrl} alt="Hero" className="w-full h-full rounded-full object-cover border border-amber-600 shadow-lg" />
                                    ) : (
                                        <div className="w-full h-full bg-amber-900/40 rounded-full flex items-center justify-center border border-amber-700">
                                            <User className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`relative rounded-2xl p-4 md:p-6 shadow-xl leading-relaxed ${isModel ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-amber-900/30 border border-amber-900/50 text-amber-100 rounded-tr-none'}`}>
                                {isModel && (
                                    <button 
                                        onClick={() => playTextToSpeech(text, idx)}
                                        disabled={isLoading || (audioLoadingId !== null && audioLoadingId !== idx)}
                                        className={`absolute -right-10 top-2 p-2 rounded-full transition-all ${
                                            (audioLoadingId === idx || (isPlayingAudio && audioSourceRef.current && audioLoadingId === null)) 
                                            ? 'text-amber-500 animate-pulse' 
                                            : 'text-slate-600 hover:text-amber-500'
                                        }`}
                                        title="Listen to story"
                                    >
                                        {audioLoadingId === idx ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Volume2 className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                                <div className="markdown-body text-sm md:text-base font-serif">{formatText(text)}</div>
                            </div>

                        </div>
                    </div>
                );
            })}
            {isLoading && <div className="flex justify-start p-4 ml-12"><div className="flex gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></div></div></div>}
            <div ref={messagesEndRef} />
        </div>

        <div className="bg-slate-900 p-4 border-t border-slate-800 relative z-20">
            <div className="max-w-4xl mx-auto flex gap-2">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)} placeholder="What do you do?" disabled={isLoading} className="flex-1 bg-slate-950 border border-slate-700 text-white p-4 rounded-lg focus:outline-none focus:border-amber-600 transition-all placeholder-slate-600" />
                <button onClick={() => handleSendMessage(inputText)} disabled={isLoading || !inputText.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white p-4 rounded-lg transition-colors"><Send className="w-6 h-6" /></button>
            </div>
        </div>
      </div>

      <div className={`fixed lg:static top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          <div className="h-full relative">
               <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden text-slate-500 hover:text-white"><X /></button>
              <CharacterSheet characters={characters} onEquip={handleEquip} onUnequip={handleUnequip} onUpgradeStat={handleUpgradeStat} onUpgradeAbility={handleUpgradeAbility} />
          </div>
      </div>

      {diceResult !== null && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-black/70 backdrop-blur-sm p-8 rounded-2xl border-2 border-amber-500 shadow-2xl shadow-amber-500/20 flex flex-col items-center">
                  <Dice6 className="w-16 h-16 text-amber-500 mb-2 animate-spin-slow" />
                  <div className="text-6xl font-bold text-white fantasy-font">{diceResult}</div>
              </div>
          </div>
      )}

      {/* Tips Modal */}
        {showTipsModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in p-4">
                 <div className="bg-slate-900 border border-slate-700 p-0 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-[500px] z-[60]">
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

export default GameInterface;