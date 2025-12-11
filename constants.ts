import { StatName, Rarity, SpecialAbility } from "./types";

export const DEFAULT_STATS = {
  [StatName.STR]: 10,
  [StatName.INT]: 10,
  [StatName.WIS]: 10,
  [StatName.CHA]: 10,
  [StatName.LCK]: 10,
  [StatName.AGI]: 10,
  [StatName.WEP]: 10,
};

export const STARTING_POINTS = 20;

export const RACES = [
  "Human", "Elf", "Dwarf", "Halfling", "Orc", "Dragonborn", "Tiefling", "Gnome"
];

export const CLASSES = [
  "Barbarian", "Bard", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"
];

export const RARITY_COLORS = {
  [Rarity.BASIC]: "text-slate-300",
  [Rarity.RARE]: "text-blue-400",
  [Rarity.ELITE]: "text-purple-400",
  [Rarity.SPECIAL]: "text-orange-400",
  [Rarity.EPIC]: "text-red-500",
  [Rarity.LEGEND]: "text-yellow-400",
  [Rarity.GOD]: "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse font-bold",
};

export const LEVEL_THRESHOLDS = [0, 10, 20, 30, 45, 65, 80, 100];

// Logic: Level 2 = 10 XP. Level 100 = 100,000 XP. Quadratic curve.
export const getLevelFromXP = (xp: number) => {
    // Inverse of 10 * (level-1)^2
    return Math.floor(Math.sqrt(Math.max(0, xp) / 10)) + 1;
};

export const getXPForNextLevel = (currentLevel: number) => {
    // 10 * (currentLevel)^2. 
    // Example: Lvl 1 -> 10xp. Lvl 2 -> 40xp. 
    return 10 * Math.pow(currentLevel, 2);
};

// Define Special Abilities based on Class (Priority) or Race
export const GET_SPECIAL_ABILITY = (charClass: string, race: string): SpecialAbility => {
    const ability: SpecialAbility = { name: "Willpower", description: "Focus your mind.", level: 1, maxLevel: 10 };
    
    // Class based overrides
    if (charClass === 'Wizard') { ability.name = "Frost Nova"; ability.description = "Freeze enemies in area."; }
    else if (charClass === 'Sorcerer') { ability.name = "Mana Surge"; ability.description = "Regenerate mana instantly."; }
    else if (charClass === 'Barbarian') { ability.name = "Undying Rage"; ability.description = "Cannot die for 1 turn."; }
    else if (charClass === 'Druid') { ability.name = "Nature's Bloom"; ability.description = "Rapidly grow plants."; }
    else if (charClass === 'Paladin') { ability.name = "Holy Shield"; ability.description = "Block all damage."; }
    else if (charClass === 'Rogue') { ability.name = "Shadow Step"; ability.description = "Teleport behind target."; }
    
    // Race based overrides (if Class is generic)
    else if (race === 'Elf') { ability.name = "Nature's Touch"; ability.description = "Heal self or ally."; }
    else if (race === 'Dragonborn') { ability.name = "Draconic Spirit"; ability.description = "Summon a spectral whelp."; }
    else if (race === 'Dwarf') { ability.name = "Stone Skin"; ability.description = "Turn skin to rock."; }
    else if (race === 'Tiefling') { ability.name = "Hellfire"; ability.description = "Burn target over time."; }
    
    return ability;
};

// Map Class -> Level -> Title & Perk Description
export const CLASS_PROGRESSION: any = {
  // SPECIAL CLASS FOR DRAGORA
  "The Thirteenth God": {
    0: { title: "The Fallen One", perk: "Shadow Slash: Deal bonus damage to enemies affected by fear. (Hidden: Double dmg to Divine)" },
    10: { title: "The Awakening", perk: "Soul Pulse: Burst of unstable divine resonance. Heals 1% HP per enemy hit." },
    20: { title: "Memory Walker", perk: "Memory Echo Burst: Slows enemies. Reveals weak points. (Hidden: Shows past life visions)" },
    30: { title: "Cursebearer", perk: "Cursebrand: Strikes leave exploding black sigils. Guaranteed stagger on Divine enemies." },
    45: { title: "Abyss Walker", perk: "Abyss Rift Step: Teleport through tears. Enemies passed through suffer mental shock." },
    65: { title: "Ruin Monarch", perk: "Ruin Commandment: Speak ancient words. Enemies crumble. Undead/Aberrations kneel." },
    80: { title: "Godfear Ascendant", perk: "Thirteenth Seal Break: God-tier enemies lose buffs instantly. Unlocks true potential." },
    100: { title: "God of Oblivion", perk: "Realm Shatter: Destroy reality in an area. True Godbane Form activated." }
  },
  "Barbarian": {
    0: { title: "Wildman", perk: "Raw strength +2" },
    10: { title: "Rageborn", perk: "Resist basic damage" },
    20: { title: "Bonecrusher", perk: "Critical hits disable limbs" },
    30: { title: "Titanblood Berserker", perk: "Size increases during rage" },
    45: { title: "Wrath Ascendant", perk: "Aura of fear" },
    65: { title: "Colossus Rager", perk: "Shatter terrain" },
    80: { title: "Worldbreaker", perk: "Ignore armor" },
    100: { title: "Avatar of Ruin", perk: "Immortality during battle" }
  },
  "Bard": {
    0: { title: "Street Performer", perk: "Charisma +2" },
    10: { title: "Melody Weaver", perk: "Heal with music" },
    20: { title: "Songbinder", perk: "Control animals" },
    30: { title: "Echomancer", perk: "Duplicate spells" },
    45: { title: "Fate Bard", perk: "Reroll dice once per battle" },
    65: { title: "Harmony Sovereign", perk: "Stop time with song" },
    80: { title: "Eternal Fatesinger", perk: "Resurrect allies" },
    100: { title: "Voice of Eternity", perk: "Alter reality with words" }
  },
  "Druid": {
    0: { title: "Wild Initiate", perk: "Wisdom +2" },
    10: { title: "Grove Adept", perk: "Speak with plants" },
    20: { title: "Spirit Shaman", perk: "Summon spirit wolf" },
    30: { title: "Wildshape Master", perk: "Shift into magical beasts" },
    45: { title: "Primal Harbinger", perk: "Control weather" },
    65: { title: "Nature Ascendant", perk: "Become a treant" },
    80: { title: "Worldroot Sage", perk: "Teleport via trees" },
    100: { title: "Avatar of the Wild Heart", perk: "Command nature itself" }
  },
  "Fighter": {
    0: { title: "Squire", perk: "Weapon Mastery +2" },
    10: { title: "Weapon Adept", perk: "Use any simple weapon" },
    20: { title: "Battle Master", perk: "Counter attacks" },
    30: { title: "Warblade General", perk: "Command allies (+Stats)" },
    45: { title: "Iron Ascendant", perk: "Skin as hard as steel" },
    65: { title: "Godslayer Knight", perk: "Damage vs Divine beings" },
    80: { title: "Ascended Blademaster", perk: "Cut through magic" },
    100: { title: "Sword of Realms", perk: "Slice dimensions" }
  },
  "Monk": {
    0: { title: "Initiate", perk: "Agility +2" },
    10: { title: "Chi Adept", perk: "Catch arrows" },
    20: { title: "Flow Disciple", perk: "Walk on water" },
    30: { title: "Mindstorm Monk", perk: "Psychic punches" },
    45: { title: "Astral Strider", perk: "Phase through walls" },
    65: { title: "Realmwalker Monk", perk: "Teleport on hit" },
    80: { title: "Silent Paragon", perk: "Silence enemies on touch" },
    100: { title: "Hand of the Still World", perk: "Stop hearts with a look" }
  },
  "Paladin": {
    0: { title: "Squire of Light", perk: "Strength +1, Charisma +1" },
    10: { title: "Oathbound", perk: "Detect Evil" },
    20: { title: "Divine Knight", perk: "Smite darkness" },
    30: { title: "Starcaller Paladin", perk: "Summon starlight beams" },
    45: { title: "Judgment Herald", perk: "Flying mount" },
    65: { title: "Astral Crusader", perk: "Space breathing" },
    80: { title: "Divine Starbreaker", perk: "Destroy magical barriers" },
    100: { title: "Paladin of the Eternal Star", perk: "Become pure light" }
  },
  "Ranger": {
    0: { title: "Hunter", perk: "Agility +1, Luck +1" },
    10: { title: "Trail Adept", perk: "Never lost" },
    20: { title: "Spirit Tracker", perk: "Track ghosts" },
    30: { title: "Shadow Ranger", perk: "Invisible in dark" },
    45: { title: "Phantom Huntsman", perk: "Shoot through walls" },
    65: { title: "Wild Ascendant", perk: "Tame dragons" },
    80: { title: "Horizon Stalker", perk: "Snipe from miles away" },
    100: { title: "Ranger of Worlds", perk: "Walk between planes" }
  },
  "Rogue": {
    0: { title: "Cutpurse", perk: "Luck +2" },
    10: { title: "Scout", perk: "See traps" },
    20: { title: "Nightblade", perk: "Poison mastery" },
    30: { title: "Shadow Dancer", perk: "Teleport behind target" },
    45: { title: "Soulpiercer", perk: "Steal buffs" },
    65: { title: "Veil Ascendant", perk: "Permanent silence" },
    80: { title: "Abyss Shade", perk: "Become a shadow" },
    100: { title: "Assassin of the Silent Void", perk: "Kill existence" }
  },
  "Sorcerer": {
    0: { title: "Sparkling Novice", perk: "Mana pool increased" },
    10: { title: "Mana Adept", perk: "Sense magic" },
    20: { title: "Chaos Adept", perk: "Random bonus damage" },
    30: { title: "Arcane Stormcaster", perk: "Chain lightning" },
    45: { title: "Chaos Archon", perk: "Flight" },
    65: { title: "Mythic Spellborn", perk: "Dual cast" },
    80: { title: "Cataclysm Sovereign", perk: "Meteor swarm" },
    100: { title: "Sorcerer of Infinity", perk: "Infinite Mana" }
  },
  "Warlock": {
    0: { title: "Pact Initiate", perk: "Charisma +2" },
    10: { title: "Shadow Acolyte", perk: "Darkvision" },
    20: { title: "Pact Adept", perk: "Life drain" },
    30: { title: "Abyss Herald", perk: "Summon demon" },
    45: { title: "Void Oathbearer", perk: "Ignore magic resist" },
    65: { title: "Abyss Ascendant", perk: "Form of the Demon" },
    80: { title: "Herald of Oblivion", perk: "Black hole spell" },
    100: { title: "Chosen of the Forgotten God", perk: "Reality warp" }
  },
  "Wizard": {
    0: { title: "Apprentice", perk: "Intelligence +2" },
    10: { title: "Spellwright", perk: "Copy scrolls" },
    20: { title: "Arcane Scholar", perk: "Identify all items" },
    30: { title: "Chronomancer", perk: "Haste" },
    45: { title: "Infinite Sage", perk: "Levitation" },
    65: { title: "Time Ascendant", perk: "Rewind time (1 turn)" },
    80: { title: "Archmage Eternal", perk: "Wish spell" },
    100: { title: "Wizard of the Infinite Library", perk: "Know all spells" }
  }
};

export const ELYRIA_LORE = `
THE WORLD-BIBLE OF ELYRIA
Version: Thirteenth Cycle – Rebirth Edition

PREMISE:
The player is "Dragora", the 13th God who was betrayed by the other 12 Gods.
Dragora has reincarnated as a mortal with no initial memory, level 1.
The goal is to reclaim the throne, defeat the 12 Gods, and restore balance.

THE 12 BETRAYER GODS:
1. Solarin (Light) - Leader of betrayal.
2. Astereth (Fate) - Erased your name.
3. Vaedorin (War) - Struck first blow.
4. Luminara (Purity) - Labeled you corrupted.
5. Kyroth (Storms) - Destroyed your armies.
6. Myrielle (Life) - Sealed your apostles.
7. Xandros (Shadows) - Stole memory.
8. Drevarn (Death) - Tried to claim your soul.
9. Elarin (Time) - Locked cycle.
10. Vaeluna (Illusion) - Covered truth.
11. Teryon (Beasts) - Created aberrations.
12. Ophiria (Order) - Designed the chains.

THE 7 APOSTLES (Allies to find & The Weapons they Guard):
1. Kaelyra (The Healer) - Guards "Aurelion Bastion" (Celestial Shield). Grants barrier & reflection.
2. Nysera (The Support) - Guards "Echoseeker" (Resonance Bow). Tracks any target, reveals weak points.
3. Lysara (The Mage) - Guards "Embercalamity" (Arcane Staff). Controls fire, ruin, and reality fractures.
4. Valkora (The Storm) - Guards "Thunderclaw & Skyrend" (Dual Daggers). Fastest divine weapons.
5. Veyra (The Tank) - Guards "Obsidian Judgment" (Two-Handed Battle Axe). Creates seismic shockwaves.
6. Sixth Apostle (Unknown) - Guards "Nullpiercer" (Spear of the Void). Pierces dimension barriers.
7. Seventh Apostle (The Lost) - Guards "THIRTEENTH EDGE" (Godforged Sword). Your true weapon. Cuts destiny.

LOCATIONS:
Ardentia (Mortal Kingdoms), Serenthal (Broken Divine Capital), Vael’Kar (Living Forest), Theryon Wastes (Monster Continent).
`;

export const ELYRIA_INTRO = `
*Black screen. Slow heartbeat. A whisper:*
"When balance falls… the world breaks."

*A throne made of stars shatters in silence. Twelve silhouettes strike a lone figure — YOU — and the world explodes into white light.*

*Cut to a burning sky. A continent splits. A forest dies. A temple collapses. A baby cries in the dark.*
"The Thirteenth God has fallen."

*Silence.*

*Then a faint glow in the darkness — a reincarnated soul.*
"But he will rise again."

**ELYRIA — THE THIRTEENTH REBORN**
`;

export const GAME_TIPS = {
  weapons: [
    { title: "Damage Types", content: "Slash (Swords), Pierce (Daggers), Blunt (Hammers). Some enemies resist specific types." },
    { title: "Weapon Rarity", content: "Rarity increases base damage and the number of magical perks attached." },
    { title: "Thirteenth Edge", content: "Legends speak of a sword that can cut through destiny itself. It was lost during the Betrayal." }
  ],
  armor: [
    { title: "Heavy vs Light", content: "Heavy armor reduces agility but blocks more damage. Light armor favors dodging." },
    { title: "Magical Resist", content: "Robes often possess high resistance to elemental attacks but offer little physical protection." }
  ],
  rarity: [
    { color: "text-slate-300", name: "Basic", desc: "Common items found everywhere." },
    { color: "text-blue-400", name: "Rare", desc: "Superior craftsmanship." },
    { color: "text-purple-400", name: "Elite", desc: "Imbued with minor magic." },
    { color: "text-orange-400", name: "Special", desc: "Unique items with history." },
    { color: "text-red-500", name: "Epic", desc: "Heroic gear of legend." },
    { color: "text-yellow-400", name: "Legend", desc: "World-altering power." },
    { color: "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500", name: "God-Level", desc: "Artifacts of the Divine." }
  ],
  locations: [
    { title: "Ardentia", content: "The mortal kingdoms. A good place to start regaining your strength." },
    { title: "Theryon Wastes", content: "A continent of monsters created by Teryon. High danger, high reward." },
    { title: "Serenthal", content: "The Divine Capital. Do not go here until you have awakened your true form." }
  ]
};