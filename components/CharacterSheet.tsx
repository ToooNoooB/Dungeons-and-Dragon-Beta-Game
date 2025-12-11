import React, { useState } from 'react';
import { Character, StatName, InventoryItem } from '../types'; 
import { RARITY_COLORS as COLORS, getXPForNextLevel } from '../constants';
import { Heart, Coins, Backpack, Zap, Sword, Shield, Trash2, Scroll, Sparkles, Plus, Activity, User, CheckSquare, Crown, Gift, MapPin } from 'lucide-react';

interface CharacterSheetProps {
  characters: Character[];
  onEquip: (charId: string, item: InventoryItem) => void;
  onUnequip: (charId: string, slot: 'weapon' | 'armor') => void;
  onUpgradeStat: (charId: string, stat: StatName) => void;
  onUpgradeAbility: (charId: string) => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ characters, onEquip, onUnequip, onUpgradeStat, onUpgradeAbility }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [view, setView] = useState<'STATS' | 'QUESTS'>('STATS');
  const [questFilter, setQuestFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const character = characters[activeTab];

  if (!character) return null;

  const xpNeeded = getXPForNextLevel(character.level);
  const xpPercent = Math.min(100, (character.xp / xpNeeded) * 100);

  const filteredQuests = character.quests.filter(q => {
      if (questFilter === 'ALL') return true;
      if (questFilter === 'ACTIVE') return q.status === 'ACTIVE' || q.status === 'FAILED';
      if (questFilter === 'COMPLETED') return q.status === 'COMPLETED';
      return true;
  });

  return (
    <div className="bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden font-sans">
      {/* --- Character Tabs --- */}
      <div className="flex overflow-x-auto bg-slate-950 border-b border-slate-800 scrollbar-hide">
          {characters.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(idx)}
                className={`flex-1 min-w-[100px] py-4 px-2 text-xs font-bold uppercase tracking-wider truncate transition-all flex flex-col items-center gap-2 relative ${
                    activeTab === idx 
                    ? 'text-amber-500 bg-slate-900' 
                    : 'text-slate-600 hover:text-slate-400 bg-slate-950'
                }`}
              >
                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${activeTab === idx ? 'border-amber-500' : 'border-slate-700'}`}>
                    {c.avatarUrl ? (
                         <img src={c.avatarUrl} className="w-full h-full object-cover" alt={c.name} />
                    ) : (
                         <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User className="w-4 h-4"/></div>
                    )}
                  </div>
                  <span className="truncate max-w-full">{c.name}</span>
                  {activeTab === idx && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 animate-fade-in" />}
              </button>
          ))}
      </div>

      {/* --- View Toggle --- */}
      <div className="p-4 pb-0 bg-slate-900">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner">
              <button onClick={() => setView('STATS')} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${view === 'STATS' ? 'bg-slate-800 text-amber-500 shadow border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Activity className="w-3 h-3" /> Hero
              </button>
              <button onClick={() => setView('QUESTS')} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${view === 'QUESTS' ? 'bg-slate-800 text-amber-500 shadow border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Scroll className="w-3 h-3" /> Quests <span className={`ml-1 px-1.5 rounded-full text-[10px] ${view === 'QUESTS' ? 'bg-amber-900/50 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>{character.quests.filter(q => q.status === 'ACTIVE').length}</span>
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {view === 'STATS' ? (
        <div className="space-y-6 animate-fade-in">
            
            {/* --- Hero Profile Card --- */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg flex gap-4 items-center">
                <div className="w-16 h-16 rounded-lg border-2 border-amber-500/30 overflow-hidden shrink-0 shadow-lg bg-black">
                     {character.avatarUrl ? (
                         <img src={character.avatarUrl} className="w-full h-full object-cover" alt="Hero" />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-600"><User className="w-8 h-8"/></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg text-white font-bold tracking-tight truncate">{character.name}</h2>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider mt-1 truncate">
                        <span className="text-amber-500 shrink-0">{character.race}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-blue-400 truncate">{character.class}</span>
                    </div>
                    <p className="text-slate-400 text-xs italic truncate mt-1 font-medium">"{character.classTitle}"</p>
                </div>
            </div>

            {/* --- Vitals Section --- */}
            <div className="grid grid-cols-2 gap-3">
                {/* HP */}
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between relative overflow-hidden group hover:border-red-900/50 transition-colors">
                    <div className="flex justify-between items-center z-10">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Health</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2 z-10">
                        <span className="text-2xl">❤️</span>
                        <span className="text-xl font-bold text-white">{character.hp}</span>
                        <span className="text-xs text-slate-500">/ {character.maxHp}</span>
                    </div>
                </div>

                {/* Gold */}
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between relative overflow-hidden group hover:border-yellow-900/50 transition-colors">
                    <div className="flex justify-between items-center z-10">
                         <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Wealth</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2 z-10">
                         <span className="text-2xl">💰</span>
                        <span className="text-xl font-bold text-amber-400">{character.gold}</span>
                    </div>
                </div>
            </div>

            {/* --- Points Notification --- */}
            {character.attributePoints > 0 && (
                <div className="bg-gradient-to-r from-amber-900/40 to-slate-900 border border-amber-500/50 p-3 rounded-lg flex items-center justify-between animate-pulse shadow-amber-900/20 shadow-lg">
                    <span className="text-amber-400 text-xs font-bold uppercase flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-amber-400" /> Level Up Available
                    </span>
                    <span className="bg-amber-500 text-slate-900 text-xs font-extrabold px-2 py-0.5 rounded-full">
                        {character.attributePoints} PTS
                    </span>
                </div>
            )}

            {/* --- XP Bar --- */}
            <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Level {character.level}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{character.xp} / {xpNeeded} XP</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${xpPercent}%` }}></div>
                </div>
            </div>

            {/* --- Attributes --- */}
            <div>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Activity className="w-3 h-3 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(StatName).map(stat => (
                        <div key={stat} className="bg-slate-800/30 px-3 py-2 rounded border border-slate-800 flex justify-between items-center hover:bg-slate-800/60 transition-colors">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.slice(0,3)}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-slate-200">{character.stats[stat]}</span>
                                {character.attributePoints > 0 && (
                                    <button onClick={() => onUpgradeStat(character.id, stat)} className="w-4 h-4 bg-amber-600 hover:bg-amber-500 text-white rounded flex items-center justify-center transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Special Ability --- */}
             <div className="bg-slate-800/40 border border-purple-500/20 p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> {character.specialAbility.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">Lvl {character.specialAbility.level}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{character.specialAbility.description}</p>
                    {character.attributePoints > 0 && character.specialAbility.level < character.specialAbility.maxLevel && (
                         <button onClick={() => onUpgradeAbility(character.id)} className="mt-3 w-full py-1 text-[10px] font-bold text-center text-purple-300 border border-purple-500/30 rounded hover:bg-purple-500/20 transition-all">Upgrade Ability</button>
                    )}
                </div>
             </div>

            {/* --- Equipment --- */}
            <div>
                 <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Shield className="w-3 h-3 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Loadout</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                    {/* Weapon Slot */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center gap-4 relative overflow-hidden group">
                        <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:border-slate-500 transition-colors">
                             <Sword className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5 tracking-wider whitespace-nowrap">Main Hand</span>
                            {character.equipment.weapon ? (
                                <span className={`text-sm font-bold truncate block ${COLORS[character.equipment.weapon.rarity]}`}>{character.equipment.weapon.name}</span>
                            ) : (
                                <span className="text-sm text-slate-500 italic">Empty</span>
                            )}
                        </div>
                        {character.equipment.weapon && (
                            <button onClick={() => onUnequip(character.id, 'weapon')} className="text-slate-600 hover:text-red-400 p-2 z-10 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        )}
                    </div>

                    {/* Armor Slot */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center gap-4 relative overflow-hidden group">
                        <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:border-slate-500 transition-colors">
                             <Shield className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                             <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5 tracking-wider whitespace-nowrap">Armor</span>
                            {character.equipment.armor ? (
                                <span className={`text-sm font-bold truncate block ${COLORS[character.equipment.armor.rarity]}`}>{character.equipment.armor.name}</span>
                            ) : (
                                <span className="text-sm text-slate-500 italic">Empty</span>
                            )}
                        </div>
                        {character.equipment.armor && (
                             <button onClick={() => onUnequip(character.id, 'armor')} className="text-slate-600 hover:text-red-400 p-2 z-10 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Inventory --- */}
            <div className="pb-4">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Backpack className="w-3 h-3 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Backpack</h3>
                </div>
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 divide-y divide-slate-800/50">
                    {character.inventory.length === 0 && (
                        <div className="p-6 text-center text-slate-600 text-xs italic">
                            Empty...
                        </div>
                    )}
                    {character.inventory.map((item) => (
                        <div key={item.id} className="p-3 flex justify-between items-center group hover:bg-slate-800/50 transition-colors">
                            <div className="flex flex-col overflow-hidden mr-3 min-w-0">
                                <span className={`text-sm font-bold truncate ${COLORS[item.rarity]}`}>{item.name}</span>
                                {item.description && <span className="text-[10px] text-slate-400 truncate">{item.description}</span>}
                            </div>
                            {(item.type === 'WEAPON' || item.type === 'ARMOR') && (
                                <button 
                                    onClick={() => onEquip(character.id, item)} 
                                    className="shrink-0 text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-amber-700 px-3 py-1.5 rounded transition-colors border border-slate-700"
                                >
                                    Equip
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        ) : (
        /* --- Quest View --- */
        <div className="space-y-4 animate-fade-in flex-1 flex flex-col">
            
            {/* Quest Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mb-2">
                {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setQuestFilter(f)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${
                            questFilter === f 
                            ? 'bg-slate-800 text-white shadow' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Quest List */}
            {filteredQuests.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500">
                    <Scroll className="w-12 h-12 mb-3 opacity-20" />
                    <p className="italic text-sm">No {questFilter.toLowerCase()} quests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuests.map(quest => {
                        const isMain = quest.type === 'MAIN';
                        const isCompleted = quest.status === 'COMPLETED';
                        const isFailed = quest.status === 'FAILED';
                        
                        // Progress Calculation
                        const totalObj = quest.objectives?.length || 0;
                        const completedObj = quest.objectives?.filter(o => o.completed).length || 0;
                        const progress = totalObj > 0 ? (completedObj / totalObj) * 100 : (isCompleted ? 100 : 0);

                        return (
                            <div key={quest.id} className={`rounded-xl border relative overflow-hidden transition-all shadow-md group ${
                                isCompleted 
                                ? 'bg-slate-900/50 border-green-900/30' 
                                : isFailed
                                    ? 'bg-slate-900/50 border-red-900/30'
                                    : isMain 
                                        ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/10' 
                                        : 'bg-slate-900 border-slate-700'
                            }`}>
                                {/* Header */}
                                <div className={`px-4 py-3 border-b flex justify-between items-start gap-4 ${
                                    isCompleted 
                                    ? 'bg-green-900/10 border-green-900/20' 
                                    : isFailed
                                        ? 'bg-red-900/10 border-red-900/20'
                                        : isMain 
                                            ? 'bg-gradient-to-r from-amber-900/20 to-transparent border-amber-900/30' 
                                            : 'bg-slate-800/50 border-slate-800'
                                }`}>
                                    <div>
                                         <div className="flex items-center gap-2 mb-1">
                                            {isMain && <Crown className="w-3 h-3 text-amber-500" />}
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                isCompleted ? 'text-green-500' : isFailed ? 'text-red-500' : isMain ? 'text-amber-500' : 'text-slate-400'
                                            }`}>
                                                {isMain ? 'Main Quest' : 'Side Quest'}
                                            </span>
                                        </div>
                                        <h4 className={`font-bold fantasy-font text-base leading-tight ${
                                            isCompleted ? 'text-slate-400 line-through decoration-slate-600' : isFailed ? 'text-red-400 decoration-red-900 line-through' : 'text-slate-100'
                                        }`}>
                                            {quest.title}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            quest.status === 'COMPLETED' ? 'bg-green-950 text-green-400 border-green-900' : 
                                            quest.status === 'FAILED' ? 'bg-red-950 text-red-400 border-red-900' : 
                                            'bg-blue-950 text-blue-300 border-blue-900'
                                        }`}>
                                            {quest.status}
                                        </span>
                                        {/* Mini Progress % */}
                                        {!isCompleted && !isFailed && totalObj > 0 && (
                                            <span className="text-[10px] text-slate-500 font-mono">{Math.round(progress)}% Complete</span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar Line */}
                                {!isCompleted && !isFailed && totalObj > 0 && (
                                    <div className="h-1 bg-slate-800 w-full">
                                        <div 
                                            className={`h-full transition-all duration-500 ${isMain ? 'bg-amber-600' : 'bg-blue-600'}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                )}

                                <div className="p-4 relative">
                                    <p className="text-xs text-slate-300 italic leading-relaxed mb-4 border-l-2 border-slate-700 pl-3">
                                        "{quest.description}"
                                    </p>

                                    {/* Objectives */}
                                    {quest.objectives && quest.objectives.length > 0 && (
                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 mb-4">
                                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <MapPin className="w-3 h-3" /> Objectives
                                            </h5>
                                            <div className="space-y-2">
                                                {quest.objectives.map((obj, i) => (
                                                    <div key={obj.id || i} className="flex items-start gap-3 group/obj">
                                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                            obj.completed 
                                                            ? 'bg-green-900/30 border-green-600/50 text-green-500' 
                                                            : 'bg-slate-900 border-slate-700 text-transparent'
                                                        }`}>
                                                            <CheckSquare className="w-3 h-3" />
                                                        </div>
                                                        <span className={`text-xs transition-colors ${
                                                            obj.completed ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-200 group-hover/obj:text-white'
                                                        }`}>
                                                            {obj.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rewards */}
                                    {quest.reward && (
                                        <div className={`mt-3 pt-3 border-t flex items-center gap-3 ${isMain ? 'border-amber-900/20' : 'border-slate-800/50'}`}>
                                            <div className={`p-1.5 rounded-md ${isMain ? 'bg-amber-900/20 text-amber-500' : 'bg-purple-900/20 text-purple-400'}`}>
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase block leading-none mb-1">Rewards</span>
                                                <span className={`text-xs font-bold ${isMain ? 'text-amber-300' : 'text-purple-300'}`}>{quest.reward}</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Decorative background Icon */}
                                    <Scroll className={`absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] pointer-events-none transform -rotate-12 ${
                                        isMain ? 'text-amber-500' : 'text-slate-500'
                                    }`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSheet;