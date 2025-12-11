import { Content } from "@google/genai";

export enum StatName {
  STR = 'Strength',
  INT = 'Intelligence',
  WIS = 'Wisdom',
  CHA = 'Charisma',
  LCK = 'Luck',
  AGI = 'Agility',
  WEP = 'Weapon Mastery'
}

export enum Rarity {
  BASIC = 'Basic',
  RARE = 'Rare',
  ELITE = 'Elite',
  SPECIAL = 'Special',
  EPIC = 'Epic',
  LEGEND = 'Legend',
  GOD = 'God-level'
}

export type ItemType = 'WEAPON' | 'ARMOR' | 'ITEM';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description?: string;
}

export interface QuestObjective {
  id?: string;
  text: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  reward?: string;
  type?: 'MAIN' | 'SIDE';
  objectives?: QuestObjective[];
}

export interface SpecialAbility {
  name: string;
  description: string;
  level: number;
  maxLevel: number;
}

export interface Stats {
  [StatName.STR]: number;
  [StatName.INT]: number;
  [StatName.WIS]: number;
  [StatName.CHA]: number;
  [StatName.LCK]: number;
  [StatName.AGI]: number;
  [StatName.WEP]: number;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  classTitle: string; 
  level: number;
  stats: Stats;
  attributePoints: number; // Points available to spend
  specialAbility: SpecialAbility; // Race/Class specific skill
  hp: number;
  maxHp: number;
  xp: number; // Cumulative Total XP
  gold: number;
  inventory: InventoryItem[];
  equipment: {
    weapon: InventoryItem | null;
    armor: InventoryItem | null;
  };
  quests: Quest[];
  background: string;
  avatarUrl?: string; // Base64 image
  isNpc: boolean; 
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'BRUTAL';

export interface SaveSlot {
  id: string;
  name: string; 
  date: string;
  characters: Character[];
  chatHistory: Content[];
  lastSummary: string;
  mode: 'SINGLE' | 'COOP' | 'CAMPAIGN';
  difficulty?: Difficulty;
}

export interface GameState {
  currentSaveId: string | null;
  characters: Character[];
  chatHistory: Content[];
  mode: 'SINGLE' | 'COOP' | 'CAMPAIGN';
  difficulty?: Difficulty;
}

export type Screen = 'HOME' | 'MODE_SELECT' | 'CREATE_CHARACTER' | 'GAME';