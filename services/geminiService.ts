import { GoogleGenAI, Content, FunctionDeclaration, Type, Chat, Tool, Modality } from "@google/genai";
import { Character, InventoryItem, Rarity, ItemType, Difficulty } from "../types";
import { CLASS_PROGRESSION, LEVEL_THRESHOLDS, ELYRIA_LORE, ELYRIA_INTRO } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const updateGameStateTool: FunctionDeclaration = {
  name: 'updateGameState',
  description: 'Update character status, quests, and loot.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetCharacterName: {
        type: Type.STRING,
        description: 'The exact name of the character.',
      },
      hpChange: {
        type: Type.INTEGER,
        description: 'Negative for damage, positive for healing.',
      },
      goldChange: {
        type: Type.INTEGER,
        description: 'Gold gain/loss.',
      },
      xpChange: {
        type: Type.INTEGER,
        description: 'XP gained. If Total XP passes a threshold, the char levels up.',
      },
      questUpdate: {
        type: Type.OBJECT,
        description: 'Add, update or complete a quest.',
        properties: {
            action: { type: Type.STRING, enum: ['ADD', 'UPDATE_STATUS'] },
            questId: { type: Type.STRING, description: 'Unique ID for the quest (or new one)' },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['ACTIVE', 'COMPLETED', 'FAILED'] },
            type: { type: Type.STRING, enum: ['MAIN', 'SIDE'] },
            reward: { type: Type.STRING },
            objectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                }
              }
            }
        }
      },
      loot: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['WEAPON', 'ARMOR', 'ITEM'] },
            rarity: { type: Type.STRING, enum: ['Basic', 'Rare', 'Elite', 'Special', 'Epic', 'Legend', 'God-level'] },
            description: { type: Type.STRING }
          }
        },
        description: 'New items found.',
      },
      newCompanion: {
        type: Type.OBJECT,
        description: 'If a new NPC joins the party permanently.',
        properties: {
           name: { type: Type.STRING },
           race: { type: Type.STRING },
           class: { type: Type.STRING },
           description: { type: Type.STRING }
        }
      },
      summary: {
        type: Type.STRING,
        description: 'Brief summary of the current event.',
      }
    },
    required: ['targetCharacterName'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [updateGameStateTool] }];

export const createGameChat = (
    characters: Character[], 
    history: Content[] = [], 
    mode: 'SINGLE' | 'COOP' | 'CAMPAIGN', 
    difficulty: Difficulty = 'MEDIUM'
): Chat => {
  const charDescriptions = characters.map(c => `
    Name: ${c.name}
    Race: ${c.race}
    Class: ${c.class} (Title: ${c.classTitle})
    Level: ${c.level} (Total XP: ${c.xp})
    Stats: STR:${c.stats.Strength}, INT:${c.stats.Intelligence}, WIS:${c.stats.Wisdom}, CHA:${c.stats.Charisma}, LCK:${c.stats.Luck}, AGI:${c.stats.Agility}, WEP:${c.stats['Weapon Mastery']}
    Special Ability: ${c.specialAbility.name} (Lvl ${c.specialAbility.level})
    HP: ${c.hp}/${c.maxHp}
    Equipment: Main Hand: [${c.equipment.weapon?.name || 'Empty'}], Body: [${c.equipment.armor?.name || 'Empty'}]
    Active Quests: ${c.quests.filter(q => q.status === 'ACTIVE').map(q => q.title).join(', ') || 'None'}
  `).join('\n---\n');

  let systemInstruction = `
    You are an expert Dungeon Master for a text-based RPG. 
    Mode: ${mode === 'COOP' ? 'Two Player Co-op' : mode === 'CAMPAIGN' ? 'Story Campaign' : 'Single Player'}.
    Difficulty: ${difficulty}. 
  `;

  if (mode === 'CAMPAIGN') {
      systemInstruction += `
        \n\n*** CAMPAIGN MODE: ELYRIA - THE THIRTEENTH REBORN ***
        ${ELYRIA_LORE}
        
        NARRATIVE RULES:
        1. The player is Dragora (Reincarnated). They do NOT know they are a God yet. Reveal hints slowly.
        2. START THE GAME by printing the Intro: "${ELYRIA_INTRO}"
        3. AFTER EVERY SCENARIO DESCRIPTION, YOU MUST PROVIDE EXACTLY 3 DISTINCT CHOICES for the player to react.
           Example:
           1. [Aggressive] Attack the guard.
           2. [Diplomatic] Try to persuade him.
           3. [Sneaky] Slip past unnoticed.
        4. User choices matter. The story branches based on these decisions.
        5. WRITING STYLE: 
           - Write like a best-selling Young Adult fantasy novel (e.g., Percy Jackson, Harry Potter).
           - Keep it engaging, fast-paced, and easy to read. 
           - Use short paragraphs (max 2-3 sentences). Add line breaks often.
           - Avoid overly archaic, Shakespearean, or difficult English. Keep it modern and cool.
           - Make the action feel visceral and the dialogue natural.
        6. DIFFICULTY SCALING:
           - EASY: Player has luck, enemies weak.
           - MEDIUM: Balanced.
           - HARD: Enemies +2 Levels, resources scarce.
           - BRUTAL: Enemies +5 Levels, ruthless AI, tactical combat required.
      `;
  } else {
      systemInstruction += `
        \nYour Goal:
        Run an immersive adventure. Describe the world, enemies, and loot. 
        Keep language simple, engaging, and easy to understand. Break text into small paragraphs.
      `;
  }

  systemInstruction += `
    \nThe Party:
    ${charDescriptions}

    Mechanics:
    1. Stats: Strength, Intelligence, Wisdom, Charisma, Luck, Agility, Weapon Mastery.
    2. Items have Rarity: Basic, Rare, Elite, Special, Epic, Legend, God-level.
    3. Leveling: XP is cumulative. Curve is quadratic. Lvl 2 = 10xp. Lvl 100 = 100,000 XP.
    4. Quests: Use 'questUpdate' to track missions. Always give a quest at the start.
    5. Combat: Use dice rolls (d20) logic implicitly.
    6. Use 'updateGameState' for all stat changes, XP, loot, and quests.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: systemInstruction,
      temperature: difficulty === 'BRUTAL' ? 1.0 : 0.9, // More chaos on brutal
      tools: tools,
    },
  });
};

export const generateCharacterBackstory = async (race: string, charClass: string, name: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a 1-sentence epic backstory for a ${race} ${charClass} named ${name}.`,
        });
        return response.text || "A warrior seeking destiny.";
    } catch (e) {
        return "A warrior seeking destiny.";
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!text) return null;
    try {
        const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' } // Deep, storyteller voice
                    }
                }
            }
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (e) {
        console.error("Speech generation failed", e);
        return null;
    }
};